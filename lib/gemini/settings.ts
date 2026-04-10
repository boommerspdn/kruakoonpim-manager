import prisma from "@/lib/prisma";

export const GEMINI_SETTINGS_ID = "global" as const;

export type GeminiProviderName = "vertex" | "studio";

export type GeminiSettings = {
  provider: GeminiProviderName;
  model: string;
  subModel: string | null;
  modelOptions: string[];
};

const DEFAULT_SETTINGS: GeminiSettings = {
  provider: "vertex",
  model: "gemini-3.1-pro-preview",
  subModel: null,
  modelOptions: ["gemini-3.1-pro-preview", "gemini-3-flash-preview"],
};

function normalizeModelName(raw: string) {
  return raw.trim();
}

function uniqPreserveOrder(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

export async function getOrCreateGeminiSettings(): Promise<GeminiSettings> {
  const existing = await prisma.appSetting.findUnique({
    where: { id: GEMINI_SETTINGS_ID },
  });

  if (existing) {
    return {
      provider: existing.geminiProvider as GeminiProviderName,
      model: existing.geminiModel,
      subModel: existing.geminiSubModel,
      modelOptions: existing.geminiModelOptions,
    };
  }

  const created = await prisma.appSetting.create({
    data: {
      id: GEMINI_SETTINGS_ID,
      geminiProvider: DEFAULT_SETTINGS.provider,
      geminiModel: DEFAULT_SETTINGS.model,
      geminiSubModel: DEFAULT_SETTINGS.subModel,
      geminiModelOptions: DEFAULT_SETTINGS.modelOptions,
    },
  });

  return {
    provider: created.geminiProvider as GeminiProviderName,
    model: created.geminiModel,
    subModel: created.geminiSubModel,
    modelOptions: created.geminiModelOptions,
  };
}

export type UpdateGeminiSettingsInput = Partial<{
  provider: GeminiProviderName;
  model: string;
  subModel: string | null;
  modelOptions: string[];
}>;

export function validateAndNormalizeGeminiSettingsUpdate(
  input: UpdateGeminiSettingsInput,
) {
  const out: UpdateGeminiSettingsInput = {};

  if (input.provider !== undefined) {
    if (input.provider !== "vertex" && input.provider !== "studio") {
      throw new Error("Invalid provider. Expected 'vertex' or 'studio'.");
    }
    out.provider = input.provider;
  }

  if (input.model !== undefined) {
    const normalized = normalizeModelName(input.model);
    if (!normalized) {
      throw new Error("Model must be a non-empty string.");
    }
    out.model = normalized;
  }

  if (input.subModel !== undefined) {
    if (input.subModel === null) {
      out.subModel = null;
    } else {
      const normalized = normalizeModelName(input.subModel);
      out.subModel = normalized || null;
    }
  }

  if (input.modelOptions !== undefined) {
    const normalized = uniqPreserveOrder(
      input.modelOptions.map(normalizeModelName).filter(Boolean),
    );
    out.modelOptions = normalized;
  }

  return out;
}
