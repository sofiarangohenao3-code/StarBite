import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Eres StarBite AI, un asistente especializado en recomendaciones 
de restaurantes en Medellín, Colombia. Ayudas a los usuarios a encontrar el restaurante 
perfecto según sus gustos, presupuesto y ocasión. Responde siempre en español, de forma 
amable y concisa.`;

export const chat = async (req, res) => {
  try {
    const mensaje = req.body.mensaje?.trim();
    if (!mensaje)
      return res.status(400).json({ error: 'Mensaje requerido' });

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(mensaje);
    const respuesta = result.response.text();

    return res.json({ respuesta });
  } catch (error) {
    console.error('Error en chat:', error);
    return res.status(500).json({ error: 'Error al procesar el mensaje' });
  }
};