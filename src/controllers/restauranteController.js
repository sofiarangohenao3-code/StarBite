import { getAllRestaurantes, getRestauranteById } from '../models/restauranteModel.js';

const sanitizeLogo = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    if (value.startsWith('data:image') || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    return `data:image/png;base64,${Buffer.from(value).toString('base64')}`;
  }
  if (value instanceof Uint8Array || ArrayBuffer.isView(value)) {
    return `data:image/png;base64,${Buffer.from(value).toString('base64')}`;
  }
  return null;
};

export const getRestaurantes = async (req, res) => {
  try {
    const rows = await getAllRestaurantes();
    const data = rows.map(r => ({ ...r, logo: sanitizeLogo(r.logo) }));
    return res.json(data);
  } catch (error) {
    console.error('Error al cargar restaurantes:', error);
    return res.status(500).json({ error: 'Error al cargar restaurantes' });
  }
};

export const getRestaurante = async (req, res) => {
  try {
    const row = await getRestauranteById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Restaurante no encontrado' });
    return res.json({ ...row, logo: sanitizeLogo(row.logo) });
  } catch (error) {
    console.error('Error al obtener restaurante:', error);
    return res.status(500).json({ error: 'Error al cargar el restaurante' });
  }
};