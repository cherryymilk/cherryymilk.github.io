function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ========================================
   BUILD BIBLIOGRAPHY DATABASE
======================================== */

function buildBibliography() {

  const bibliography = {
    entries: {},
    authors: {}
  };

  const headings = [
    ...document.querySelectorAll("h1,h2,h3,h4,h5,h6")
  ];

  const worksCited = headings.find(
    h =>
      h.textContent.trim().toLowerCase() ===
      "works cited"
  );

  if (!worksCited) {
    console.log("No Works Cited section found.");
    return bibliography;
  }

  let node = worksCited.nextElementSibling;

  while (node) {

    if (/^H[1-6]$/.test(node.tagName)) {
      break;
    }

    const text = node.textContent.trim();

    const yearMatch =
      text.match(/\b(1\d{3}|20\d{2})\b/);

    if (!yearMatch) {
      node = node.nextElementSibling;
      continue;
    }

    const year = yearMatch[1];

    const authorPart =
      text.slice(0, yearMatch.index);

    const surnames = [];

    const firstMatch =
      authorPart.match(/^([^,]+)/);

    if (firstMatch) {
      surnames.push(firstMatch[1].trim());
    }

    const andMatch =
      authorPart.match(
        /\band\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ'-]+)/i
      );

    if (andMatch) {
      surnames.push(andMatch[1].trim());
    }

    if (surnames.length === 0) {
      node = node.nextElementSibling;
      continue;
    }

    const primaryKey =
      slugify(surnames[0]) +
      "-" +
      year;

    node.id = "ref-" + primaryKey;

    bibliography.entries[primaryKey] = node;

    for (const surname of surnames) {

      bibliography.authors[
        slugify(surname)
      ] = bibliography.authors[
        slugify(surname)
      ] || [];

      bibliography.authors[
        slugify(surname)
      ].push({
        year,
        key: primaryKey
      });
    }

    if (surnames.length >= 2) {

      const combined =
        slugify(surnames[0]) +
        "-and-" +
        slugify(surnames[1]) +
        "-" +
        year;

      bibliography.entries[
        combined
      ] = node;
    }

    node = node.nextElementSibling;
  }

  return bibliography;
}

/* ========================================
   AUTHOR INFERENCE
======================================== */

function inferAuthor(textBefore, year, bibliography) {

  const lowered =
    slugify(textBefore);

  let best = null;
  let bestPos = -1;

  for (const author of Object.keys(
    bibliography.authors
  )) {

    const pos =
      lowered.lastIndexOf(author);

    if (pos === -1) continue;

    const matches =
      bibliography.authors[author]
        .filter(a => a.year === year);

    if (!matches.length) continue;

    if (pos > bestPos) {
      bestPos = pos;
      best = matches[0].key;
    }
  }

  return best;
}

/* ========================================
   PROCESS CITATIONS
======================================== */

function processCitations(bibliography) {

  const walker =
    document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );

  const nodes = [];

  while (walker.nextNode()) {
    nodes.push(
      walker.currentNode
    );
  }

  for (const node of nodes) {

    const parent =
      node.parentNode;

    if (
      parent &&
      parent.closest &&
      parent.closest(
        "a,code,pre,script,style"
      )
    ) {
      continue;
    }

    const text =
      node.textContent;

    if (!text.includes("(")) {
      continue;
    }

    let changed = false;

    const html =
      text.replace(
        /\(([^)]*)\)/g,
        (fullMatch, content) => {

          const parts =
            content.split(
              /\s*;\s*/
            );

          const processed =
            parts.map(part => {

              part = part.replace(
                /^(see also|see|cf\.|compare|quoted in)\s+/i,
                ""
              );

              const authorMatch =
                part.match(
                  /^(.+?)\s+(\d{4})(.*)$/
                );

              /* ------------------
                 Author + year
              ------------------- */

              if (authorMatch) {

                const author =
                  authorMatch[1]
                    .trim();

                const year =
                  authorMatch[2];

                const rest =
                  authorMatch[3];

                const key =
                  slugify(author) +
                  "-" +
                  year;

                if (
                  bibliography.entries[
                    key
                  ]
                ) {

                  changed = true;

                  return `
<a class="citation-link"
href="#${bibliography.entries[key].id}">
${author}
<span class="cite-year">${year}</span>${rest}
</a>`;
                }

                return (
                  author +
                  " " +
                  `<span class="cite-year">${year}</span>` +
                  rest
                );
              }

              /* ------------------
                 Bare year
              ------------------- */

              const bareMatch =
                part.match(
                  /^(\d{4})(.*)$/
                );

              if (
                !bareMatch
              ) {
                return part;
              }

              const year =
                bareMatch[1];

              const rest =
                bareMatch[2];

              const context =
                text.slice(
                  Math.max(
                    0,
                    text.indexOf(
                      fullMatch
                    ) - 500
                  ),
                  text.indexOf(
                    fullMatch
                  )
                );

              const inferred =
                inferAuthor(
                  context,
                  year,
                  bibliography
                );

              if (
                inferred &&
                bibliography.entries[
                  inferred
                ]
              ) {

                changed = true;

                return `
<a class="citation-link"
href="#${bibliography.entries[inferred].id}">
<span class="cite-year">${year}</span>${rest}
</a>`;
              }

              return (
                `<span class="cite-year">${year}</span>` +
                rest
              );
            });

          return (
            "(" +
            processed.join(
              "; "
            ) +
            ")"
          );
        }
      );

    if (
      !changed &&
      html === text
    ) {
      continue;
    }

    const span =
      document.createElement(
        "span"
      );

    span.innerHTML = html;

    parent.replaceChild(
      span,
      node
    );
  }
}

/* ========================================
   RUN
======================================== */

const bibliography =
  buildBibliography();

processCitations(
  bibliography
);