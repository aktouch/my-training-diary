// src/lib/saveActivitiesToFirestore.ts などに保存している想定

import { db } from '@/lib/firebase';
import { collection, addDoc, getAuth } from 'firebase/firestore';

export async function saveActivitiesToFirestore(activities: any[]) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    console.error('ユーザー未ログイン');
    return;
  }

  const batch = activities.map((activity) => ({
    name: activity.name,
    start_date: activity.start_date,
    distance: activity.distance,
    type: activity.type,
    uid: user.uid, // ⭐️ここ追加
  }));

  const colRef = collection(db, 'strava_activities');

  for (const item of batch) {
    await addDoc(colRef, item);
  }
}
