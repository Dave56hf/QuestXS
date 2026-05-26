import { NextResponse } from "next/server";

type FearGreedResponse = {
  data: Array<{ value: string; value_classification: string }>;
};

export async function GET() {
  try {
    const response = await fetch("https://api.alternative.me/fng/", {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Fear and Greed request failed: ${response.status}`);
    }

    const payload = (await response.json()) as FearGreedResponse;
    const latest = payload.data[0];

    return NextResponse.json({
      value: Number(latest.value),
      classification: latest.value_classification,
    });
  } catch (error) {
    console.error("Fear and Greed API error:", error);
    return NextResponse.json(
      { error: "Unable to load sentiment data" },
      { status: 502 },
    );
  }
}
