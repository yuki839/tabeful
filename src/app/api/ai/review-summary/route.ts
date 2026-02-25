import { NextRequest, NextResponse } from "next/server";

const MAX_REVIEWS = 8;
const MAX_REVIEW_CHARS = 8000;

type OutputPart = { type?: unknown; text?: unknown };

type OutputItem = {
  content?: unknown;
};

type OpenAIResponseLike = {
  output_text?: unknown;
  output?: unknown;
};

const extractSummary = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return null;
  }
  const payload = data as OpenAIResponseLike;
  if (typeof payload.output_text === "string") {
    return payload.output_text.trim();
  }
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray((item as OutputItem).content)
      ? ((item as OutputItem).content as OutputPart[])
      : [];
    for (const part of content) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        return part.text.trim();
      }
      if (typeof part?.text === "string") {
        return part.text.trim();
      }
    }
  }
  return null;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const reviews = Array.isArray(body?.reviews) ? body.reviews : [];
  const texts = reviews
    .map((text: string) => String(text ?? "").trim())
    .filter(Boolean)
    .slice(0, MAX_REVIEWS);

  if (texts.length === 0) {
    return NextResponse.json({ error: "Reviews are required." }, { status: 400 });
  }

  const joined = texts.join("\n---\n").slice(0, MAX_REVIEW_CHARS);
  const prompt = [
    "以下のレビューを日本語で要約してください。",
    "条件:",
    "- 3?4行の箇条書き",
    "- 良い点/悪い点が分かるように",
    "- 具体名はぼかして一般化",
    "",
    "レビュー:",
    joined,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.4,
        max_output_tokens: 220,
        store: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "OpenAI request failed." },
        { status: response.status }
      );
    }

    const summary = extractSummary(data);
    if (!summary) {
      return NextResponse.json(
        { error: "Failed to parse summary." },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("OpenAI summary failed.", error);
    return NextResponse.json(
      { error: "Failed to summarize reviews." },
      { status: 500 }
    );
  }
}

