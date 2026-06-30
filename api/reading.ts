import { GoogleGenAI } from '@google/genai';

// Initialize the SDK; automatically uses process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, cards } = req.body;

    const prompt = `
      You are an expert, compassionate Tarot Card Reader with deep insight into human psychology.
      The user asked: "${question}"
      They pulled the following cards: ${cards.join(', ')}.
      
      Provide a beautifully structured reading. Include:
      1. A short, atmospheric introduction.
      2. Breakdown of each card's meaning in relation to their question.
      3. A modern, actionable psychological synthesis.
      Keep the tone mysterious yet grounded and uplifting. Use clear paragraphs.
    `;

    const response = await ai.models.generateContent({
      model: 'models/gemini-2.5-flash',
      contents: prompt,
    });

    return res.status(200).json({ reading: response.text });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}