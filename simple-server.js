import express from 'express';
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Сервер работает!');
});

app.listen(PORT, 'localhost', () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});