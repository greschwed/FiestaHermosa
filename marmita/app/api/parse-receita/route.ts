import { NextRequest, NextResponse } from 'next/server';

const GEMINI_KEY = process.env.GEMINI_API_KEY!;

const PROMPT = `Analise esta imagem de receita e extraia as informações retornando SOMENTE um JSON válido, sem markdown, sem blocos de código, sem texto extra:
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
- Extraia TODOS os ingredientes visíveis na imagem`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json() as { imageBase64: string };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
              { text: PROMPT },
            ],
          }],
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `HTTP ${res.status}`);

    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    const recipe = JSON.parse(match?.[0] ?? text);
    return NextResponse.json(recipe);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
