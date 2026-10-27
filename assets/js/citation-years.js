function highlightCitationYears() {
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
      parent.closest('code, pre, script, style')
    ) {
      continue;
    }

    const text = node.textContent;

    if (!text.includes('(')) continue;

    const replaced = text.replace(
      /\(([^)]*)\)/g,
      (match, content) => {

        const looksLikeCitation =
          /[A-ZÀ-ÿ][^)]*\b\d{4}\b/.test(content) ||
          /^\d{4},/.test(content.trim());

        if (!looksLikeCitation) {
          return match;
        }

        let newContent = content;

        newContent = newContent.replace(
          /([A-ZÀ-ÿ][^,;)]*?)\s(\d{4})(?=[,;)]|$)/g,
          '$1 <span class="cite-year">$2</span>'
        );

        newContent = newContent.replace(
          /^(\d{4})(?=,)/,
          '<span class="cite-year">$1</span>'
        );

        return `(${newContent})`;
      }
    );

    if (replaced === text) continue;

    const span = document.createElement('span');
    span.innerHTML = replaced;

    parent.replaceChild(span, node);
  }
}

highlightCitationYears();