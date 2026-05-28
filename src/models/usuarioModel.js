import db from '../config/database.js';

export const getUserByEmail = async (correo) => {
  const [rows] = await db.query(
    'SELECT id_user, correo, contrasena, nombre, telefono, direccion, imagen, creado FROM tbl_user WHERE correo = ?',
    [correo]
  );
  return rows[0] || null;
};

export const getUserById = async (id) => {
  const [rows] = await db.query(
    'SELECT id_user, correo, nombre, telefono, direccion, imagen, creado FROM tbl_user WHERE id_user = ?',
    [id]
  );
  return rows[0] || null;
};

export const createUser = async ({ correo, contrasena, nombre, telefono, direccion }) => {
  const [result] = await db.query(
    'INSERT INTO tbl_user (correo, contrasena, nombre, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
    [correo, contrasena, nombre, telefono || null, direccion || null]
  );
  return result.insertId;
};

export const updateUser = async (id, { correo, nombre, telefono, direccion, contrasena }) => {
  const fields = ['correo = ?', 'nombre = ?', 'telefono = ?', 'direccion = ?'];
  const values = [correo, nombre, telefono || null, direccion || null];

  if (contrasena) {
    fields.push('contrasena = ?');
    values.push(contrasena);
  }

  values.push(id);
  const [result] = await db.query(
    `UPDATE tbl_user SET ${fields.join(', ')} WHERE id_user = ?`,
    values
  );
  return result.affectedRows;
};

export const deleteUser = async (id) => {
  await db.query('DELETE FROM tbl_resenas WHERE id_user = ?', [id]);
  await db.query('DELETE FROM tbl_guardados WHERE id_user = ?', [id]);
  await db.query('DELETE FROM tbl_user WHERE id_user = ?', [id]);
};