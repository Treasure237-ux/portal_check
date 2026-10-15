const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));
 
const students = {
  'DSU/001': { matric: 'DSU/001', password: '1234', name: 'Treasue Okoro', progress: 100 }, // finished, name misspelt
  'DSU/002': { matric: 'DSU/002', password: '1234', name: 'Ade Bello',     progress: 40  }, // not finished
};
 
app.post('/api/login', (req, res) => {
  const s = students[req.body.matric];
  if (!s || s.password !== req.body.password) return res.status(401).json({ error: 'Invalid login' });
  res.json({ token: s.matric, student: { matric: s.matric, name: s.name, progress: s.progress } });
});
 
app.put('/api/name', (req, res) => {
  const s = students[req.body.matric];           // ❌ who is this? client says so
  s.name = req.body.name;
  res.json({ name: s.name });
});
 
app.post('/api/certificate', (req, res) => {
  const { name } = req.body;                     // ❌ name comes from the client
  // ❌ no check that the student finished the programme
  res.json({ certificate: { name, programme: 'Full Stack Dev', date: new Date().toDateString() } });
});
 
app.listen(3000, () => console.log('VULNERABLE server on http://localhost:3000'));