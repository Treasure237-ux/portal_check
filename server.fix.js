const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static('public'));
 
const students = {
  'DSU/001': { matric: 'DSU/001', password: '1234', name: 'Treasue Okoro', progress: 100, nameChanges: 0 },
  'DSU/002': { matric: 'DSU/002', password: '1234', name: 'Ade Bello',     progress: 40,  nameChanges: 0 },
};
const sessions = new Map();      // token -> matric
const certificates = new Map();  // certId -> { certId, matric, name, ..., revoked }
 
// 1. Real authentication: random token, identity comes from the token only
app.post('/api/login', (req, res) => {
  const s = students[req.body.matric];
  if (!s || s.password !== req.body.password) return res.status(401).json({ error: 'Invalid login' });
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, s.matric);
  res.json({ token, student: { matric: s.matric, name: s.name, progress: s.progress } });
});
 
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const matric = sessions.get(token);
  if (!matric) return res.status(401).json({ error: 'Not logged in' });
  req.student = students[matric];   // never read matric/name from body
  next();
}
 
// 2. Name edits: only your own record, limited, and old certificates get revoked
app.put('/api/name', auth, (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 3 || name.length > 80) return res.status(400).json({ error: 'Invalid name' });
  if (req.student.nameChanges >= 2) return res.status(403).json({ error: 'Name change limit reached. Contact admin.' });
  req.student.name = name;
  req.student.nameChanges++;
  for (const c of certificates.values()) if (c.matric === req.student.matric) c.revoked = true;
  res.json({ name });
});
 
// 3. Certificate: eligibility check + name from DB + unique ID
app.post('/api/certificate', auth, (req, res) => {
  const s = req.student;
  if (s.progress < 100) return res.status(403).json({ error: `Programme not completed (${s.progress}%)` });
 
  for (const c of certificates.values())            // one active cert per student
    if (c.matric === s.matric && !c.revoked) return res.json({ certificate: c });
 
  const certId = 'CERT-' + crypto.randomBytes(5).toString('hex').toUpperCase();
  const cert = { certId, matric: s.matric, name: s.name, programme: 'Full Stack Dev',
                 date: new Date().toDateString(), revoked: false };
  certificates.set(certId, cert);
  res.json({ certificate: cert });
});
 
// 4. Anyone (employers) can verify a certificate
app.get('/api/verify/:id', (req, res) => {
  const c = certificates.get(req.params.id);
  if (!c || c.revoked) return res.status(404).json({ valid: false });
  res.json({ valid: true, name: c.name, programme: c.programme, date: c.date });
});
 
app.listen(3000, () => console.log('FIXED server on http://localhost:3000'));