import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import ministerioRoutes from './routes/ministerioRoute.js';
import voluntarioRoutes from './routes/voluntarioRoute.js';
import escalaRoutes from './routes/escalaRoute.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/ministerios', ministerioRoutes);
app.use('/api/voluntarios', voluntarioRoutes);
app.use('/api/escalas', escalaRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 [Servidor Local] Plataforma rodando em http://localhost:${PORT}`);
  });
});