// lib/syncStravaActivities.ts

import { fetchActivities } from "@/lib/fetchActivities";
import { saveActivities } from "@/lib/saveActivities";
import { getAuth } from "firebase/auth";

export const syncStravaActivities = async () => {
  try {
    const accessToken = localStorage.getItem("strava_access_token");
    if (!accessToken) {
      throw new Error("STRAVAアクセストークンがありません。");
    }

    const activities = await fetchActivities(accessToken);

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("ログインユーザーが見つかりません。");
    }

    await saveActivities(activities, user.uid);

    alert("STRAVAアクティビティを保存しました！");
  } catch (error) {
    console.error(error);
    alert("エラーが発生しました！");
  }
};
