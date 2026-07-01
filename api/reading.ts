

// Complete 9-card reference pool array
const TAROT_POOL = [
  'The Fool', 'The Magician', 'The High Priestess',
  'The Empress', 'The Emperor', 'The Hierophant',
  'The Lovers', 'The Chariot', 'Strength'
];

module.exports = async function handler(req: any, res: any) {
  // 1. Establish necessary CORS headers for your Angular frontend
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // =========================================================================
  // --- GET ROUTE: Handles Shuffling and Dynamic Card Selection ---
  // =========================================================================
  if (req.method === 'GET') {
    try {
      // Read the count query parameter (e.g., /api/reading?count=3), defaulting to 3
      const count = parseInt(req.query.count, 10) || 3;
      
      // Shuffle array copy using the standard Fisher-Yates routine
      const shuffled = [...TAROT_POOL];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Slice out the exact number of items requested (3 or 9)
      const selectedCards = shuffled.slice(0, count);
      return res.status(200).json({ cards: selectedCards });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed generating deck layout' });
    }
  }

  // =========================================================================
  // --- POST ROUTE: Handles Focused Text Generation Reading with Hook ---
  // =========================================================================
  if (req.method === 'POST') {
    try {
      const { question, cards } = req.body;
      
      // Safely access env tokens through global typecasting for TypeScript compatibility
      const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
      }

      // Find an unselected card from the pool to act as the surprise "Shadow" card
      const unselectedCards = TAROT_POOL.filter(card => !cards.includes(card));
      const surpriseShadowCard = unselectedCards.length > 0 
        ? unselectedCards[Math.floor(Math.random() * unselectedCards.length)]
        : 'The Unknown';

      // Refined context prompt that includes the hidden surprise card variable
      const prompt = `
        User Question: "${question}"
        Selected Spread Layout: [${cards.join(' → ')}]
        Hidden Shadow Card: "${surpriseShadowCard}"

        Analyze this layout with laser precision. Connect the symbolic themes of these cards directly to the specific realities of their question. Avoid generic fortunes.
      `;

      const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const googleResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          // Injects a strict behavioral profile with the surprise element rule
          systemInstruction: {
            parts: [{
              text: `You are a practical, hyper-perceptive psychological Tarot consultant. 
              Your style is concise, direct, and zero-fluff. 
              
              Rules:
              - Never provide vague, open-ended generalizations ("big changes are coming").
              - Address the user's specific text question directly in the first sentence.
              - Dedicate exactly 2-3 sentences to parsing the intersection of each individual card with their query.
              
              - SURPRISE ELEMENT HOOK: Right before the conclusion, introduce a dedicated section called "The Undercurrent (Your Shadow Card)". Reveal the Hidden Shadow Card provided in the prompt. Explain to the user that this card represents a critical blind spot, an unacknowledged motivation, or a hidden asset operating entirely beneath their conscious awareness regarding their question. Make this revelation feel shocking yet profoundly accurate to their psychological state.
              
              - Conclude with a clear, bulleted 'Actionable Insight' section offering structural psychological advice.
              - Use plain paragraphs without excessive poetic filler.`
            }]
          },
          contents: [{ parts: [{ text: prompt }] }],
          // Lowered temperature to anchor logic patterns and minimize rambling
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 900
          }
        })
      });

      if (!googleResponse.ok) {
        const errorPayload = await googleResponse.json();
        return res.status(googleResponse.status).json({ error: 'Google API Exception', details: errorPayload });
      }

      const data = await googleResponse.json();
      
      // Trace cleanly down the JSON response tree
      const textReading = data.candidates?.[0]?.content?.parts?.[0]?.text || 'The cards are unclear. Try shuffling again.';

      return res.status(200).json({ reading: textReading });

    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal Server Crash' });
    }
  }

  // Fallback for unhandled HTTP methods
  return res.status(405).json({ error: 'Method not allowed' });
};