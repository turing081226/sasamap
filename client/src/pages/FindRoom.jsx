import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

// 층별 교실 배치 데이터 (임시 지도 좌표 포함)
const floorData = {
  1: [
    { id: 1, name: '1-1반', x: 60,  y: 60,  w: 100, h: 70, status: 'IN_USE',      current: '수학 (홍길동)' },
    { id: 2, name: '1-2반', x: 180, y: 60,  w: 100, h: 70, status: 'EMPTY',       current: '공강' },
    { id: 3, name: '1-3반', x: 300, y: 60,  w: 100, h: 70, status: 'EMPTY',       current: '공강' },
    { id: 4, name: '화장실', x: 60,  y: 160, w: 70,  h: 50, status: 'MAINTENANCE', current: '점검중' },
    { id: 5, name: '교무실', x: 180, y: 160, w: 220, h: 80, status: 'IN_USE',      current: '재실' },
  ],
  2: [
    { id: 6, name: '2-1반', x: 60,  y: 60,  w: 100, h: 70, status: 'EMPTY',       current: '공강' },
    { id: 7, name: '음악실', x: 180, y: 60,  w: 120, h: 70, status: 'MAINTENANCE', current: '청소중' },
    { id: 8, name: '2-2반', x: 60,  y: 160, w: 100, h: 70, status: 'IN_USE',      current: '영어 (김영희)' },
    { id: 9, name: '미디어실', x: 180, y: 160, w: 120, h: 70, status: 'EMPTY',     current: '공강' },
  ],
  3: [
    { id: 10, name: '3-1반', x: 60,  y: 60,  w: 100, h: 70, status: 'IN_USE',     current: '물리 (박과학)' },
    { id: 11, name: '3-2반', x: 180, y: 60,  w: 100, h: 70, status: 'EMPTY',      current: '공강' },
    { id: 12, name: '과학실', x: 300, y: 60,  w: 100, h: 70, status: 'EMPTY',      current: '공강' },
    { id: 13, name: '도서관', x: 60,  y: 160, w: 340, h: 80, status: 'IN_USE',     current: '개방 중' },
  ],
  4: [
    { id: 14, name: '4-1반', x: 60,  y: 60,  w: 100, h: 70, status: 'EMPTY',      current: '공강' },
    { id: 15, name: '강당',   x: 200, y: 40,  w: 180, h: 150, status: 'IN_USE',    current: '행사 중' },
  ],
  5: [
    { id: 16, name: '미술실', x: 60,  y: 60,  w: 120, h: 80, status: 'MAINTENANCE', current: '공사중' },
    { id: 17, name: '옥상정원', x: 220, y: 50,  w: 160, h: 120, status: 'EMPTY',   current: '개방' },
  ],
};

const statusColor = {
  IN_USE:         { fill: '#fee2e2', stroke: '#ef4444', text: '#991b1b' }, // Red (사용 중)
  CLASS:          { fill: '#fef08a', stroke: '#eab308', text: '#854d0e' }, // Yellow (수업 중)
  EMPTY:          { fill: '#dcfce7', stroke: '#22c55e', text: '#166534' }, // Green (빈 교실)
  MAINTENANCE:    { fill: '#fef9c3', stroke: '#ca8a04', text: '#713f12' }, // Dark Yellow (점검 중)
  NEEDS_APPROVAL: { fill: '#bfdbfe', stroke: '#3b82f6', text: '#1e3a8a' }, // Blue (승인 필요)
  UNAVAILABLE:    { fill: '#f1f5f9', stroke: '#94a3b8', text: '#334155' }, // Gray (사용 불가)
};

const MAP_W = 500;
const MAP_H = 320;

const PERIODS = [
  { id: 1, label: "1교시", time: "08:40-09:30" },
  { id: 2, label: "2교시", time: "09:40-10:30" },
  { id: 3, label: "3교시", time: "10:40-11:30" },
  { id: 4, label: "4교시", time: "11:40-12:30" },
  { id: 5, label: "5교시", time: "13:20-14:10" },
  { id: 6, label: "6교시", time: "14:20-15:10" },
  { id: 7, label: "7교시", time: "15:20-16:10" },
  { id: 8, label: "8교시", time: "16:20-17:10" },
  { id: 9, label: "9교시", time: "17:20-18:10" }
];

const getCurrentPeriod = () => {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  for (const p of PERIODS) {
    const [startStr, endStr] = p.time.split(/[-–]/);
    const [sh, sm] = startStr.trim().split(':').map(Number);
    const [eh, em] = endStr.trim().split(':').map(Number);
    if (currentMins >= sh * 60 + sm && currentMins <= eh * 60 + em) {
      return p.id;
    }
  }
  return null;
};

export default function FindRoom() {
  const [floor, setFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    // Fetch all timetables for dynamic map state
    const fetchTimetables = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${API}/rooms/timetables`);
        if (res.ok) {
          const data = await res.json();
          setTimetables(data);
        }
      } catch (err) {
        console.error('Failed to fetch timetables', err);
      }
    };
    fetchTimetables();

    // Check time every minute
    const interval = setInterval(() => {
      setCurrentPeriod(getCurrentPeriod());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute dynamic rooms
  const baseRooms = floorData[floor] || [];
  const now = new Date();
  const currentDay = now.getDay(); // 1 = Monday ... 5 = Friday

  const rooms = baseRooms.map(room => {
    // Keep maintenance state statically
    if (room.status === 'MAINTENANCE') return room;
    
    // Check if there is an active class right now
    if (currentDay >= 1 && currentDay <= 5 && currentPeriod) {
      const activeClass = timetables.find(t => 
        (t.room_name === room.name || t.room_id === room.id) && 
        t.day_of_week === currentDay && 
        t.period === currentPeriod
      );
      if (activeClass) {
        return { 
          ...room, 
          status: 'IN_USE', 
          current: `${activeClass.subject} (${activeClass.teacher_name})` 
        };
      }
    }
    
    // Otherwise it's empty
    return { ...room, status: 'EMPTY', current: '공강' };
  });

  // Reset view when floor changes
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setSelectedRoom(null);
  }, [floor]);

  // ---------- Mouse events ----------
  const onMouseDown = (e) => {
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };
  const onMouseUp = () => { isPanning.current = false; };

  // ---------- Touch events ----------
  const lastTouchDist = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      isPanning.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist.current) {
        const ratio = dist / lastTouchDist.current;
        setScale(prev => Math.min(3, Math.max(0.5, prev * ratio)));
      }
      lastTouchDist.current = dist;
    }
  };
  const onTouchEnd = () => { isPanning.current = false; lastTouchDist.current = null; };

  // ---------- Wheel zoom ----------
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(3, Math.max(0.5, prev * delta)));
  };

  // ---------- Click on room ----------
  const handleRoomClick = (e, room) => {
    e.stopPropagation();
    setSelectedRoom(prev => prev?.id === room.id ? null : room);
  };

  return (
    <div>
      <h1 className="title" style={{ marginBottom: '1rem' }}>🏫 교실 찾기</h1>

      {/* Map container */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        style={{
          width: '100%',
          height: '300px',
          overflow: 'hidden',
          background: '#f1f5f9',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          cursor: isPanning.current ? 'grabbing' : 'grab',
          position: 'relative',
          marginBottom: '1rem',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* SVG map */}
        <svg
          width={MAP_W}
          height={MAP_H}
          style={{
            position: 'absolute',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: 'none',
          }}
        >
          {/* Floor outline */}
          <rect x="40" y="30" width={MAP_W - 80} height={MAP_H - 60}
            fill="white" stroke="#cbd5e1" strokeWidth="2" rx="8" />
          {/* Floor label */}
          <text x="50" y="24" fontSize="13" fill="#64748b" fontWeight="600">{floor}층 평면도</text>

          {/* Hallway */}
          <rect x="40" y="130" width={MAP_W - 80} height="20"
            fill="#e2e8f0" stroke="none" />
          <text x={MAP_W / 2} y="143" fontSize="10" fill="#94a3b8" textAnchor="middle">복도</text>

          {/* Rooms */}
          {rooms.map(room => {
            const col = statusColor[room.status] || statusColor.EMPTY;
            const isSelected = selectedRoom?.id === room.id;
            return (
              <g key={room.id} onClick={(e) => handleRoomClick(e, room)} style={{ cursor: 'pointer' }}>
                <rect
                  x={room.x} y={room.y} width={room.w} height={room.h}
                  fill={col.fill}
                  stroke={isSelected ? '#1d4ed8' : col.stroke}
                  strokeWidth={isSelected ? 3 : 1.5}
                  rx="6"
                />
                <foreignObject x={room.x + 4} y={room.y + 4} width={room.w - 8} height={room.h - 8}>
                  <div xmlns="http://www.w3.org/1999/xhtml"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: col.text, textAlign: 'center', lineHeight: 1.2 }}>{room.name}</span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Zoom controls */}
        <div style={{ position: 'absolute', right: '10px', bottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[['＋', 1.2], ['－', 0.8]].map(([label, factor]) => (
            <button
              key={label}
              onClick={() => setScale(prev => Math.min(3, Math.max(0.5, prev * factor)))}
              style={{
                width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >{label}</button>
          ))}
          <button
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
            style={{
              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'white', fontSize: '11px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >↺</button>
        </div>

        {/* Hint */}
        <div style={{ position: 'absolute', left: '10px', bottom: '10px', fontSize: '11px', color: '#94a3b8', pointerEvents: 'none' }}>
          드래그로 이동 · 핀치/휠로 줌
        </div>
      </div>

      {/* Floor selector — centered */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[1, 2, 3, 4, 5].map(f => (
          <button
            key={f}
            onClick={() => setFloor(f)}
            className="btn"
            style={{
              minWidth: '52px',
              backgroundColor: floor === f ? 'var(--primary)' : '#e2e8f0',
              color: floor === f ? 'white' : 'var(--text-main)',
            }}
          >
            {f}층
          </button>
        ))}
      </div>

      {/* Room detail card */}
      {selectedRoom && (
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>교실 상세 정보</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.1rem' }}>
              <MapPin size={16} /> {selectedRoom.name}
            </span>
            {selectedRoom.status === 'IN_USE'         && <span className="badge bg-red">사용 중</span>}
            {selectedRoom.status === 'CLASS'          && <span className="badge" style={{ background: '#fef08a', color: '#854d0e' }}>수업 중</span>}
            {selectedRoom.status === 'EMPTY'          && <span className="badge bg-green">빈 교실</span>}
            {selectedRoom.status === 'MAINTENANCE'    && <span className="badge" style={{ background: '#fef9c3', color: '#713f12' }}>점검 중</span>}
            {selectedRoom.status === 'NEEDS_APPROVAL' && <span className="badge" style={{ background: '#bfdbfe', color: '#1e3a8a' }}>승인 필요</span>}
            {selectedRoom.status === 'UNAVAILABLE'    && <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>사용 불가</span>}
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>현재 상태:</span> {selectedRoom.current}
          </p>
        </div>
      )}
    </div>
  );
}
