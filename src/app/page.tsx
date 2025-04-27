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
  const [editId, setEditId] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

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

  const fetchStravaActivities = async () => {
    const token = prompt('Stravaのアクセストークンを入力してください！');
    if (!token) return;

    try {
      const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('取得したアクティビティ:', data);
      setActivities(data);
      setStatus(`アクティビティを${data.length}件取得しました`);
    } catch (error) {
      console.error(error);
      setStatus('アクティビティ取得に失敗しました');
    }
  };

  const handleSubmit = async () => {
    if (!text || !user) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'diary', editingId), {
          content: text,
        });
        setStatus('更新しました！');
        setEditingId(null);
      } else {
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
      }).filter((event) => event.uid === currentUser.uid);

      setEvents(newEvents);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <p>こんにちは、{user.displayName} さん！</p>
              <button onClick={handleLogout} className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
                ログアウト
              </button>
              <button
                onClick={fetchStravaActivities}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 ml-2"
              >
                Stravaデータ取得
              </button>
            </div>
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

      <h2 className="text-xl font-semibold mt-8 mb-4">Stravaアクティビティ</h2>
      <ul className="space-y-2">
        {activities.map((activity) => (
          <li key={activity.id} className="border p-2 rounded">
            <div>{new Date(activity.start_date).toLocaleDateString()} - {activity.name}</div>
            <div>距離: {(activity.distance / 1000).toFixed(2)} km</div>
            <div>タイム: {Math.floor(activity.elapsed_time / 60)}分{activity.elapsed_time % 60}秒</div>
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
