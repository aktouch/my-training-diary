// lib/saveActivities.ts

import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // ※あなたのプロジェクトに合わせてパス修正してね

type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  type: string;
};

export async function saveActivities(activities: StravaActivity[], userId: string) {
  console.log('保存開始:', activities.length, '件のアクティビティ');

  for (const activity of activities) {
    try {
      // stravaIdが同じドキュメントを検索
      const q = query(
        collection(db, 'strava_activities'),
        where('stravaId', '==', activity.id)
      );
      const querySnapshot = await getDocs(q);

      // 重複が存在しない場合のみ保存
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'strava_activities'), {
          userId,
          stravaId: activity.id,
          name: activity.name,
          distance: activity.distance,
          moving_time: activity.moving_time,
          elapsed_time: activity.elapsed_time,
          start_date: activity.start_date,
          type: activity.type,
          createdAt: new Date(),
        });
        console.log('アクティビティを保存しました:', activity.id, activity.name);
      } else {
        console.log('重複するアクティビティをスキップしました:', activity.id, activity.name);
      }
    } catch (error) {
      console.error('アクティビティの保存中にエラーが発生しました:', error);
    }
  }

  console.log('保存完了');
}
