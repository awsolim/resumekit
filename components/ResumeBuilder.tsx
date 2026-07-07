"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
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
import { firebaseAuth, googleAuthProvider } from "@/lib/firebase";
import {
  loadResumeState,
  saveResumeState,
} from "@/lib/firebase-resume-store";
import {
  cloneFormatting,
  createBlockId,
  createBlankDocument,
  createBulletId,
  createEmptyBlock,
  createEmptyUserState,
  createSectionDefinition,
  defaultFormatting,
  duplicateBlock,
  duplicateDocument,
  isDefined,
} from "@/lib/resume-utils";

type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error";
type DangerousActionConfig = {
  title: string;
  message: string;
  confirmLabel?: string;
  completedMessage?: string;
  onConfirm: () => void;
};

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

function getOrderedSections(document: ResumeDocument) {
  const sectionMap = new Map(
    document.sections.map((section) => [section.id, section]),
  );

  return document.sectionOrder
    .map((sectionId) => sectionMap.get(sectionId))
    .filter(isDefined);
}

function getSelectedBlocks(
  document: ResumeDocument,
  orderedSections: ReturnType<typeof getOrderedSections>,
) {
  const blockMap = new Map(document.blocks.map((block) => [block.id, block]));

  const orderedBlocks = orderedSections.flatMap((section) => {
    const sectionBlockIds =
      document.blockOrder[section.id] ??
      document.blocks
        .filter((block) => block.section === section.id)
        .map((block) => block.id);

    return sectionBlockIds
      .map((blockId) => blockMap.get(blockId))
      .filter(isDefined);
  });

  return orderedBlocks
    .filter((block) => document.selection.selectedBlockIds.includes(block.id))
    .map((block) => {
      const orderedBulletIds =
        document.bulletOrder[block.id] ?? block.bullets.map((bullet) => bullet.id);

      const orderedBullets = orderedBulletIds
        .map((bulletId) => block.bullets.find((bullet) => bullet.id === bulletId))
        .filter(isDefined);

      return {
        ...block,
        bullets: orderedBullets.filter((bullet) =>
          document.selection.selectedBulletIds.includes(bullet.id),
        ),
      };
    });
}

function getSelectedHeader(document: ResumeDocument) {
  return {
    ...document.header,
    contactItems: document.header.contactItems.filter((item) =>
      document.selection.selectedContactItemIds.includes(item.id),
    ),
  };
}

export default function ResumeBuilder() {
  const initialState = useMemo(() => createEmptyUserState(), []);

  const [documents, setDocuments] = useState<ResumeDocument[]>(
    initialState.documents,
  );
  const [activeDocumentId, setActiveDocumentId] = useState(
    initialState.activeDocumentId,
  );
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [authError, setAuthError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [pendingDangerousAction, setPendingDangerousAction] =
    useState<DangerousActionConfig | null>(null);
  const [completionMessage, setCompletionMessage] = useState("");

  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ?? documents[0];

  const orderedSections = useMemo(
    () => getOrderedSections(activeDocument),
    [activeDocument],
  );

  const selectedBlocks = useMemo(
    () => getSelectedBlocks(activeDocument, orderedSections),
    [activeDocument, orderedSections],
  );

  const selectedHeader = useMemo(
    () => getSelectedHeader(activeDocument),
    [activeDocument],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);
      setAuthError("");

      if (!user) {
        const emptyState = createEmptyUserState();
        setDocuments(emptyState.documents);
        setActiveDocumentId(emptyState.activeDocumentId);
        setCloudReady(false);
        setIsCloudLoading(false);
        setSaveStatus("idle");
        return;
      }

      setCloudReady(false);
      setIsCloudLoading(true);
      setSaveStatus("loading");

      try {
        const cloudState = await loadResumeState(user.uid);
        setDocuments(cloudState.documents);
        setActiveDocumentId(cloudState.activeDocumentId);
        setCloudReady(true);
        setSaveStatus("saved");
      } catch (error) {
        console.error(error);
        setAuthError(
          "Could not load your cloud resumes. Check Firebase Auth, Firestore, and rules.",
        );
        setSaveStatus("error");
      } finally {
        setIsCloudLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!authUser) return;
    if (!cloudReady || isCloudLoading) return;

    const stateToStore: ResumeKitState = {
      documents,
      activeDocumentId,
    };

    queueMicrotask(() => setSaveStatus("saving"));

    const saveTimeout = window.setTimeout(() => {
      saveResumeState(authUser.uid, stateToStore)
        .then(() => setSaveStatus("saved"))
        .catch((error) => {
          console.error(error);
          setSaveStatus("error");
        });
    }, 900);

    return () => window.clearTimeout(saveTimeout);
  }, [
    documents,
    activeDocumentId,
    authReady,
    authUser,
    cloudReady,
    isCloudLoading,
  ]);

  async function signInWithGoogle() {
    setAuthError("");

    try {
      await signInWithPopup(firebaseAuth, googleAuthProvider);
    } catch (error) {
      if (isDismissedAuthPopup(error)) return;

      console.error(error);
      setAuthError("Sign in failed. Check your Firebase authorized domains.");
    }
  }

  async function signOutUser() {
    setAuthError("");

    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error(error);
      setAuthError("Sign out failed. Please try again.");
    }
  }

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
  }

  function requestDangerousAction(action: DangerousActionConfig) {
    setPendingDangerousAction(action);
  }

  function showCompletionMessage(message: string) {
    setCompletionMessage(message);
    window.setTimeout(() => setCompletionMessage(""), 2600);
  }

  function confirmDangerousAction() {
    if (!pendingDangerousAction) return;

    const action = pendingDangerousAction;
    action.onConfirm();
    setPendingDangerousAction(null);

    if (action.completedMessage) {
      showCompletionMessage(action.completedMessage);
    }
  }

  function renameDocument(documentId: string, name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              documentName: cleanName,
            }
          : document,
      ),
    );

  }

  function createDocument() {
    const newDocument = createBlankDocument("Untitled Resume");
    setDocuments((current) => [...current, newDocument]);
    setActiveDocumentId(newDocument.id);
  }

  function duplicateExistingDocument(documentId: string) {
    const documentToDuplicate = documents.find(
      (document) => document.id === documentId,
    );
    if (!documentToDuplicate) return;

    const newDocument = duplicateDocument(documentToDuplicate);
    setDocuments((current) => [...current, newDocument]);
    setActiveDocumentId(newDocument.id);
  }

  function deleteDocument(documentId: string) {
    if (documents.length <= 1) return;

    const documentToDelete = documents.find((document) => document.id === documentId);
    if (!documentToDelete) return;

    requestDangerousAction({
      title: "Delete resume?",
      message: `Are you sure you want to delete "${documentToDelete.documentName}"? This only deletes it from your ResumeKit account.`,
      confirmLabel: "Delete",
      completedMessage: "Resume deleted.",
      onConfirm: () => {
        const remainingDocuments = documents.filter(
          (document) => document.id !== documentId,
        );
        const nextActiveDocument =
          documentId === activeDocument.id ? remainingDocuments[0] : activeDocument;

        setDocuments(remainingDocuments);
        setActiveDocumentId(nextActiveDocument.id);
      },
    });
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
    requestDangerousAction({
      title: "Delete bullet?",
      message: "Are you sure you want to delete this bullet point?",
      confirmLabel: "Delete",
      completedMessage: "Bullet deleted.",
      onConfirm: () => {
        updateActiveDocument((document) => ({
          ...document,
          blocks: document.blocks.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  bullets: block.bullets.filter(
                    (bullet) => bullet.id !== bulletId,
                  ),
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
      },
    });
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

    requestDangerousAction({
      title: "Delete block?",
      message: `Are you sure you want to delete "${block.title || "Untitled Block"}" from this document?`,
      confirmLabel: "Delete",
      completedMessage: "Block deleted.",
      onConfirm: () => {
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
      },
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

  function renameSection(sectionId: SectionId, label: string) {
    const cleanLabel = label.trim();
    if (!cleanLabel) return;

    updateActiveDocument((document) => ({
      ...document,
      sections: document.sections.map((section) =>
        section.id === sectionId ? { ...section, label: cleanLabel } : section,
      ),
    }));
  }

  function duplicateSection(sectionId: SectionId) {
    const section = activeDocument.sections.find((item) => item.id === sectionId);
    if (!section) return;

    const newSection = createSectionDefinition(`${section.label} Copy`, {
      ...section.fields,
    });
    const orderedBlockIds =
      activeDocument.blockOrder[sectionId] ??
      activeDocument.blocks
        .filter((block) => block.section === sectionId)
        .map((block) => block.id);
    const blockMap = new Map(activeDocument.blocks.map((block) => [block.id, block]));
    const newBlocks = orderedBlockIds
      .map((blockId) => blockMap.get(blockId))
      .filter(isDefined)
      .map((block) => {
        const newBlockId = createBlockId(newSection.id);

        return {
          ...block,
          id: newBlockId,
          section: newSection.id,
          bullets: block.bullets.map((bullet) => ({
            ...bullet,
            id: createBulletId(newBlockId),
          })),
        };
      });
    const sourceIndex = activeDocument.sectionOrder.indexOf(sectionId);

    updateActiveDocument((document) => {
      const nextSectionOrder = [...document.sectionOrder];
      nextSectionOrder.splice(sourceIndex + 1, 0, newSection.id);

      return {
        ...document,
        sections: [...document.sections, newSection],
        blocks: [...document.blocks, ...newBlocks],
        sectionOrder: nextSectionOrder,
        blockOrder: {
          ...document.blockOrder,
          [newSection.id]: newBlocks.map((block) => block.id),
        },
        bulletOrder: {
          ...document.bulletOrder,
          ...Object.fromEntries(
            newBlocks.map((block) => [
              block.id,
              block.bullets.map((bullet) => bullet.id),
            ]),
          ),
        },
        selection: {
          ...document.selection,
          selectedBlockIds: Array.from(
            new Set([
              ...document.selection.selectedBlockIds,
              ...newBlocks.map((block) => block.id),
            ]),
          ),
          selectedBulletIds: Array.from(
            new Set([
              ...document.selection.selectedBulletIds,
              ...newBlocks.flatMap((block) =>
                block.bullets.map((bullet) => bullet.id),
              ),
            ]),
          ),
        },
      };
    });
  }

  function deleteSection(sectionId: SectionId) {
    const section = activeDocument.sections.find((item) => item.id === sectionId);
    if (!section) return;

    requestDangerousAction({
      title: "Delete section?",
      message: `Are you sure you want to delete "${section.label}" and everything inside it? Other resumes will not be changed.`,
      confirmLabel: "Delete",
      completedMessage: "Section deleted.",
      onConfirm: () => {
        const blocksToDelete = activeDocument.blocks.filter(
          (block) => block.section === sectionId,
        );
        const blockIdsToDelete = new Set(blocksToDelete.map((block) => block.id));
        const bulletIdsToDelete = new Set(
          blocksToDelete.flatMap((block) =>
            block.bullets.map((bullet) => bullet.id),
          ),
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
      },
    });
  }

  async function downloadPdf(documentId = activeDocument.id) {
    const documentToExport =
      documents.find((document) => document.id === documentId) ?? activeDocument;
    const exportSections = getOrderedSections(documentToExport);
    const exportBlocks = getSelectedBlocks(documentToExport, exportSections);
    const exportHeader = getSelectedHeader(documentToExport);

    setIsGeneratingPdf(true);

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentName: documentToExport.documentName,
          header: exportHeader,
          pageSize: documentToExport.pageSize,
          sectionDefinitions: exportSections,
          blocks: exportBlocks,
          formatting: documentToExport.formatting,
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
      link.download = `${sanitizeFileName(documentToExport.documentName)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      window.alert(
        "PDF export failed. Please try again after checking the document content.",
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  if (!authReady) {
    return (
      <AuthGate
        status="Checking your account"
        detail="ResumeKit is loading your sign-in state."
        authError={authError}
        onSignIn={signInWithGoogle}
        signInDisabled
      />
    );
  }

  if (!authUser) {
    return (
      <AuthGate
        status="Sign in to use ResumeKit"
        detail="Your resumes are saved to your account. Guest editing and local-only saves are turned off."
        authError={authError}
        onSignIn={signInWithGoogle}
      />
    );
  }

  if (isCloudLoading || !cloudReady) {
    return (
      <AuthGate
        status="Loading your resumes"
        detail="ResumeKit is opening the resumes saved to your account."
        authError={authError}
        onSignIn={signInWithGoogle}
        signInDisabled
      />
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1500px] print:max-w-none">
        <header className="border-b border-slate-200 bg-white px-5 py-4 print:hidden lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              ResumeKit
            </span>
            <span className="mt-1 block text-3xl font-bold tracking-tight">
              {activeDocument.documentName}
            </span>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  saveStatus === "error"
                    ? "bg-red-50 text-red-700"
                    : authUser
                      ? "bg-sky-50 text-sky-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {statusLabel(saveStatus, authUser)}
              </span>

              {authUser ? (
                <button
                  type="button"
                  onClick={signOutUser}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={!authReady}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sign In With Google
                </button>
              )}
            </div>

            {authUser && (
              <span className="max-w-[280px] truncate text-xs text-slate-500">
                {authUser.email ?? authUser.displayName}
              </span>
            )}

            {authError && (
              <p className="max-w-md text-sm text-red-600">{authError}</p>
            )}
          </div>
          </div>
        </header>

        <div className="grid items-start lg:grid-cols-[500px_minmax(0,1fr)] print:block">
          <ControlPanel
            documents={documents}
            activeDocumentId={activeDocument.id}
            isGeneratingPdf={isGeneratingPdf}
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
            onRenameSection={renameSection}
            onDuplicateSection={duplicateSection}
            onDeleteSection={deleteSection}
            onAddBlock={addBlock}
            onUpdateBlock={updateBlock}
            onDuplicateBlock={duplicateExistingBlock}
            onDeleteBlock={deleteBlock}
            onAddBullet={addBullet}
            onUpdateBullet={updateBullet}
            onDeleteBullet={deleteBullet}
            onRequestDangerousAction={requestDangerousAction}
            onFormattingChange={updateFormatting}
            onFormattingReset={resetFormatting}
            onSwitchDocument={switchDocument}
            onRenameSpecificDocument={renameDocument}
            onCreateDocument={createDocument}
            onDuplicateSpecificDocument={duplicateExistingDocument}
            onDeleteSpecificDocument={deleteDocument}
            onDownloadPdf={downloadPdf}
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

      {pendingDangerousAction && (
        <ConfirmationModal
          action={pendingDangerousAction}
          onCancel={() => setPendingDangerousAction(null)}
          onConfirm={confirmDangerousAction}
        />
      )}

      {completionMessage && <CompletionToast message={completionMessage} />}
    </main>
  );
}

function AuthGate({
  status,
  detail,
  authError,
  signInDisabled,
  onSignIn,
}: {
  status: string;
  detail: string;
  authError: string;
  signInDisabled?: boolean;
  onSignIn: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 text-slate-950">
      <section className="w-full max-w-md">
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
          ResumeKit
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{status}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>

        <button
          type="button"
          onClick={onSignIn}
          disabled={signInDisabled}
          className="mt-6 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sign In With Google
        </button>

        {authError && <p className="mt-4 text-sm text-red-600">{authError}</p>}
      </section>
    </main>
  );
}

function ConfirmationModal({
  action,
  onCancel,
  onConfirm,
}: {
  action: DangerousActionConfig;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 print:hidden">
      <div className="w-full max-w-sm rounded-xl border border-sky-100 bg-white p-5 shadow-2xl shadow-sky-950/10">
        <h2 className="text-lg font-semibold text-slate-950">{action.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{action.message}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {action.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletionToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-xl shadow-sky-950/10 print:hidden">
      {message}
    </div>
  );
}

function statusLabel(status: SaveStatus, user: User | null) {
  if (!user) return "Account required";

  if (status === "loading") return "Loading cloud resumes";
  if (status === "saving") return "Saving";
  if (status === "saved") return "Saved to cloud";
  if (status === "error") return "Cloud save issue";

  return "Signed in";
}

function isDismissedAuthPopup(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error ? String(error.code) : "";

  return (
    code === "auth/cancelled-popup-request" ||
    code === "auth/popup-closed-by-user"
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
