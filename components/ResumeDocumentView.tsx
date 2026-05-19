import type React from "react";
import type {
  PageSize,
  ResumeBlock,
  ResumeFormatting,
  ResumeHeader,
  ResumeSectionDefinition,
  TextStyleKey,
} from "@/types/resume";

export type PageDefinition = {
  label: string;
  width: string;
  height: string;
};

export const pageDefinitions: Record<PageSize, PageDefinition> = {
  letter: {
    label: "Letter",
    width: "8.5in",
    height: "11in",
  },
  a4: {
    label: "A4",
    width: "210mm",
    height: "297mm",
  },
};

type ResumeDocumentViewProps = {
  header: ResumeHeader;
  pageSize: PageSize;
  sectionDefinitions: ResumeSectionDefinition[];
  blocks: ResumeBlock[];
  formatting: ResumeFormatting;
  pageRef?: React.Ref<HTMLElement>;
};

export default function ResumeDocumentView({
  header,
  pageSize,
  sectionDefinitions,
  blocks,
  formatting,
  pageRef,
}: ResumeDocumentViewProps) {
  const page = pageDefinitions[pageSize];

  function textStyle(key: TextStyleKey): React.CSSProperties {
    const style = formatting.textStyles[key];

    return {
      fontFamily: style.fontFamily || formatting.fontFamily,
      fontSize: `${style.fontSize}px`,
      fontWeight: style.bold ? 700 : 400,
      fontStyle: style.italic ? "italic" : "normal",
    };
  }

  return (
    <article
      ref={pageRef}
      id="resume-document"
      className={`resume-page resume-page-${pageSize}`}
      style={
        {
          "--resume-page-width": page.width,
          "--resume-page-height": page.height,
          "--resume-margin": `${formatting.margin}px`,
          fontFamily: formatting.fontFamily,
          lineHeight: formatting.lineHeight,
          padding: `${formatting.margin}px`,
        } as React.CSSProperties
      }
    >
      <header className="resume-header">
        <h1 className="resume-name" style={textStyle("name")}>
          {header.name}
        </h1>
        <p className="resume-contact" style={textStyle("contact")}>
          {header.contactItems.map((item, index) => (
            <span key={item.id}>
              {index > 0 && <span> · </span>}
              {item.href ? (
                <a href={item.href}>{item.value}</a>
              ) : (
                <span>{item.value}</span>
              )}
            </span>
          ))}
        </p>
      </header>

      <div className="resume-body">
        {sectionDefinitions.map((section) => {
          const sectionBlocks = blocks.filter(
            (block) => block.section === section.id,
          );

          if (sectionBlocks.length === 0) return null;

          return (
            <section
              key={section.id}
              className="resume-section"
              style={{ marginBottom: `${formatting.sectionSpacing}px` }}
            >
              <h2
                className="resume-section-title"
                style={textStyle("sectionTitle")}
              >
                {section.label}
              </h2>

              <div className="resume-section-content">
                {sectionBlocks.map((block) => (
                  <ResumeBlockView
                    key={block.id}
                    block={block}
                    section={section}
                    formatting={formatting}
                    textStyle={textStyle}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}

function ResumeBlockView({
  block,
  section,
  formatting,
  textStyle,
}: {
  block: ResumeBlock;
  section: ResumeSectionDefinition;
  formatting: ResumeFormatting;
  textStyle: (key: TextStyleKey) => React.CSSProperties;
}) {
  const hasMeta =
    (section.fields.location && block.location) ||
    (section.fields.gpa && block.gpa) ||
    (section.fields.dates && (block.startDate || block.endDate));

  return (
    <div className="resume-block">
      <div className="resume-block-header">
        <div className="resume-block-main">
          <h3 className="resume-block-title" style={textStyle("blockTitle")}>
            {renderInlineEmphasis(block.title)}
          </h3>

          {section.fields.subtitle && block.subtitle && (
            <p className="resume-block-subtitle" style={textStyle("subtitle")}>
              {renderInlineEmphasis(block.subtitle)}
            </p>
          )}

          {section.fields.stack && block.stack && block.stack.length > 0 && (
            <p className="resume-stack" style={textStyle("stack")}>
              {renderInlineList(block.stack, " · ")}
            </p>
          )}
        </div>

        {hasMeta && (
          <div className="resume-meta" style={textStyle("meta")}>
            {section.fields.location && block.location && (
              <p>{renderInlineEmphasis(block.location)}</p>
            )}

            {section.fields.gpa && block.gpa && (
              <p className="resume-gpa">{renderInlineEmphasis(block.gpa)}</p>
            )}

            {section.fields.dates && (block.startDate || block.endDate) && (
              <p>
                {block.startDate && renderInlineEmphasis(block.startDate)}
                {block.startDate?.trim() && block.endDate?.trim() ? " – " : ""}
                {block.endDate && renderInlineEmphasis(block.endDate)}
              </p>
            )}
          </div>
        )}
      </div>

      {section.fields.bullets && block.bullets.length > 0 && (
        <ul className="resume-bullets">
          {block.bullets.map((bullet) => (
            <li
              key={bullet.id}
              style={{
                ...textStyle("bullet"),
                marginTop: `${formatting.bulletSpacing}px`,
              }}
            >
              {renderInlineEmphasis(bullet.text)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderInlineEmphasis(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return <span key={index}>{part}</span>;
  });
}

function renderInlineList(items: string[], separator: string) {
  return items.map((item, index) => (
    <span key={`${item}-${index}`}>
      {index > 0 && <span>{separator}</span>}
      {renderInlineEmphasis(item)}
    </span>
  ));
}
