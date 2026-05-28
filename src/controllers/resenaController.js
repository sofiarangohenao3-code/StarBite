import {
  getResenasByRestaurante, getResenasByUsuario,
  createResena, updateResena, deleteResena
} from '../models/resenaModel.js';

export const getResenasPorRestaurante = async (req, res) => {
  try {
    const rows = await getResenasByRestaurante(req.params.id);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar reseñas' });
  }
};

export const getResenasPorUsuario = async (req, res) => {
  try {
    const rows = await getResenasByUsuario(req.params.id);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar reseñas' });
  }
};

export const postResena = async (req, res) => {
  try {
    const id_user = Number(req.body.id_user);
    const id_rest = Number(req.body.id_rest);
    const descripcion = req.body.descripcion?.trim();
    const calificacion = Number(req.body.calificacion);

    if (!id_user || !id_rest || !descripcion || isNaN(calificacion))
      return res.status(400).json({ error: 'Datos incompletos' });

    if (calificacion < 1 || calificacion > 5)
      return res.status(400).json({ error: 'Calificación debe ser entre 1 y 5' });

    await createResena({ id_user, id_rest, descripcion, calificacion });
    return res.status(201).json({ message: 'Reseña creada' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al guardar reseña' });
  }
};

export const putResena = async (req, res) => {
  try {
    const descripcion = req.body.descripcion?.trim();
    const calificacion = Number(req.body.calificacion);

    if (!descripcion || isNaN(calificacion))
      return res.status(400).json({ error: 'Datos incompletos' });

    const affected = await updateResena(req.params.id, { descripcion, calificacion });
    if (!affected) return res.status(404).json({ error: 'Reseña no encontrada' });

    return res.json({ message: 'Reseña actualizada' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar reseña' });
  }
};

export const deleteResenaCtrl = async (req, res) => {
  try {
    const affected = await deleteResena(req.params.id);
    if (!affected) return res.status(404).json({ error: 'Reseña no encontrada' });
    return res.json({ message: 'Reseña eliminada' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar reseña' });
  }
};