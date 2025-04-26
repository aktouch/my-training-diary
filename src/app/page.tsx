 'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import localizer from '@/lib/calendar';

interface DiaryEvent {
  id: string; // ← ここ追加！
  start: Date;
  end: Date;
  title: string;
}

export default function Home() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [events, setEvents] = useState<DiaryEvent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [editId, setEditId] = useState<string | null>(null); // 編集中ID

  // ログイン監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 投稿追加
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

  // 投稿編集保存
  const handleUpdate = async () => {
    if (!editId || !text) return;
    try {
      const diaryRef = doc(db, 'diary', editId);
      await updateDoc(diaryRef, { content: text });
      setStatus('更新しました！');
      setText('');
      setEditId(null);
    } catch (err) {
      console.error(err);
      setStatus('更新に失敗しました');
    }
  };

  // 投稿削除
  const handleDelete = async (id: string) => {
    try {
      const diaryRef = doc(db, 'diary', id);
      await deleteDoc(diaryRef);
      setStatus('削除しました！');
    } catch (err) {
      console.error(err);
      setStatus('削除に失敗しました');
    }
  };

  // 投稿一覧取得
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'diary'), (snapshot) => {
      const newEvents = snapshot.docs.map((docItem) => {
        const data = docItem.data();
        const date = data.createdAt?.toDate?.() ?? new Date();
        return {
          id: docItem.id, // ドキュメントID取得
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
            <button onClick={() => signOut(getAuth())} className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
              ログアウト
            </button>
          </>
        ) : (
          <button onClick={() => signInWithPopup(getAuth(), new GoogleAuthProvider())} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
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
          {editId ? (
            <button
              onClick={handleUpdate}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              更新する
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              投稿する
            </button>
          )}
          <p className="mt-2 text-sm">{status}</p>
        </>
      ) : (
        <p className="text-gray-500 mb-4">※投稿するにはログインが必要です</p>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-4">投稿一覧</h2>
      <ul className="space-y-4 mb-8">
        {events.map((event) => (
          <li key={event.id} className="border p-4 rounded">
            <p>{event.title}</p>
            <p className="text-sm text-gray-500">{event.start.toLocaleDateString()}</p>
            {user && (
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => {
                    setEditId(event.id);
                    setText(event.title);
                  }}
                  className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

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
