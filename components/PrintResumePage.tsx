"use client";

import { useEffect, useMemo, useState } from "react";
import ResumeDocumentView from "@/components/ResumeDocumentView";
import type {
  ResumeBlock,
  ResumeDocument,
  ResumeKitState,
  ResumeSectionDefinition,
} from "@/types/resume";
import { createInitialState, isDefined, readStoredState } from "@/lib/resume-utils";

function getOrderedSections(document: ResumeDocument) {
  const sectionMap = new Map(
    document.sections.map((section) => [section.id, section]),
  );

  return document.sectionOrder
    .map((sectionId) => sectionMap.get(sectionId))
    .filter(isDefined);
}

function getOrderedSelectedBlocks(
  document: ResumeDocument,
  orderedSections: ResumeSectionDefinition[],
): ResumeBlock[] {
  const blockMap = new Map(document.blocks.map((block) => [block.id, block]));

  return orderedSections
    .flatMap((section) => {
      const blockIds =
        document.blockOrder[section.id] ??
        document.blocks
          .filter((block) => block.section === section.id)
          .map((block) => block.id);

      return blockIds.map((blockId) => blockMap.get(blockId)).filter(isDefined);
    })
    .filter((block) => document.selection.selectedBlockIds.includes(block.id))
    .map((block) => {
      const orderedBulletIds =
        document.bulletOrder[block.id] ??
        block.bullets.map((bullet) => bullet.id);
      const orderedBullets = orderedBulletIds
        .map((bulletId) => block.bullets.find((bullet) => bullet.id === bulletId))
        .filter(isDefined)
        .filter((bullet) =>
          document.selection.selectedBulletIds.includes(bullet.id),
        );

      return {
        ...block,
        bullets: orderedBullets,
      };
    });
}

export default function PrintResumePage() {
  const [state, setState] = useState<ResumeKitState | null>(null);
  const fallbackState = useMemo(() => createInitialState(), []);
  const activeState = state ?? fallbackState;
  const activeDocument =
    activeState.documents.find(
      (document) => document.id === activeState.activeDocumentId,
    ) ?? activeState.documents[0];
  const orderedSections = useMemo(
    () => getOrderedSections(activeDocument),
    [activeDocument],
  );
  const selectedBlocks = useMemo(
    () => getOrderedSelectedBlocks(activeDocument, orderedSections),
    [activeDocument, orderedSections],
  );
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
      setState(storedState ?? fallbackState);
    });

    return () => {
      cancelled = true;
    };
  }, [fallbackState]);

  useEffect(() => {
    if (!state) return;

    document.title = `${activeDocument.documentName} Resume`;

    const printTimer = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => window.clearTimeout(printTimer);
  }, [activeDocument.documentName, state]);

  return (
    <main className="print-shell">
      <ResumeDocumentView
        header={selectedHeader}
        pageSize={activeDocument.pageSize}
        sectionDefinitions={orderedSections}
        blocks={selectedBlocks}
        formatting={activeDocument.formatting}
      />
    </main>
  );
}
