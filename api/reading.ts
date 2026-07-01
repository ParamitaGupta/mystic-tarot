// Use module.exports instead of export default
module.exports = async function handler(req: any, res: any) {
  // 1. Establish CORS fallback headers for your Angular app
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
    
    // Safety fallback for TypeScript types if needed
    const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server key setup error: GEMINI_API_KEY is missing.' });
    }

    // 2. Draft the specialized tarot prompt block
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

    // 3. Hit the identical endpoint that worked in your curl terminal test
    const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const googleResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!googleResponse.ok) {
      const errorPayload = await googleResponse.json();
      return res.status(googleResponse.status).json({ error: 'Google API Exception', details: errorPayload });
    }

    const data = await googleResponse.json();
    
    // 4. Trace down the JSON branches exactly like Google's response tree outputs
    const textReading = data.candidates?.[0]?.content?.parts?.[0]?.text || 'The cards are unclear. Try shuffling again.';

    return res.status(200).json({ reading: textReading });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Crash' });
  }
}