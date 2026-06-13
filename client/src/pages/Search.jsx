import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, MapPin, Search as SearchIcon, UserRound } from 'lucide-react';
import { apiFetch } from '../lib/api';

const filters = [
  { value: 'all', label: '전체' },
  { value: 'room', label: '교실' },
  { value: 'subject', label: '과목' },
  { value: 'teacher', label: '교사' },
];

const typeMeta = {
  교실: { label: '교실', icon: MapPin, className: 'green' },
  과목: { label: '과목', icon: BookOpen, className: 'blue' },
  교사: { label: '교사', icon: UserRound, className: 'purple' },
};

const getTypeMeta = (type = '') => {
  if (type.includes('교실')) return typeMeta.교실;
  if (type.includes('과목')) return typeMeta.과목;
  if (type.includes('교사') || type.includes('선생')) return typeMeta.교사;
  return { label: type || '정보', icon: SearchIcon, className: 'gray' };
};

const getRoomTarget = (item) => {
  if (item?.location && item.location !== '-') return item.location;
  const match = String(item?.title || '').match(/[AS]\d{3}(?:-\d)?/i);
  return match?.[0] || '';
};

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/search?q=${encodeURIComponent(query)}&type=${searchType}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search failed');
        setResults(await response.json());
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchType]);

  const selectedRoomTarget = useMemo(() => getRoomTarget(selectedResult), [selectedResult]);

  const openOnMap = () => {
    if (!selectedRoomTarget) return;
    setSelectedResult(null);
    navigate(`/?room=${encodeURIComponent(selectedRoomTarget)}`);
  };

  return (
    <section className="page-shell search-page">
      <header className="section-head">
        <div>
          <span className="section-kicker">통합 검색</span>
          <h1>찾고 싶은 정보를 바로 확인</h1>
        </div>
      </header>

      <div className="search-toolbar">
        <label className="search-box">
          <SearchIcon size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="찾고 싶은 정보 검색"
            aria-label="검색어"
          />
        </label>
        <div className="segmented" role="tablist" aria-label="검색 유형">
          {filters.map((filter) => (
            <button
              key={filter.value}
              className={`seg-button ${searchType === filter.value ? 'active' : ''}`}
              onClick={() => setSearchType(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="result-summary">
        <strong>{loading ? '검색 중' : `${results.length}개 결과`}</strong>
        <span>결과를 누르면 상세 정보가 먼저 열립니다.</span>
      </div>

      <div className="list">
        {!loading && results.length === 0 && (
          <div className="empty-state">검색 결과가 없습니다.</div>
        )}
        {results.map((item) => {
          const meta = getTypeMeta(item.type);
          const Icon = meta.icon;
          return (
            <button key={item.id} className="list-row result-row" onClick={() => setSelectedResult(item)} type="button">
              <span className={`type-chip ${meta.className}`}>
                <Icon size={14} />
                {meta.label}
              </span>
              <span className="result-main">
                <strong>{item.title}</strong>
                <small>{item.subtitle || item.location || '상세 정보 없음'}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>

      {selectedResult && (
        <div className="modal-backdrop" onClick={() => setSelectedResult(null)}>
          <section className="app-modal detail-modal" onClick={(event) => event.stopPropagation()}>
            <header className="app-modal-header">
              <div>
                <span className="section-kicker">상세 정보</span>
                <h2>{selectedResult.title}</h2>
              </div>
              <button className="icon-control" onClick={() => setSelectedResult(null)} aria-label="닫기">×</button>
            </header>
            <p className="modal-copy">{selectedResult.subtitle || '등록된 요약 정보가 없습니다.'}</p>
            <div className="detail-list">
              {(selectedResult.details?.length ? selectedResult.details : ['등록된 세부 일정이 없습니다.']).map((detail, index) => (
                <div key={`${selectedResult.id}-${index}`} className="detail-item">{detail}</div>
              ))}
            </div>
            <div className="app-modal-actions">
              <button className="button secondary" onClick={() => setSelectedResult(null)}>닫기</button>
              <button className="button primary" onClick={openOnMap} disabled={!selectedRoomTarget}>
                지도에서 보기
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
