import { NextResponse } from "next/server";

type SpotInput = {
  id: string;
  name?: string | null;
  primaryType?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type StartInput = {
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type RouteMode = "fastest" | "diverse";

type GenerateRouteInput = {
  spots: SpotInput[];
  mode: RouteMode;
  start?: StartInput | null;
  extraContext?: string | string[] | null;
};

type AiRouteResult = {
  route_name: string;
  concept: string;
  ordered_spot_ids: string[];
  reasoning_bullets: string[];
  per_spot_notes: Record<string, string>;
};

type DistanceMatrixResponse = {
  rows?: Array<{
    elements?: Array<{ duration?: { value?: number } | null } | null>;
  }>;
};

type OutputTextPayload = {
  output_text?: unknown;
  output?: unknown;
};

type OutputMessage = {
  type?: unknown;
  content?: unknown;
};

type OutputContent = {
  type?: unknown;
  text?: unknown;
};

const MAX_SPOTS = 5;
const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const GOOGLE_DISTANCE_API =
  "https://maps.googleapis.com/maps/api/distancematrix/json";

const buildResponseSchema = (spotIds: string[]) => ({
  type: "object",
  additionalProperties: false,
  required: [
    "route_name",
    "concept",
    "ordered_spot_ids",
    "reasoning_bullets",
    "per_spot_notes",
  ],
  properties: {
    route_name: { type: "string" },
    concept: { type: "string" },
    ordered_spot_ids: {
      type: "array",
      items: { type: "string" },
    },
    reasoning_bullets: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    per_spot_notes: {
      type: "object",
      additionalProperties: false,
      required: spotIds,
      properties: spotIds.reduce<Record<string, { type: "string" }>>(
        (acc, id) => {
          acc[id] = { type: "string" };
          return acc;
        },
        {}
      ),
    },
  },
});

const buildResponseFormat = (spotIds: string[]) => ({
  type: "json_schema",
  name: "ai_routing",
  description: "AI routing result for a shiori.",
  strict: true,
  schema: buildResponseSchema(spotIds),
});

const buildInstructions = () =>
  [
    "You are a route planner for a food-walk app.",
    "Return JSON ONLY that matches the provided schema.",
    "All text values must be in Japanese.",
    "Do not use English.",
    "ordered_spot_ids must contain ALL provided ids exactly once.",
    "If travel_time_matrix is provided, prioritize shorter total travel time when mode is fastest.",
    "If mode is diverse, keep genre variety but avoid obvious backtracking using travel_time_matrix.",
    "reasoning_bullets must be concise and no more than 5 items.",
    "per_spot_notes must include a short note (1 sentence) for every spot id.",
  ].join(" ");

const buildPrompt = (
  input: GenerateRouteInput & { travel_time_matrix?: unknown }
) => {
  const normalized = {
    mode: input.mode,
    start: input.start ?? null,
    spots: input.spots.map((spot) => ({
      id: spot.id,
      name: spot.name ?? null,
      primaryType: spot.primaryType ?? null,
      lat: typeof spot.lat === "number" ? spot.lat : null,
      lng: typeof spot.lng === "number" ? spot.lng : null,
    })),
    extraContext: input.extraContext ?? [],
    travel_time_matrix: input.travel_time_matrix ?? null,
  };
  return JSON.stringify(normalized);
};

const buildTravelTimeMatrix = async ({
  apiKey,
  spots,
  start,
}: {
  apiKey: string;
  spots: Array<{ id: string; lat: number; lng: number }>;
  start?: { id: string; lat: number; lng: number } | null;
}) => {
  const nodes = start ? [start, ...spots] : [...spots];
  if (nodes.length <= 1) return null;

  const origins = nodes.map((node) => `${node.lat},${node.lng}`).join("|");
  const destinations = origins;
  const url = `${GOOGLE_DISTANCE_API}?origins=${encodeURIComponent(
    origins
  )}&destinations=${encodeURIComponent(destinations)}&mode=walking&key=${apiKey}`;

  const response = await fetch(url, { method: "GET" });
  const data = (await response.json().catch(() => null)) as
    | DistanceMatrixResponse
    | null;
  if (!response.ok || !data?.rows) {
    return null;
  }

  const ids = nodes.map((node) => node.id);
  const durations: Record<string, Record<string, number | null>> = {};

  data.rows.forEach((row, rowIndex) => {
    const fromId = ids[rowIndex];
    durations[fromId] = {};
    const elements = Array.isArray(row?.elements) ? row.elements : [];
    elements.forEach((element, colIndex) => {
      const toId = ids[colIndex];
      const value = element?.duration?.value;
      durations[fromId][toId] =
        typeof value === "number" ? Math.round(value / 60) : null;
    });
  });

  return { mode: "walking", ids, durations };
};

const extractOutputText = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const data = payload as OutputTextPayload;
  if (typeof data.output_text === "string") {
    return data.output_text;
  }
  const output = Array.isArray(data.output) ? data.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    const message = item as OutputMessage;
    if (message?.type !== "message" || !Array.isArray(message?.content)) {
      continue;
    }
    for (const content of message.content as OutputContent[]) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  const text = chunks.join("\n").trim();
  return text.length > 0 ? text : null;
};

const isNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

const validateResult = (
  result: unknown,
  selectedIds: string[]
): { ok: true; value: AiRouteResult } | { ok: false; error: string } => {
  if (!result || typeof result !== "object") {
    return { ok: false, error: "AIの出力が不正です。" };
  }
  const candidate = result as Partial<AiRouteResult> & {
    ordered_spot_ids?: unknown;
    reasoning_bullets?: unknown;
    per_spot_notes?: unknown;
  };
  if (!isNonEmptyString(candidate.route_name) || !isNonEmptyString(candidate.concept)) {
    return { ok: false, error: "AIの出力が不正です。" };
  }

  const ordered = Array.isArray(candidate.ordered_spot_ids)
    ? candidate.ordered_spot_ids.filter((id): id is string => typeof id === "string")
    : null;
  if (!ordered || ordered.length === 0) {
    return { ok: false, error: "AIの出力が不正です。" };
  }

  const reasoning = Array.isArray(candidate.reasoning_bullets)
    ? candidate.reasoning_bullets.filter(
        (item): item is string => typeof item === "string"
      )
    : null;
  if (!reasoning || reasoning.length > 5) {
    return { ok: false, error: "AIの出力が不正です。" };
  }

  if (
    !candidate.per_spot_notes ||
    typeof candidate.per_spot_notes !== "object" ||
    Array.isArray(candidate.per_spot_notes)
  ) {
    return { ok: false, error: "AIの出力が不正です。" };
  }

  const selectedSet = new Set(selectedIds);
  const orderedSet = new Set(ordered);
  if (ordered.length !== selectedSet.size || orderedSet.size !== ordered.length) {
    return { ok: false, error: "AIの出力が不正です。" };
  }
  for (const id of ordered) {
    if (!selectedSet.has(id)) {
      return { ok: false, error: "AIの出力が不正です。" };
    }
  }
  for (const id of selectedSet) {
    const note = (candidate.per_spot_notes as Record<string, unknown>)[id];
    if (!isNonEmptyString(note)) {
      return { ok: false, error: "AIの出力が不正です。" };
    }
  }

  return { ok: true, value: candidate as AiRouteResult };
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY が設定されていません。" },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | GenerateRouteInput
    | null;
  if (!body || !Array.isArray(body.spots) || body.spots.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (body.spots.length > MAX_SPOTS) {
    return NextResponse.json(
      { error: "最大5件まで選択してください。" },
      { status: 400 }
    );
  }

  const mode: RouteMode = body.mode === "diverse" ? "diverse" : "fastest";
  const spots = body.spots
    .map((spot) => ({
      id: String(spot.id),
      name: spot.name ?? null,
      primaryType: spot.primaryType ?? null,
      lat: typeof spot.lat === "number" ? spot.lat : null,
      lng: typeof spot.lng === "number" ? spot.lng : null,
    }))
    .filter((spot) => spot.id);

  if (spots.length === 0) {
    return NextResponse.json({ error: "No valid spots" }, { status: 400 });
  }

  const start =
    body.start &&
    (isNonEmptyString(body.start.label) ||
      typeof body.start.lat === "number" ||
      typeof body.start.lng === "number")
      ? {
          label: body.start.label ?? null,
          lat: typeof body.start.lat === "number" ? body.start.lat : null,
          lng: typeof body.start.lng === "number" ? body.start.lng : null,
        }
      : null;

  const promptInput: GenerateRouteInput = {
    spots,
    mode,
    start,
    extraContext: body.extraContext ?? [],
  };

  let travelMatrix: unknown = null;
  const mapsKey = process.env.GOOGLE_API_KEY;
  const validSpotsForMatrix = spots.filter(
    (spot): spot is { id: string; lat: number; lng: number } =>
      typeof spot.lat === "number" && typeof spot.lng === "number"
  );
  const validStart =
    start &&
    typeof start.lat === "number" &&
    typeof start.lng === "number"
      ? { id: "start", lat: start.lat, lng: start.lng }
      : null;

  if (mapsKey && validSpotsForMatrix.length === spots.length) {
    travelMatrix = await buildTravelTimeMatrix({
      apiKey: mapsKey,
      spots: validSpotsForMatrix,
      start: validStart,
    });
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const responseFormat = buildResponseFormat(spots.map((spot) => spot.id));
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: buildInstructions(),
      input: buildPrompt({ ...promptInput, travel_time_matrix: travelMatrix }),
      temperature: 0.2,
      max_output_tokens: 800,
      text: {
        format: responseFormat,
      },
    }),
  });

  const raw = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (raw as { error?: { message?: string } } | null)?.error?.message ??
      (raw as { error?: string } | null)?.error ??
      "AIルーティングの生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const outputText = extractOutputText(raw);
  if (!outputText) {
    return NextResponse.json(
      { error: "AIの出力が空でした。" },
      { status: 502 }
    );
  }

  let parsed: AiRouteResult;
  try {
    parsed = JSON.parse(outputText) as AiRouteResult;
  } catch (error) {
    console.error("Failed to parse AI JSON output.", error);
    return NextResponse.json(
      { error: "AIの出力を解析できませんでした。" },
      { status: 502 }
    );
  }

  const validation = validateResult(parsed, spots.map((spot) => spot.id));
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 502 });
  }

  return NextResponse.json(validation.value);
}

