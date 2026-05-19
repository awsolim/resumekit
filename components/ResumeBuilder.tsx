"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PageSize,
  ResumeBlock,
  ResumeDocument,
  ResumeFormatting,
  ResumeHeader,
  ResumeKitState,
  SectionFieldConfig,
  SectionId,
} from "@/types/resume";
import ControlPanel from "@/components/ControlPanel";
import ResumePreview from "@/components/ResumePreview";
import {
  cloneFormatting,
  createBulletId,
  createEmptyBlock,
  createInitialState,
  createNewDocument,
  createSectionDefinition,
  defaultFormatting,
  duplicateBlock,
  duplicateDocument,
  isDefined,
  readStoredState,
  STORAGE_KEY,
} from "@/lib/resume-utils";

function moveId(order: string[], draggedId: string, targetIndex: number) {
  const draggedIndex = order.indexOf(draggedId);
  if (draggedIndex === -1) return order;

  const nextOrder = [...order];
  const [draggedItem] = nextOrder.splice(draggedIndex, 1);
  if (!draggedItem) return order;

  const adjustedTargetIndex =
    draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const boundedTargetIndex = Math.max(
    0,
    Math.min(adjustedTargetIndex, nextOrder.length),
  );

  nextOrder.splice(boundedTargetIndex, 0, draggedItem);
  return nextOrder;
}

export default function ResumeBuilder() {
  const initialState = useMemo(() => createInitialState(), []);

  const [documents, setDocuments] = useState<ResumeDocument[]>(
    initialState.documents,
  );
  const [activeDocumentId, setActiveDocumentId] = useState(
    initialState.activeDocumentId,
  );
  const [documentMenuOpen, setDocumentMenuOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(
    initialState.documents[0].documentName,
  );
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ?? documents[0];

  const orderedSections = useMemo(() => {
    const sectionMap = new Map(
      activeDocument.sections.map((section) => [section.id, section]),
    );

    return activeDocument.sectionOrder
      .map((sectionId) => sectionMap.get(sectionId))
      .filter(isDefined);
  }, [activeDocument]);

  const orderedBlocks = useMemo(() => {
    const blockMap = new Map(
      activeDocument.blocks.map((block) => [block.id, block]),
    );

    return orderedSections.flatMap((section) => {
      const sectionBlockIds =
        activeDocument.blockOrder[section.id] ??
        activeDocument.blocks
          .filter((block) => block.section === section.id)
          .map((block) => block.id);

      return sectionBlockIds
        .map((blockId) => blockMap.get(blockId))
        .filter(isDefined);
    });
  }, [activeDocument, orderedSections]);

  const selectedBlocks = useMemo(() => {
    return orderedBlocks
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
  }, [orderedBlocks, activeDocument]);

  const selectedHeader = useMemo(
    () => ({
      ...activeDocument.header,
      contactItems: activeDocument.header.contactItems.filter((item) =>
        activeDocument.selection.selectedContactItemIds.includes(item.id),
      ),
    }),
    [activeDocument],
  );

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const storedState = readStoredState();

      if (storedState) {
        setDocuments(storedState.documents);
        setActiveDocumentId(storedState.activeDocumentId);

        const storedActiveDocument =
          storedState.documents.find(
            (document) => document.id === storedState.activeDocumentId,
          ) ?? storedState.documents[0];

        setRenameValue(storedActiveDocument.documentName);
      }

      setHasLoadedStorage(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    const stateToStore: ResumeKitState = {
      documents,
      activeDocumentId,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
  }, [documents, activeDocumentId, hasLoadedStorage]);

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

  function createDocument() {
    const newDocument = createNewDocument("Untitled Resume");

    setDocuments((current) => [...current, newDocument]);
    setActiveDocumentId(newDocument.id);
    setRenameValue(newDocument.documentName);
    setDocumentMenuOpen(false);
  }

  function duplicateActiveDocument() {
    const newDocument = duplicateDocument(activeDocument);

    setDocuments((current) => [...current, newDocument]);
    setActiveDocumentId(newDocument.id);
    setRenameValue(newDocument.documentName);
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

  function updateFormatting(formatting: ResumeFormatting) {
    updateActiveDocument((document) => ({
      ...document,
      formatting,
    }));
  }

  function updateHeader(header: ResumeHeader) {
    updateActiveDocument((document) => {
      const previousContactIds = document.header.contactItems.map(
        (item) => item.id,
      );
      const nextContactIds = header.contactItems.map((item) => item.id);
      const addedContactIds = nextContactIds.filter(
        (id) => !previousContactIds.includes(id),
      );

      return {
        ...document,
        header,
        selection: {
          ...document.selection,
          selectedContactItemIds: [
            ...document.selection.selectedContactItemIds.filter((id) =>
              nextContactIds.includes(id),
            ),
            ...addedContactIds,
          ],
        },
      };
    });
  }

  function toggleContactItem(contactItemId: string) {
    const isSelected =
      activeDocument.selection.selectedContactItemIds.includes(contactItemId);

    updateActiveDocument((document) => ({
      ...document,
      selection: {
        ...document.selection,
        selectedContactItemIds: isSelected
          ? document.selection.selectedContactItemIds.filter(
              (id) => id !== contactItemId,
            )
          : [...document.selection.selectedContactItemIds, contactItemId],
      },
    }));
  }

  function resetFormatting() {
    updateActiveDocument((document) => ({
      ...document,
      formatting: cloneFormatting(defaultFormatting),
    }));
  }

  function toggleBlock(blockId: string) {
    const block = activeDocument.blocks.find((item) => item.id === blockId);
    if (!block) return;

    const isSelected = activeDocument.selection.selectedBlockIds.includes(blockId);
    const blockBulletIds = block.bullets.map((bullet) => bullet.id);

    updateActiveDocument((document) => {
      if (isSelected) {
        return {
          ...document,
          selection: {
            ...document.selection,
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
          ...document.selection,
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

      return {
        ...document,
        selection: {
          ...document.selection,
          selectedBlockIds: Array.from(
            new Set([...document.selection.selectedBlockIds, blockId]),
          ),
          selectedBulletIds: nextBulletIds,
        },
      };
    });
  }

  function reorderSection(draggedSectionId: string, targetIndex: number) {
    updateActiveDocument((document) => ({
      ...document,
      sectionOrder: moveId(document.sectionOrder, draggedSectionId, targetIndex),
    }));
  }

  function reorderBlock(
    sectionId: SectionId,
    draggedBlockId: string,
    targetIndex: number,
  ) {
    updateActiveDocument((document) => {
      const fallbackOrder = document.blocks
        .filter((block) => block.section === sectionId)
        .map((block) => block.id);
      const currentOrder = document.blockOrder[sectionId] ?? fallbackOrder;

      return {
        ...document,
        blockOrder: {
          ...document.blockOrder,
          [sectionId]: moveId(currentOrder, draggedBlockId, targetIndex),
        },
      };
    });
  }

  function reorderBullet(
    blockId: string,
    draggedBulletId: string,
    targetIndex: number,
  ) {
    updateActiveDocument((document) => {
      const fallbackOrder =
        document.blocks
          .find((block) => block.id === blockId)
          ?.bullets.map((bullet) => bullet.id) ?? [];
      const currentOrder = document.bulletOrder[blockId] ?? fallbackOrder;

      return {
        ...document,
        bulletOrder: {
          ...document.bulletOrder,
          [blockId]: moveId(currentOrder, draggedBulletId, targetIndex),
        },
      };
    });
  }

  function addBullet(blockId: string, text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;

    const block = activeDocument.blocks.find((item) => item.id === blockId);
    if (!block) return;

    const bulletId = createBulletId(blockId);

    updateActiveDocument((document) => {
      const currentOrder =
        document.bulletOrder[blockId] ?? block.bullets.map((bullet) => bullet.id);

      return {
        ...document,
        blocks: document.blocks.map((item) =>
          item.id === blockId
            ? {
                ...item,
                bullets: [...item.bullets, { id: bulletId, text: cleanText }],
              }
            : item,
        ),
        selection: {
          ...document.selection,
          selectedBlockIds: Array.from(
            new Set([...document.selection.selectedBlockIds, blockId]),
          ),
          selectedBulletIds: Array.from(
            new Set([...document.selection.selectedBulletIds, bulletId]),
          ),
        },
        bulletOrder: {
          ...document.bulletOrder,
          [blockId]: [...currentOrder, bulletId],
        },
      };
    });
  }

  function updateBullet(blockId: string, bulletId: string, text: string) {
    updateActiveDocument((document) => ({
      ...document,
      blocks: document.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              bullets: block.bullets.map((bullet) =>
                bullet.id === bulletId ? { ...bullet, text } : bullet,
              ),
            }
          : block,
      ),
    }));
  }

  function deleteBullet(blockId: string, bulletId: string) {
    updateActiveDocument((document) => ({
      ...document,
      blocks: document.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              bullets: block.bullets.filter((bullet) => bullet.id !== bulletId),
            }
          : block,
      ),
      selection: {
        ...document.selection,
        selectedBlockIds: document.selection.selectedBlockIds,
        selectedBulletIds: document.selection.selectedBulletIds.filter(
          (id) => id !== bulletId,
        ),
      },
      bulletOrder: {
        ...document.bulletOrder,
        [blockId]: (document.bulletOrder[blockId] ?? []).filter(
          (id) => id !== bulletId,
        ),
      },
    }));
  }

  function updateBlock(blockId: string, updates: Partial<ResumeBlock>) {
    updateActiveDocument((document) => ({
      ...document,
      blocks: document.blocks.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block,
      ),
    }));
  }

  function addBlock(sectionId: SectionId) {
    const section = activeDocument.sections.find((item) => item.id === sectionId);
    const newBlock = createEmptyBlock(sectionId, section?.label);

    updateActiveDocument((document) => ({
      ...document,
      blocks: [...document.blocks, newBlock],
      selection: {
        ...document.selection,
        selectedBlockIds: Array.from(
          new Set([...document.selection.selectedBlockIds, newBlock.id]),
        ),
        selectedBulletIds: document.selection.selectedBulletIds,
      },
      blockOrder: {
        ...document.blockOrder,
        [sectionId]: [...(document.blockOrder[sectionId] ?? []), newBlock.id],
      },
      bulletOrder: {
        ...document.bulletOrder,
        [newBlock.id]: [],
      },
    }));
  }

  function duplicateExistingBlock(blockId: string) {
    const block = activeDocument.blocks.find((item) => item.id === blockId);
    if (!block) return;

    const newBlock = duplicateBlock(block);

    updateActiveDocument((document) => {
      const currentOrder =
        document.blockOrder[block.section] ??
        document.blocks
          .filter((item) => item.section === block.section)
          .map((item) => item.id);
      const sourceIndex = currentOrder.indexOf(blockId);
      const nextOrder = [...currentOrder];
      nextOrder.splice(sourceIndex + 1, 0, newBlock.id);

      return {
        ...document,
        blocks: [...document.blocks, newBlock],
        selection: {
          ...document.selection,
          selectedBlockIds: Array.from(
            new Set([...document.selection.selectedBlockIds, newBlock.id]),
          ),
          selectedBulletIds: Array.from(
            new Set([
              ...document.selection.selectedBulletIds,
              ...newBlock.bullets.map((bullet) => bullet.id),
            ]),
          ),
        },
        blockOrder: {
          ...document.blockOrder,
          [block.section]: nextOrder,
        },
        bulletOrder: {
          ...document.bulletOrder,
          [newBlock.id]: newBlock.bullets.map((bullet) => bullet.id),
        },
      };
    });
  }

  function deleteBlock(blockId: string) {
    const block = activeDocument.blocks.find((item) => item.id === blockId);
    if (!block) return;

    const confirmed = window.confirm(
      `Delete "${block.title}" from this document only?`,
    );
    if (!confirmed) return;

    const blockBulletIds = block.bullets.map((bullet) => bullet.id);

    updateActiveDocument((document) => {
      const nextBulletOrder = { ...document.bulletOrder };
      delete nextBulletOrder[blockId];

      return {
        ...document,
        blocks: document.blocks.filter((item) => item.id !== blockId),
        selection: {
          ...document.selection,
          selectedBlockIds: document.selection.selectedBlockIds.filter(
            (id) => id !== blockId,
          ),
          selectedBulletIds: document.selection.selectedBulletIds.filter(
            (id) => !blockBulletIds.includes(id),
          ),
        },
        blockOrder: {
          ...document.blockOrder,
          [block.section]: (document.blockOrder[block.section] ?? []).filter(
            (id) => id !== blockId,
          ),
        },
        bulletOrder: nextBulletOrder,
      };
    });
  }

  function addSection(label: string, fields: SectionFieldConfig) {
    const cleanLabel = label.trim();
    if (!cleanLabel) return;

    const newSection = createSectionDefinition(cleanLabel, fields);

    updateActiveDocument((document) => ({
      ...document,
      sections: [...document.sections, newSection],
      sectionOrder: [...document.sectionOrder, newSection.id],
      blockOrder: {
        ...document.blockOrder,
        [newSection.id]: [],
      },
    }));
  }

  function deleteSection(sectionId: SectionId) {
    const section = activeDocument.sections.find((item) => item.id === sectionId);
    if (!section) return;

    const confirmed = window.confirm(
      `Delete "${section.label}" and all blocks inside it from the active document only? Other documents will not be changed.`,
    );
    if (!confirmed) return;

    const blocksToDelete = activeDocument.blocks.filter(
      (block) => block.section === sectionId,
    );
    const blockIdsToDelete = new Set(blocksToDelete.map((block) => block.id));
    const bulletIdsToDelete = new Set(
      blocksToDelete.flatMap((block) => block.bullets.map((bullet) => bullet.id)),
    );

    updateActiveDocument((document) => {
      const nextBlockOrder = { ...document.blockOrder };
      delete nextBlockOrder[sectionId];

      const nextBulletOrder = { ...document.bulletOrder };
      blockIdsToDelete.forEach((blockId) => {
        delete nextBulletOrder[blockId];
      });

      return {
        ...document,
        sections: document.sections.filter((item) => item.id !== sectionId),
        blocks: document.blocks.filter((block) => block.section !== sectionId),
        sectionOrder: document.sectionOrder.filter((id) => id !== sectionId),
        blockOrder: nextBlockOrder,
        bulletOrder: nextBulletOrder,
        selection: {
          ...document.selection,
          selectedBlockIds: document.selection.selectedBlockIds.filter(
            (id) => !blockIdsToDelete.has(id),
          ),
          selectedBulletIds: document.selection.selectedBulletIds.filter(
            (id) => !bulletIdsToDelete.has(id),
          ),
        },
      };
    });
  }

  function resetPrototypeData() {
    const confirmed = window.confirm(
      "Reset ResumeKit prototype data? This will restore the default documents, sections, and content.",
    );

    if (!confirmed) return;

    const freshState = createInitialState();

    setDocuments(freshState.documents);
    setActiveDocumentId(freshState.activeDocumentId);
    setRenameValue(freshState.documents[0].documentName);
    setDocumentMenuOpen(false);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function printActiveDocument() {
    // Browser print headers/footers are controlled by Chrome's print dialog.
    // The /print route removes the app UI and page chrome from our side.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ documents, activeDocumentId } satisfies ResumeKitState),
    );
    window.open("/print", "_blank");
  }

  async function downloadPdf() {
    setIsGeneratingPdf(true);

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentName: activeDocument.documentName,
          header: selectedHeader,
          pageSize: activeDocument.pageSize,
          sectionDefinitions: orderedSections,
          blocks: selectedBlocks,
          formatting: activeDocument.formatting,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errorBody?.error ?? "PDF export failed.");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${sanitizeFileName(activeDocument.documentName)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      window.alert(
        "PDF export failed. You can still use Print / Save PDF as a fallback.",
      );
    } finally {
      setIsGeneratingPdf(false);
    }
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
                <div className="absolute z-20 mt-3 w-96 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Documents
                      </p>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={createDocument}
                          className="rounded-lg px-2 py-1 text-sm hover:bg-neutral-100"
                          title="Create new document"
                        >
                          ＋
                        </button>

                        <button
                          type="button"
                          onClick={duplicateActiveDocument}
                          className="rounded-lg px-2 py-1 text-sm hover:bg-neutral-100"
                          title="Duplicate active document"
                        >
                          ⧉
                        </button>
                      </div>
                    </div>

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
                        className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Delete active document"
                      >
                        🗑
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={resetPrototypeData}
                      className="mt-3 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                    >
                      Reset prototype data
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadPdf}
                disabled={isGeneratingPdf}
                className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingPdf ? "Generating..." : "Download PDF"}
              </button>

              <button
                type="button"
                onClick={printActiveDocument}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[420px_1fr] print:block">
          <ControlPanel
            blocks={activeDocument.blocks}
            header={activeDocument.header}
            sectionDefinitions={orderedSections}
            selection={activeDocument.selection}
            sectionOrder={activeDocument.sectionOrder}
            blockOrder={activeDocument.blockOrder}
            bulletOrder={activeDocument.bulletOrder}
            formatting={activeDocument.formatting}
            pageSize={activeDocument.pageSize}
            onPageSizeChange={updatePageSize}
            onHeaderChange={updateHeader}
            onToggleContactItem={toggleContactItem}
            onToggleBlock={toggleBlock}
            onToggleBullet={toggleBullet}
            onReorderSection={reorderSection}
            onReorderBlock={reorderBlock}
            onReorderBullet={reorderBullet}
            onAddSection={addSection}
            onDeleteSection={deleteSection}
            onAddBlock={addBlock}
            onUpdateBlock={updateBlock}
            onDuplicateBlock={duplicateExistingBlock}
            onDeleteBlock={deleteBlock}
            onAddBullet={addBullet}
            onUpdateBullet={updateBullet}
            onDeleteBullet={deleteBullet}
            onFormattingChange={updateFormatting}
            onFormattingReset={resetFormatting}
          />

          <ResumePreview
            header={selectedHeader}
            documentSettings={{
              documentName: activeDocument.documentName,
              pageSize: activeDocument.pageSize,
            }}
            sectionDefinitions={orderedSections}
            blocks={selectedBlocks}
            formatting={activeDocument.formatting}
          />
        </div>
      </div>
    </main>
  );
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
