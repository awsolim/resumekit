"use client";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import {
  createEmptyUserState,
  normalizeStoredState,
} from "@/lib/resume-utils";
import type { ResumeKitState } from "@/types/resume";

const RESUME_STATE_PATH = "state/resumekit";

function resumeStateDoc(userId: string) {
  return doc(firestore, `users/${userId}/${RESUME_STATE_PATH}`);
}

export async function loadResumeState(userId: string) {
  const snapshot = await getDoc(resumeStateDoc(userId));

  if (!snapshot.exists()) {
    const emptyState = createEmptyUserState();
    await saveResumeState(userId, emptyState);
    return emptyState;
  }

  const data = snapshot.data();
  return normalizeStoredState(data.state ?? data) ?? createEmptyUserState();
}

export async function saveResumeState(
  userId: string,
  state: ResumeKitState,
) {
  await setDoc(
    resumeStateDoc(userId),
    {
      state,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
