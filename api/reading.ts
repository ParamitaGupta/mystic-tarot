// Fallback minimalist dataset in case external request fails
const FALLBACK_POOL = [
  { name: 'The Fool', type: 'Major Arcana', icon: '🏃‍♂️', focus: 'New journeys, pure potential, leaps of faith.' },
  { name: 'The Magician', type: 'Major Arcana', icon: '🪄', focus: 'Manifestation, personal power, resourcefulness.' },
  { name: 'The High Priestess', type: 'Major Arcana', icon: '🌙', focus: 'Subconscious mind, intuition, inner divine wisdom.' }
];

module.exports = async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // =========================================================================
  // --- GET ROUTE: Pulls & Shuffles From the Complete 78-Card Pool ---
  // =========================================================================
  if (req.method === 'GET') {
    try {
      const count = parseInt(req.query.count, 10) || 3;
      let deckPool = [...FALLBACK_POOL];

      // Fetch the comprehensive, standard 78-card repository stream
      const deckResponse = await fetch('https://raw.githubusercontent.com/ekelen/tarot-api/master/tarot-images.json');
      
      if (deckResponse.ok) {
        const rawData = await deckResponse.json();
        if (rawData && Array.isArray(rawData.cards)) {
          // Map the standard names into your frontend interface properties
          deckPool = rawData.cards.map((c: any) => {
            const isMajor = c.type === 'major';
            return {
              name: c.name,
              type: isMajor ? 'Major Arcana' : 'Minor Arcana',
              icon: isMajor ? '🔮' : '🃏',
              focus: `Associated with the elemental suit of ${c.suit || 'the Cosmos'}.`
            };
          });
        }
      }

      // Execute Fisher-Yates randomizer sequence across the entire 78-card pool
      const shuffled = [...deckPool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      const selectedCards = shuffled.slice(0, count);
      return res.status(200).json({ cards: selectedCards });
    } catch (err: any) {
      // Graceful error fallback to keep frontend execution functional
      return res.status(200).json({ cards: FALLBACK_POOL.slice(0, parseInt(req.query.count, 10) || 3) });
    }
  }

  // =========================================================================
  // --- POST ROUTE: Handles Context Interpretation Matrix ---
  // =========================================================================
  if (req.method === 'POST') {
    try {
      const { question, cards } = req.body;
      const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
      }

      // Draft a surprise shadow undercurrent pulled dynamically out of the ether
      const alternativeShadowOptions = ['The Moon', 'The Tower', 'Death', 'The Hanged Man', 'Wheel of Fortune'];
      const unselectedShadows = alternativeShadowOptions.filter(name => !cards.includes(name));
      const surpriseShadowCard = unselectedShadows[Math.floor(Math.random() * unselectedShadows.length)] || 'The Unknown';

      const prompt = `
        User Inquiry: "${question}"
        Pulled Cards: [${cards.join(' → ')}]
        Subconscious Dynamic (Shadow): "${surpriseShadowCard}"

        Synthesize this spread into a cohesive narrative path. Map the archetypes cleanly to their situation without rambling or over-generalizing.
      `;

      const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const googleResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are a practical, grounded psychological Tarot consultant. Your voice is concise, descriptive, and emotionally smart.
              
              Structural Rules:
              - Answer the query directly in your opening observations, skipping empty preambles.
              - Dedicate exactly 2-3 precise sentences to analyzing the intersection of each individual card with their situation.
              - Include a dedicated section called "The Undercurrent (Your Shadow Card)" right before you close to reveal the surprise card, highlighting an unacknowledged motivation or blind spot.
              
              Flow & Ending Restrictions (Crucial):
              - Maintain a continuous, fluid narrative flow. Every segment must gracefully hand off to the next.
              - Never use abrupt, transactional termination tags or summarizing sign-offs (e.g., Avoid closing with "Hopefully this helps!", "That is your reading for today", "Good luck on your journey", or concluding bullet summaries).
              - Conclude your advice with a normal, fully integrated sentence that allows the core psychological insight to settle naturally, ending the text elegantly.`
            }]
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.55,
            maxOutputTokens: 950
          }
        })
      });

      if (!googleResponse.ok) {
        const errorPayload = await googleResponse.json();
        return res.status(googleResponse.status).json({ error: 'Google API Exception', details: errorPayload });
      }

      const data = await googleResponse.json();
      const textReading = data.candidates?.[0]?.content?.parts?.[0]?.text || 'The lines of insight are currently tangled. Please draw again.';

      return res.status(200).json({ reading: textReading });

    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal Server Crash' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};