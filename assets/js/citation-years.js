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

  const text =
    entry.html
      .replace(
        /https?:\/\/\S+/g,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

  const yearMatch =
    text.match(
      /\b(1\d{3}|20\d{2})([a-z])?\.\s*/i
    );

  if (!yearMatch) {
    return text;
  }

  let title =
    text.slice(
      yearMatch.index +
      yearMatch[0].length
    ).trim();

  let result = "";

  let parenDepth = 0;
  let inQuote = false;

  for (let i = 0; i < title.length; i++) {

    const char =
      title[i];

    result += char;

    if (char === "(") {
      parenDepth++;
      continue;
    }

    if (char === ")") {
      parenDepth =
        Math.max(
          0,
          parenDepth - 1
        );
      continue;
    }

    if (
      char === "“" ||
      char === "\""
    ) {
      inQuote = true;
      continue;
    }

if (
  char === "”"
) {

  const remainder =
    title
      .slice(i + 1)
      .trimStart();

  if (
    remainder.startsWith(":")
  ) {

    inQuote = false;
    continue;
  }

  result =
    result.replace(
      /\.”$/,
      "”"
    );

  return result.trim();
}

    /*
      only allow title to end
      at a period that is not:
      - inside parentheses
      - inside a quotation
    */

    if (
      char === "." &&
      parenDepth === 0 &&
      !inQuote
    ) {

      result =
        result.replace(
          /\.$/,
          ""
        );

      break;
    }
  }

  return result.trim();
}

/* =========================================
   BUILD BIBLIOGRAPHY DATABASE
========================================= */

function buildBibliography() {

  const bibliography = {
    entries: {},
    authors: {},
    years: {},
    titles: {}
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
      text.match(
        /\b(1\d{3}|20\d{2})([a-z])?\b/i
      );

    if (!yearMatch) {
      node = node.nextElementSibling;
      continue;
    }

    const year =
      yearMatch[1] +
      (yearMatch[2] || "");    

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

    bibliography.entries[
      slugify(surnames[0]) +
      "-et-al-" +
      year
    ] =
      bibliography.entries[
        primaryKey
      ];

    const preview =
      bibliographyPreview(
        bibliography.entries[
          primaryKey
        ]
      )
        .replace(/<[^>]+>/g, "")
        .replace(/[“”"]/g, "")
        .toLowerCase()
        .trim();

    if (preview) {
      bibliography.titles[
        preview
      ] = primaryKey;
    }

    bibliography.years[
      year
    ] =
      bibliography.years[
        year
      ] || [];

    bibliography.years[
      year
    ].push(
      primaryKey
    );

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
  /\belsewhere\b/i.test(
    textBefore
  )
) {

  const mine =
    bibliography.authors[
      "ballegeer"
    ];

  if (mine) {

    const match =
      mine.find(
        entry =>
          entry.year === year
      );

    if (match) {
      return match.target;
    }
  }
}

const loweredText =
  textBefore
    .toLowerCase()

let bestTitle = null;
let bestPos = -1;

for (
  const [title, key]
  of Object.entries(
    bibliography.titles
  )
) {

  let pos = loweredText.lastIndexOf(
    title
  );

  if (pos >= 0) {

    if (
      bibliography.entries[key] &&
      key.endsWith("-" + year)
    ) {

      if (pos > bestPos) {
        bestPos = pos;
        bestTitle = key;
      }
    }

    continue;
  }

  const words =
    title
      .split(/\s+/)
      .filter(
        word =>
          word.length > 3
      );

  if (
    words.length &&
    words.every(
      word =>
        loweredText.includes(
          word
        )
    )
  ) {

    const wordPositions =
      words.map(
        word =>
          loweredText.lastIndexOf(
            word
          )
      );

    pos =
      Math.max(
        ...wordPositions
      );

    if (
      bibliography.entries[key] &&
      key.endsWith("-" + year)
    ) {

      if (pos > bestPos) {
        bestPos = pos;
        bestTitle = key;
      }
    }
  }
}

if (bestTitle) {

  return bestTitle;
}

const yearMatches =
  bibliography.years?.[
    year
  ];

console.log(
  "YEAR MATCHES:",
  year,
  yearMatches
);

  if (
    yearMatches &&
    yearMatches.length === 1
  ) {
    return yearMatches[0];
  }

  const lowered =
    slugify(textBefore);


if (
  year === "2026" &&
  textBefore.includes("Peter Bradshaw")
) {

  console.log(
    "LOWERED TAIL:",
    lowered.slice(-2000)
  );
}


  let best = null;
  let bestAuthorPos = -1;

  for (
    const surname of Object.keys(
      bibliography.authors
    )
  ) {

    const pos =
      lowered.lastIndexOf(
        surname
      );

    if (
      year === "2026" &&
      pos >= 0
    ) {
      console.log(
        "AUTHOR FOUND:",
        surname,
        pos
      );
    }

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

    if (pos > bestAuthorPos) {
      bestAuthorPos = pos;
      best = match.target;
    }
  }


if (best) {
  return best;
}


/* ------------------
   IMMEDIATE TITLE CHECK
------------------- */


const tail =
  textBefore
    .trim()
    .slice(-120);

const finalPhrase =
  tail.match(
    /([A-Z][A-Za-z0-9'’!:-]+(?:\s+[A-Z][A-Za-z0-9'’!:-]+){0,6})\s*$/
  )?.[1];

if (finalPhrase) {

  const isKnownTitle =
    Object.keys(
      bibliography.titles
    ).some(
      title =>
        title.includes(
          finalPhrase.toLowerCase()
        )
    );

  if (!isKnownTitle) {
    return null;
  }
}

return null;

}

/* =========================================
   PROCESS CITATIONS
========================================= */

function processCitations(
  bibliography
) {

  const nodes = [
    ...document.querySelectorAll(
      "p,li,blockquote"
    )
  ];

  for (
    const node of nodes
  ) {

    const parent = node;

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
      node.innerHTML;

    if (
      !text.includes("(") &&
      !text.includes("[")
    ) {
      continue;
    }

    const localBlock =
      parent.closest(
        "p,li,blockquote,div"
      );

    const localText =
      localBlock?.innerText || "";

    const blockquote =
      parent.closest(
        "blockquote"
      );

    const previousBlock =
      blockquote
        ? blockquote.previousElementSibling
        : localBlock?.previousElementSibling;
    const broadText =
      (
        (previousBlock?.innerText || "")
        + "\n"
        + localText
      );

    let changed =
      false;

    let html = text;

    /* square brackets first */

    html = html.replace(
      /\[([^\]]*)\]/g,
      (
        fullMatch,
        content
      ) => {

        const looksLikeCitation =
          /^[A-ZÀ-ÿ].*\d{4}[a-z]?/i.test(
            content.trim()
          )
          ||
          /^\d{4}[a-z]?(?:,|$)/i.test(
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
                  /^(\d{4}[a-z]?)(.*)$/i
                );

              if (
                bareMatch
              ) {

                const year =
                  bareMatch[1];

                const rest =
                  bareMatch[2];

                const nodeText =
                node.textContent;

                /* try local context first */

                let citationPos =
                  localText.indexOf(
                    nodeText
                  );

                let precedingText =
                  citationPos >= 0
                    ? localText.slice(
                        0,
                        citationPos +
                        nodeText.indexOf(
                          fullMatch
                        )
                      )
                    : localText;

                  let inferred =
                    inferAuthor(
                      precedingText,
                      year,
                      bibliography
                    );

                /* fall back to broader context */

                if (!inferred) {

                  citationPos =
                    broadText.indexOf(
                      localText
                    );

                  precedingText =
                    citationPos >= 0
                      ? broadText.slice(
                          0,
                          citationPos +
                          localText.indexOf(
                            fullMatch
                          )
                        )
                      : broadText;

                  const broadInferred =
                    inferAuthor(
                      precedingText,
                      year,
                      bibliography
                    );

                  inferred = broadInferred;
                }

                if (
                  inferred &&
                  bibliography.entries[
                    inferred
                  ]
                ) {

                  changed =
                    true;

console.log(
  "FINAL LINK:",
  year,
  inferred
);

                  return `<a class="citation-link" data-cite-key="${inferred}" href="#${bibliography.entries[inferred].node.id}"><span class="cite-year">${year}</span></a>${rest}`;
                }

                return `<span class="cite-year">${year}</span>${rest}`;
              }

              /* ------------------
                AUTHOR + YEAR
              ------------------- */

              const authorMatch =
                part.match(
                  /^(.+?)\s+(\d{4}[a-z]?)(.*)$/i
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

              const normalizedAuthor =
                author.replace(
                  /\s+et\s+al\.?$/i,
                  ""
                );

              const key =
                slugify(
                  normalizedAuthor
                ) +
                "-" +
                year;

              if (
                bibliography
                  .entries[key]
              ) {

                changed =
                  true;

                return `${prefix}<a class="citation-link" data-cite-key="${key}" href="#${bibliography.entries[key].node.id}">${author} <span class="cite-year">${year}</span></a>${rest}`;
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
            "[" +
            processed.join("; ") +
            "]"
          );
        }
      );

/* then parentheses */

    html = html.replace(
      /\(([^)]*)\)/g,
      (
        fullMatch,
        content
      ) => {

        const looksLikeCitation =
          /^[A-ZÀ-ÿ].*\d{4}[a-z]?/i.test(
            content.trim()
          )
          ||
          /^\d{4}[a-z]?(?:,|$)/i.test(
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
                  /^(\d{4}[a-z]?)(.*)$/i
                );

              if (
                bareMatch
              ) {

                const year =
                  bareMatch[1];

                const rest =
                  bareMatch[2];

                const nodeText =
                node.textContent;

                /* try local context first */

                let citationPos =
                  localText.indexOf(
                    nodeText
                  );

                let precedingText =
                  citationPos >= 0
                    ? localText.slice(
                        0,
                        citationPos +
                        nodeText.indexOf(
                          fullMatch
                        )
                      )
                    : localText;

                const localInferred =
                  inferAuthor(
                    precedingText,
                    year,
                    bibliography
                  );

                let inferred =
                  localInferred;

                /* fall back to broader context */

                if (!inferred) {

                  citationPos =
                    broadText.indexOf(
                      localText
                    );

                  precedingText =
                    citationPos >= 0
                      ? broadText.slice(
                          0,
                          citationPos +
                          localText.indexOf(
                            fullMatch
                          )
                        )
                      : broadText;
                      
                  const broadInferred =
                    inferAuthor(
                      precedingText,
                      year,
                      bibliography
                    );

                  inferred =
                    broadInferred;
                }

                if (
                  inferred &&
                  bibliography.entries[
                    inferred
                  ]
                ) {

                  changed =
                    true;

                  return `<a class="citation-link" data-cite-key="${inferred}" href="#${bibliography.entries[inferred].node.id}"><span class="cite-year">${year}</span></a>${rest}`;
                }

                return `<span class="cite-year">${year}</span>${rest}`;
              }

              /* ------------------
                AUTHOR + YEAR
              ------------------- */

              const authorMatch =
                part.match(
                  /^(.+?)\s+(\d{4}[a-z]?)(.*)$/i
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

                return `${prefix}<a class="citation-link" data-cite-key="${key}" href="#${bibliography.entries[key].node.id}">${author} <span class="cite-year">${year}</span></a>${rest}`;
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

node.innerHTML = html;

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

        tooltip.innerHTML =
          bibliographyPreview(
            bibliography.entries[key]
          );

        tooltip.style.display =
          "block";

        const rects =
          link.getClientRects();

        const rect =
          rects.length
            ? rects[
                rects.length - 1
              ]
            : link.getBoundingClientRect();

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





