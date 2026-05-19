import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";
import type {
  PageSize,
  ResumeBlock,
  ResumeFormatting,
  ResumeHeader,
  ResumeSectionDefinition,
  TextStyleKey,
} from "@/types/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportPdfPayload = {
  documentName: string;
  header: ResumeHeader;
  pageSize: PageSize;
  sectionDefinitions: ResumeSectionDefinition[];
  blocks: ResumeBlock[];
  formatting: ResumeFormatting;
};

const pageDimensions: Record<PageSize, { width: string; height: string }> = {
  letter: {
    width: "8.5in",
    height: "11in",
  },
  a4: {
    width: "210mm",
    height: "297mm",
  },
};

export async function POST(request: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    const payload = (await request.json()) as ExportPdfPayload;
    const page = pageDimensions[payload.pageSize];

    if (!page || !payload.header || !payload.formatting) {
      return Response.json({ error: "Invalid PDF export payload." }, { status: 400 });
    }

    const executablePath = findBrowserExecutable();
    if (!executablePath) {
      return Response.json(
        {
          error:
            "PDF export needs a local Chrome or Edge executable. Install Chrome/Edge or set PUPPETEER_EXECUTABLE_PATH.",
        },
        { status: 500 },
      );
    }

    const resumeMarkup = renderResumeDocumentMarkup(payload);
    const html = createExportHtml(resumeMarkup, page.width, page.height);

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const pdfPage = await browser.newPage();
    await pdfPage.setContent(html, { waitUntil: "load" });
    await pdfPage.emulateMediaType("screen");

    const pdf = await pdfPage.pdf({
      width: page.width,
      height: page.height,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });

    const pdfBody = pdf.buffer.slice(
      pdf.byteOffset,
      pdf.byteOffset + pdf.byteLength,
    ) as ArrayBuffer;

    return new Response(pdfBody, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizeFileName(
          payload.documentName,
        )}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF export failed unexpectedly.";

    return Response.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}

function findBrowserExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => {
    try {
      return Boolean(candidate && existsSync(candidate));
    } catch {
      return false;
    }
  });
}

function createExportHtml(resumeMarkup: string, width: string, height: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      ${resumeExportCss(width, height)}
    </style>
  </head>
  <body>
    ${resumeMarkup}
  </body>
</html>`;
}

function renderResumeDocumentMarkup(payload: ExportPdfPayload) {
  const page = pageDimensions[payload.pageSize];

  return `<article id="resume-document" class="resume-page resume-page-${payload.pageSize}" style="${styleObjectToString(
    {
      "--resume-page-width": page.width,
      "--resume-page-height": page.height,
      "--resume-margin": `${payload.formatting.margin}px`,
      "font-family": payload.formatting.fontFamily,
      "line-height": String(payload.formatting.lineHeight),
      padding: `${payload.formatting.margin}px`,
    },
  )}">
    <header class="resume-header">
      <h1 class="resume-name" style="${textStyle("name", payload.formatting)}">${renderInlineEmphasis(
        payload.header.name,
      )}</h1>
      <p class="resume-contact" style="${textStyle("contact", payload.formatting)}">${renderContactItems(
        payload.header,
      )}</p>
    </header>
    <div class="resume-body">
      ${payload.sectionDefinitions
        .map((section) => renderSection(section, payload))
        .join("")}
    </div>
  </article>`;
}

function renderSection(
  section: ResumeSectionDefinition,
  payload: ExportPdfPayload,
) {
  const sectionBlocks = payload.blocks.filter(
    (block) => block.section === section.id,
  );

  if (sectionBlocks.length === 0) return "";

  return `<section class="resume-section" style="margin-bottom: ${payload.formatting.sectionSpacing}px;">
    <h2 class="resume-section-title" style="${textStyle(
      "sectionTitle",
      payload.formatting,
    )}">${escapeHtml(section.label)}</h2>
    <div class="resume-section-content">
      ${sectionBlocks
        .map((block) => renderBlock(block, section, payload.formatting))
        .join("")}
    </div>
  </section>`;
}

function renderBlock(
  block: ResumeBlock,
  section: ResumeSectionDefinition,
  formatting: ResumeFormatting,
) {
  const hasMeta =
    (section.fields.location && block.location) ||
    (section.fields.gpa && block.gpa) ||
    (section.fields.dates && (block.startDate || block.endDate));

  return `<div class="resume-block">
    <div class="resume-block-header">
      <div class="resume-block-main">
        <h3 class="resume-block-title" style="${textStyle(
          "blockTitle",
          formatting,
        )}">${renderInlineEmphasis(block.title)}</h3>
        ${
          section.fields.subtitle && block.subtitle
            ? `<p class="resume-block-subtitle" style="${textStyle(
                "subtitle",
                formatting,
              )}">${renderInlineEmphasis(block.subtitle)}</p>`
            : ""
        }
        ${
          section.fields.stack && block.stack && block.stack.length > 0
            ? `<p class="resume-stack" style="${textStyle(
                "stack",
                formatting,
              )}">${renderInlineList(block.stack, " · ")}</p>`
            : ""
        }
      </div>
      ${
        hasMeta
          ? `<div class="resume-meta" style="${textStyle(
              "meta",
              formatting,
            )}">
              ${
                section.fields.location && block.location
                  ? `<p>${renderInlineEmphasis(block.location)}</p>`
                  : ""
              }
              ${
                section.fields.gpa && block.gpa
                  ? `<p class="resume-gpa">${renderInlineEmphasis(block.gpa)}</p>`
                  : ""
              }
              ${
                section.fields.dates && (block.startDate || block.endDate)
                  ? `<p>${block.startDate ? renderInlineEmphasis(block.startDate) : ""}${
                      block.startDate?.trim() && block.endDate?.trim()
                        ? " – "
                        : ""
                    }${block.endDate ? renderInlineEmphasis(block.endDate) : ""}</p>`
                  : ""
              }
            </div>`
          : ""
      }
    </div>
    ${
      section.fields.bullets && block.bullets.length > 0
        ? `<ul class="resume-bullets">
            ${block.bullets
              .map(
                (bullet) =>
                  `<li style="${textStyle("bullet", formatting)} margin-top: ${
                    formatting.bulletSpacing
                  }px;">${renderInlineEmphasis(bullet.text)}</li>`,
              )
              .join("")}
          </ul>`
        : ""
    }
  </div>`;
}

function renderContactItems(header: ResumeHeader) {
  return header.contactItems
    .map((item, index) => {
      const separator = index > 0 ? "<span> · </span>" : "";
      const content = item.href
        ? `<a href="${escapeAttribute(item.href)}">${escapeHtml(item.value)}</a>`
        : `<span>${escapeHtml(item.value)}</span>`;

      return `<span>${separator}${content}</span>`;
    })
    .join("");
}

function renderInlineEmphasis(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
      }

      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return `<em>${escapeHtml(part.slice(1, -1))}</em>`;
      }

      return escapeHtml(part);
    })
    .join("");
}

function renderInlineList(items: string[], separator: string) {
  return items
    .map((item, index) => {
      const prefix = index > 0 ? `<span>${escapeHtml(separator)}</span>` : "";
      return `<span>${prefix}${renderInlineEmphasis(item)}</span>`;
    })
    .join("");
}

function textStyle(key: TextStyleKey, formatting: ResumeFormatting) {
  const style = formatting.textStyles[key];

  return styleObjectToString({
    "font-family": style.fontFamily || formatting.fontFamily,
    "font-size": `${style.fontSize}px`,
    "font-weight": style.bold ? "700" : "400",
    "font-style": style.italic ? "italic" : "normal",
  });
}

function styleObjectToString(styles: Record<string, string>) {
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${escapeAttribute(value)};`)
    .join(" ");
}

function resumeExportCss(width: string, height: string) {
  return `
@page {
  size: ${width} ${height};
  margin: 0;
}

* {
  box-sizing: border-box;
}

html,
body {
  background: white;
  color: black;
  height: ${height};
  margin: 0;
  padding: 0;
  width: ${width};
}

body {
  overflow: hidden;
}

.resume-page {
  background: white;
  color: black;
  height: var(--resume-page-height);
  margin: 0;
  min-height: var(--resume-page-height);
  overflow: hidden;
  width: var(--resume-page-width);
  box-shadow: none;
}

.resume-header {
  border-bottom: 1px solid #000;
  padding-bottom: 8px;
  text-align: center;
}

.resume-name {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.1;
  margin: 0;
  text-transform: uppercase;
}

.resume-contact {
  font-size: 11px;
  line-height: 1.2;
  margin: 4px 0 0;
}

.resume-contact a {
  color: inherit;
  text-decoration: none;
}

.resume-body {
  padding-top: 12px;
}

.resume-section {
  break-inside: avoid;
}

.resume-section-title {
  border-bottom: 1px solid #000;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
  margin: 0;
  padding-bottom: 2px;
  text-transform: uppercase;
}

.resume-section-content {
  margin-top: 6px;
}

.resume-block {
  break-inside: avoid;
  margin-bottom: 8px;
}

.resume-block-header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.resume-block-main {
  flex: 1 1 auto;
  min-width: 0;
}

.resume-block-title,
.resume-block-subtitle,
.resume-stack,
.resume-meta p {
  margin: 0;
}

.resume-block-title {
  font-weight: 700;
  line-height: 1.15;
}

.resume-block-subtitle {
  font-style: italic;
  line-height: 1.15;
}

.resume-stack {
  font-size: 10px;
  line-height: 1.15;
}

.resume-meta {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1.15;
  max-width: 42%;
  overflow: visible;
  text-align: right;
  white-space: normal;
}

.resume-gpa {
  text-align: center;
}

.resume-bullets {
  list-style-type: disc;
  margin: 0 0 0 16px;
  padding: 0;
}
`;
}

function sanitizeFileName(documentName: string) {
  return (
    documentName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "resume"
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
