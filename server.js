import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { wrapPdfDocument } from "./lib/pdf-template.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3847;

const TOC_MAX_DEPTH = 3;

function slugify(text, seenSlugs) {
  const base = String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-") || "secao";

  let slug = base;
  let counter = 2;
  while (seenSlugs.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  seenSlugs.add(slug);
  return slug;
}

function createMarkedInstance(context) {
  const instance = new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    }),
    {
      renderer: {
        heading(token) {
          const { tokens, depth } = token;
          const html = this.parser.parseInline(tokens);
          const plainText = this.parser.parseInline(tokens, this.parser.textRenderer).trim();
          const id = slugify(plainText, context.seenSlugs);
          if (plainText && depth <= TOC_MAX_DEPTH) {
            context.headings.push({ depth, text: plainText, id, docIndex: context.currentDocIndex });
          }
          return `<h${depth} id="${id}">${html}</h${depth}>\n`;
        },
      },
    }
  );

  instance.setOptions({ gfm: true, breaks: false });
  return instance;
}

function buildTocHtml(headings) {
  if (!headings.length) return "";
  const items = headings
    .map(({ depth, text, id }) => {
      const level = Math.min(Math.max(depth, 1), TOC_MAX_DEPTH);
      return `<li class="toc-level-${level}"><a href="#${id}"><span class="toc-text">${escapeHtml(text)}</span><span class="toc-dots"></span></a></li>`;
    })
    .join("\n");
  return `<section class="toc-page"><h2 class="toc-title">Sumário</h2><ol class="toc-list">${items}</ol></section>`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 50 },
  fileFilter(_req, file, cb) {
    const name = (file.originalname || "").toLowerCase();
    if (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt")) {
      cb(null, true);
      return;
    }
    cb(new Error("Envie um arquivo .md, .markdown ou .txt"));
  },
});

const PAGE_FORMATS = new Set(["A4", "Letter"]);
const MARGINS = {
  compact: { top: "12mm", bottom: "14mm", left: "12mm", right: "12mm" },
  normal: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
  wide: { top: "24mm", bottom: "26mm", left: "22mm", right: "22mm" },
};

const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

let browser;

function findBrowserExecutable() {
  for (const candidate of BROWSER_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Não encontrei o Chrome nem o Edge. Instale um deles ou defina CHROME_PATH com o caminho do executável."
  );
}

async function getBrowser() {
  if (browser?.connected) return browser;
  const executablePath = findBrowserExecutable();
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--disable-gpu", "--no-first-run", "--no-default-browser-check"],
  });
  return browser;
}

function stripFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? markdown.slice(match[0].length) : markdown;
}

function safePdfName(originalName) {
  const base = path.basename(originalName || "documento.md", path.extname(originalName || ""));
  const cleaned = base.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim() || "documento";
  return `${cleaned}.pdf`;
}

function contentDisposition(filename) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename).replaceAll("'", "%27");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function markdownToPdf(
  documents,
  { title, format, margin, pageNumbers, pageBreaks, showFileTitles, tableOfContents, fontScale }
) {
  const context = { seenSlugs: new Set(), headings: [], currentDocIndex: 0 };
  const markedInstance = createMarkedInstance(context);

  const sections = documents.map((document, index) => {
    context.currentDocIndex = index;
    return {
      title: document.title,
      bodyHtml: markedInstance.parse(stripFrontmatter(document.markdown)),
      pageBreak: pageBreaks,
      showTitle: showFileTitles && documents.length > 1,
    };
  });

  const tocHtml = tableOfContents ? buildTocHtml(context.headings) : "";
  const html = wrapPdfDocument({ title, tocHtml, sections, fontScale });
  const instance = await getBrowser();
  const page = await instance.newPage();

  try {
    await page.setJavaScriptEnabled(false);
    await page.setContent(html, { waitUntil: "load", timeout: 120_000 });
    return await page.pdf({
      format,
      printBackground: true,
      preferCSSPageSize: false,
      margin,
      displayHeaderFooter: pageNumbers,
      headerTemplate: "<div></div>",
      footerTemplate: pageNumbers
        ? `<div style="width:100%;font-size:9px;color:#6b6458;font-family:Georgia,serif;padding:0 16mm;display:flex;justify-content:space-between;">
            <span>${escapeHtml(title)}</span>
            <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>`
        : "<div></div>",
    });
  } finally {
    await page.close();
  }
}

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/convert", (req, res) => {
  upload.array("files", 50)(req, res, async (err) => {
    if (err) {
      const message = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
        ? "O arquivo ultrapassa o limite de 12 MB."
        : err.message || "Não foi possível enviar o arquivo.";
      res.status(400).json({ error: message });
      return;
    }

    const uploaded = req.files || [];
    if (!uploaded.length) {
      res.status(400).json({ error: "Nenhum arquivo foi enviado." });
      return;
    }

    const format = PAGE_FORMATS.has(req.body.format) ? req.body.format : "A4";
    const margin = MARGINS[req.body.margin] || MARGINS.normal;
    const pageNumbers = req.body.pageNumbers !== "false";
    const pageBreaks = req.body.pageBreaks !== "false";
    const showFileTitles = req.body.showFileTitles !== "false";
    const tableOfContents = req.body.tableOfContents !== "false";
    const fontScalePercent = Number.parseInt(req.body.fontScale, 10);
    const fontScale = Number.isFinite(fontScalePercent)
      ? Math.min(Math.max(fontScalePercent, 50), 100) / 100
      : 1;
    const documents = uploaded.map((file) => ({
      title: path.basename(file.originalname, path.extname(file.originalname)),
      markdown: file.buffer.toString("utf8"),
      originalname: file.originalname,
    }));
    const title = documents.length === 1
      ? documents[0].title
      : (req.body.outputName || "documentos").replace(/\.(md|markdown|txt|pdf)$/i, "") || "documentos";
    const downloadName = documents.length === 1
      ? safePdfName(documents[0].originalname)
      : safePdfName(`${title}.md`);

    try {
      const pdf = await markdownToPdf(documents, {
        title,
        format,
        margin,
        pageNumbers,
        pageBreaks,
        showFileTitles,
        tableOfContents,
        fontScale,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", contentDisposition(downloadName));
      res.send(pdf);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Falha ao gerar o PDF." });
    }
  });
});

app.use((error, _req, res, _next) => {
  res.status(500).json({ error: error.message || "Erro interno." });
});

const server = app.listen(PORT, () => {
  console.log(`Conversor MD → PDF em http://localhost:${PORT}`);
});

async function shutdown() {
  if (browser) await browser.close().catch(() => {});
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
