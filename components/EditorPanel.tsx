"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ResumeContactItem,
  ResumeBlock,
  ResumeHeader,
  ResumeSectionDefinition,
  ResumeSelection,
  SectionFieldConfig,
  SectionId,
} from "@/types/resume";
import { createEmptyContactItem } from "@/lib/resume-utils";

type EditorPanelProps = {
  blocks: ResumeBlock[];
  header: ResumeHeader;
  sectionDefinitions: ResumeSectionDefinition[];
  selection: ResumeSelection;
  sectionOrder: SectionId[];
  blockOrder: Record<SectionId, string[]>;
  bulletOrder: Record<string, string[]>;
  onToggleBlock: (blockId: string) => void;
  onHeaderChange: (header: ResumeHeader) => void;
  onToggleContactItem: (contactItemId: string) => void;
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
  onRenameSection: (section: SectionId, label: string) => void;
  onDuplicateSection: (section: SectionId) => void;
  onDeleteSection: (section: SectionId) => void;
  onAddBlock: (section: SectionId) => void;
  onUpdateBlock: (blockId: string, updates: Partial<ResumeBlock>) => void;
  onDuplicateBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBullet: (blockId: string, text: string) => void;
  onUpdateBullet: (blockId: string, bulletId: string, text: string) => void;
  onDeleteBullet: (blockId: string, bulletId: string) => void;
  onRequestDangerousAction: (action: DangerousActionConfig) => void;
};

type DangerousActionConfig = {
  title: string;
  message: string;
  confirmLabel?: string;
  completedMessage?: string;
  onConfirm: () => void;
};

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function stackToInput(stack?: string[]) {
  return stack?.join(", ") ?? "";
}

function inputToStack(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const defaultNewSectionFields: SectionFieldConfig = {
  subtitle: true,
  location: true,
  dates: true,
  presentEndDate: true,
  gpa: false,
  stack: false,
  bullets: true,
};

export default function EditorPanel({
  blocks,
  header,
  sectionDefinitions,
  selection,
  sectionOrder,
  blockOrder,
  bulletOrder,
  onToggleBlock,
  onHeaderChange,
  onToggleContactItem,
  onToggleBullet,
  onReorderSection,
  onReorderBlock,
  onReorderBullet,
  onAddSection,
  onRenameSection,
  onDuplicateSection,
  onDeleteSection,
  onAddBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
  onRequestDangerousAction,
}: EditorPanelProps) {
  const [collapsedSections, setCollapsedSections] = useState<string[]>(() =>
    sectionDefinitions.map((section) => section.id),
  );
  const [headerCollapsed, setHeaderCollapsed] = useState(true);
  const [collapsedBlocks, setCollapsedBlocks] = useState<string[]>(() =>
    blocks.map((block) => block.id),
  );
  const [editingBlockIds, setEditingBlockIds] = useState<string[]>([]);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<{
    sectionId: string;
    blockId: string;
  } | null>(null);
  const [draggedBullet, setDraggedBullet] = useState<{
    blockId: string;
    bulletId: string;
  } | null>(null);
  const [linkMenuItemId, setLinkMenuItemId] = useState<string | null>(null);
  const [openSectionMenuId, setOpenSectionMenuId] = useState<string | null>(null);
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
  const [sectionRenameValue, setSectionRenameValue] = useState("");
  const [draftBullets, setDraftBullets] = useState<Record<string, string>>({});
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionFields, setNewSectionFields] = useState<SectionFieldConfig>(
    defaultNewSectionFields,
  );

  function toggleSectionCollapse(section: SectionId) {
    setCollapsedSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
  }

  function toggleBlockCollapse(blockId: string) {
    setCollapsedBlocks((current) =>
      current.includes(blockId)
        ? current.filter((item) => item !== blockId)
        : [...current, blockId],
    );
  }

  function toggleBlockEdit(blockId: string) {
    setEditingBlockIds((current) =>
      current.includes(blockId)
        ? current.filter((item) => item !== blockId)
        : [...current, blockId],
    );
  }

  function updateHeaderName(name: string) {
    onHeaderChange({
      ...header,
      name,
    });
  }

  function addContactItem() {
    onHeaderChange({
      ...header,
      contactItems: [...header.contactItems, createEmptyContactItem()],
    });
  }

  function updateContactItem(
    itemId: string,
    updates: Partial<ResumeContactItem>,
  ) {
    onHeaderChange({
      ...header,
      contactItems: header.contactItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    });
  }

  function deleteContactItem(itemId: string) {
    onRequestDangerousAction({
      title: "Delete display text?",
      message: "Are you sure you want to delete this display text line?",
      confirmLabel: "Delete",
      completedMessage: "Display text deleted.",
      onConfirm: () => {
        onHeaderChange({
          ...header,
          contactItems: header.contactItems.filter((item) => item.id !== itemId),
        });
      },
    });
  }

  function startSectionRename(section: ResumeSectionDefinition) {
    setRenamingSectionId(section.id);
    setSectionRenameValue(section.label);
    setOpenSectionMenuId(null);
  }

  function saveSectionRename() {
    if (!renamingSectionId) return;

    const cleanLabel = sectionRenameValue.trim();
    if (!cleanLabel) return;

    onRenameSection(renamingSectionId, cleanLabel);
    setRenamingSectionId(null);
    setSectionRenameValue("");
  }

  function cancelSectionRename() {
    setRenamingSectionId(null);
    setSectionRenameValue("");
  }

  function applyContactLinkPreset(
    itemId: string,
    preset: "email" | "linkedin" | "github" | "link",
  ) {
    const presetValues = {
      email: {
        label: "Email",
        type: "email" as const,
        href: "mailto:",
      },
      linkedin: {
        label: "LinkedIn",
        type: "link" as const,
        href: "https://linkedin.com/in/",
      },
      github: {
        label: "GitHub",
        type: "link" as const,
        href: "https://github.com/",
      },
      link: {
        label: "Link",
        type: "link" as const,
        href: "",
      },
    };

    updateContactItem(itemId, presetValues[preset]);
    setLinkMenuItemId(null);
  }

  function getOrderedBlocks(sectionId: SectionId) {
    const blockMap = new Map(blocks.map((block) => [block.id, block]));
    const orderedIds =
      blockOrder[sectionId] ??
      blocks.filter((block) => block.section === sectionId).map((block) => block.id);

    return orderedIds
      .map((blockId) => blockMap.get(blockId))
      .filter(isDefined);
  }

  function getOrderedBullets(block: ResumeBlock) {
    const orderedIds =
      bulletOrder[block.id] ?? block.bullets.map((bullet) => bullet.id);

    return orderedIds
      .map((bulletId) => block.bullets.find((bullet) => bullet.id === bulletId))
      .filter(isDefined);
  }

  function updateDraftBullet(blockId: string, text: string) {
    setDraftBullets((current) => ({
      ...current,
      [blockId]: text,
    }));
  }

  function submitDraftBullet(blockId: string) {
    const text = draftBullets[blockId]?.trim();
    if (!text) return;

    onAddBullet(blockId, text);

    setDraftBullets((current) => ({
      ...current,
      [blockId]: "",
    }));
  }

  function submitSectionModal() {
    const cleanName = newSectionName.trim();
    if (!cleanName) return;

    onAddSection(cleanName, {
      ...newSectionFields,
      presentEndDate: newSectionFields.dates
        ? newSectionFields.presentEndDate
        : false,
    });
    setNewSectionName("");
    setNewSectionFields(defaultNewSectionFields);
    setSectionModalOpen(false);
  }

  function handleSectionDragOver(
    event: React.DragEvent<HTMLElement>,
    targetSectionId: string,
  ) {
    event.preventDefault();

    if (!draggedSectionId || draggedSectionId === targetSectionId) return;

    const targetIndex = sectionOrder.indexOf(targetSectionId);
    if (targetIndex === -1) return;

    const rowRect = event.currentTarget.getBoundingClientRect();
    const insertIndex =
      event.clientY > rowRect.top + rowRect.height / 2
        ? targetIndex + 1
        : targetIndex;

    onReorderSection(draggedSectionId, insertIndex);
  }

  function handleBlockDragOver(
    event: React.DragEvent<HTMLDivElement>,
    sectionId: string,
    targetBlockId: string,
    orderedBlockIds: string[],
  ) {
    event.preventDefault();

    if (!draggedBlock) return;
    if (draggedBlock.sectionId !== sectionId) return;
    if (draggedBlock.blockId === targetBlockId) return;

    const targetIndex = orderedBlockIds.indexOf(targetBlockId);
    if (targetIndex === -1) return;

    const rowRect = event.currentTarget.getBoundingClientRect();
    const insertIndex =
      event.clientY > rowRect.top + rowRect.height / 2
        ? targetIndex + 1
        : targetIndex;

    onReorderBlock(sectionId, draggedBlock.blockId, insertIndex);
  }

  function handleBulletDragOver(
    event: React.DragEvent<HTMLDivElement>,
    blockId: string,
    targetBulletId: string,
    orderedBulletIds: string[],
  ) {
    event.preventDefault();

    if (!draggedBullet) return;
    if (draggedBullet.blockId !== blockId) return;
    if (draggedBullet.bulletId === targetBulletId) return;

    const targetIndex = orderedBulletIds.indexOf(targetBulletId);
    if (targetIndex === -1) return;

    const rowRect = event.currentTarget.getBoundingClientRect();
    const insertIndex =
      event.clientY > rowRect.top + rowRect.height / 2
        ? targetIndex + 1
        : targetIndex;

    onReorderBullet(blockId, draggedBullet.bulletId, insertIndex);
  }

  return (
    <div className="min-w-0">
      <div className="min-w-0 divide-y divide-slate-200 border-y border-slate-200">
        <section className="min-w-0 bg-white">
          <div className="flex w-full min-w-0 items-center gap-3 py-4">
            <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />

            <button
              type="button"
              onClick={() => setHeaderCollapsed((current) => !current)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-semibold text-slate-950">
                Resume Title
              </span>
              <span className="mt-1 block truncate text-xs text-slate-500">
                {header.name || "Untitled"} · {header.contactItems.length} contact{" "}
                {header.contactItems.length === 1 ? "item" : "items"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHeaderCollapsed((current) => !current)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-slate-500 hover:bg-sky-50 hover:text-sky-700"
              aria-label="Collapse resume header"
            >
              {headerCollapsed ? "▾" : "▴"}
            </button>
          </div>

          <div
            className={`resume-collapse-grid ${
              headerCollapsed ? "is-collapsed" : "is-open"
            }`}
          >
            <div className="min-h-0 min-w-0">
              <div className="min-w-0 space-y-4 pb-5 pl-5 pr-1">
                <FieldInput
                  label="Display text"
                  value={header.name}
                  onChange={updateHeaderName}
                />

                <div className="space-y-2">
                  {header.contactItems.map((item) => {
                    const itemSelected =
                      selection.selectedContactItemIds.includes(item.id);

                    const hasLinkEditor =
                      item.type !== "text" ||
                      Boolean(item.href) ||
                      linkMenuItemId === item.id;

                    return (
                    <div
                      key={item.id}
                      className="grid min-w-0 gap-2 border-l-2 border-sky-100 bg-white py-2 pl-3"
                    >
                      <div className="grid min-w-0 grid-cols-[auto_1fr_auto_auto] gap-2">
                        <input
                          type="checkbox"
                          checked={itemSelected}
                          onChange={() => onToggleContactItem(item.id)}
                          className="mt-6 h-4 w-4 shrink-0"
                          aria-label={`Show ${item.label || item.value}`}
                        />

                        <FieldInput
                          label="Display text"
                          value={item.value}
                          onChange={(value) =>
                            updateContactItem(item.id, { value })
                          }
                        />

                        <div className="relative mt-5">
                          <button
                            type="button"
                            onClick={() =>
                              setLinkMenuItemId((current) =>
                                current === item.id ? null : item.id,
                              )
                            }
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm hover:bg-sky-50 ${
                              hasLinkEditor ? "text-sky-700" : "text-slate-500"
                            }`}
                            title="Add link"
                            aria-label="Add link"
                          >
                            <LinkIcon />
                          </button>

                          {linkMenuItemId === item.id && (
                            <div className="absolute right-0 z-20 mt-2 w-36 rounded-lg border border-sky-100 bg-white p-1 text-sm shadow-xl shadow-sky-950/10">
                              <LinkPresetButton
                                label="Email"
                                onClick={() =>
                                  applyContactLinkPreset(item.id, "email")
                                }
                              />
                              <LinkPresetButton
                                label="LinkedIn"
                                onClick={() =>
                                  applyContactLinkPreset(item.id, "linkedin")
                                }
                              />
                              <LinkPresetButton
                                label="GitHub"
                                onClick={() =>
                                  applyContactLinkPreset(item.id, "github")
                                }
                              />
                              <LinkPresetButton
                                label="Insert Link"
                                onClick={() =>
                                  applyContactLinkPreset(item.id, "link")
                                }
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteContactItem(item.id)}
                          className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-red-600 hover:bg-red-50"
                          title="Delete contact item"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      {hasLinkEditor && (
                        <FieldInput
                          label="Link"
                          value={item.href ?? ""}
                          placeholder="mailto:, https://linkedin.com/in/, or https://"
                          onChange={(value) =>
                            updateContactItem(item.id, {
                              href: value,
                              type: value ? item.type : "link",
                            })
                          }
                        />
                      )}
                    </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addContactItem}
                  className="w-full rounded-lg border border-dashed border-sky-200 bg-sky-50/60 px-3 py-2 text-xs font-semibold text-sky-700 hover:border-sky-400 hover:bg-sky-50"
                >
                  + Add Display Text
                </button>
              </div>
            </div>
          </div>
        </section>

        {sectionDefinitions.map((section) => {
          const sectionBlocks = getOrderedBlocks(section.id);
          const orderedBlockIds = sectionBlocks.map((block) => block.id);
          const sectionCollapsed = collapsedSections.includes(section.id);
          const inlineBulletBlock =
            isInlineBulletSection(section, sectionBlocks) ? sectionBlocks[0] : null;
          const selectedCount = sectionBlocks.filter((block) =>
            selection.selectedBlockIds.includes(block.id),
          ).length;
          const isSectionDragging = draggedSectionId === section.id;
          const isSectionRenaming = renamingSectionId === section.id;

          return (
            <section
              key={section.id}
              onDragOver={(event) => handleSectionDragOver(event, section.id)}
              className={`min-w-0 bg-white transition ${
                isSectionDragging ? "opacity-60" : ""
              }`}
            >
              <div className="flex w-full min-w-0 items-center gap-3 py-4">
                <span
                  draggable
                  onDragStart={() => setDraggedSectionId(section.id)}
                  onDragEnd={() => setDraggedSectionId(null)}
                  className="shrink-0 cursor-grab select-none text-slate-300 hover:text-sky-500"
                  title="Drag section"
                >
                  ⋮⋮
                </span>

                {isSectionRenaming ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      value={sectionRenameValue}
                      onChange={(event) =>
                        setSectionRenameValue(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveSectionRename();
                        if (event.key === "Escape") cancelSectionRename();
                      }}
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-sky-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-sky-500"
                    />

                    <button
                      type="button"
                      onClick={saveSectionRename}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sky-700 hover:bg-sky-50"
                      aria-label="Save section name"
                    >
                      <CheckIcon />
                    </button>

                    <button
                      type="button"
                      onClick={cancelSectionRename}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-sky-50"
                      aria-label="Cancel section rename"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse(section.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-semibold text-slate-950">
                      {section.label}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {selectedCount} of {sectionBlocks.length} blocks selected
                    </span>
                  </button>
                )}

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSectionMenuId((current) =>
                        current === section.id ? null : section.id,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                    title={`${section.label} options`}
                    aria-label={`${section.label} options`}
                  >
                    <DotsIcon />
                  </button>

                  {openSectionMenuId === section.id && (
                    <div className="absolute right-0 z-20 mt-2 w-36 rounded-lg border border-sky-100 bg-white p-1 text-sm shadow-xl shadow-sky-950/10">
                      <MenuItemButton
                        label="Rename"
                        onClick={() => startSectionRename(section)}
                      />
                      <MenuItemButton
                        label="Duplicate"
                        onClick={() => {
                          onDuplicateSection(section.id);
                          setOpenSectionMenuId(null);
                        }}
                      />
                      <MenuItemButton
                        label="Delete"
                        danger
                        onClick={() => {
                          onDeleteSection(section.id);
                          setOpenSectionMenuId(null);
                        }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleSectionCollapse(section.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                  aria-label={`Collapse ${section.label}`}
                >
                  {sectionCollapsed ? "▾" : "▴"}
                </button>
              </div>

              <div
                className={`resume-collapse-grid ${
                  sectionCollapsed ? "is-collapsed" : "is-open"
                }`}
              >
                <div className="min-h-0 min-w-0">
                  <div className="min-w-0 space-y-3 pb-5 pl-5 pr-1">
                    {inlineBulletBlock ? (
                      <InlineBulletList
                        block={inlineBulletBlock}
                        selection={selection}
                        orderedBullets={getOrderedBullets(inlineBulletBlock)}
                        draggedBullet={draggedBullet}
                        draftValue={draftBullets[inlineBulletBlock.id] ?? ""}
                        onDraftChange={(value) =>
                          updateDraftBullet(inlineBulletBlock.id, value)
                        }
                        onDraftSubmit={() =>
                          submitDraftBullet(inlineBulletBlock.id)
                        }
                        onToggleBullet={onToggleBullet}
                        onUpdateBullet={onUpdateBullet}
                        onDeleteBullet={onDeleteBullet}
                        onDragBulletStart={(bulletId) =>
                          setDraggedBullet({
                            blockId: inlineBulletBlock.id,
                            bulletId,
                          })
                        }
                        onDragBulletEnd={() => setDraggedBullet(null)}
                        onBulletDragOver={handleBulletDragOver}
                      />
                    ) : (
                    sectionBlocks.map((block) => {
                      const blockSelected =
                        selection.selectedBlockIds.includes(block.id);
                      const blockCollapsed = collapsedBlocks.includes(block.id);
                      const blockEditing = editingBlockIds.includes(block.id);
                      const orderedBullets = getOrderedBullets(block);
                      const orderedBulletIds = orderedBullets.map(
                        (bullet) => bullet.id,
                      );
                      const isBlockDragging = draggedBlock?.blockId === block.id;

                      const selectedBulletCount = block.bullets.filter((bullet) =>
                        selection.selectedBulletIds.includes(bullet.id),
                      ).length;

                      return (
                        <div
                          key={block.id}
                          onDragOver={(event) =>
                            handleBlockDragOver(
                              event,
                              section.id,
                              block.id,
                              orderedBlockIds,
                            )
                          }
                          className={`min-w-0 overflow-hidden border-l-2 border-slate-100 bg-white transition hover:border-sky-200 ${
                            isBlockDragging ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex min-w-0 items-start gap-2 py-2 pl-3">
                            <span
                              draggable
                              onDragStart={() =>
                                setDraggedBlock({
                                  sectionId: section.id,
                                  blockId: block.id,
                                })
                              }
                              onDragEnd={() => setDraggedBlock(null)}
                              className="mt-0.5 w-4 shrink-0 cursor-grab select-none text-center text-slate-300 hover:text-sky-500"
                              title="Drag block"
                            >
                              ⋮⋮
                            </span>

                            <input
                              type="checkbox"
                              checked={blockSelected}
                              onChange={() => onToggleBlock(block.id)}
                              className="mt-1 h-4 w-4 shrink-0"
                              aria-label={`Toggle ${block.title}`}
                            />

                            <button
                              type="button"
                              onClick={() => toggleBlockCollapse(block.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <span className="block truncate text-sm font-semibold">
                                {block.title || "Untitled Block"}
                              </span>

                              {block.subtitle && section.fields.subtitle && (
                                <span className="mt-0.5 block truncate text-xs text-slate-600">
                                  {block.subtitle}
                                </span>
                              )}

                              <span className="mt-1 block text-xs text-slate-500">
                                {selectedBulletCount} of {block.bullets.length}{" "}
                                bullets selected
                              </span>
                            </button>

                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleBlockEdit(block.id)}
                                className={`rounded-lg px-2 py-1 text-sm hover:bg-sky-50 ${
                                  blockEditing
                                    ? "bg-sky-50 text-sky-700"
                                    : "text-slate-500"
                                }`}
                                title="Edit block fields"
                              >
                                <EditIcon />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDuplicateBlock(block.id)}
                                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-sky-50"
                                title="Duplicate block"
                              >
                                ⧉
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteBlock(block.id)}
                                className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                                title="Delete block"
                              >
                                <TrashIcon />
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleBlockCollapse(block.id)}
                                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                                aria-label={`Collapse ${block.title}`}
                              >
                                {blockCollapsed ? "▾" : "▴"}
                              </button>
                            </div>
                          </div>

                          <div
                            className={`resume-collapse-grid ${
                              blockCollapsed ? "is-collapsed" : "is-open"
                            }`}
                          >
                            <div className="min-h-0 min-w-0">
                              <div className="min-w-0 space-y-3 pb-3 pl-9 pt-2">
                                {blockEditing && (
                                  <div className="grid min-w-0 gap-2 bg-sky-50/50 p-3">
                                    <FieldInput
                                      label="Title"
                                      value={block.title}
                                      onChange={(value) =>
                                        onUpdateBlock(block.id, { title: value })
                                      }
                                    />

                                    {section.fields.subtitle && (
                                      <FieldInput
                                        label="Subtitle / role"
                                        value={block.subtitle ?? ""}
                                        onChange={(value) =>
                                          onUpdateBlock(block.id, {
                                            subtitle: value,
                                          })
                                        }
                                      />
                                    )}

                                    {section.fields.location && (
                                      <FieldInput
                                        label="Location"
                                        value={block.location ?? ""}
                                        onChange={(value) =>
                                          onUpdateBlock(block.id, {
                                            location: value,
                                          })
                                        }
                                      />
                                    )}

                                    {section.fields.dates && (
                                      <div className="grid min-w-0 grid-cols-2 gap-2">
                                        <FieldInput
                                          label="Start"
                                          value={block.startDate ?? ""}
                                          onChange={(value) =>
                                            onUpdateBlock(block.id, {
                                              startDate: value,
                                            })
                                          }
                                        />

                                        <FieldInput
                                          label={
                                            section.fields.presentEndDate
                                              ? "End / Present"
                                              : "End"
                                          }
                                          value={block.endDate ?? ""}
                                          placeholder={
                                            section.fields.presentEndDate
                                              ? "Present"
                                              : undefined
                                          }
                                          onChange={(value) =>
                                            onUpdateBlock(block.id, {
                                              endDate: value,
                                            })
                                          }
                                        />
                                      </div>
                                    )}

                                    {section.fields.gpa && (
                                      <FieldInput
                                        label="GPA"
                                        value={block.gpa ?? ""}
                                        placeholder="GPA: 3.8 / 4.0"
                                        onChange={(value) =>
                                          onUpdateBlock(block.id, {
                                            gpa: value,
                                          })
                                        }
                                      />
                                    )}

                                    {section.fields.stack && (
                                      <FieldInput
                                        label="Stack / skills"
                                        value={stackToInput(block.stack)}
                                        placeholder="Next.js, Supabase, PostgreSQL"
                                        onChange={(value) =>
                                          onUpdateBlock(block.id, {
                                            stack: inputToStack(value),
                                          })
                                        }
                                      />
                                    )}
                                  </div>
                                )}

                                {section.fields.bullets && (
                                  <div className="min-w-0 space-y-2">
                                    {orderedBullets.map((bullet) => {
                                      const bulletSelected =
                                        selection.selectedBulletIds.includes(
                                          bullet.id,
                                        );
                                      const isDragging =
                                        draggedBullet?.bulletId === bullet.id;

                                      return (
                                        <div
                                          key={bullet.id}
                                          onDragOver={(event) =>
                                            handleBulletDragOver(
                                              event,
                                              block.id,
                                              bullet.id,
                                              orderedBulletIds,
                                            )
                                          }
                                          className={`flex w-full max-w-full min-w-0 items-start gap-2 overflow-hidden rounded-lg border px-2 py-1.5 text-sm text-slate-700 transition ${
                                            isDragging
                                              ? "border-sky-200 bg-sky-50 opacity-60"
                                              : "border-transparent hover:border-sky-100 hover:bg-sky-50/50"
                                          }`}
                                        >
                                          <span
                                            draggable
                                            onDragStart={() =>
                                              setDraggedBullet({
                                                blockId: block.id,
                                                bulletId: bullet.id,
                                              })
                                            }
                                            onDragEnd={() =>
                                              setDraggedBullet(null)
                                            }
                                            className="mt-0.5 w-4 shrink-0 cursor-grab select-none text-center text-slate-300 hover:text-sky-500"
                                            title="Drag bullet"
                                          >
                                            ⋮⋮
                                          </span>

                                          <input
                                            type="checkbox"
                                            checked={bulletSelected}
                                            onChange={() =>
                                              onToggleBullet(block.id, bullet.id)
                                            }
                                            className="mt-1 h-3.5 w-3.5 shrink-0"
                                          />

                                          <AutoGrowTextarea
                                            value={bullet.text}
                                            onChange={(value) =>
                                              onUpdateBullet(
                                                block.id,
                                                bullet.id,
                                                value,
                                              )
                                            }
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              onDeleteBullet(block.id, bullet.id)
                                            }
                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs text-red-600 hover:bg-red-50"
                                            title="Delete bullet"
                                          >
                                            <TrashIcon />
                                          </button>
                                        </div>
                                      );
                                    })}

                                    <div className="group mt-2 flex w-full min-w-0 items-start gap-2 rounded-lg border border-dashed border-sky-200 bg-sky-50/50 px-2 py-1.5 text-sm text-slate-500 focus-within:border-sky-500 focus-within:bg-white">
                                      <span className="mt-0.5 w-4 shrink-0 select-none text-center text-slate-300">
                                        ⋮⋮
                                      </span>

                                      <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm border border-sky-200 bg-white" />

                                      <input
                                        value={draftBullets[block.id] ?? ""}
                                        onChange={(event) =>
                                          updateDraftBullet(
                                            block.id,
                                            event.target.value,
                                          )
                                        }
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.preventDefault();
                                            submitDraftBullet(block.id);
                                          }
                                        }}
                                        onBlur={() =>
                                          submitDraftBullet(block.id)
                                        }
                                        placeholder="Add bullet point"
                                        className="min-w-0 flex-1 bg-transparent italic outline-none placeholder:text-slate-400 focus:not-italic"
                                      />

                                      <span className="h-6 w-6 shrink-0" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }))}

                    {!inlineBulletBlock && (
                      <button
                        type="button"
                        onClick={() => onAddBlock(section.id)}
                        className="w-full rounded-lg border border-dashed border-sky-200 bg-sky-50/60 px-3 py-2 text-xs font-semibold text-sky-700 hover:border-sky-400 hover:bg-sky-50"
                      >
                        + Add {section.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        <div className="bg-white py-4">
          <button
            type="button"
            onClick={() => setSectionModalOpen(true)}
            className="w-full rounded-lg border border-dashed border-sky-200 bg-sky-50/60 px-3 py-2 text-xs font-semibold text-sky-700 hover:border-sky-400 hover:bg-sky-50"
          >
            + Add Section
          </button>
        </div>
      </div>

      {sectionModalOpen && (
        <AddSectionModal
          name={newSectionName}
          fields={newSectionFields}
          onNameChange={setNewSectionName}
          onFieldsChange={setNewSectionFields}
          onCancel={() => setSectionModalOpen(false)}
          onSave={submitSectionModal}
        />
      )}
    </div>
  );
}

function TrashIcon() {
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
      <path d="M4.5 6h11" />
      <path d="M8 6V4.5h4V6" />
      <path d="M6.5 6.5 7.1 16h5.8l.6-9.5" />
      <path d="M8.8 9v4.5" />
      <path d="M11.2 9v4.5" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="currentColor"
    >
      <circle cx="5" cy="10" r="1.3" />
      <circle cx="10" cy="10" r="1.3" />
      <circle cx="15" cy="10" r="1.3" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="m5 14.5-.5 2 2-.5 8.4-8.4-1.5-1.5L5 14.5Z" />
      <path d="m12.4 5.1 1.5-1.5 2.5 2.5-1.5 1.5" />
    </svg>
  );
}

function CheckIcon() {
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
      <path d="m4.5 10.5 3.5 3.4 7.5-8" />
    </svg>
  );
}

function CloseIcon() {
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
      <path d="m6 6 8 8" />
      <path d="m14 6-8 8" />
    </svg>
  );
}

function LinkIcon() {
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
      <path d="M8.5 11.5 11.5 8.5" />
      <path d="M7.5 7.5 6.4 8.6a3 3 0 0 0 4.2 4.2l1.1-1.1" />
      <path d="m12.5 12.5 1.1-1.1a3 3 0 0 0-4.2-4.2L8.3 8.3" />
    </svg>
  );
}

function MenuItemButton({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-md px-2 py-1.5 text-left font-medium ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-sky-50 hover:text-sky-700"
      }`}
    >
      {label}
    </button>
  );
}

function LinkPresetButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-md px-2 py-1.5 text-left font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
    >
      {label}
    </button>
  );
}

function isInlineBulletSection(
  section: ResumeSectionDefinition,
  sectionBlocks: ResumeBlock[],
) {
  return (
    sectionBlocks.length === 1 &&
    section.fields.bullets &&
    !section.fields.subtitle &&
    !section.fields.location &&
    !section.fields.dates &&
    !section.fields.gpa &&
    !section.fields.stack
  );
}

function InlineBulletList({
  block,
  selection,
  orderedBullets,
  draggedBullet,
  draftValue,
  onDraftChange,
  onDraftSubmit,
  onToggleBullet,
  onUpdateBullet,
  onDeleteBullet,
  onDragBulletStart,
  onDragBulletEnd,
  onBulletDragOver,
}: {
  block: ResumeBlock;
  selection: ResumeSelection;
  orderedBullets: ResumeBlock["bullets"];
  draggedBullet: {
    blockId: string;
    bulletId: string;
  } | null;
  draftValue: string;
  onDraftChange: (value: string) => void;
  onDraftSubmit: () => void;
  onToggleBullet: (blockId: string, bulletId: string) => void;
  onUpdateBullet: (blockId: string, bulletId: string, text: string) => void;
  onDeleteBullet: (blockId: string, bulletId: string) => void;
  onDragBulletStart: (bulletId: string) => void;
  onDragBulletEnd: () => void;
  onBulletDragOver: (
    event: React.DragEvent<HTMLDivElement>,
    blockId: string,
    targetBulletId: string,
    orderedBulletIds: string[],
  ) => void;
}) {
  const orderedBulletIds = orderedBullets.map((bullet) => bullet.id);

  return (
    <div className="min-w-0 space-y-2">
      {orderedBullets.map((bullet) => {
        const bulletSelected = selection.selectedBulletIds.includes(bullet.id);
        const isDragging = draggedBullet?.bulletId === bullet.id;

        return (
          <div
            key={bullet.id}
            onDragOver={(event) =>
              onBulletDragOver(event, block.id, bullet.id, orderedBulletIds)
            }
            className={`flex w-full max-w-full min-w-0 items-start gap-2 overflow-hidden rounded-lg border px-2 py-1.5 text-sm text-slate-700 transition ${
              isDragging
                ? "border-sky-200 bg-sky-50 opacity-60"
                : "border-transparent hover:border-sky-100 hover:bg-sky-50/50"
            }`}
          >
            <span
              draggable
              onDragStart={() => onDragBulletStart(bullet.id)}
              onDragEnd={onDragBulletEnd}
              className="mt-0.5 w-4 shrink-0 cursor-grab select-none text-center text-slate-300 hover:text-sky-500"
              title="Drag skill list"
            >
              ⋮⋮
            </span>

            <input
              type="checkbox"
              checked={bulletSelected}
              onChange={() => onToggleBullet(block.id, bullet.id)}
              className="mt-1 h-3.5 w-3.5 shrink-0"
            />

            <AutoGrowTextarea
              value={bullet.text}
              onChange={(value) => onUpdateBullet(block.id, bullet.id, value)}
            />

            <button
              type="button"
              onClick={() => onDeleteBullet(block.id, bullet.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs text-red-600 hover:bg-red-50"
              title="Delete skill list"
            >
              <TrashIcon />
            </button>
          </div>
        );
      })}

      <div className="group mt-2 flex w-full min-w-0 items-start gap-2 rounded-lg border border-dashed border-sky-200 bg-sky-50/50 px-2 py-1.5 text-sm text-slate-500 focus-within:border-sky-500 focus-within:bg-white">
        <span className="mt-0.5 w-4 shrink-0 select-none text-center text-slate-300">
          ⋮⋮
        </span>

        <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm border border-sky-200 bg-white" />

        <input
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onDraftSubmit();
            }
          }}
          onBlur={onDraftSubmit}
          placeholder="Add skill list"
          className="min-w-0 flex-1 bg-transparent italic outline-none placeholder:text-slate-400 focus:not-italic"
        />

        <span className="h-6 w-6 shrink-0" />
      </div>
    </div>
  );
}

function AddSectionModal({
  name,
  fields,
  onNameChange,
  onFieldsChange,
  onCancel,
  onSave,
}: {
  name: string;
  fields: SectionFieldConfig;
  onNameChange: (name: string) => void;
  onFieldsChange: (fields: SectionFieldConfig) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  function updateField(key: keyof SectionFieldConfig, value: boolean) {
    onFieldsChange({
      ...fields,
      [key]: value,
      presentEndDate:
        key === "dates" && !value ? false : fields.presentEndDate,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-xl border border-sky-100 bg-white p-4 shadow-2xl shadow-sky-950/10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Add Section</h3>
            <p className="mt-1 text-sm text-slate-500">
              New sections are added to the active document only.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-sky-50"
            aria-label="Close add section modal"
          >
            ×
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Section name
          </span>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSave();
              if (event.key === "Escape") onCancel();
            }}
            autoFocus
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-sky-500"
          />
        </label>

        <div className="mt-4 space-y-2">
          <CheckboxControl
            label="Subtitle / role"
            checked={fields.subtitle}
            onChange={(value) => updateField("subtitle", value)}
          />
          <CheckboxControl
            label="Location"
            checked={fields.location}
            onChange={(value) => updateField("location", value)}
          />
          <CheckboxControl
            label="Dates"
            checked={fields.dates}
            onChange={(value) => updateField("dates", value)}
          />
          <CheckboxControl
            label="End can be Present"
            checked={fields.presentEndDate}
            disabled={!fields.dates}
            onChange={(value) => updateField("presentEndDate", value)}
          />
          <CheckboxControl
            label="GPA"
            checked={fields.gpa}
            onChange={(value) => updateField("gpa", value)}
          />
          <CheckboxControl
            label="Stack / skills line"
            checked={fields.stack}
            onChange={(value) => updateField("stack", value)}
          />
          <CheckboxControl
            label="Bullet points"
            checked={fields.bullets}
            onChange={(value) => updateField("bullets", value)}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!name.trim()}
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Section
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckboxControl({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium ${
        disabled ? "bg-slate-50 text-slate-400" : "bg-white text-slate-800"
      }`}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

function FieldInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => handleInlineFormatShortcut(event, value, onChange)}
        className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-sky-500"
      />
    </label>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const resizeObserver = new ResizeObserver(resizeTextarea);
    resizeObserver.observe(textarea);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
        requestAnimationFrame(resizeTextarea);
      }}
      onKeyDown={(event) => handleInlineFormatShortcut(event, value, onChange)}
      rows={1}
      wrap="soft"
      className="block min-h-4.5 w-full min-w-0 max-w-full flex-1 resize-none overflow-hidden overflow-x-hidden whitespace-pre-wrap break-words rounded-md bg-transparent px-1 py-0 leading-snug outline-none focus:bg-white focus:ring-1 focus:ring-sky-200"
      style={{
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap",
      }}
    />
  );
}

function handleInlineFormatShortcut<
  T extends HTMLInputElement | HTMLTextAreaElement,
>(
  event: React.KeyboardEvent<T>,
  value: string,
  onChange: (value: string) => void,
) {
  if (!(event.ctrlKey || event.metaKey)) return;

  const key = event.key.toLowerCase();
  if (key !== "b" && key !== "i") return;

  event.preventDefault();
  toggleInlineMarker(event.currentTarget, value, key === "b" ? "**" : "*", onChange);
}

function toggleInlineMarker(
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  marker: "*" | "**",
  onChange: (value: string) => void,
) {
  const selectionStart = input.selectionStart ?? 0;
  const selectionEnd = input.selectionEnd ?? selectionStart;
  const selectedText = value.slice(selectionStart, selectionEnd);
  const selectedMarkerWrapped = isWrappedWithMarker(selectedText, marker);
  const surroundingMarkerWrapped = hasSurroundingMarker(
    value,
    selectionStart,
    selectionEnd,
    marker,
  );

  let nextValue: string;
  let nextSelectionStart: number;
  let nextSelectionEnd: number;

  if (selectedMarkerWrapped) {
    const unwrappedText = selectedText.slice(marker.length, -marker.length);
    nextValue = `${value.slice(0, selectionStart)}${unwrappedText}${value.slice(selectionEnd)}`;
    nextSelectionStart = selectionStart;
    nextSelectionEnd = selectionStart + unwrappedText.length;
  } else if (surroundingMarkerWrapped) {
    nextValue = `${value.slice(0, selectionStart - marker.length)}${selectedText}${value.slice(selectionEnd + marker.length)}`;
    nextSelectionStart = selectionStart - marker.length;
    nextSelectionEnd = nextSelectionStart + selectedText.length;
  } else {
    nextValue = `${value.slice(0, selectionStart)}${marker}${selectedText}${marker}${value.slice(selectionEnd)}`;
    nextSelectionStart = selectionStart + marker.length;
    nextSelectionEnd = nextSelectionStart + selectedText.length;
  }

  onChange(nextValue);

  requestAnimationFrame(() => {
    input.focus();
    input.setSelectionRange(nextSelectionStart, nextSelectionEnd);
  });
}

function isWrappedWithMarker(text: string, marker: "*" | "**") {
  if (!text.startsWith(marker) || !text.endsWith(marker)) return false;
  if (text.length < marker.length * 2) return false;

  if (marker === "*") {
    return !text.startsWith("**") && !text.endsWith("**");
  }

  return true;
}

function hasSurroundingMarker(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  marker: "*" | "**",
) {
  const before = text.slice(selectionStart - marker.length, selectionStart);
  const after = text.slice(selectionEnd, selectionEnd + marker.length);

  if (before !== marker || after !== marker) return false;

  if (marker === "*") {
    const beforePrevious = text.slice(
      selectionStart - marker.length - 1,
      selectionStart - marker.length,
    );
    const afterNext = text.slice(
      selectionEnd + marker.length,
      selectionEnd + marker.length + 1,
    );

    return beforePrevious !== "*" && afterNext !== "*";
  }

  return true;
}
