function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* =========================================
   TOOLTIP PREVIEW
========================================= */

function bibliographyPreview(entry) {

  const temp =
    document.createElement("div");

  temp.innerHTML =
    entry.html;

  const italic =
    temp.querySelector("em, i");

  if (italic) {

    return italic.textContent
      .replace(/\s+/g, " ")
      .trim();
  }

  const text =
    entry.text
      .replace(/\s+/g, " ")
      .trim();

  const yearMatch =
    text.match(/\b(1\d{3}|20\d{2})\b/);

  if (!yearMatch) {
    return text;
  }

  return text
    .slice(
      yearMatch.index +
      yearMatch[0].length
    )
    .split(".")[0]
    .trim();
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

    const firstMatch =
      authorPart.match(/^([^,]+)/);

    if (firstMatch) {
      surnames.push(
        firstMatch[1].trim()
      );
    }

    if (/\band\b/i.test(authorPart)) {

      const afterAnd =
        authorPart
          .split(/\band\b/i)
          .pop()
          .trim();

      const words =
        afterAnd.match(
          /[A-ZÀ-ÿ][A-Za-zÀ-ÿ'-]+/g
        );

      if (
        words &&
        words.length
      ) {

        surnames.push(
          words[words.length - 1]
        );
      }
    }

    if (!surnames.length) {
      node = node.nextElementSibling;
      continue;
    }

    const primaryKey =
      slugify(surnames[0]) +
      "-" +
      year;

    node.id =
      "ref-" +
      primaryKey;

    bibliography.entries[
      primaryKey
    ] = {
      node,
      html: node.innerHTML,
      text: node.textContent.trim()
    };

    surnames.forEach(
      surname => {

        const key =
          slugify(surname);

        bibliography.authors[key] =
          bibliography.authors[key] || [];

        bibliography.authors[key].push({
          year,
          target: primaryKey
        });
      }
    );

    if (surnames.length >= 2) {

      bibliography.entries[
        slugify(
          surnames[0]
        ) +
          "-and-" +
          slugify(
            surnames[1]
          ) +
          "-" +
          year
      ] =
        bibliography.entries[
          primaryKey
        ];
    }

    node = node.nextElementSibling;
  }

  return bibliography;
}

/* =========================================
   AUTHOR INFERENCE
========================================= */

function inferAuthor(
  textBefore,
  year,
  bibliography
) {

  if (
    /\belsewhere\b/i.test(textBefore) &&
    year === "2026"
  ) {
    return "ballegeer-2026";
  }

  const lowered =
    slugify(textBefore);

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
        a =>
          a.year === year
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

  while (
    walker.nextNode()
  ) {
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

    let changed =
      false;

    const html =
      text.replace(
        /\(([^)]*)\)/g,
        (
          fullMatch,
          content
        ) => {

          const looksLikeCitation =
            /[A-ZÀ-ÿ].*\d{4}/.test(content)
            ||
            /^\d{4},/.test(
              content.trim()
            );

          if (
            !looksLikeCitation
          ) {
            return fullMatch;
          }

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

              /* ------------------
                BARE YEAR FIRST
              ------------------- */

              const bareMatch =
                part.match(
                  /^(\d{4})(.*)$/
                );

              if (
                bareMatch
              ) {

                const year =
                  bareMatch[1];

                const rest =
                  bareMatch[2];

                const citationPos =
                  blockText.indexOf(
                    fullMatch
                  );

                const precedingText =
                  citationPos >= 0
                    ? blockText.slice(
                        0,
                        citationPos
                      )
                    : blockText;

                const inferred =
                  inferAuthor(
                    precedingText,
                    year,
                    bibliography
                  );

                if (
                  inferred &&
                  bibliography.entries[
                    inferred
                  ]
                ) {

                  changed =
                    true;

                  return `<a class="citation-link" data-cite-key="${inferred}" href="#${bibliography.entries[inferred].node.id}"><span class="cite-year">${year}</span>${rest}</a>`;
                }

                return `<span class="cite-year">${year}</span>${rest}`;
              }

              /* ------------------
                AUTHOR + YEAR
              ------------------- */

              const authorMatch =
                part.match(
                  /^(.+?)\s+(\d{4})(.*)$/
                );

              if (
                !authorMatch
              ) {
                return part;
              }

              const author =
                authorMatch[1]
                  .trim();

              const year =
                authorMatch[2];

              const rest =
                authorMatch[3];

              const key =
                slugify(
                  author
                ) +
                "-" +
                year;

              if (
                bibliography
                  .entries[key]
              ) {

                changed =
                  true;

                return `${prefix}<a class="citation-link" data-cite-key="${key}" href="#${bibliography.entries[key].node.id}">${author} <span class="cite-year">${year}</span>${rest}</a>`;
              }

              return (
                prefix +
                author +
                " " +
                `<span class="cite-year">${year}</span>` +
                rest
              );

            });

          return (
            "(" +
            processed.join("; ") +
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

const tooltip =
  document.createElement(
    "div"
  );

tooltip.className =
  "citation-tooltip";

document.body.appendChild(
  tooltip
);

document
  .querySelectorAll(
    ".citation-link"
  )
  .forEach(link => {

    link.addEventListener(
      "mouseenter",
      () => {

        const key =
          link.dataset.citeKey;

        if (
          !bibliography.entries[key]
        ) {
          return;
        }

        tooltip.textContent =
          bibliographyPreview(
            bibliography.entries[key]
          );

        tooltip.style.display =
          "block";

        const rect =
          link.getBoundingClientRect();

        tooltip.style.left =
          (
            rect.left +
            rect.width / 2 -
            tooltip.offsetWidth / 2
          ) + "px";

        tooltip.style.top =
          (
            rect.top -
            tooltip.offsetHeight -
            12
          ) + "px";
      }
    );

    link.addEventListener(
      "mouseleave",
      () => {
        tooltip.style.display =
          "none";
      }
    );
  });