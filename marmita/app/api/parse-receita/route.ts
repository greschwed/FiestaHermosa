import { NextRequest, NextResponse } from 'next/server';

const VISION_KEY = process.env.GOOGLE_CLOUD_API_KEY!;
const GEMINI_KEY = process.env.GEMINI_API_KEY!;

// Step 1: extract raw text from image using Cloud Vision API
async function extractText(imageBase64: string): Promise<string> {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'Vision API error');
  return data.responses?.[0]?.fullTextAnnotation?.text ?? '';
}

// Step 2: parse extracted text into recipe JSON using Gemini text model
async function parseRecipe(text: string): Promise<unknown> {
  const prompt = `A partir do texto abaixo extraído de uma receita, retorne SOMENTE um JSON válido, sem markdown, sem blocos de código:
{
  "nome": "nome completo da receita",
  "rendimento": <número de porções como inteiro>,
  "ingredientes": [
    {"nome": "nome do ingrediente", "qtd": <quantidade numérica>, "un": "kg|g|L|ml|un"}
  ],
  "preparo": ["passo 1 completo", "passo 2 completo"]
}

Regras:
- Normalize unidades para apenas: kg, g, L, ml, un
- Xícara de chá (240ml) → ml. Colher de sopa (15ml) → ml. Colher de chá (5ml) → ml
- Se não conseguir determinar o rendimento, use 1
- Extraia TODOS os ingredientes

Texto da receita:
${text}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'Gemini API error');
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const match = responseText.match(/\{[\s\S]*\}/);
  return JSON.parse(match?.[0] ?? responseText);
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json() as { imageBase64: string };

    const rawText = await extractText(imageBase64);
    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Nenhum texto encontrado na imagem' }, { status: 422 });
    }

    const recipe = await parseRecipe(rawText);
    return NextResponse.json(recipe);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
