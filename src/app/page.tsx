 'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import localizer from '@/lib/calendar';

interface DiaryEvent {
  id: string;
  start: Date;
  end: Date;
  title: string;
  uid: string;
}

export default function Home() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [events, setEvents] = useState<DiaryEvent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('ログイン失敗:', error);
    }
  };

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
      if (editingId) {
        // 編集モードならupdate
        await updateDoc(doc(db, 'diary', editingId), {
          content: text,
        });
        setStatus('更新しました！');
        setEditingId(null);
      } else {
        // 通常投稿
        await addDoc(collection(db, 'diary'), {
          content: text,
          createdAt: Timestamp.now(),
          uid: user.uid,
          name: user.displayName,
        });
        setStatus('保存しました！');
      }
      setText('');
    } catch (err) {
      console.error(err);
      setStatus('保存に失敗しました');
    }
  };

  const handleEdit = (id: string, title: string) => {
    setEditingId(id);
    setText(title);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diary', id));
      setStatus('削除しました');
    } catch (err) {
      console.error(err);
      setStatus('削除に失敗しました');
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'diary'), (snapshot) => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const newEvents = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate?.() ?? new Date();
        return {
          id: doc.id,
          start: date,
          end: date,
          title: data.content,
          uid: data.uid,
        };
      }).filter((event) => event.uid === currentUser.uid); // 自分の投稿だけ表示

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
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {editingId ? '更新する' : '投稿する'}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setText('');
                }}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
            )}
          </div>
          <p className="mt-2 text-sm">{status}</p>
        </>
      ) : (
        <p className="text-gray-500 mb-4">※投稿するにはログインが必要です</p>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-4">過去の記録</h2>
      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="border p-2 rounded">
            <div className="flex justify-between items-center">
              <span>{event.start.toLocaleDateString()} - {event.title}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(event.id, event.title)}
                  className="text-blue-500 hover:underline"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-red-500 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
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

