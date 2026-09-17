export function wrapPdfDocument({ title, tocHtml, sections, fontScale = 1 }) {
  const body = sections
    .map((section, index) => {
      const classes = ["markdown-body", "document"];
      if (index > 0 && section.pageBreak) classes.push("document-break");
      const label = section.showTitle
        ? `<p class="doc-label">${escapeHtml(section.title)}</p>`
        : "";
      return `<article class="${classes.join(" ")}">${label}${section.bodyHtml}</article>`;
    })
    .join("\n");

  const scale = Number.isFinite(fontScale) ? Math.min(Math.max(fontScale, 0.5), 1) : 1;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>${PDF_STYLES}</style>
  <style>:root { --font-scale: ${scale}; }</style>
</head>
<body>
  ${tocHtml || ""}
  ${body}
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const PDF_STYLES = `
  :root {
    --ink: #1c1915;
    --muted: #5c564c;
    --rule: #d9d1c3;
    --paper: #fffdf8;
    --code-bg: #f4efe6;
    --accent: #8d3b16;
    --quote: #efe8d9;
    --font-scale: 1;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--paper);
    color: var(--ink);
  }

  body {
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
    font-size: calc(11.5pt * var(--font-scale));
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .markdown-body {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .document-break {
    break-before: page;
    page-break-before: always;
  }

  .doc-label {
    margin: 0 0 0.7em;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: calc(9pt * var(--font-scale));
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .toc-page {
    break-after: page;
    page-break-after: always;
  }

  .toc-title {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: calc(20pt * var(--font-scale));
    font-weight: 650;
    margin: 0 0 1em;
  }

  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .toc-list li a {
    display: flex;
    align-items: baseline;
    gap: 6px;
    text-decoration: none;
    color: inherit;
    padding: 3px 0;
    break-inside: avoid;
  }

  .toc-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .toc-dots {
    flex: 1;
    border-bottom: 1px dotted var(--rule);
    margin: 0 4px 0.28em;
  }

  .toc-level-1 {
    margin-top: 0.65em;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-weight: 650;
    font-size: calc(12pt * var(--font-scale));
  }

  .toc-level-1:first-child { margin-top: 0; }

  .toc-level-2 {
    margin-left: 1.2em;
    font-size: calc(11pt * var(--font-scale));
  }

  .toc-level-3 {
    margin-left: 2.4em;
    font-size: calc(10pt * var(--font-scale));
    color: var(--muted);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: var(--ink);
    line-height: 1.25;
    page-break-after: avoid;
    margin: 1.4em 0 0.55em;
  }

  h1 { font-size: calc(24pt * var(--font-scale)); margin-top: 0; letter-spacing: -0.02em; }
  h2 { font-size: calc(16pt * var(--font-scale)); padding-bottom: 0.2em; border-bottom: 1px solid var(--rule); }
  h3 { font-size: calc(13.5pt * var(--font-scale)); }
  h4 { font-size: calc(12pt * var(--font-scale)); }

  p, ul, ol, blockquote, pre, table { margin: 0 0 0.9em; }

  a { color: var(--accent); text-decoration: underline; }

  hr {
    border: 0;
    border-top: 1px solid var(--rule);
    margin: 1.6em 0;
  }

  ul, ol { padding-left: 1.4em; }
  li { margin: 0.2em 0; }
  li > p { margin: 0.25em 0; }

  blockquote {
    margin-left: 0;
    padding: 0.4em 0.9em;
    border-left: 3px solid var(--accent);
    background: var(--quote);
    color: var(--muted);
  }

  code {
    font-family: "Cascadia Mono", "Consolas", "Courier New", monospace;
    font-size: 0.86em;
    background: var(--code-bg);
    padding: 0.08em 0.32em;
    border-radius: 4px;
  }

  pre {
    background: #221f1b;
    color: #f6f1e7;
    padding: 0.9em 1em;
    border-radius: 8px;
    overflow: hidden;
    page-break-inside: avoid;
  }

  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    font-size: calc(8.8pt * var(--font-scale));
    line-height: 1.45;
    white-space: pre-wrap;
  }

  img {
    max-width: 100%;
    height: auto;
    page-break-inside: avoid;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: calc(10.5pt * var(--font-scale));
    page-break-inside: avoid;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  }

  th, td {
    border: 1px solid var(--rule);
    padding: 0.45em 0.6em;
    text-align: left;
    vertical-align: top;
  }

  th { background: #f0eadc; font-weight: 650; }

  tr:nth-child(even) td { background: #fbf7ee; }

  .task-list-item { list-style: none; margin-left: -1.2em; }

  .hljs-comment, .hljs-quote { color: #9a917f; font-style: italic; }
  .hljs-keyword, .hljs-selector-tag, .hljs-addition { color: #f0b27a; }
  .hljs-number, .hljs-string, .hljs-meta .hljs-string, .hljs-literal { color: #d6e8a8; }
  .hljs-title, .hljs-section, .hljs-name, .hljs-selector-id { color: #f4d58d; }
  .hljs-attr, .hljs-attribute, .hljs-variable, .hljs-template-variable { color: #9fd4c7; }
  .hljs-built_in, .hljs-type { color: #8ecae6; }
  .hljs-deletion { color: #e07a5f; }
`;
