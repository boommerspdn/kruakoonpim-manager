import { getGeminiProvider } from "@/lib/gemini/provider";
import { getOrCreateGeminiSettings } from "@/lib/gemini/settings";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { provider: providerFromDb } = await getOrCreateGeminiSettings();
    const { ai } = getGeminiProvider({ providerOverride: providerFromDb });

    const pager = await ai.caches.list({ config: { pageSize: 100 } });
    const caches = (pager.page ?? []).map((c) => ({
      name: c.name,
      displayName: c.displayName,
      model: c.model,
      createTime: c.createTime,
      expireTime: c.expireTime,
      usageMetadata: c.usageMetadata,
    }));

    return NextResponse.json({ caches });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list caches";
    console.error(error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { name } = (await req.json()) as { name?: string };
    if (!name) {
      return NextResponse.json(
        { message: "Cache name is required" },
        { status: 400 },
      );
    }

    const { provider: providerFromDb } = await getOrCreateGeminiSettings();
    const { ai } = getGeminiProvider({ providerOverride: providerFromDb });

    await ai.caches.delete({ name });
    return NextResponse.json({ deleted: name });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete cache";
    console.error(error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
