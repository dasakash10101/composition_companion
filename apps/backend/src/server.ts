import express from 'express';
import cors from 'cors';
import { modalInterchangeRouter } from './routes/modalInterchange';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', modalInterchangeRouter);

app.listen(PORT, () => {
  console.log(`modal-interchange backend listening on http://localhost:${PORT}`);
});
