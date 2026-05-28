import crypto from 'node:crypto';
import {
  getUserByEmail, getUserById, createUser, updateUser, deleteUser
} from '../models/usuarioModel.js';

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

const passwordMatches = (password, stored) => {
  if (!stored) return false;
  return stored === password || stored === hashPassword(password);
};

const normalize = (v) => (typeof v === 'string' ? v.trim() : '');
const normalizeOpt = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') { const t = v.trim(); return t === '' ? null : t; }
  return v;
};

export const login = async (req, res) => {
  try {
    const correo = normalize(req.body.correo);
    const contrasena = normalize(req.body.contrasena);

    if (!correo || !contrasena)
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });

    const user = await getUserByEmail(correo);
    if (!user || !passwordMatches(contrasena, user.contrasena))
      return res.status(401).json({ error: 'Correo o contraseña inválidos' });

    const { contrasena: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const register = async (req, res) => {
  try {
    const nombre = normalize(req.body.nombre);
    const correo = normalize(req.body.correo);
    const contrasena = normalize(req.body.contrasena);

    if (!nombre || !correo || !contrasena)
      return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos' });

    if (contrasena.length < 5)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 5 caracteres' });

    const existing = await getUserByEmail(correo);
    if (existing) return res.status(409).json({ error: 'Este correo ya está registrado' });

    const id = await createUser({
      correo,
      contrasena: hashPassword(contrasena),
      nombre,
      telefono: normalizeOpt(req.body.telefono),
      direccion: normalizeOpt(req.body.direccion),
    });

    const user = await getUserById(id);
    return res.status(201).json({ user });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const getUsuario = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar el perfil' });
  }
};

export const putUsuario = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nombre = normalize(req.body.nombre);
    const correo = normalize(req.body.correo);
    const contrasena = normalize(req.body.contrasena);

    if (!nombre || !correo)
      return res.status(400).json({ error: 'Nombre y correo son requeridos' });

    const affected = await updateUser(id, {
      correo,
      nombre,
      telefono: normalizeOpt(req.body.telefono),
      direccion: normalizeOpt(req.body.direccion),
      contrasena: contrasena ? hashPassword(contrasena) : null,
    });

    if (!affected) return res.status(404).json({ error: 'Usuario no encontrado' });

    const user = await getUserById(id);
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

export const removeUsuario = async (req, res) => {
  try {
    await deleteUser(Number(req.params.id));
    return res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
};