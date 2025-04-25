'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
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

  const handleSubmit = async () => {
    if (!text) return;

    try {
      await addDoc(collection(db, 'diary'), {
        content: text,
        createdAt: Timestamp.now(),
      });
      setStatus('保存しました！');
      setText('');
    } catch (err) {
      console.error(err);
      setStatus('保存に失敗しました');
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
      <h1 className="text-2xl font-bold mb-4">練習日誌</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="今日の練習内容を入力"
        className="w-full border p-2 mb-2 rounded"
        rows={4}
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        投稿する
      </button>
      <p className="mt-2 text-sm">{status}</p>

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


