import { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin, BookOpen, User, Filter } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // all -> room -> subject -> teacher
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cycle through search types
  const toggleSearchType = () => {
    const types = ['all', 'room', 'subject', 'teacher'];
    const currentIndex = types.indexOf(searchType);
    setSearchType(types[(currentIndex + 1) % types.length]);
  };

  const getSearchTypeLabel = (type) => {
    switch (type) {
      case 'all': return '전체 검색';
      case 'room': return '🏫 교실 검색';
      case 'subject': return '📚 과목 검색';
      case 'teacher': return '👨‍🏫 교사 검색';
      default: return '전체';
    }
  };

  // Trigger search when query or type changes
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API}/search?q=${encodeURIComponent(query)}&type=${searchType}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce to prevent too many requests, but trigger immediately for initial empty load
    const timeoutId = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchType]);

  const renderIcon = (type) => {
    switch (type) {
      case '교사': return <User size={16} />;
      case '교실': return <MapPin size={16} />;
      case '과목': return <BookOpen size={16} />;
      default: return null;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case '교사': return 'bg-blue';
      case '교실': return 'bg-green';
      case '과목': return 'bg-purple';
      default: return 'bg-blue';
    }
  };

  return (
    <div>
      <h1 className="title">🔍 통합 검색</h1>
      
      <div className="card" style={{marginBottom: '1rem'}}>
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          <div style={{flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 1rem'}}>
            <SearchIcon size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder={`${getSearchTypeLabel(searchType).replace(' 검색', '')}을(를) 검색하세요...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{flex: 1, padding: '0.75rem 0.5rem', border: 'none', outline: 'none', fontSize: '1rem'}}
            />
          </div>
          <button 
            className="btn" 
            onClick={toggleSearchType}
            style={{display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'}}
          >
            <Filter size={18} /> {getSearchTypeLabel(searchType)}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem'}}>
          검색 결과 {!loading && `(${results.length}건)`}
          {loading && <span style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '10px'}}>검색 중...</span>}
        </h2>
        
        {results.length === 0 && !loading ? (
          <p style={{color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0'}}>"{query}"에 대한 검색 결과가 없습니다.</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {results.map(item => (
              <div key={item.id} className="tooltip-container" style={{padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', transition: 'transform 0.2s ease, box-shadow 0.2s ease'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                      <span className={`badge ${getBadgeColor(item.type)}`} style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                        {renderIcon(item.type)} {item.type}
                      </span>
                      <strong style={{fontSize: '1.1rem'}}>{item.title}</strong>
                    </div>
                    <p style={{marginTop: '0.5rem', color: 'var(--text-color)'}}>{item.subtitle}</p>
                  </div>
                </div>
                {/* Tooltip Content */}
                <div className="tooltip-content">
                  상세 정보가 여기에 표시됩니다. <br/>
                  ({item.type} 데이터)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
