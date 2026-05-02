import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
    const { imageBase64, mediaType } = await req.json() as {
      imageBase64: string;
      mediaType: string;
    };

    const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType: mediaType } },
      PROMPT,
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch?.[0] ?? text);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
