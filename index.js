import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chat } from './src/controllers/chatController.js';

import { getRestaurantes, getRestaurante } from './src/controllers/restauranteController.js';
import { login, register, getUsuario, putUsuario, removeUsuario } from './src/controllers/usuarioController.js';
import { getResenasPorRestaurante, getResenasPorUsuario, postResena, putResena, deleteResenaCtrl } from './src/controllers/resenaController.js';
import { getGuardados, postGuardado, deleteGuardadoCtrl } from './src/controllers/guardadoController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Manejar errores de parseo JSON (body-parser) y devolver JSON legible
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en la petición' });
  }
  next(err);
});


// Archivos estáticos
app.use('/assets', express.static(path.join(__dirname, 'src/public/assets')));
app.use('/css', express.static(path.join(__dirname, 'src/public/css')));
app.use('/js', express.static(path.join(__dirname, 'src/public/js')));


// Vistas
app.use(express.static(path.join(__dirname, 'src/views')));

// Rutas de restaurantes
app.get('/api/restaurantes', getRestaurantes);
app.get('/api/restaurantes/:id', getRestaurante);

// Ruta de chat (IA)
app.post('/api/chat', chat);

// Rutas de usuarios
app.post('/api/login', login);
app.post('/api/register', register);
app.get('/api/usuarios/:id', getUsuario);
app.put('/api/usuarios/:id', putUsuario);
app.delete('/api/usuarios/:id', removeUsuario);

// Rutas de reseñas
app.get('/api/resenas/restaurante/:id', getResenasPorRestaurante);
app.get('/api/resenas/usuario/:id', getResenasPorUsuario);
app.post('/api/resenas', postResena);
app.put('/api/resenas/:id', putResena);
app.delete('/api/resenas/:id', deleteResenaCtrl);

// Rutas de guardados
app.get('/api/guardados/:id', getGuardados);
app.post('/api/guardados', postGuardado);
app.delete('/api/guardados/:id', deleteGuardadoCtrl);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});