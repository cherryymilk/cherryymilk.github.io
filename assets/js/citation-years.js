function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ------------------------------------
   Infer missing authors
------------------------------------ */

function findNearestAuthor(textBefore, year, index) {

  const keys = Object.keys(index);

  let best = null;
  let bestPosition = -1;

  for (const key of keys) {

    const match = key.match(/^([a-z0-9-]+)-(\d{4})$/);

    if (!match) continue;

    const author = match[1];
    const keyYear = match[2];

    if (keyYear !== year) continue;

    const regex = new RegExp(
      author.replace(/-/g, "\\s+"),
      "ig"
    );

    let m;

    while ((m = regex.exec(slugify(textBefore))) !== null) {

      if (m.index > bestPosition) {
        bestPosition = m.index;
        best = key;
      }
    }
  }

  return best;
}

/* ------------------------------------
   Bibliography indexing
------------------------------------ */

function buildBibIndex() {

  const index = {};

  const headings = [
    ...document.querySelectorAll("h1,h2,h3,h4,h5,h6")
  ];

  const worksCited = headings.find(
    h => h.textContent.trim().toLowerCase() === "works cited"
  );

  if (!worksCited) {
    console.log("No Works Cited section found.");
    return index;
  }

  let node = worksCited.nextElementSibling;

  while (node) {

    if (/^H[1-6]$/.test(node.tagName)) {
      break;
    }

    const text = node.textContent.trim();

    const match = text.match(
      /^([^,]+).*?\b(\d{4})\b/
    );

    if (match) {

      const firstSurname = match[1].trim();
      const year = match[2];

      const primaryKey =
        slugify(firstSurname) +
        "-" +
        year;

      node.id = "ref-" + primaryKey;
      index[primaryKey] = node;

      /* Two-author aliases */

      const twoAuthorMatch = text.match(
        /^([^,]+),.*?\band\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ'-]+).*?\b(\d{4})\b/i
      );

      if (twoAuthorMatch) {

        const first =
          slugify(twoAuthorMatch[1]);

        const second =
          slugify(twoAuthorMatch[2]);

        const aliasYear =
          twoAuthorMatch[3];

        index[`${first}-${aliasYear}`] = node;
        index[`${second}-${aliasYear}`] = node;
        index[`${first}-and-${second}-${aliasYear}`] = node;
      }
    }

    node = node.nextElementSibling;
  }

  return index;
}

/* ------------------------------------
   Citation processing
------------------------------------ */

function processCitations(index) {

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT
  );

  const nodes = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  for (const node of nodes) {

    const parent = node.parentNode;

    if (
      parent &&
      parent.closest &&
      parent.closest(
        "a,code,pre,script,style"
      )
    ) {
      continue;
    }

    const text = node.textContent;

    if (!text.includes("(")) {
      continue;
    }

    let changed = false;

    const html = text.replace(
      /\(([^)]*)\)/g,
      (fullMatch, content) => {

        const parts =
          content.split(/\s*;\s*/);

        const linkedParts = parts.map(part => {

          part = part.replace(
            /^(see also|see|cf\.|compare|quoted in)\s+/i,
            ""
          );

          const authorMatch = part.match(
            /^(.+?)\s+(\d{4})(.*)$/
          );

          /* --------------------
             Author-Year citation
          -------------------- */

          if (authorMatch) {

            const author =
              authorMatch[1].trim();

            const year =
              authorMatch[2];

            const rest =
              authorMatch[3];

            const key =
              slugify(author) +
              "-" +
              year;

            if (index[key]) {

              changed = true;

              return `
<a class="citation-link"
   href="#${index[key].id}">
${author} <span class="cite-year">${year}</span>${rest}
</a>`;
            }

            return (
              author +
              " " +
              `<span class="cite-year">${year}</span>` +
              rest
            );
          }

          /* --------------------
             Bare year citation
          -------------------- */

          const bareMatch = part.match(
            /^(\d{4})(.*)$/
          );

          if (!bareMatch) {
            return part;
          }

          const year =
            bareMatch[1];

          const rest =
            bareMatch[2];

          const context =
            text.slice(
              Math.max(0, text.indexOf(fullMatch) - 300),
              text.indexOf(fullMatch)
            );

          const inferred =
            findNearestAuthor(
              context,
              year,
              index
            );

          if (!inferred) {

            return (
              `<span class="cite-year">${year}</span>` +
              rest
            );
          }

          changed = true;

          return `
<a class="citation-link"
   href="#${index[inferred].id}">
<span class="cite-year">${year}</span>${rest}
</a>`;
        });

        return "(" +
          linkedParts.join("; ") +
          ")";
      }
    );

    if (!changed && html === text) {
      continue;
    }

    const span = document.createElement("span");
    span.innerHTML = html;

    parent.replaceChild(span, node);
  }
}

/* ------------------------------------
   Run
------------------------------------ */

const bibliography =
  buildBibIndex();

processCitations(bibliography);