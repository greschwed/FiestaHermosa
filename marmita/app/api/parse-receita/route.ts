import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json() as {
      imageBase64: string;
      mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    };

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Analise esta imagem de receita e extraia as informações retornando SOMENTE um JSON válido, sem markdown, sem texto extra, sem blocos de código:
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
- Xícaras de chá (240ml) → ml. Colher de sopa (15ml) → ml. Colher de chá (5ml) → ml
- Se não conseguir determinar o rendimento, use 1
- Extraia TODOS os ingredientes visíveis na imagem`,
          },
        ],
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch?.[0] ?? text);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
