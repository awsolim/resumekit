"use client";

import { useRef } from "react";
import ResumeDocumentView from "@/components/ResumeDocumentView";
import type {
  ResumeBlock,
  ResumeDocumentSettings,
  ResumeFormatting,
  ResumeHeader,
  ResumeSectionDefinition,
} from "@/types/resume";

type ResumePreviewProps = {
  header: ResumeHeader;
  documentSettings: ResumeDocumentSettings;
  sectionDefinitions: ResumeSectionDefinition[];
  blocks: ResumeBlock[];
  formatting: ResumeFormatting;
};

export default function ResumePreview({
  header,
  documentSettings,
  sectionDefinitions,
  blocks,
  formatting,
}: ResumePreviewProps) {
  const pageRef = useRef<HTMLElement | null>(null);

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-sky-100/80 px-4 py-5 print:min-h-0 print:bg-white print:p-0">
      <div className="mb-4 flex flex-col items-center justify-center gap-2 text-center print:hidden sm:flex-row">
        <h2 className="text-lg font-semibold text-slate-900">
          {documentSettings.documentName}
        </h2>
      </div>

      <div className="overflow-auto print:overflow-visible">
        <ResumeDocumentView
          pageRef={pageRef}
          header={header}
          pageSize={documentSettings.pageSize}
          sectionDefinitions={sectionDefinitions}
          blocks={blocks}
          formatting={formatting}
        />
      </div>
    </section>
  );
}
