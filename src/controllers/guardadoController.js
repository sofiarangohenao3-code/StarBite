import {
  getGuardadosByUsuario, createGuardado, deleteGuardado
} from '../models/guardadoModel.js';

export const getGuardados = async (req, res) => {
  try {
    const rows = await getGuardadosByUsuario(req.params.id);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar guardados' });
  }
};

export const postGuardado = async (req, res) => {
  try {
    const id_user = Number(req.body.id_user);
    const id_rest = Number(req.body.id_rest);
    const tipo = req.body.tipo?.trim() || 'favorito';

    if (!id_user || !id_rest)
      return res.status(400).json({ error: 'Datos incompletos' });

    await createGuardado({ id_user, id_rest, tipo });
    return res.status(201).json({ message: 'Restaurante guardado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al guardar restaurante' });
  }
};

export const deleteGuardadoCtrl = async (req, res) => {
  try {
    const affected = await deleteGuardado(req.params.id);
    if (!affected) return res.status(404).json({ error: 'Guardado no encontrado' });
    return res.json({ message: 'Guardado eliminado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar guardado' });
  }
};