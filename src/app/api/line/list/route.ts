import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Firebase Admin SDK初期化（さっきと同じ）
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const dbAdmin = getFirestore();

console.log('LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN);

export async function GET(req: NextRequest) {
  const snapshot = await dbAdmin.collection('line_diaries').orderBy('timestamp', 'desc').get();

  const diaries = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log('Firestoreから取得したデータ:', diaries);

  return NextResponse.json({ diaries });
}

async function replyMessage(replyToken: string, message: string) {
  const url = 'https://api.line.me/v2/bot/message/reply';

  const body = {
    replyToken,
    messages: [
      {
        type: 'text',
        text: message,
      },
    ],
  };

  console.log('送信するリクエスト:', {
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body)
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();
    console.log('LINEリプライAPIレスポンス:', response.status, responseBody);
    console.log('LINE APIレスポンス詳細:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody
    });

  } catch (error) {
    console.error('LINEリプライAPIでエラー発生:', error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('受信body全体:', JSON.stringify(body, null, 2));

    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return new Response('Invalid request', { status: 400 });
    }

    console.log('受信イベントオブジェクト:', JSON.stringify(events, null, 2));

    for (const event of events) {
      console.log('イベント内容:', event);

      if (event.type === 'message' && event.message.type === 'text') {
        console.log('テキストメッセージ判定OK');

        const userMessage = event.message.text;
        const userId = event.source.userId;

        console.log(`ユーザーID: ${userId}`);
        console.log(`受信メッセージ: ${userMessage}`);

        await dbAdmin.collection('line_diaries').add({
          userId: userId,
          message: userMessage,
          timestamp: new Date(),
        });

        console.log('Firestoreに保存しました！');
        console.log('リプライ送信します');

        await replyMessage(event.replyToken, 'メッセージ受け取りました！🏃');
      }
    }

    return new Response('OK');
  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
