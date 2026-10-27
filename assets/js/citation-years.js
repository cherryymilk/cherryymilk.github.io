function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* =========================================
   BUILD BIBLIOGRAPHY DATABASE
========================================= */

function buildBibliography() {

  const bibliography = {
    entries: {},
    authors: {}
  };

  const headings = [
    ...document.querySelectorAll("h1,h2,h3,h4,h5,h6")
  ];

  const worksCited = headings.find(
    h => h.textContent.trim().toLowerCase() === "works cited"
  );

  if (!worksCited) {
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

    /* first author surname */
    const firstAuthorMatch =
      authorPart.match(/^([^,]+)/);

    if (firstAuthorMatch) {
      surnames.push(
        firstAuthorMatch[1].trim()
      );
    }

    /* detect second author */

    if (authorPart.includes(" and ")) {

      const afterAnd =
        authorPart.split(/\band\b/i).pop().trim();

      const words =
        afterAnd.match(/[A-ZÀ-ÿ][A-Za-zÀ-ÿ'-]+/g);

      if (words && words.length) {

        surnames.push(
          words[words.length - 1]
        );
      }
    }

    if (!surnames.length) {
      node = node.nextElementSibling;
      continue;
    }

    console.log(
      "AUTHORS:",
      surnames,
      "YEAR:",
      year
    );

    const primaryKey =
      slugify(surnames[0]) +
      "-" +
      year;

    node.id = "ref-" + primaryKey;

    bibliography.entries[
      primaryKey
    ] = node;

    /* author lookup table */

    surnames.forEach(name => {

      const key =
        slugify(name);

      bibliography.authors[key] =
        bibliography.authors[key] || [];

      bibliography.authors[key].push({
        year,
        target: primaryKey
      });
    });

    /* multi-author aliases */

    if (surnames.length >= 2) {

      bibliography.entries[
        slugify(
          surnames[0] +
          "-and-" +
          surnames[1]
        ) +
        "-" +
        year
      ] = node;
    }

    node = node.nextElementSibling;
  }

  return bibliography;
}

/* =========================================
   INFER AUTHOR FROM PARAGRAPH
========================================= */

function inferAuthor(
  paragraphText,
  year,
  bibliography
) {

  const lowered =
    slugify(paragraphText);

  let best = null;
  let bestPos = -1;

  for (
    const surname of Object.keys(
      bibliography.authors
    )
  ) {

    const pos =
      lowered.lastIndexOf(
        surname
      );

    if (pos < 0) {
      continue;
    }

    const match =
      bibliography.authors[
        surname
      ].find(
        item =>
          item.year === year
      );

    if (!match) {
      continue;
    }

    if (pos > bestPos) {

      bestPos = pos;
      best = match.target;
    }
  }

  return best;
}

/* =========================================
   PROCESS CITATIONS
========================================= */

function processCitations(
  bibliography
) {

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

  for (
    const node of nodes
  ) {

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

    if (
      !text.includes("(")
    ) {
      continue;
    }

    const block =
      parent.closest(
        "p,li,blockquote,div"
      );

    const blockText =
      block?.innerText || "";

    let changed = false;

    const html =
      text.replace(
        /\(([^)]*)\)/g,
        (
          fullMatch,
          content
        ) => {

          const parts =
            content.split(
              /\s*;\s*/
            );

          const processed =
            parts.map(part => {

              const prefixMatch =
                part.match(
                  /^(see also|see|cf\.|compare|quoted in)\s+/i
                );

              const prefix =
                prefixMatch
                  ? prefixMatch[0]
                  : "";

              part =
                part.replace(
                  /^(see also|see|cf\.|compare|quoted in)\s+/i,
                  ""
                );

              /* AUTHOR-YEAR */

              const authorYear =
                part.match(
                  /^(.+?)\s+(\d{4})(.*)$/
                );

              if (authorYear) {

                const author =
                  authorYear[1]
                    .trim();

                const year =
                  authorYear[2];

                const rest =
                  authorYear[3];

                const key =
                  slugify(author) +
                  "-" +
                  year;

                if (
                  bibliography
                    .entries[key]
                ) {

                  changed =
                    true;

                  return `
${prefix}<a class="citation-link"
href="#${bibliography.entries[key].id}">
${author}
 <span class="cite-year">${year}</span>${rest}
</a>`;
                }

                return (
                  prefix +
                  author +
                  " " +
                  `<span class="cite-year">${year}</span>` +
                  rest
                );
              }

              /* BARE YEAR */

              const bare =
                part.match(
                  /^(\d{4})(.*)$/
                );

              if (!bare) {
                return part;
              }

              const year =
                bare[1];

              const rest =
                bare[2];

              const inferred =
                inferAuthor(
                  blockText,
                  year,
                  bibliography
                );

              if (
                inferred &&
                bibliography
                  .entries[
                    inferred
                  ]
              ) {

                changed =
                  true;

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

    span.innerHTML =
      html;

    parent.replaceChild(
      span,
      node
    );
  }
}

/* =========================================
   RUN
========================================= */

const bibliography =
  buildBibliography();

processCitations(
  bibliography
);