"use client";

import { useState } from "react";
import type React from "react";
import type {
  PageSize,
  ResumeBlock,
  ResumeDocument,
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
  documents: ResumeDocument[];
  activeDocumentId: string;
  isGeneratingPdf: boolean;
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
  onSwitchDocument: (documentId: string) => void;
  onRenameSpecificDocument: (documentId: string, name: string) => void;
  onCreateDocument: () => void;
  onDuplicateSpecificDocument: (documentId: string) => void;
  onDeleteSpecificDocument: (documentId: string) => void;
  onDownloadPdf: (documentId?: string) => void;
};

type ControlTab = "file" | "content" | "formatting";

export default function ControlPanel({
  documents,
  activeDocumentId,
  isGeneratingPdf,
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
  onSwitchDocument,
  onRenameSpecificDocument,
  onCreateDocument,
  onDuplicateSpecificDocument,
  onDeleteSpecificDocument,
  onDownloadPdf,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<ControlTab>("file");
  const [contentRenderKey, setContentRenderKey] = useState(0);

  function selectContentTab() {
    setActiveTab("content");
    setContentRenderKey((current) => current + 1);
  }

  return (
    <aside className="sticky top-0 max-h-screen overflow-y-auto overscroll-contain border-r border-slate-200 bg-white print:hidden">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 pt-4">
        <div className="flex items-end gap-8">
          <TabButton
            active={activeTab === "file"}
            onClick={() => setActiveTab("file")}
          >
            File
          </TabButton>

          <button
            type="button"
            onClick={selectContentTab}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${
              activeTab === "content"
                ? "border-sky-500 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-950"
            }`}
          >
            Content
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("formatting")}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${
              activeTab === "formatting"
                ? "border-sky-500 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-950"
            }`}
          >
            Formatting
          </button>
        </div>
      </div>

      <div className="px-5 py-5 pb-28">
        {activeTab === "file" && (
          <FilePanel
            documents={documents}
            activeDocumentId={activeDocumentId}
            isGeneratingPdf={isGeneratingPdf}
            onSwitchDocument={onSwitchDocument}
            onRenameDocument={onRenameSpecificDocument}
            onCreateDocument={onCreateDocument}
            onDuplicateDocument={onDuplicateSpecificDocument}
            onDeleteDocument={onDeleteSpecificDocument}
            onDownloadPdf={onDownloadPdf}
          />
        )}

        {activeTab === "content" && (
          <EditorPanel
            key={contentRenderKey}
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

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${
        active
          ? "border-sky-500 text-sky-700"
          : "border-transparent text-slate-500 hover:text-slate-950"
      }`}
    >
      {children}
    </button>
  );
}

function FilePanel({
  documents,
  activeDocumentId,
  isGeneratingPdf,
  onSwitchDocument,
  onRenameDocument,
  onCreateDocument,
  onDuplicateDocument,
  onDeleteDocument,
  onDownloadPdf,
}: {
  documents: ResumeDocument[];
  activeDocumentId: string;
  isGeneratingPdf: boolean;
  onSwitchDocument: (documentId: string) => void;
  onRenameDocument: (documentId: string, name: string) => void;
  onCreateDocument: () => void;
  onDuplicateDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onDownloadPdf: (documentId?: string) => void;
}) {
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function startRename(document: ResumeDocument) {
    setEditingDocumentId(document.id);
    setEditingName(document.documentName);
  }

  function saveRename() {
    if (!editingDocumentId) return;

    const cleanName = editingName.trim();
    if (!cleanName) return;

    onRenameDocument(editingDocumentId, cleanName);
    setEditingDocumentId(null);
    setEditingName("");
  }

  function cancelRename() {
    setEditingDocumentId(null);
    setEditingName("");
  }

  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Resumes</h2>
        <button
          type="button"
          onClick={onCreateDocument}
          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
        >
          New
        </button>
      </div>

      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {documents.map((document) => {
          const isActive = document.id === activeDocumentId;
          const isEditing = document.id === editingDocumentId;

          return (
            <div
              key={document.id}
              className={`grid min-w-0 grid-cols-[1fr_auto] items-center gap-3 py-3 text-sm ${
                isActive ? "text-sky-700" : "text-slate-700"
              }`}
            >
              {isEditing ? (
                <input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveRename();
                    if (event.key === "Escape") cancelRename();
                  }}
                  autoFocus
                  className="min-w-0 rounded-lg border border-sky-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-950 outline-none focus:border-sky-500"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSwitchDocument(document.id)}
                  className="min-w-0 truncate text-left font-medium hover:text-slate-950"
                >
                  {document.documentName}
                </button>
              )}

              <div className="flex shrink-0 items-center gap-1">
                {isEditing ? (
                  <>
                    <IconButton label="Save rename" onClick={saveRename}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton label="Cancel rename" onClick={cancelRename}>
                      <CloseIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton
                      label={`Rename ${document.documentName}`}
                      onClick={() => startRename(document)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      label={`Duplicate ${document.documentName}`}
                      onClick={() => onDuplicateDocument(document.id)}
                    >
                      <DuplicateIcon />
                    </IconButton>
                    <IconButton
                      label={`Download ${document.documentName}`}
                      onClick={() => onDownloadPdf(document.id)}
                      disabled={isGeneratingPdf}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      label={`Delete ${document.documentName}`}
                      onClick={() => onDeleteDocument(document.id)}
                      disabled={documents.length <= 1}
                      danger
                    >
                      <TrashIcon />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IconButton({
  label,
  children,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-500 hover:bg-sky-50 hover:text-sky-700"
      }`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {children}
    </svg>
  );
}

function EditIcon() {
  return (
    <IconBase>
      <path d="m5 14.5-.5 2 2-.5 8.4-8.4-1.5-1.5L5 14.5Z" />
      <path d="m12.4 5.1 1.5-1.5 2.5 2.5-1.5 1.5" />
    </IconBase>
  );
}

function DuplicateIcon() {
  return (
    <IconBase>
      <path d="M7 7.5h8v8H7z" />
      <path d="M5 12.5H4v-8h8v1" />
    </IconBase>
  );
}

function DownloadIcon() {
  return (
    <IconBase>
      <path d="M10 3.5v8" />
      <path d="m6.8 8.7 3.2 3.2 3.2-3.2" />
      <path d="M4.5 15.5h11" />
    </IconBase>
  );
}

function TrashIcon() {
  return (
    <IconBase>
      <path d="M4.5 6h11" />
      <path d="M8 6V4.5h4V6" />
      <path d="M6.5 6.5 7.1 16h5.8l.6-9.5" />
      <path d="M8.8 9v4.5" />
      <path d="M11.2 9v4.5" />
    </IconBase>
  );
}

function CheckIcon() {
  return (
    <IconBase>
      <path d="m4.5 10.5 3.5 3.4 7.5-8" />
    </IconBase>
  );
}

function CloseIcon() {
  return (
    <IconBase>
      <path d="m6 6 8 8" />
      <path d="m14 6-8 8" />
    </IconBase>
  );
}
