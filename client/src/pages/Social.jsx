import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, MailPlus, Trash2, UserPlus, Users } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function Social() {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState('locations');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchSocial = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        apiFetch('/friends'),
        apiFetch('/friends/requests'),
      ]);
      setFriends(friendsRes.ok ? await friendsRes.json() : []);
      setRequests(requestsRes.ok ? await requestsRes.json() : []);
    } catch (err) {
      console.error('Failed to fetch social data', err);
      setFriends([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocial();
  }, [fetchSocial]);

  const requestFriend = async () => {
    if (!friendEmail.trim()) {
      showToast('error', '친구 이메일을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: friendEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || '친구 요청에 실패했습니다.');
      showToast('success', '친구 요청을 보냈습니다.');
      setFriendEmail('');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const acceptRequest = async (id) => {
    try {
      const res = await apiFetch(`/friends/${id}/accept`, { method: 'PUT' });
      if (!res.ok) throw new Error('친구 요청 수락에 실패했습니다.');
      showToast('success', '친구 요청을 수락했습니다.');
      fetchSocial();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const deleteFriend = async (id) => {
    try {
      const res = await apiFetch(`/friends/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('처리에 실패했습니다.');
      showToast('success', '처리했습니다.');
      fetchSocial();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  return (
    <section className="page-shell social-page">
      <header className="section-head">
        <div>
          <span className="section-kicker">소셜</span>
          <h1>친구 위치와 요청 관리</h1>
        </div>
      </header>

      <div className="segmented wide" role="tablist" aria-label="소셜 탭">
        <button
          className={`seg-button ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
          type="button"
        >
          친구 위치
        </button>
        <button
          className={`seg-button ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
          type="button"
        >
          친구 추가
        </button>
      </div>

      {activeTab === 'locations' && (
        <div className="list social-list">
          {loading && <div className="empty-state">불러오는 중입니다.</div>}
          {!loading && friends.length === 0 && <div className="empty-state">아직 추가된 친구가 없습니다.</div>}
          {friends.map((friend) => (
            <div key={friend.friendship_id} className="list-row friend-row">
              <span className="friend-avatar">{(friend.name || friend.email || 'S').slice(0, 1)}</span>
              <span className="result-main">
                <strong>{friend.name || '이름 없음'}</strong>
                <small>{friend.location || '현재 위치 없음'}</small>
              </span>
              <button className="icon-control danger-control" onClick={() => deleteFriend(friend.friendship_id)} aria-label="친구 삭제">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="social-add-panel">
          <div className="card-flat">
            <div className="card-title-row">
              <UserPlus size={18} />
              <strong>이메일로 친구 추가</strong>
            </div>
            <div className="inline-form">
              <label className="search-box compact">
                <MailPlus size={17} />
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(event) => setFriendEmail(event.target.value)}
                  placeholder="친구 이메일 입력"
                />
              </label>
              <button className="button primary" onClick={requestFriend} disabled={submitting}>
                요청
              </button>
            </div>
          </div>

          <div className="card-flat">
            <div className="card-title-row">
              <Bell size={18} />
              <strong>받은 요청</strong>
              <span className="count-chip">{requests.length}</span>
            </div>
            <div className="request-list">
              {requests.length === 0 && <div className="empty-state slim">받은 친구 요청이 없습니다.</div>}
              {requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div>
                    <strong>{request.sender_name}</strong>
                    <small>{request.sender_email}</small>
                  </div>
                  <div className="mini-actions">
                    <button className="icon-control success-control" onClick={() => acceptRequest(request.id)} aria-label="수락">
                      <Check size={16} />
                    </button>
                    <button className="icon-control danger-control" onClick={() => deleteFriend(request.id)} aria-label="거절">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
