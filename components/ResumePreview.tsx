import type {
  PageSize,
  ResumeBlock,
  ResumeDocumentSettings,
  ResumeFormatting,
  SectionType,
} from "@/types/resume";

type ResumePreviewProps = {
  documentSettings: ResumeDocumentSettings;
  blocks: ResumeBlock[];
  formatting: ResumeFormatting;
};

type PageDefinition = {
  label: string;
  width: string;
  height: string;
  description: string;
};

const pageDefinitions: Record<PageSize, PageDefinition> = {
  letter: {
    label: "Letter",
    width: "8.5in",
    height: "11in",
    description: "8.5 × 11 in",
  },
  a4: {
    label: "A4",
    width: "210mm",
    height: "297mm",
    description: "210 × 297 mm",
  },
};

const sectionOrder: SectionType[] = [
  "education",
  "skills",
  "experience",
  "projects",
];

const sectionLabels: Record<SectionType, string> = {
  education: "Education",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
};

export default function ResumePreview({
  documentSettings,
  blocks,
  formatting,
}: ResumePreviewProps) {
  const page = pageDefinitions[documentSettings.pageSize];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-300 p-4 shadow-sm print:border-0 print:bg-white print:p-0 print:shadow-none">
      <div className="mb-3 text-center print:hidden">
        <h2 className="text-base font-semibold">{documentSettings.documentName}</h2>
        <p className="mt-1 text-xs text-neutral-600">
          {page.label} · {page.description}
        </p>
      </div>

      <div className="overflow-auto print:overflow-visible">
        <article
          id="resume-document"
          className={`resume-page resume-page-${documentSettings.pageSize}`}
          style={{
            "--resume-page-width": page.width,
            "--resume-page-height": page.height,
            "--resume-margin": `${formatting.margin}px`,
            fontFamily: formatting.fontFamily,
            fontSize: `${formatting.fontSize}px`,
            lineHeight: formatting.lineHeight,
            padding: `${formatting.margin}px`,
          } as React.CSSProperties}
        >
          <header className="resume-header">
            <h1 className="resume-name">Amr Soliman</h1>
            <p className="resume-contact">
              Edmonton, AB · asolima1@ualberta.ca · LinkedIn · GitHub ·
              Portfolio
            </p>
          </header>

          <div className="resume-body">
            {sectionOrder.map((section) => {
              const sectionBlocks = blocks.filter(
                (block) => block.section === section,
              );

              if (sectionBlocks.length === 0) return null;

              return (
                <section
                  key={section}
                  className="resume-section"
                  style={{ marginBottom: `${formatting.sectionSpacing}px` }}
                >
                  <h2 className="resume-section-title">
                    {sectionLabels[section]}
                  </h2>

                  <div className="resume-section-content">
                    {sectionBlocks.map((block) => (
                      <ResumeBlockView
                        key={block.id}
                        block={block}
                        formatting={formatting}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}

function ResumeBlockView({
  block,
  formatting,
}: {
  block: ResumeBlock;
  formatting: ResumeFormatting;
}) {
  const hasMeta = block.location || block.startDate || block.endDate;

  return (
    <div className="resume-block">
      <div className="resume-block-header">
        <div className="resume-block-main">
          <h3 className="resume-block-title">{block.title}</h3>

          {block.subtitle && (
            <p className="resume-block-subtitle">{block.subtitle}</p>
          )}

          {block.stack && block.stack.length > 0 && (
            <p className="resume-stack">{block.stack.join(" · ")}</p>
          )}
        </div>

        {hasMeta && (
          <div className="resume-meta">
            {block.location && <p>{block.location}</p>}
            {(block.startDate || block.endDate) && (
              <p>
                {block.startDate}
                {block.startDate || block.endDate ? " – " : ""}
                {block.endDate}
              </p>
            )}
          </div>
        )}
      </div>

      {block.bullets.length > 0 && (
        <ul className="resume-bullets">
          {block.bullets.map((bullet) => (
            <li
              key={bullet.id}
              style={{ marginTop: `${formatting.bulletSpacing}px` }}
            >
              {bullet.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}