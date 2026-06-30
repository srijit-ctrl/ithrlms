/**
 * Pluggable premium Text-to-Speech for the ITHR AI Tutor.
 *
 * Provider chosen from environment (no secrets in code):
 *   ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID) -> ElevenLabs
 *   OPENAI_API_KEY                              -> OpenAI TTS
 *   (neither)                                   -> none (UI falls back to the
 *                                                  browser's built-in voice)
 * Optional: OPENAI_TTS_MODEL (default gpt-4o-mini-tts), OPENAI_TTS_VOICE (alloy),
 *           ELEVENLABS_MODEL (eleven_multilingual_v2).
 * Uses global fetch (Node 18+). Returns { buffer, contentType } or null.
 */
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'alloy';
const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

function ttsProvider() {
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) return 'elevenlabs';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'none';
}

async function synthesize({ text }) {
  const provider = ttsProvider();
  const input = String(text || '').slice(0, 2000).trim();
  if (!input) return null;
  try {
    if (provider === 'elevenlabs') return await eleven(input);
    if (provider === 'openai') return await openai(input);
  } catch (err) {
    console.error('TTS error:', err.message);
    return null; // client falls back to browser voice
  }
  return null;
}

async function openai(input) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({ model: OPENAI_TTS_MODEL, voice: OPENAI_TTS_VOICE, input, response_format: 'mp3' }),
  });
  if (!res.ok) throw new Error('OpenAI TTS ' + res.status + ': ' + (await res.text()).slice(0, 160));
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: 'audio/mpeg' };
}

async function eleven(input) {
  const id = process.env.ELEVENLABS_VOICE_ID;
  const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(id), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'audio/mpeg', 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    body: JSON.stringify({ text: input, model_id: ELEVEN_MODEL }),
  });
  if (!res.ok) throw new Error('ElevenLabs ' + res.status + ': ' + (await res.text()).slice(0, 160));
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: 'audio/mpeg' };
}

module.exports = { synthesize, ttsProvider };
