import db from '../config/database.js';

export const getAllRestaurantes = async () => {
  const [rows] = await db.query(
    'SELECT id_rest, nombre, telefono, direccion, logo, horario, descripcion, creado FROM tbl_rest ORDER BY nombre'
  );
  return rows;
};

export const getRestauranteById = async (id) => {
  const [rows] = await db.query(
    'SELECT id_rest, nombre, telefono, direccion, logo, horario, descripcion, creado FROM tbl_rest WHERE id_rest = ?',
    [id]
  );
  return rows[0] || null;
};