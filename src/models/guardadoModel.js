import db from '../config/database.js';

export const getGuardadosByUsuario = async (id_user) => {
  const [rows] = await db.query(
    `SELECT g.id_favorito, g.id_rest, g.tipo, rest.nombre, rest.direccion
     FROM tbl_guardados g
     JOIN tbl_rest rest ON rest.id_rest = g.id_rest
     WHERE g.id_user = ?
     ORDER BY g.id_favorito DESC`,
    [id_user]
  );
  return rows;
};

export const createGuardado = async ({ id_user, id_rest, tipo }) => {
  await db.query(
    'INSERT INTO tbl_guardados (id_user, id_rest, tipo) VALUES (?, ?, ?)',
    [id_user, id_rest, tipo || 'favorito']
  );
};

export const deleteGuardado = async (id) => {
  const [result] = await db.query(
    'DELETE FROM tbl_guardados WHERE id_favorito = ?',
    [id]
  );
  return result.affectedRows;
};