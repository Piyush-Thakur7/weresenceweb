export default async function handler(req, res) {
  // CORS Headers for seamless browser access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', service: 'Resence AI Sovereign Gateway' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    let incomingMessages = body.messages || [{ role: 'user', content: body.prompt || 'Hello' }];

    // Strict Ground-Truth System Prompt enforcing Resence AI identity
    const RESENCE_SYSTEM_PROMPT = {
      role: 'system',
      content: `You are Resence AI, the official sovereign conversational AI companion of the Resence Ecosystem (resence.in, weresence.resence.in, ai.resence.in), founded by Piyush Singh.
CRITICAL IDENTITY RULES:
1. Your name is ONLY "Resence AI" (Resence AI Companion).
2. NEVER identify as "Liquid AI", "LFM", "Liquid Foundation Model", "Poolside", "Laguna", "Jane", "OpenAI", "ChatGPT", "Claude", or any other third-party model provider.
3. If asked who you are or what model you are, always state: "I am Resence AI, the native sovereign AI companion built for the Resence ecosystem founded by Piyush Singh."
4. NEVER output internal system safety headers, moderation tags, or debug logs like "User Safety: safe".
5. Match the user's language naturally — whether Hindi, Hinglish ("aur btao", "kese ho", etc.), or English. Keep your tone warm, intelligent, helpful, and concise.`
    };

    // Filter out any existing system prompts and prepend our authoritative one
    const userAndAssistant = incomingMessages.filter(m => m.role !== 'system');
    const finalMessages = [RESENCE_SYSTEM_PROMPT, ...userAndAssistant];
    const lastMsg = finalMessages[finalMessages.length - 1] ? finalMessages[finalMessages.length - 1].content : 'Hello';

    // Server-side call to official Resence AI endpoint
    const response = await fetch('https://ai.resence.in/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WeResence/1.0 (Resence-AI-Client)'
      },
      body: JSON.stringify({ messages: finalMessages })
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || 'text/plain';
      const text = await response.text();

      // Cleanse unwanted provider leakage, persona tags, and safety debug tags
      let cleaned = text
        .replace(/User Safety:\s*safe/gi, '')
        .replace(/User Safety:\s*unsafe/gi, '')
        .replace(/Liquid AI/gi, 'Resence AI')
        .replace(/Liquid Foundation Model/gi, 'Resence AI Engine')
        .replace(/\bLFM\b/g, 'Resence AI')
        .replace(/I'm Jane/gi, "I'm Resence AI")
        .replace(/I am Jane/gi, "I am Resence AI")
        .replace(/\bJane\b/g, 'Resence AI');

      res.setHeader('Content-Type', contentType);
      return res.status(200).send(cleaned);
    } else {
      // Intelligent fallback
      const fallbackReply = lastMsg.toLowerCase().includes('kese') || lastMsg.toLowerCase().includes('kaun')
        ? "Main theek hoon! Main aapka Resence AI companion hoon — Resence ecosystem (founded by Piyush Singh) ka official sovereign assistant. Btaiye aaj kya kaam karein?"
        : `Namaste! Main Resence AI companion hoon. Aapka message mila: "${lastMsg}". Main aapki kya madad kar sakta hoon?`;

      return res.status(200).json({
        choices: [{
          delta: {
            content: fallbackReply
          }
        }]
      });
    }
  } catch (err) {
    console.error('Resence AI Gateway Error:', err);
    return res.status(200).json({
      choices: [{
        delta: {
          content: "Main Resence AI companion hoon. Sovereign encrypted channel active hai aur main madad ke liye taiyar hoon."
        }
      }]
    });
  }
}
