"use client";

import { useState } from "react";
import type {
  PageSize,
  ResumeBlock,
  ResumeFormatting,
  ResumeHeader,
  ResumeSectionDefinition,
  ResumeSelection,
  SectionFieldConfig,
  SectionId,
} from "@/types/resume";
import EditorPanel from "@/components/EditorPanel";
import FormattingPanel from "@/components/FormattingPanel";

type ControlPanelProps = {
  blocks: ResumeBlock[];
  header: ResumeHeader;
  sectionDefinitions: ResumeSectionDefinition[];
  selection: ResumeSelection;
  sectionOrder: SectionId[];
  blockOrder: Record<SectionId, string[]>;
  bulletOrder: Record<string, string[]>;
  formatting: ResumeFormatting;
  pageSize: PageSize;
  onPageSizeChange: (pageSize: PageSize) => void;
  onHeaderChange: (header: ResumeHeader) => void;
  onToggleContactItem: (contactItemId: string) => void;
  onToggleBlock: (blockId: string) => void;
  onToggleBullet: (blockId: string, bulletId: string) => void;
  onReorderSection: (draggedSectionId: string, targetIndex: number) => void;
  onReorderBlock: (
    sectionId: SectionId,
    draggedBlockId: string,
    targetIndex: number,
  ) => void;
  onReorderBullet: (
    blockId: string,
    draggedBulletId: string,
    targetIndex: number,
  ) => void;
  onAddSection: (label: string, fields: SectionFieldConfig) => void;
  onDeleteSection: (section: SectionId) => void;
  onAddBlock: (section: SectionId) => void;
  onUpdateBlock: (blockId: string, updates: Partial<ResumeBlock>) => void;
  onDuplicateBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBullet: (blockId: string, text: string) => void;
  onUpdateBullet: (blockId: string, bulletId: string, text: string) => void;
  onDeleteBullet: (blockId: string, bulletId: string) => void;
  onFormattingChange: (formatting: ResumeFormatting) => void;
  onFormattingReset: () => void;
};

type ControlTab = "content" | "formatting";

export default function ControlPanel({
  blocks,
  header,
  sectionDefinitions,
  selection,
  sectionOrder,
  blockOrder,
  bulletOrder,
  formatting,
  pageSize,
  onPageSizeChange,
  onHeaderChange,
  onToggleContactItem,
  onToggleBlock,
  onToggleBullet,
  onReorderSection,
  onReorderBlock,
  onReorderBullet,
  onAddSection,
  onDeleteSection,
  onAddBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
  onFormattingChange,
  onFormattingReset,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<ControlTab>("content");

  function handOffUpwardScroll(event: React.WheelEvent<HTMLDivElement>) {
    if (event.deltaY >= 0) return;
    if (event.currentTarget.scrollTop > 0) return;
    if (window.scrollY <= 0) return;

    window.scrollBy({
      top: event.deltaY,
      left: 0,
      behavior: "auto",
    });
  }

  return (
    <aside className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm print:hidden">
      <div className="border-b border-neutral-200 p-2">
        <div className="grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === "content"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-600 hover:text-neutral-950"
            }`}
          >
            Content
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("formatting")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === "formatting"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-600 hover:text-neutral-950"
            }`}
          >
            Formatting
          </button>
        </div>
      </div>

      <div
        onWheel={handOffUpwardScroll}
        className="max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain p-4 pr-3 pb-28"
      >
        {activeTab === "content" && (
          <EditorPanel
            blocks={blocks}
            header={header}
            sectionDefinitions={sectionDefinitions}
            selection={selection}
            sectionOrder={sectionOrder}
            blockOrder={blockOrder}
            bulletOrder={bulletOrder}
            onToggleBlock={onToggleBlock}
            onHeaderChange={onHeaderChange}
            onToggleContactItem={onToggleContactItem}
            onToggleBullet={onToggleBullet}
            onReorderSection={onReorderSection}
            onReorderBlock={onReorderBlock}
            onReorderBullet={onReorderBullet}
            onAddSection={onAddSection}
            onDeleteSection={onDeleteSection}
            onAddBlock={onAddBlock}
            onUpdateBlock={onUpdateBlock}
            onDuplicateBlock={onDuplicateBlock}
            onDeleteBlock={onDeleteBlock}
            onAddBullet={onAddBullet}
            onUpdateBullet={onUpdateBullet}
            onDeleteBullet={onDeleteBullet}
          />
        )}

        {activeTab === "formatting" && (
          <FormattingPanel
            formatting={formatting}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            onChange={onFormattingChange}
            onReset={onFormattingReset}
          />
        )}
      </div>
    </aside>
  );
}
