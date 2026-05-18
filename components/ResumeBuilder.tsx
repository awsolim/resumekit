"use client";

import { useMemo, useState } from "react";
import { resumeBlocks } from "@/data/resume-data";
import type {
  PageSize,
  ResumeDocument,
  ResumeFormatting,
  ResumeSelection,
} from "@/types/resume";
import EditorPanel from "@/components/EditorPanel";
import ResumePreview from "@/components/ResumePreview";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

const defaultFormatting: ResumeFormatting = {
  fontFamily: "Arial",
  fontSize: 10.5,
  lineHeight: 1.25,
  margin: 36,
  sectionSpacing: 10,
  bulletSpacing: 3,
};

function getAllBlockIds() {
  return resumeBlocks.map((block) => block.id);
}

function getAllBulletIds() {
  return resumeBlocks.flatMap((block) => block.bullets.map((bullet) => bullet.id));
}

function getDefaultBulletOrder() {
  return Object.fromEntries(
    resumeBlocks.map((block) => [
      block.id,
      block.bullets.map((bullet) => bullet.id),
    ]),
  );
}

function createSelection(blockIds: string[]): ResumeSelection {
  const selectedBlocks = resumeBlocks.filter((block) => blockIds.includes(block.id));

  return {
    selectedBlockIds: blockIds,
    selectedBulletIds: selectedBlocks.flatMap((block) =>
      block.bullets.map((bullet) => bullet.id),
    ),
  };
}

const initialDocuments: ResumeDocument[] = [
  {
    id: "software-resume",
    documentName: "Software Resume",
    pageSize: "letter",
    selection: {
      selectedBlockIds: getAllBlockIds(),
      selectedBulletIds: getAllBulletIds(),
    },
    bulletOrder: getDefaultBulletOrder(),
  },
  {
    id: "electrical-resume",
    documentName: "Electrical / Hardware Resume",
    pageSize: "letter",
    selection: createSelection([
      "education-ualberta",
      "skills-software",
      "experience-startup",
      "project-altium",
      "project-suluk",
    ]),
    bulletOrder: getDefaultBulletOrder(),
  },
];

export default function ResumeBuilder() {
  const [documents, setDocuments] = useState<ResumeDocument[]>(initialDocuments);
  const [activeDocumentId, setActiveDocumentId] = useState(initialDocuments[0].id);
  const [documentMenuOpen, setDocumentMenuOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(initialDocuments[0].documentName);

  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ?? documents[0];

  const [formatting] = useState<ResumeFormatting>(defaultFormatting);

  const selectedBlocks = useMemo(() => {
    return resumeBlocks
      .filter((block) => activeDocument.selection.selectedBlockIds.includes(block.id))
      .map((block) => {
        const orderedBulletIds =
          activeDocument.bulletOrder[block.id] ??
          block.bullets.map((bullet) => bullet.id);

        const orderedBullets = orderedBulletIds
  .map((bulletId) => block.bullets.find((bullet) => bullet.id === bulletId))
  .filter(isDefined);

        return {
          ...block,
          bullets: orderedBullets.filter((bullet) =>
            activeDocument.selection.selectedBulletIds.includes(bullet.id),
          ),
        };
      });
  }, [activeDocument]);

  function updateActiveDocument(updater: (document: ResumeDocument) => ResumeDocument) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === activeDocument.id ? updater(document) : document,
      ),
    );
  }

  function switchDocument(documentId: string) {
    const nextDocument = documents.find((document) => document.id === documentId);
    if (!nextDocument) return;

    setActiveDocumentId(documentId);
    setRenameValue(nextDocument.documentName);
    setDocumentMenuOpen(false);
  }

  function renameActiveDocument() {
    const cleanName = renameValue.trim();
    if (!cleanName) return;

    updateActiveDocument((document) => ({
      ...document,
      documentName: cleanName,
    }));

    setDocumentMenuOpen(false);
  }

  function deleteActiveDocument() {
    if (documents.length <= 1) return;

    const remainingDocuments = documents.filter(
      (document) => document.id !== activeDocument.id,
    );

    setDocuments(remainingDocuments);
    setActiveDocumentId(remainingDocuments[0].id);
    setRenameValue(remainingDocuments[0].documentName);
    setDocumentMenuOpen(false);
  }

  function updatePageSize(pageSize: PageSize) {
    updateActiveDocument((document) => ({
      ...document,
      pageSize,
    }));
  }

  function toggleBlock(blockId: string) {
    const block = resumeBlocks.find((item) => item.id === blockId);
    if (!block) return;

    const isSelected = activeDocument.selection.selectedBlockIds.includes(blockId);
    const blockBulletIds = block.bullets.map((bullet) => bullet.id);

    updateActiveDocument((document) => {
      if (isSelected) {
        return {
          ...document,
          selection: {
            selectedBlockIds: document.selection.selectedBlockIds.filter(
              (id) => id !== blockId,
            ),
            selectedBulletIds: document.selection.selectedBulletIds.filter(
              (id) => !blockBulletIds.includes(id),
            ),
          },
        };
      }

      return {
        ...document,
        selection: {
          selectedBlockIds: [...document.selection.selectedBlockIds, blockId],
          selectedBulletIds: Array.from(
            new Set([...document.selection.selectedBulletIds, ...blockBulletIds]),
          ),
        },
      };
    });
  }

  function toggleBullet(blockId: string, bulletId: string) {
    const isSelected = activeDocument.selection.selectedBulletIds.includes(bulletId);

    updateActiveDocument((document) => {
      const nextBulletIds = isSelected
        ? document.selection.selectedBulletIds.filter((id) => id !== bulletId)
        : [...document.selection.selectedBulletIds, bulletId];

      const nextBlockIds = Array.from(
        new Set([...document.selection.selectedBlockIds, blockId]),
      );

      return {
        ...document,
        selection: {
          selectedBlockIds: nextBlockIds,
          selectedBulletIds: nextBulletIds,
        },
      };
    });
  }

  function reorderBullet(blockId: string, draggedBulletId: string, targetBulletId: string) {
    if (draggedBulletId === targetBulletId) return;

    updateActiveDocument((document) => {
      const currentOrder =
        document.bulletOrder[blockId] ??
        resumeBlocks
          .find((block) => block.id === blockId)
          ?.bullets.map((bullet) => bullet.id) ??
        [];

      const withoutDragged = currentOrder.filter((id) => id !== draggedBulletId);
      const targetIndex = withoutDragged.indexOf(targetBulletId);

      if (targetIndex === -1) return document;

      const nextOrder = [...withoutDragged];
      nextOrder.splice(targetIndex, 0, draggedBulletId);

      return {
        ...document,
        bulletOrder: {
          ...document.bulletOrder,
          [blockId]: nextOrder,
        },
      };
    });
  }

  function handleFutureFeature(featureName: string) {
    alert(`${featureName} will be added in the content editing phase.`);
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-4 text-neutral-950 md:p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl print:max-w-none">
        <header className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm print:hidden">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative">
              <button
                type="button"
                onClick={() => setDocumentMenuOpen((current) => !current)}
                className="group flex items-center gap-3 rounded-xl px-1 py-1 text-left hover:bg-neutral-50"
              >
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    ResumeKit
                  </span>
                  <span className="mt-1 block text-3xl font-bold tracking-tight">
                    {activeDocument.documentName}
                  </span>
                </span>

                <span className="mt-6 text-lg text-neutral-500 group-hover:text-neutral-900">
                  {documentMenuOpen ? "▴" : "▾"}
                </span>
              </button>

              {documentMenuOpen && (
                <div className="absolute z-20 mt-3 w-90 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Switch document
                    </p>

                    <div className="mt-2 space-y-1">
                      {documents.map((document) => (
                        <button
                          key={document.id}
                          type="button"
                          onClick={() => switchDocument(document.id)}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium ${
                            document.id === activeDocument.id
                              ? "bg-neutral-950 text-white"
                              : "hover:bg-neutral-100"
                          }`}
                        >
                          {document.documentName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Rename active document
                      </span>
                      <input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-neutral-900"
                      />
                    </label>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={renameActiveDocument}
                        className="flex-1 rounded-xl bg-neutral-950 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                      >
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={deleteActiveDocument}
                        disabled={documents.length <= 1}
                        className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[160px_auto] sm:items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Page size
                </span>
                <select
                  value={activeDocument.pageSize}
                  onChange={(event) =>
                    updatePageSize(event.target.value as PageSize)
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium shadow-sm outline-none focus:border-neutral-900"
                >
                  <option value="letter">Letter</option>
                  <option value="a4">A4</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr] print:block">
          <EditorPanel
            blocks={resumeBlocks}
            selection={activeDocument.selection}
            bulletOrder={activeDocument.bulletOrder}
            onToggleBlock={toggleBlock}
            onToggleBullet={toggleBullet}
            onReorderBullet={reorderBullet}
            onAddSection={() => handleFutureFeature("Add section")}
            onAddBlock={(section) =>
              handleFutureFeature(`Add ${section} block`)
            }
            onAddBullet={(blockTitle) =>
              handleFutureFeature(`Add bullet to ${blockTitle}`)
            }
          />

          <ResumePreview
            documentSettings={{
              documentName: activeDocument.documentName,
              pageSize: activeDocument.pageSize,
            }}
            blocks={selectedBlocks}
            formatting={formatting}
          />
        </div>
      </div>
    </main>
  );
}