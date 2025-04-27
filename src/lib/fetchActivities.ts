// lib/fetchActivities.ts

export const fetchActivities = async (accessToken: string) => {
    const response = await fetch("https://www.strava.com/api/v3/athlete/activities", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch activities from STRAVA");
    }
  
    const data = await response.json();
    return data; // 配列形式でアクティビティが返ってくる
  };
  