const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, email: 'woolrabit77@sasa.hs.kr', role: 'ADMIN' }, 'development_jwt_secret_123!', { expiresIn: '1h' });

const req = http.request({
  hostname: 'localhost', port: 3001, path: '/api/admin/rooms', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('POST /admin/rooms:', res.statusCode, body));
});
req.write(JSON.stringify({name: 'TestRoom', floor: 1, type: '', description: ''}));
req.end();

const req2 = http.request({
  hostname: 'localhost', port: 3001, path: '/api/admin/timetables', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('POST /admin/timetables:', res.statusCode, body));
});
req2.write(JSON.stringify({teacher_name: 'Test', subject: 'TestSub', room_id: '', day_of_week: 1, period: 1}));
req2.end();

