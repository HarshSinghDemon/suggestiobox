'use server';

import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Suggestion, Assignment } from '@/lib/types';
import type { Subject } from '@/lib/constants';

export async function getSuggestions(activeSubject?: Subject): Promise<Suggestion[]> {
  const { firestore } = initializeFirebase();
  const suggestionsCol = collection(firestore, 'suggestions');
  let q;

  if (activeSubject) {
    q = query(
      suggestionsCol,
      where('subject', '==', activeSubject),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  } else {
    q = query(suggestionsCol, orderBy('createdAt', 'desc'), limit(50));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Suggestion)
  );
}

export async function getAssignments(activeSubject?: Subject): Promise<Assignment[]> {
  const { firestore } = initializeFirebase();
  const assignmentsCol = collection(firestore, 'assignments');
  let q;

  if (activeSubject) {
    q = query(
      assignmentsCol,
      where('subject', '==', activeSubject),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  } else {
    q = query(assignmentsCol, orderBy('createdAt', 'desc'), limit(50));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Assignment)
  );
}
