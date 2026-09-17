const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const fileList = document.getElementById("file-list");
const fileCount = document.getElementById("file-count");
const preview = document.getElementById("preview");
const previewName = document.getElementById("preview-name");
const btnOne = document.getElementById("btn-one");
const btnAll = document.getElementById("btn-all");
const statusEl = document.getElementById("status");
const panelLeft = document.querySelector(".panel-left");

const files = [];
let selectedId = null;
let converting = false;

function uid() {
  return crypto.randomUUID();
}

function outputMode() {
  return document.querySelector('input[name="output-mode"]:checked')?.value || "separate";
}

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`.trim();
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });
}

function isMarkdown(file) {
  const name = file.name.toLowerCase();
  return name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt");
}

async function addFiles(fileListLike) {
  const incoming = [...fileListLike].filter(isMarkdown);
  if (!incoming.length) {
    setStatus("Nenhum arquivo .md válido foi encontrado.", "err");
    return;
  }

  for (const file of incoming) {
    const text = await readFile(file);
    files.push({ id: uid(), file, text });
  }

  if (!selectedId) selectedId = files[0].id;
  render();
  setStatus(`${incoming.length} arquivo(s) adicionado(s).`);
}

function removeFile(id) {
  const index = files.findIndex((item) => item.id === id);
  if (index === -1) return;
  files.splice(index, 1);
  if (selectedId === id) selectedId = files[0]?.id || null;
  render();
}

function moveFile(id, direction) {
  const index = files.findIndex((item) => item.id === id);
  const next = index + direction;
  if (index === -1 || next < 0 || next >= files.length) return;
  const [item] = files.splice(index, 1);
  files.splice(next, 0, item);
  selectedId = id;
  render();
}

function renderMarkdown(text) {
  if (window.marked) {
    window.marked.setOptions({ gfm: true, breaks: false });
    return window.marked.parse(text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ""));
  }
  return `<pre>${text.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]))}</pre>`;
}

function renderPreview() {
  const merged = outputMode() === "merged" && files.length > 1;
  const showTitles = document.getElementById("opt-titles").checked;

  if (!files.length) {
    previewName.textContent = "Nenhum arquivo selecionado";
    preview.innerHTML = '<p class="placeholder">O conteúdo do Markdown aparece aqui antes da conversão.</p>';
    return;
  }

  if (merged) {
    previewName.textContent = `PDF unificado · ${files.length} arquivos`;
    preview.innerHTML = "";
    for (const item of files) {
      const section = document.createElement("section");
      section.className = "preview-section markdown-body";
      if (showTitles) {
        const label = document.createElement("p");
        label.className = "doc-label";
        label.textContent = item.file.name.replace(/\.(md|markdown|txt)$/i, "");
        section.append(label);
      }
      const body = document.createElement("div");
      body.innerHTML = renderMarkdown(item.text);
      section.append(body);
      preview.append(section);
    }
    return;
  }

  const current = files.find((item) => item.id === selectedId) || files[0];
  previewName.textContent = current.file.name;
  preview.innerHTML = renderMarkdown(current.text);
}

function render() {
  const merged = outputMode() === "merged";
  panelLeft.classList.toggle("merge-off", !merged);

  fileCount.textContent = files.length
    ? `${files.length} arquivo${files.length > 1 ? "s" : ""}`
    : "Nenhum arquivo";

  fileList.innerHTML = "";
  files.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = `file-item${item.id === selectedId ? " active" : ""}`;

    const reorder = document.createElement("div");
    reorder.className = "reorder";
    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "▲";
    up.setAttribute("aria-label", `Subir ${item.file.name}`);
    up.disabled = index === 0;
    up.addEventListener("click", (event) => {
      event.stopPropagation();
      moveFile(item.id, -1);
    });
    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "▼";
    down.setAttribute("aria-label", `Descer ${item.file.name}`);
    down.disabled = index === files.length - 1;
    down.addEventListener("click", (event) => {
      event.stopPropagation();
      moveFile(item.id, 1);
    });
    reorder.append(up, down);

    const name = document.createElement("span");
    name.className = "name";
    name.title = item.file.name;
    name.textContent = item.file.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remover ${item.file.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      removeFile(item.id);
    });

    li.addEventListener("click", () => {
      selectedId = item.id;
      render();
    });
    li.append(reorder, name, remove);
    fileList.append(li);
  });

  renderPreview();

  const current = files.find((item) => item.id === selectedId);
  btnOne.disabled = converting || !current;
  btnAll.disabled = converting || files.length === 0;
  btnAll.textContent = merged ? "Juntar em um PDF" : "Converter todos";
}

function options() {
  return {
    format: document.getElementById("opt-format").value,
    margin: document.getElementById("opt-margin").value,
    pageNumbers: document.getElementById("opt-pages").checked ? "true" : "false",
    tableOfContents: document.getElementById("opt-toc").checked ? "true" : "false",
    fontScale: document.getElementById("opt-font-scale").value,
    pageBreaks: document.getElementById("opt-breaks").checked ? "true" : "false",
    showFileTitles: document.getElementById("opt-titles").checked ? "true" : "false",
    outputName: document.getElementById("opt-output-name").value.trim() || "documentos",
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function pdfNameFrom(fileName) {
  return fileName.replace(/\.(md|markdown|txt)$/i, "") + ".pdf";
}

async function convertItems(items, { merged }) {
  const body = new FormData();
  const opts = options();
  for (const item of items) {
    body.append("files", item.file, item.file.name);
  }
  body.append("format", opts.format);
  body.append("margin", opts.margin);
  body.append("pageNumbers", opts.pageNumbers);
  body.append("tableOfContents", opts.tableOfContents);
  body.append("fontScale", opts.fontScale);
  body.append("pageBreaks", opts.pageBreaks);
  body.append("showFileTitles", opts.showFileTitles);
  body.append("outputName", opts.outputName);

  const response = await fetch("/api/convert", { method: "POST", body });
  if (!response.ok) {
    let message = "Falha ao gerar o PDF.";
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      message = data.error || message;
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = merged && items.length > 1
    ? pdfNameFrom(opts.outputName.replace(/\.pdf$/i, "") + ".md")
    : pdfNameFrom(items[0].file.name);
  downloadBlob(blob, filename);
}

async function runConversion(items, { merged = false } = {}) {
  converting = true;
  render();
  try {
    if (merged) {
      setStatus(`Juntando ${items.length} arquivo(s) em um PDF...`);
      await convertItems(items, { merged: true });
      setStatus("PDF unificado baixado.", "ok");
    } else {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        setStatus(`Gerando PDF ${i + 1} de ${items.length}: ${item.file.name}`);
        await convertItems([item], { merged: false });
      }
      setStatus(items.length === 1 ? "PDF baixado." : `${items.length} PDFs baixados.`, "ok");
    }
  } catch (error) {
    setStatus(error.message, "err");
  } finally {
    converting = false;
    render();
  }
}

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener("change", async () => {
  await addFiles(fileInput.files);
  fileInput.value = "";
});

["dragenter", "dragover"].forEach((type) => {
  dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  });
});
["dragleave", "drop"].forEach((type) => {
  dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");
  });
});
dropzone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

btnOne.addEventListener("click", () => {
  const current = files.find((item) => item.id === selectedId);
  if (current) runConversion([current], { merged: false });
});
btnAll.addEventListener("click", () => {
  runConversion([...files], { merged: outputMode() === "merged" });
});

document.querySelectorAll('input[name="output-mode"]').forEach((input) => {
  input.addEventListener("change", render);
});
document.getElementById("opt-titles").addEventListener("change", renderPreview);

const fontScaleInput = document.getElementById("opt-font-scale");
const fontScaleValue = document.getElementById("opt-font-scale-value");
fontScaleInput.addEventListener("input", () => {
  fontScaleValue.textContent = `${fontScaleInput.value}%`;
  preview.style.fontSize = `${fontScaleInput.value}%`;
});

render();
