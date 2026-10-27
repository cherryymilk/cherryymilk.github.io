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

    if (!text.includes('(') || !text.includes(')')) {
      continue;
    }

    const replaced = text.replace(
      /\(([^)]*)\)/g,
      (match, content) => {
        return (
          '(' +
          content.replace(
            /\b(\d{4})\b/g,
            '<span class="cite-year">$1</span>'
          ) +
          ')'
        );
      }
    );

    if (replaced === text) continue;

    const span = document.createElement('span');
    span.innerHTML = replaced;

    parent.replaceChild(span, node);
  }
}

highlightCitationYears();