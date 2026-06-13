import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { floorData } from './floorData';

const statusStyle = {
  EMPTY: { fill: '#dcfce7', stroke: '#22c55e', text: '#166534', label: '빈 교실' },
  CLASS: { fill: '#fef08a', stroke: '#eab308', text: '#854d0e', label: '수업 중' },
  IN_USE: { fill: '#fee2e2', stroke: '#ef4444', text: '#991b1b', label: '사용 중' },
  MAINTENANCE: { fill: '#fef9c3', stroke: '#ca8a04', text: '#713f12', label: '점검 중' },
  NEEDS_APPROVAL: { fill: '#bfdbfe', stroke: '#3b82f6', text: '#1e3a8a', label: '승인 필요' },
  UNAVAILABLE: { fill: '#f1f5f9', stroke: '#94a3b8', text: '#334155', label: '사용 불가' },
};

const legendKeys = ['EMPTY', 'CLASS', 'IN_USE', 'NEEDS_APPROVAL', 'UNAVAILABLE'];

const bgImages = {
  1: { href: '/1F_bg.jpg', width: 2564, height: 2788, transform: 'translate(329.92 47.83) scale(.48)' },
  2: { href: '/2F_bg.jpg', width: 2612, height: 2760, transform: 'translate(318.5 51.6) scale(.5)' },
  3: { href: '/3F_bg.jpg', width: 2564, height: 2736, transform: 'translate(359.4 88.26) scale(.48)' },
  4: { href: '/4F_bg.jpg', width: 2592, height: 2760, transform: 'translate(366.15 84.68) scale(.48)' },
  5: { href: '/5F_bg.jpg', width: 2540, height: 2752, transform: 'translate(361.13 86.7) scale(.48)' },
};

const PERIODS = [
  { id: 1, label: '1교시', time: '08:40-09:30' },
  { id: 2, label: '2교시', time: '09:40-10:30' },
  { id: 3, label: '3교시', time: '10:40-11:30' },
  { id: 4, label: '4교시', time: '11:40-12:30' },
  { id: 5, label: '5교시', time: '13:20-14:10' },
  { id: 6, label: '6교시', time: '14:20-15:10' },
  { id: 7, label: '7교시', time: '15:20-16:10' },
  { id: 8, label: '8교시', time: '16:20-17:10' },
  { id: 9, label: '9교시', time: '17:20-18:10' },
];

const WEEK_DAYS = [
  { id: 1, label: '월' },
  { id: 2, label: '화' },
  { id: 3, label: '수' },
  { id: 4, label: '목' },
  { id: 5, label: '금' },
  { id: 6, label: '토' },
  { id: 7, label: '일' },
];

const normalizeRoomKey = (value) => String(value || '')
  .toLowerCase()
  .replace(/\s+/g, '')
  .replace(/[()]/g, '')
  .replace(/[^a-z0-9가-힣-]/g, '');

const sameRoom = (a, b) => {
  const left = normalizeRoomKey(a);
  const right = normalizeRoomKey(b);
  return Boolean(left && right && left === right);
};

const getCurrentPeriod = () => {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  for (const period of PERIODS) {
    const [start, end] = period.time.split('-');
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (current >= sh * 60 + sm && current <= eh * 60 + em) return period.id;
  }
  return null;
};

const getDefaultDay = () => {
  const day = new Date().getDay();
  if (day === 0) return 7;
  return day;
};

const parseViewBox = (viewBox) => {
  const [x, y, width, height] = String(viewBox).split(/\s+/).map(Number);
  return { x, y, width, height };
};

export default function FindRoom() {
  const showToast = useToast();
  const [searchParams] = useSearchParams();
  const requestedRoom = searchParams.get('room');
  const [floor, setFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [dbRooms, setDbRooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [occupancies, setOccupancies] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());
  const [reservationDay, setReservationDay] = useState(getDefaultDay());
  const [reservationPeriod, setReservationPeriod] = useState(getCurrentPeriod() || 1);
  const [reserving, setReserving] = useState(false);
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ distance: null, center: null });

  const currentFloorConfig = floorData[floor] || { viewBox: '0 0 500 320', rooms: [] };
  const currentDay = new Date().getDay();

  const applyTransform = (scale, offset) => {
    scaleRef.current = scale;
    offsetRef.current = offset;
    if (svgRef.current) {
      svgRef.current.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
    }
  };

  const clampOffset = (nextX, nextY, scale) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: nextX, y: nextY };
    const marginX = rect.width * 0.55;
    const marginY = rect.height * 0.55;
    return {
      x: Math.min(Math.max(nextX, rect.width * (1 - scale) - marginX), marginX),
      y: Math.min(Math.max(nextY, rect.height * (1 - scale) - marginY), marginY),
    };
  };

  const zoomAt = (clientX, clientY, nextScale) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const prevScale = scaleRef.current;
    const prevOffset = offsetRef.current;
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const ratio = nextScale / prevScale;
    const nextOffset = clampOffset(
      localX - (localX - prevOffset.x) * ratio,
      localY - (localY - prevOffset.y) * ratio,
      nextScale,
    );
    applyTransform(nextScale, nextOffset);
  };

  const centerRoom = (room) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !room) return;
    const viewBox = parseViewBox(currentFloorConfig.viewBox);
    const targetScale = 1.75;
    const roomX = ((room.cx - viewBox.x) / viewBox.width) * rect.width;
    const roomY = ((room.cy - viewBox.y) / viewBox.height) * rect.height;
    const nextOffset = clampOffset(
      rect.width / 2 - roomX * targetScale,
      rect.height / 2 - roomY * targetScale,
      targetScale,
    );
    applyTransform(targetScale, nextOffset);
  };

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const [roomRes, timetableRes, occupancyRes] = await Promise.all([
          apiFetch('/rooms'),
          apiFetch('/rooms/timetables'),
          apiFetch('/rooms/occupancies'),
        ]);
        setDbRooms(roomRes.ok ? await roomRes.json() : []);
        setTimetables(timetableRes.ok ? await timetableRes.json() : []);
        setOccupancies(occupancyRes.ok ? await occupancyRes.json() : []);
      } catch (err) {
        console.error('Failed to fetch map data', err);
      }
    };

    fetchMapData();
    const timer = setInterval(() => {
      setCurrentPeriod(getCurrentPeriod());
      apiFetch('/rooms/occupancies')
        .then((res) => (res.ok ? res.json() : []))
        .then(setOccupancies)
        .catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      const nextScale = Math.min(3.5, Math.max(0.85, scaleRef.current * factor));
      zoomAt(event.clientX, event.clientY, nextScale);
    };

    const getTouchCenter = (touches) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const getTouchDistance = (touches) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );

    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        isPanning.current = true;
        lastPos.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
      if (event.touches.length === 2) {
        lastTouch.current = {
          distance: getTouchDistance(event.touches),
          center: getTouchCenter(event.touches),
        };
      }
    };

    const handleTouchMove = (event) => {
      event.preventDefault();
      if (event.touches.length === 1 && isPanning.current) {
        const dx = event.touches[0].clientX - lastPos.current.x;
        const dy = event.touches[0].clientY - lastPos.current.y;
        lastPos.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        const prev = offsetRef.current;
        applyTransform(scaleRef.current, clampOffset(prev.x + dx, prev.y + dy, scaleRef.current));
      }
      if (event.touches.length === 2 && lastTouch.current.distance) {
        const distance = getTouchDistance(event.touches);
        const center = getTouchCenter(event.touches);
        const ratio = distance / lastTouch.current.distance;
        const nextScale = Math.min(3.5, Math.max(0.85, scaleRef.current * ratio));
        zoomAt(center.x, center.y, nextScale);
        lastTouch.current = { distance, center };
      }
    };

    const handleTouchEnd = () => {
      isPanning.current = false;
      lastTouch.current = { distance: null, center: null };
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const rooms = useMemo(() => {
    return currentFloorConfig.rooms.map((room) => {
      const dbRoom = dbRooms.find((candidate) => (
        sameRoom(candidate.name, room.name) || sameRoom(candidate.name, room.id)
      ));
      const baseStatus = dbRoom?.status || room.status || 'EMPTY';
      const description = dbRoom?.description || room.description || '등록된 설명 없음';

      if (['MAINTENANCE', 'UNAVAILABLE', 'NEEDS_APPROVAL'].includes(baseStatus)) {
        return { ...room, dbId: dbRoom?.id, status: baseStatus, current: description };
      }

      if (currentDay >= 1 && currentDay <= 5 && currentPeriod) {
        const activeClass = timetables.find((item) => (
          item.day_of_week === currentDay &&
          item.period === currentPeriod &&
          (
            sameRoom(item.room_name, room.name) ||
            sameRoom(item.room_name, room.id) ||
            (dbRoom && String(item.room_id) === String(dbRoom.id))
          )
        ));
        if (activeClass) {
          return {
            ...room,
            dbId: dbRoom?.id,
            status: 'CLASS',
            current: `${activeClass.subject || '수업'}${activeClass.teacher_name ? ` · ${activeClass.teacher_name}` : ''}`,
          };
        }

        const activeOccupancies = occupancies.filter((item) => (
          item.day_of_week === currentDay &&
          item.period === currentPeriod &&
          (
            sameRoom(item.room_name, room.name) ||
            sameRoom(item.room_name, room.id) ||
            (dbRoom && String(item.room_id) === String(dbRoom.id))
          )
        ));
        if (activeOccupancies.length > 0) {
          const names = activeOccupancies.slice(0, 2).map((item) => item.user_name).filter(Boolean).join(', ');
          return {
            ...room,
            dbId: dbRoom?.id,
            status: 'IN_USE',
            current: activeOccupancies.length > 2 ? `${names} 외 ${activeOccupancies.length - 2}명` : names || '사용 중',
          };
        }
      }

      return { ...room, dbId: dbRoom?.id, status: 'EMPTY', current: description };
    });
  }, [currentDay, currentFloorConfig.rooms, currentPeriod, dbRooms, occupancies, timetables]);

  useEffect(() => {
    applyTransform(1, { x: 0, y: 0 });
    if (!requestedRoom) setSelectedRoom(null);
  }, [floor]);

  useEffect(() => {
    if (!requestedRoom) return;
    const found = Object.entries(floorData).reduce((match, [floorNumber, config]) => {
      if (match) return match;
      const room = config.rooms.find((candidate) => (
        sameRoom(candidate.name, requestedRoom) || sameRoom(candidate.id, requestedRoom)
      ));
      return room ? { floor: Number(floorNumber), room } : null;
    }, null);
    if (found && found.floor !== floor) {
      setFloor(found.floor);
      return;
    }
    const currentRoom = rooms.find((room) => sameRoom(room.name, requestedRoom) || sameRoom(room.id, requestedRoom));
    if (currentRoom) {
      setSelectedRoom(currentRoom);
      requestAnimationFrame(() => centerRoom(currentRoom));
    }
  }, [floor, requestedRoom, rooms]);

  const onMouseDown = (event) => {
    isPanning.current = true;
    lastPos.current = { x: event.clientX, y: event.clientY };
  };

  const onMouseMove = (event) => {
    if (!isPanning.current) return;
    const dx = event.clientX - lastPos.current.x;
    const dy = event.clientY - lastPos.current.y;
    lastPos.current = { x: event.clientX, y: event.clientY };
    const prev = offsetRef.current;
    applyTransform(scaleRef.current, clampOffset(prev.x + dx, prev.y + dy, scaleRef.current));
  };

  const stopPanning = () => {
    isPanning.current = false;
  };

  const zoom = (factor) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const nextScale = Math.min(3.5, Math.max(0.85, scaleRef.current * factor));
    if (rect) {
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, nextScale);
    }
  };

  const reserveRoom = async () => {
    if (!selectedRoom?.dbId) {
      showToast('error', 'DB에 연결된 교실만 예약할 수 있습니다.');
      return;
    }

    setReserving(true);
    try {
      const res = await apiFetch('/mypage/occupancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: selectedRoom.dbId,
          day_of_week: reservationDay,
          period: reservationPeriod,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || '예약에 실패했습니다.');
      showToast('success', `${selectedRoom.name} 예약을 신청했습니다.`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setReserving(false);
    }
  };

  return (
    <section className="page-shell map-page">
      <header className="section-head">
        <div>
          <span className="section-kicker">지도 대시보드</span>
          <h1>지금 비어있는 교실</h1>
        </div>
      </header>

      <div className="floor-controls" aria-label="층 선택">
        {[1, 2, 3, 4, 5].map((item) => (
          <button key={item} className={floor === item ? 'active' : ''} onClick={() => setFloor(item)} type="button">
            {item}F
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="map-card"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
      >
        <svg ref={svgRef} viewBox={currentFloorConfig.viewBox} className="school-map">
          {bgImages[floor] && (
            <image
              draggable={false}
              href={bgImages[floor].href}
              width={bgImages[floor].width}
              height={bgImages[floor].height}
              transform={bgImages[floor].transform}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {rooms.map((room) => {
            const style = statusStyle[room.status] || statusStyle.EMPTY;
            const selected = selectedRoom?.id === room.id;
            return (
              <g key={room.id} onClick={(event) => { event.stopPropagation(); setSelectedRoom(room); }} className="room-shape">
                {room.type === 'rect' && (
                  <rect x={room.x} y={room.y} width={room.w} height={room.h} fill={style.fill} stroke={selected ? '#1d4ed8' : style.stroke} strokeWidth={selected ? 5 : 2.5} />
                )}
                {room.type === 'polygon' && (
                  <polygon points={room.points} fill={style.fill} stroke={selected ? '#1d4ed8' : style.stroke} strokeWidth={selected ? 5 : 2.5} />
                )}
                {room.type === 'path' && (
                  <path d={room.d} fill={style.fill} stroke={selected ? '#1d4ed8' : style.stroke} strokeWidth={selected ? 5 : 2.5} />
                )}
                <text
                  x={room.cx}
                  y={room.cy}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="800"
                  fill={style.text}
                  stroke="#ffffff"
                  strokeWidth="3"
                  paintOrder="stroke fill"
                  pointerEvents="none"
                >
                  {room.name}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="map-legend">
          {legendKeys.map((key) => (
            <div key={key} className="legend-item">
              <span className="legend-dot" style={{ background: statusStyle[key].stroke }} />
              <span>{statusStyle[key].label}</span>
            </div>
          ))}
        </div>

        <div className="zoom-controls">
          <button onClick={() => zoom(1.2)} type="button" aria-label="확대">+</button>
          <button onClick={() => zoom(0.85)} type="button" aria-label="축소">−</button>
          <button onClick={() => applyTransform(1, { x: 0, y: 0 })} type="button" aria-label="초기화">1x</button>
        </div>
      </div>

      <div className="room-detail-panel">
        {selectedRoom ? (
          <>
            <div className="room-detail-title">
              <MapPin size={18} />
              <strong>{selectedRoom.name}</strong>
              <span className={`status-pill ${selectedRoom.status.toLowerCase()}`}>
                {statusStyle[selectedRoom.status]?.label || selectedRoom.status}
              </span>
            </div>
            <p>{selectedRoom.current || '등록된 설명 없음'}</p>
            <div className="reservation-panel">
              <strong>공강실 예약</strong>
              <div className="reservation-controls">
                <select value={reservationDay} onChange={(event) => setReservationDay(Number(event.target.value))}>
                  {WEEK_DAYS.map((day) => (
                    <option key={day.id} value={day.id}>{day.label}</option>
                  ))}
                </select>
                <select value={reservationPeriod} onChange={(event) => setReservationPeriod(Number(event.target.value))}>
                  {PERIODS.map((period) => (
                    <option key={period.id} value={period.id}>{period.label}</option>
                  ))}
                </select>
                <button className="button primary thin-button" onClick={reserveRoom} disabled={reserving || !selectedRoom.dbId} type="button">
                  사용하기
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="muted">교실을 선택하면 설명과 예약 기능이 표시됩니다.</p>
        )}
      </div>
    </section>
  );
}
