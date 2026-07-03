import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ParsedPosition {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  hours?: number;
  hourlyRate?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transkription erforderlich' },
        { status: 400 }
      );
    }

    // Get the offer to verify ownership
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Angebot nicht gefunden' }, { status: 404 });
    }

    if (offer.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 });
    }

    // Use GPT-4o-mini to parse positions from transcript
    const systemPrompt = `Du bist ein hilfreicher Assistent für Landschaftsgärtner.
    Der Benutzer diktiert Positionen für ein Angebot, und du extrahierst die Positionen strukturiert.

    Versuche, standardisierte Einheiten und typische Preise für Landschaftsgartenarbeit zu verwenden:
    - Rasenarbeiten: m²
    - Heckenarbeiten: m (Länge) oder Stunden
    - Beete: m² oder Stunden
    - Gehwege: m²
    - Pflanzarbeiten: Stunden

    Typische Stundensätze für deutsche Landschaftsgärtner:
    - Standard: €40-60/h
    - Spezialist: €60-80/h

    Typische Preise:
    - Rasenmähen/Vertikutieren: €10-15/m²
    - Unkrautbekämpfung: €5-8/m²
    - Heckenschnitt: €30-50/m
    - Beete vorbereiten: €15-20/m²

    Antworte mit JSON-Array von Positionen im Format:
    [{
      "name": "Positionsname",
      "description": "Kurze Beschreibung",
      "quantity": 100,
      "unit": "m²",
      "unitPrice": 15,
      "hours": null,
      "hourlyRate": null
    }]

    Wichtig:
    - Nutze ENTWEDER unitPrice ODER hours+hourlyRate (nicht beide)
    - quantity sollte eine Zahl sein
    - Schreibe NUR das JSON-Array, keine anderen Texte`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Bitte extrahiere die Positionen aus dieser Diktation: "${transcript}"`,
        },
      ],
      temperature: 0.3,
    });

    let parsedPositions: ParsedPosition[] = [];

    const responseText = completion.choices[0]?.message?.content?.trim() || '';

    // Try to extract JSON from response (in case GPT adds extra text)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        parsedPositions = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('JSON parse error:', e);
        return NextResponse.json(
          { error: 'Fehler beim Parsen der Positionen' },
          { status: 400 }
        );
      }
    }

    // Validate and normalize positions
    const validatedPositions = parsedPositions
      .filter((pos) => pos.name && (pos.unitPrice || pos.hourlyRate))
      .map((pos) => ({
        name: pos.name.trim(),
        description: pos.description?.trim() || '',
        quantity: Math.max(1, pos.quantity || 1),
        unit: pos.unit || 'm²',
        unitPrice: pos.unitPrice ? parseFloat(pos.unitPrice.toString()) : 0,
        hours: pos.hours ? parseFloat(pos.hours.toString()) : undefined,
        hourlyRate: pos.hourlyRate ? parseFloat(pos.hourlyRate.toString()) : undefined,
      }));

    if (validatedPositions.length === 0) {
      return NextResponse.json(
        {
          error: 'Keine Positionen in der Diktation erkannt. Bitte versuchen Sie es mit mehr Details.',
          transcript,
        },
        { status: 400 }
      );
    }

    // Create positions in the offer
    const createdPositions: any[] = [];

    for (const pos of validatedPositions) {
      const created = await prisma.position.create({
        data: {
          offerId: params.id,
          name: pos.name,
          description: pos.description,
          quantity: pos.quantity,
          unit: pos.unit,
          unitPrice: pos.unitPrice || 0,
          hours: pos.hours,
          hourlyRate: pos.hourlyRate,
          totalNet: pos.unitPrice
            ? pos.quantity * pos.unitPrice
            : (pos.hours || 0) * (pos.hourlyRate || 0),
          order: createdPositions.length + 1,
        },
      });
      createdPositions.push(created);
    }

    // Recalculate offer totals
    const updatedOffer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: { positions: true },
    });

    if (!updatedOffer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden nach Position-Erstellung' },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotalNet = updatedOffer.positions.reduce(
      (sum, pos) => sum + pos.totalNet,
      0
    );
    const taxRate = 0.19; // Standard tax rate (19% in Germany)
    const taxAmount = subtotalNet * taxRate;
    const totalGross = subtotalNet + taxAmount;

    const updated = await prisma.offer.update({
      where: { id: params.id },
      data: {
        subtotalNet,
        taxAmount,
        totalGross,
      },
      include: { positions: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${createdPositions.length} Positionen hinzugefügt`,
        positions: createdPositions,
        transcript,
        offer: updated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Voice-to-quote error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Fehler beim Verarbeiten der Diktation',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
