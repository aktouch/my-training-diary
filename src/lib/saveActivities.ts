// lib/saveActivities.ts

import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // ※あなたのプロジェクトに合わせてパス修正してね

type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  type: string;
};

export const saveActivities = async (activities: StravaActivity[], userId: string) => {
  const activitiesRef = collection(db, "strava_activities");

  const savePromises = activities.map((activity) =>
    addDoc(activitiesRef, {
      userId,
      stravaId: activity.id,
      name: activity.name,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      start_date: activity.start_date,
      type: activity.type,
      createdAt: new Date(),
    })
  );

  await Promise.all(savePromises);
};
