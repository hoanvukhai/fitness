// Firestore CRUD operations
'use client';

import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, where, orderBy, getDocs, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppSettings, WorkoutSession } from './types';

const SETTINGS_DOC = 'settings/main';

// ==================== SETTINGS ====================

export async function getSettings(): Promise<AppSettings | null> {
  const ref = doc(db, SETTINGS_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as AppSettings;
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const ref = doc(db, SETTINGS_DOC);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, settings as Record<string, unknown>);
  } else {
    await setDoc(ref, { id: 'main', ...settings });
  }
}

// ==================== WORKOUT SESSIONS ====================

export async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
  const ref = doc(db, 'workouts', session.id);
  await setDoc(ref, session);
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | null> {
  const ref = doc(db, 'workouts', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as WorkoutSession;
}

export async function getRecentWorkouts(limitCount: number = 10): Promise<WorkoutSession[]> {
  const q = query(
    collection(db, 'workouts'),
    where('status', '==', 'completed'),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as WorkoutSession);
}

export async function getLastWorkoutForExercise(
  exerciseId: string,
  day: string,
  session: string
): Promise<WorkoutSession | null> {
  const q = query(
    collection(db, 'workouts'),
    where('day', '==', day),
    where('session', '==', session),
    where('status', '==', 'completed'),
    orderBy('date', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as WorkoutSession;
}

export async function getAllWorkouts(): Promise<WorkoutSession[]> {
  const q = query(
    collection(db, 'workouts'),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as WorkoutSession);
}
