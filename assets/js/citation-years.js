function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ------------------------------
   Build bibliography index
-------------------------------- */

function buildBibIndex() {

  const index = {};

  const headings = [
    ...document.querySelectorAll("h1,h2,h3,h4,h5,h6")
  ];

  const worksCited = headings.find(
    h => h.textContent.trim().toLowerCase() === "works cited"
  );

  if (!worksCited) {
    console.log("No works cited section found.");
    return index;
  }

  let node = worksCited.nextElementSibling;

  while (node) {

    if (/^H[1-6]$/.test(node.tagName)) {
      break;
    }

    const text = node.textContent.trim();

    const match = text.match(
      /^([^,\.]+).*?\b(\d{4})\b/
    );

    if (match) {

      const surname = match[1].trim();
      const year = match[2];

      const key =
        slugify(surname) +
        "-" +
        year;

      node.id = "ref-" + key;

      index[key] = node;

      /* Handle two-author citations */

      const andMatch = text.match(
        /^([^,]+),.*?\band\b\s+([^,.]+).*?\b(\d{4})\b/i
      );

      if (andMatch) {

        const first =
          slugify(andMatch[1]);

        const second =
          slugify(andMatch[2]);

        const year =
          andMatch[3];

        index[
          `${first}-and-${second}-${year}`
        ] = node;

        index[
          `${second}-${year}`
        ] = node;
      }
    }

    node = node.nextElementSibling;
  }

  return index;
}

/* ------------------------------
   Link citations
-------------------------------- */

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

        const linked = parts.map(part => {

          const match = part.match(
            /^(.+?)\s+(\d{4})(.*)$/
          );

          if (!match) {
            return part;
          }

          const author =
            match[1].trim();

          const year =
            match[2];

          const rest =
            match[3];

          const key =
            slugify(author) +
            "-" +
            year;

          if (!index[key]) {

            return (
              author +
              " " +
              `<span class="cite-year">${year}</span>` +
              rest
            );
          }

          changed = true;

          return `
<a class="citation-link"
   href="#${index[key].id}">
${author}
 <span class="cite-year">${year}</span>${rest}
</a>`;
        });

        return "(" + linked.join("; ") + ")";
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

/* ------------------------------
   Run
-------------------------------- */

const bibliography =
  buildBibIndex();

processCitations(bibliography);