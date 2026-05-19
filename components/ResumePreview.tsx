"use client";

import { useEffect, useRef, useState } from "react";
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
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const pageElement = pageRef.current;
    if (!pageElement) return;

    function updateFitState() {
      if (!pageElement) return;
      setIsOverflowing(pageElement.scrollHeight > pageElement.clientHeight + 1);
    }

    updateFitState();

    const resizeObserver = new ResizeObserver(updateFitState);
    resizeObserver.observe(pageElement);

    return () => resizeObserver.disconnect();
  }, [blocks, formatting, header, documentSettings.pageSize]);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-300 p-4 shadow-sm print:border-0 print:bg-white print:p-0 print:shadow-none">
      <div className="mb-3 flex flex-col items-center justify-center gap-2 text-center print:hidden sm:flex-row">
        <h2 className="text-lg font-semibold">{documentSettings.documentName}</h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isOverflowing
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {isOverflowing ? "Overflowing" : "Fits one page"}
        </span>
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
