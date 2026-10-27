console.log("citation script started");

const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT
);

const citationRegex = /\(([^)]*)\)/g;

const nodes = [];

while (walker.nextNode()) {
  nodes.push(walker.currentNode);
}

for (const node of nodes) {

  if (
    node.parentNode &&
    node.parentNode.closest &&
    node.parentNode.closest('code, pre, script, style')
  ) {
    continue;
  }

  const text = node.textContent;

  if (!regex.test(text)) continue;

  regex.lastIndex = 0;

  const span = document.createElement('span');

  console.log("found:", text);

	span.innerHTML = text.replace(
	  citationRegex,
	  (_, content) =>
		'(' +
		content.replace(
		  /\b\d{4}\b/g,
		  '<span class="cite-year">$&</span>'
		) +
		')'
	);
	
  node.parentNode.replaceChild(span, node);
}