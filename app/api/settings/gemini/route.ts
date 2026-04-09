import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  GEMINI_SETTINGS_ID,
  getOrCreateGeminiSettings,
  validateAndNormalizeGeminiSettingsUpdate,
} from "@/lib/gemini/settings";

export async function GET() {
  try {
    const settings = await getOrCreateGeminiSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load Gemini settings" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;

    const BodySchema = z
      .object({
        provider: z.enum(["vertex", "studio"]).optional(),
        model: z.string().optional(),
        modelOptions: z.array(z.string()).optional(),
      })
      .strict();

    const input = BodySchema.parse(body);

    const parsed = validateAndNormalizeGeminiSettingsUpdate(input);

    const current = await getOrCreateGeminiSettings();

    const nextProvider = parsed.provider ?? current.provider;
    const nextModel = parsed.model ?? current.model;
    const nextModelOptions =
      parsed.modelOptions ?? current.modelOptions ?? [];

    const mergedModelOptions = (() => {
      const set = new Set(nextModelOptions);
      set.add(nextModel);
      return Array.from(set);
    })();

    const updated = await prisma.appSetting.update({
      where: { id: GEMINI_SETTINGS_ID },
      data: {
        geminiProvider: nextProvider,
        geminiModel: nextModel,
        geminiModelOptions: mergedModelOptions,
      },
    });

    return NextResponse.json({
      provider: updated.geminiProvider,
      model: updated.geminiModel,
      modelOptions: updated.geminiModelOptions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}

