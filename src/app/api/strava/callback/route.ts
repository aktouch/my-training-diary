import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: '認可コードがありません' }, { status: 400 });
  }

  // Stravaアクセストークン取得リクエスト
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 500 });
  }

  // 仮でアクセストークンを返す
  return NextResponse.json({ access_token: data.access_token });
}

