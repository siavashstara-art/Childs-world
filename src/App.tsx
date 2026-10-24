import { useState, useEffect, useRef } from 'react';
import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { UncleStoryAudioEngine } from './audio';

const LanternBg = "bg-[#10141D]";
const LanternYellow = "text-[#FFD54F]";
const LanternCardBg = "bg-[#1A2232]";
const TextLight = "text-[#E2E8F0]";

export default function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [audioEngine] = useState(() => new UncleStoryAudioEngine());
  const [tasks, setTasks] = useState<any[]>([]);
  const [stars, setStars] = useState<any[]>([]);
  const [drawings, setDrawings] = useState<any[]>([]);

  useEffect(() => {
    // Sync data from Firestore
    const syncCollection = (path: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
      const q = query(collection(db, path), orderBy("timestamp", "desc"));
      return onSnapshot(q, (snapshot) => {
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, path));
    };

    const unsubTasks = syncCollection('app_tasks', setTasks);
    const unsubStars = syncCollection('stars_rewards', setStars);
    const unsubDrawings = syncCollection('child_drawings', setDrawings);

    return () => { unsubTasks(); unsubStars(); unsubDrawings(); };
  }, []);

  const addTask = async (title: string) => {
    try {
      await addDoc(collection(db, 'app_tasks'), { title, content: '', isCompleted: false, timestamp: Date.now() });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'app_tasks'); }
  };

  const addStar = async () => {
    try {
      await addDoc(collection(db, 'stars_rewards'), { ownerType: 'CHILD', starsCount: 5, rewardTitle: 'تشویق تمرکز', timestamp: Date.now() });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'stars_rewards'); }
  };

  const saveDrawing = async (isPublic: boolean) => {
    try {
      await addDoc(collection(db, 'child_drawings'), { title: 'نقاشی کودک', imagePath: '', isPublic, timestamp: Date.now() });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'child_drawings'); }
  };

  return (
    <div className={`min-h-screen ${LanternBg} p-4 ${TextLight}`}>
      <header className={`${LanternCardBg} p-4 rounded-2xl mb-4 flex items-center`}>
        <span className="text-4xl">🪔</span>
        <div className="ml-4">
          <h1 className={`font-bold text-lg ${LanternYellow}`}>شهر توانا - پناهگاه امن خانواده</h1>
          <p className="text-sm">روایت عمو قصهگو، نقاشی و آرامش ذهن</p>
        </div>
      </header>

      <nav className="flex gap-2 mb-4 overflow-x-auto">
        {["قصه و صدا", "بوم نقاشی", "ستارهها", "تمرکز ADHD"].map((tab, idx) => (
          <button key={tab} onClick={() => setSelectedTab(idx)} className={`p-2 rounded-lg ${selectedTab === idx ? 'bg-[#FFD54F] text-black' : LanternCardBg}`}>
            {tab}
          </button>
        ))}
      </nav>

      <main>
        {selectedTab === 0 && <UncleStoryTab onPlay={() => audioEngine.playStoryWithVoice("قصه شهر توانا...", 'UNCLE_STORY')} />}
        {selectedTab === 1 && <ChildDrawingCanvasTab onSave={saveDrawing} />}
        {selectedTab === 2 && <StarsRewardTab stars={stars} onAdd={addStar} />}
        {selectedTab === 3 && <AdhdFocusTasksTab tasks={tasks} onAdd={addTask} />}
      </main>
    </div>
  );
}

function UncleStoryTab({ onPlay }: { onPlay: () => void }) {
  return (
    <div className={`${LanternCardBg} p-6 rounded-xl`}>
      <h2 className={`font-bold mb-2 ${LanternYellow}`}>قصهگوی صمیمی</h2>
      <p className="mb-4">قصهی شهر توانا برای آرامش کودکان...</p>
      <button onClick={onPlay} className="w-full bg-[#FFD54F] text-black font-bold p-3 rounded-lg">▶️ پخش قصه</button>
    </div>
  );
}

function ChildDrawingCanvasTab({ onSave }: { onSave: (isPublic: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  return (
    <div className="flex flex-col h-[50vh]">
      <canvas 
        ref={canvasRef} 
        className="bg-black w-full flex-grow rounded-lg mb-4 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={() => setIsDrawing(false)}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={() => setIsDrawing(false)}
      />
      <div className="flex gap-2">
        <button onClick={() => onSave(false)} className="flex-1 bg-[#FFD54F] text-black font-bold p-3 rounded-lg">🖼️ ذخیره</button>
        <button onClick={() => onSave(true)} className="flex-1 bg-[#4CAF50] text-white font-bold p-3 rounded-lg">🌐 ارسال عمومی</button>
      </div>
    </div>
  );
}

function StarsRewardTab({ stars, onAdd }: { stars: any[], onAdd: () => void }) {
  return (
    <div>
      <button onClick={onAdd} className="w-full bg-[#FFD54F] text-black p-3 rounded-lg mb-4">➕ اهداء ۵ ستاره</button>
      {stars.map(s => <div key={s.id} className={`${LanternCardBg} p-4 rounded-lg mb-2`}>{s.starsCount} ستاره - {s.rewardTitle}</div>)}
    </div>
  );
}

function AdhdFocusTasksTab({ tasks, onAdd }: { tasks: any[], onAdd: (t: string) => void }) {
  const [title, setTitle] = useState('');
  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white/10 rounded-lg mb-2" placeholder="عنوان کار..." />
      <button onClick={() => { onAdd(title); setTitle(''); }} className="w-full bg-[#FFD54F] text-black p-3 rounded-lg mb-4">ثبت کار</button>
      {tasks.map(t => <div key={t.id} className={`${LanternCardBg} p-4 rounded-lg mb-2`}>{t.title}</div>)}
    </div>
  );
}
