// components/StravaConnectButton.tsx

import React from "react";

const StravaConnectButton = () => {
  const handleConnect = () => {
    const clientId = "157201"; // ※自分のものに差し替えてね
    const redirectUri = "http://localhost:3000/strava/callback"; // ※リダイレクト先
    const responseType = "code";
    const scope = "read,activity:read"; // アクティビティ取得に必要な権限

    const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&approval_prompt=auto&scope=${scope}`;

    window.location.href = url;
  };

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-orange-600 text-white rounded-lg"
    >
      STRAVA連携する
    </button>
  );
};

export default StravaConnectButton;
