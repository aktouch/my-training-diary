'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import localizer from '@/lib/calendar';

interface DiaryEvent {
  start: Date;
  end: Date;
  title: string;
}

export default function Home() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [events, setEvents] = useState<DiaryEvent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // ← GPT呼び出し中フラグ

  // ログイン状態を監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ログイン処理
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('ログイン失敗:', error);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } catch (error) {
      console.error('ログアウト失敗:', error);
    }
  };

  const handleSubmit = async () => {
    if (!text || !user) return;

    try {
      await addDoc(collection(db, 'diary'), {
        content: text,
        createdAt: Timestamp.now(),
        uid: user.uid,
        name: user.displayName,
      });
      setStatus('保存しました！');
      setText('');
    } catch (err) {
      console.error(err);
      setStatus('保存に失敗しました');
    }
  };

  const handleAssist = async () => {
    if (!text) return;
    setLoading(true);

    try {
      const res = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ text }), // ←ここを { prompt: text } じゃなく { text } にする！
      });
      const data = await res.json();
      if (data.result) {
        setText(data.result); // ← 生成された文章をtextareaに反映
        setStatus('アシスト完了！');
      } else {
        setStatus('GPT生成に失敗しました');
      }
    } catch (err) {
      console.error(err);
      setStatus('GPT生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'diary'), (snapshot) => {
      const newEvents = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate?.() ?? new Date();
        return {
          start: date,
          end: date,
          title: data.content,
        };
      });
      setEvents(newEvents);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        {user ? (
          <>
            <p>こんにちは、{user.displayName} さん！</p>
            <button onClick={handleLogout} className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
              ログアウト
            </button>
          </>
        ) : (
          <button onClick={handleLogin} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
            Googleでログイン
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-4">練習日誌</h1>

      {user ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="今日の練習内容を入力"
            className="w-full border p-2 mb-2 rounded"
            rows={4}
          />
          <div className="flex gap-4 mb-2">
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              投稿する
            </button>
            <button
              onClick={handleAssist}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'アシスト中...' : 'GPTアシスト生成'}
            </button>
          </div>
          <p className="mt-2 text-sm">{status}</p>
        </>
      ) : (
        <p className="text-gray-500 mb-4">※投稿するにはログインが必要です</p>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-4">カレンダー表示</h2>
      <div style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
        />
      </div>
    </main>
  );
}
