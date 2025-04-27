// src/app/api/strava/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json({ error: 'アクセストークンがありません' }, { status: 401 });
  }

  const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (Array.isArray(data)) {
    return NextResponse.json({ activities: data });
  } else {
    return NextResponse.json({ error: 'Strava APIから正しいデータを取得できませんでした' }, { status: 500 });
  }
}
