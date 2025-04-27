// src/app/strava/callback/page.tsx

"use client"; // ← App Routerの場合、useRouterを使うときは必須！

import { useRouter } from "next/navigation"; // ← app routerならこっち
import { useEffect, useState } from "react";

export default function StravaCallback() {
  const router = useRouter();
  const [message, setMessage] = useState("認証処理中...");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code) {
      const exchangeToken = async () => {
        try {
          const clientId = "157201";
          const clientSecret = "a92cb7042f3c645bece9e4df38899ab8d3607fa9";
          const redirectUri = "http://localhost:3000/strava/callback";

          const response = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              code,
              grant_type: "authorization_code",
              redirect_uri: redirectUri,
            }),
          });

          const data = await response.json();

          if (data.access_token) {
            localStorage.setItem("strava_access_token", data.access_token);
            setMessage("連携成功！トップに戻ります");
            setTimeout(() => {
              router.push("/"); // トップに戻す
            }, 2000);
          } else {
            setMessage("トークン取得失敗しました。");
          }
        } catch (error) {
          console.error(error);
          setMessage("エラーが発生しました。");
        }
      };

      exchangeToken();
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl">{message}</h1>
    </div>
  );
}
