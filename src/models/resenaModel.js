import db from '../config/database.js';

export const getResenasByRestaurante = async (id_rest) => {
  const [rows] = await db.query(
    `SELECT r.id_resena, r.id_user, u.nombre AS nombre_user,
            r.descripcion, r.calificacion, r.creado
     FROM tbl_resenas r
     JOIN tbl_user u ON u.id_user = r.id_user
     WHERE r.id_rest = ?
     ORDER BY r.creado DESC`,
    [id_rest]
  );
  return rows;
};

export const getResenasByUsuario = async (id_user) => {
  const [rows] = await db.query(
    `SELECT r.id_resena, r.id_rest, rest.nombre AS nombre_rest,
            r.descripcion, r.calificacion, r.creado
     FROM tbl_resenas r
     JOIN tbl_rest rest ON rest.id_rest = r.id_rest
     WHERE r.id_user = ?
     ORDER BY r.creado DESC`,
    [id_user]
  );
  return rows;
};

export const createResena = async ({ id_user, id_rest, descripcion, calificacion }) => {
  await db.query(
    'INSERT INTO tbl_resenas (id_user, id_rest, descripcion, calificacion) VALUES (?, ?, ?, ?)',
    [id_user, id_rest, descripcion, calificacion]
  );
};

export const updateResena = async (id, { descripcion, calificacion }) => {
  const [result] = await db.query(
    'UPDATE tbl_resenas SET descripcion = ?, calificacion = ? WHERE id_resena = ?',
    [descripcion, calificacion, id]
  );
  return result.affectedRows;
};

export const deleteResena = async (id) => {
  const [result] = await db.query(
    'DELETE FROM tbl_resenas WHERE id_resena = ?',
    [id]
  );
  return result.affectedRows;
};