"use client";

import { useMemo, useState } from "react";
import type { ResumeBlock, ResumeSelection, SectionType } from "@/types/resume";


function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

type EditorPanelProps = {
  blocks: ResumeBlock[];
  selection: ResumeSelection;
  bulletOrder: Record<string, string[]>;
  onToggleBlock: (blockId: string) => void;
  onToggleBullet: (blockId: string, bulletId: string) => void;
  onReorderBullet: (
    blockId: string,
    draggedBulletId: string,
    targetBulletId: string,
  ) => void;
  onAddSection: () => void;
  onAddBlock: (section: SectionType) => void;
  onAddBullet: (blockTitle: string) => void;
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

export default function EditorPanel({
  blocks,
  selection,
  bulletOrder,
  onToggleBlock,
  onToggleBullet,
  onReorderBullet,
  onAddSection,
  onAddBlock,
  onAddBullet,
}: EditorPanelProps) {
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [collapsedBlocks, setCollapsedBlocks] = useState<string[]>([]);
  const [draggedBullet, setDraggedBullet] = useState<{
    blockId: string;
    bulletId: string;
  } | null>(null);

  function toggleSectionCollapse(section: SectionType) {
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

  function getOrderedBullets(block: ResumeBlock) {
  const orderedIds =
    bulletOrder[block.id] ?? block.bullets.map((bullet) => bullet.id);

  return orderedIds
    .map((bulletId) => block.bullets.find((bullet) => bullet.id === bulletId))
    .filter(isDefined);
}

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm print:hidden">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Editor</h2>

        <button
          type="button"
          onClick={onAddSection}
          className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-100"
        >
          Add Section
        </button>
      </div>

      <div className="space-y-4">
        {sectionOrder.map((section) => {
          const sectionBlocks = blocks.filter((block) => block.section === section);
          const sectionCollapsed = collapsedSections.includes(section);
          const selectedCount = sectionBlocks.filter((block) =>
            selection.selectedBlockIds.includes(block.id),
          ).length;

          return (
            <section
              key={section}
              className="rounded-2xl border border-neutral-200 bg-neutral-50"
            >
              <button
                type="button"
                onClick={() => toggleSectionCollapse(section)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                    {sectionLabels[section]}
                  </span>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {selectedCount} of {sectionBlocks.length} blocks selected
                  </span>
                </span>

                <span className="text-lg font-semibold text-neutral-500">
                  {sectionCollapsed ? "▾" : "▴"}
                </span>
              </button>

              <div
                className={`resume-collapse-grid ${
                  sectionCollapsed ? "is-collapsed" : "is-open"
                }`}
              >
                <div className="min-h-0">
                  <div className="space-y-3 border-t border-neutral-200 p-3">
                    {sectionBlocks.map((block) => {
                      const blockSelected =
                        selection.selectedBlockIds.includes(block.id);
                      const blockCollapsed = collapsedBlocks.includes(block.id);
                      const orderedBullets = getOrderedBullets(block);

                      const selectedBulletCount = block.bullets.filter((bullet) =>
                        selection.selectedBulletIds.includes(bullet.id),
                      ).length;

                      return (
                        <div
                          key={block.id}
                          className="rounded-xl border border-neutral-200 bg-white"
                        >
                          <div className="flex items-start gap-3 p-3">
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
                                {block.title}
                              </span>

                              {block.subtitle && (
                                <span className="mt-0.5 block truncate text-xs text-neutral-600">
                                  {block.subtitle}
                                </span>
                              )}

                              <span className="mt-1 block text-xs text-neutral-500">
                                {selectedBulletCount} of {block.bullets.length}{" "}
                                bullets selected
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleBlockCollapse(block.id)}
                              className="rounded-lg px-2 py-1 text-sm font-semibold text-neutral-500 hover:bg-neutral-100"
                              aria-label={`Collapse ${block.title}`}
                            >
                              {blockCollapsed ? "▾" : "▴"}
                            </button>
                          </div>

                          <div
                            className={`resume-collapse-grid ${
                              blockCollapsed ? "is-collapsed" : "is-open"
                            }`}
                          >
                            <div className="min-h-0">
                              <div className="space-y-2 border-t border-neutral-200 p-3">
                                {orderedBullets.map((bullet) => {
                                  const bulletSelected =
                                    selection.selectedBulletIds.includes(bullet.id);

                                  const isDragging =
                                    draggedBullet?.bulletId === bullet.id;

                                  return (
                                    <div
                                      key={bullet.id}
                                      draggable
                                      onDragStart={() =>
                                        setDraggedBullet({
                                          blockId: block.id,
                                          bulletId: bullet.id,
                                        })
                                      }
                                      onDragEnd={() => setDraggedBullet(null)}
                                      onDragOver={(event) => event.preventDefault()}
                                      onDrop={() => {
                                        if (!draggedBullet) return;
                                        if (draggedBullet.blockId !== block.id) return;

                                        onReorderBullet(
                                          block.id,
                                          draggedBullet.bulletId,
                                          bullet.id,
                                        );
                                      }}
                                      className={`flex cursor-grab items-start gap-2 rounded-lg border border-transparent px-2 py-1 text-sm text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50 ${
                                        isDragging ? "opacity-40" : ""
                                      }`}
                                    >
                                      <span className="mt-0.5 select-none text-neutral-400">
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

                                      <span>{bullet.text}</span>
                                    </div>
                                  );
                                })}

                                <button
                                  type="button"
                                  onClick={() => onAddBullet(block.title)}
                                  className="mt-2 w-full rounded-xl border border-dashed border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-600 hover:border-neutral-500 hover:bg-neutral-50"
                                >
                                  Add Bullet
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => onAddBlock(section)}
                      className="w-full rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:border-neutral-500 hover:bg-neutral-50"
                    >
                      Add {sectionLabels[section]}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}