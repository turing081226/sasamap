import { useState } from 'react';
import { Map, MapPin } from 'lucide-react';

export default function FindRoom() {
  const [floor, setFloor] = useState(1);
  const mockupRooms = [
    { id: 1, name: '1학년 1반', status: 'IN_USE', floor: 1, current: '수학 (홍길동)' },
    { id: 2, name: '1학년 2반', status: 'EMPTY', floor: 1, current: '공강' },
    { id: 3, name: '음악실', status: 'MAINTENANCE', floor: 2, current: '청소중' },
    { id: 4, name: '2학년 3반', status: 'EMPTY', floor: 2, current: '공강' },
  ];

  const filteredRooms = mockupRooms.filter(r => r.floor === floor);

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1 className="title">🏫 교실 찾기</h1>
        <div style={{display: 'flex', gap: '8px'}}>
          {[1, 2, 3, 4].map(f => (
            <button 
              key={f}
              onClick={() => setFloor(f)}
              className="btn" 
              style={{backgroundColor: floor === f ? 'var(--primary)' : 'var(--text-muted)'}}
            >
              {f}층
            </button>
          ))}
        </div>
      </div>

      <div className="responsive-flex">
        {/* Map Area Mockup */}
        <div className="card" style={{flex: 2, minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9'}}>
          <Map size={48} color="var(--text-muted)" style={{marginBottom: '1rem'}} />
          <h3 style={{color: 'var(--text-muted)'}}>{floor}층 지도 영역 (Mockup)</h3>
          <p style={{color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem'}}>마우스 휠이나 확대 버튼으로 지도 줌인/줌아웃</p>
        </div>

        {/* Room Info */}
        <div className="card" style={{flex: 1}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem'}}>{floor}층 교실 현황</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {filteredRooms.map(room => (
              <div key={room.id} style={{padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <MapPin size={16} /> {room.name}
                  </span>
                  {room.status === 'IN_USE' && <span className="badge bg-red">사용중</span>}
                  {room.status === 'EMPTY' && <span className="badge bg-green">비어있음</span>}
                  {room.status === 'MAINTENANCE' && <span className="badge bg-blue">점검중</span>}
                </div>
                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>현재: {room.current}</p>
              </div>
            ))}
            {filteredRooms.length === 0 && <p style={{color: 'var(--text-muted)'}}>해당 층에 방이 없습니다.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
