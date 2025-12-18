import { NextResponse } from "next/server";
import { Translate } from "@google-cloud/translate/build/src/v2";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, targetLocale } = body as { text: string; targetLocale: string };
    if (!text || !targetLocale) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const projectId = process.env.GOOGLE_PROJECT_ID;
    if (!projectId) {
      return NextResponse.json({ error: "GOOGLE_PROJECT_ID not set" }, { status: 500 });
    }
    const translate = new Translate({ projectId });
    const [translation] = await translate.translate(text, targetLocale);
    return NextResponse.json({ translatedText: translation, targetLocale });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
