const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// ---------------------------------------------------------------------------
// Internal: Call Groq chat completions
// ---------------------------------------------------------------------------
async function callGroq(userMessage) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ API key is not configured. Set EXPO_PUBLIC_GROQ_API_KEY in your .env file.');
  }

  const response = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that returns only valid JSON. Never include markdown, code fences, or any explanation — only raw JSON.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq API.');
  return text;
}

// ---------------------------------------------------------------------------
// Quiz generation
// ---------------------------------------------------------------------------
export async function generateQuiz(noteTitle, noteContent) {
  const prompt = `Generate 5 multiple-choice quiz questions based on this note.

Title: ${noteTitle}
Content: ${noteContent}

Respond with a raw JSON array (no markdown, no explanation). Each element must have:
- "question": a string containing the question
- "options": an array of exactly 4 distinct answer strings
- "correctIndex": a number (0–3) indicating which option is correct

Focus on testing comprehension, not memorization. Keep each option short and clear.`;

  const rawText = await callGroq(prompt);

  // Safely extract JSON array even if there's any stray text
  const match = rawText.replace(/```json|```/gi, '').trim().match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not find a JSON array in the response.');

  const questions = JSON.parse(match[0]);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Quiz response was not a valid question array.');
  }

  for (const q of questions) {
    if (
      typeof q.question !== 'string' ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      typeof q.correctIndex !== 'number'
    ) {
      throw new Error('One or more questions have an invalid format.');
    }
  }

  return questions;
}

// ---------------------------------------------------------------------------
// Audio transcription via Groq Whisper
// ---------------------------------------------------------------------------
// fileUri  — the local file:// URI returned by expo-av
// mimeType — detected from the file extension (m4a, mp4, 3gp, wav…)
export async function transcribeAudio(fileUri, mimeType = 'audio/m4a') {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ API key is not configured. Set EXPO_PUBLIC_GROQ_API_KEY in your .env file.');
  }

  // React Native FormData accepts a file object with { uri, name, type }.
  // Do NOT convert to base64/Blob — that is a browser-only pattern.
  const ext = fileUri.split('.').pop()?.toLowerCase() || 'm4a';

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: `recording.${ext}`,
    type: mimeType,
  });
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'json');

  const response = await fetch(GROQ_AUDIO_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      // Do NOT set Content-Type — React Native fetch sets it with the correct boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Groq Whisper error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.text;
  if (!text) throw new Error('No transcription returned from Groq Whisper.');
  return text.trim();
}
