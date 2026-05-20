import {
  ordersOnlyResponseSchema,
  responseSchema,
} from "@/lib/gemini-response-type";
import { getGeminiProvider } from "@/lib/gemini/provider";
import { getOrCreateGeminiSettings } from "@/lib/gemini/settings";
import prisma from "@/lib/prisma";
import { createUserContent, GoogleGenAI, Part } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

type MenuRef = { id: string; name: string; price: number };
type CustomerRef = { name: string };

type GeminiOrder = {
  customerName: string;
  note?: string | null;
  delivery: boolean;
  payment: string | null;
  orderItems: { menuId: string; amount: number }[];
};

type FirstPageResult = {
  menus: { id: string; name: string; price: number; amount: number }[];
  orders: GeminiOrder[];
};

const SHARED_INTRO = `คุณคือผู้เชี่ยวชาญด้าน OCR หน้าที่ของคุณคือแกะตัวหนังสือจากตารางจดออเดอร์อาหารและแปลงเป็น JSON`;

function formatCustomerList(customers: CustomerRef[]): string {
  if (customers.length === 0) return "";
  return customers.map((c) => `- ${c.name}`).join("\n");
}

const FIRST_PAGE_MENU_INSTRUCTIONS = `[เมนู]
1. แถวบนสุด = ราคา (price)
2. แถวที่สอง = ยอดคงเหลือ (amount) ให้ยึดตัวเลขที่มากที่สุด
3. แถวที่สาม = ชื่อเมนู (name) เอาให้อิงจากเมนูอาหารไทยจริง
4. สร้าง id สำหรับแต่ละเมนู เช่น "menu_1", "menu_2"
5. ในบางวันจะมีเมนูผัดหอยลาย เผา/เทียม ให้แยกเป็น 2 เมนู เช่น ผัดหอยลาย (เผา) และ ผัดหอยลาย (กระเทียม)`;

const ORDER_RULES = `
[ออเดอร์ - ชื่อลูกค้า]
1. คอลัมน์แรกสุดคือชื่อลูกค้า (customerName) โดยจะมีคำนำหน้าชื่อลูกค้าเช่น K', P' หรือ N' หรืออาจจะไม่มีคำนำหน้าเลยก็ได้
2. ตัดตัวเลขยอดรวมที่ติดท้ายชื่อออก (เช่น "P'อ๊อด 200" → "P'อ๊อด")
3. ชื่อลูกค้าอาจมีความคลุมเครือจากการเขียน ให้พยายามอ่านให้ถูกต้องที่สุดเท่าที่จะเป็นไปได้

[ออเดอร์ - รายละเอียด]
1. ระวังบรรทัด: กวาดสายตาซ้ายไปขวาอย่างระมัดระวัง ห้ามให้ตัวเลขสลับบรรทัด ในบางกรณีอาจมีการรวบยอดออเดอร์ในช่องออเดอร์แต่จะไม่ใช่การสั่งอาหารของลูกค้า โดยมักจะมีตัวเลขสูง ถึง 10+ มักจะเขียนด้วยปากกาสีแดง
2. delivery: true หากมีเครื่องหมายติ๊กถูก อยู่บริเวณชื่อลูกค้าบางทีอาจอยู่ในคอลัมน์ของเมนูแรก ให้ดูให้ดี เครื่องหมายติ๊กถูกไม่ใช้ตัวเลข
3. amount: อ่านเฉพาะตัวเลข ห้ามใส่จุด (.) หรือสัญลักษณ์อื่น อ่านให้ชัดเจนเพราะตัวเลขสำคัญมาก
4. note: ถ้ามีข้อความในช่องเมนู (เช่น "แยกน้ำ") ให้ใส่ใน note เป็นชื่อเมนูที่ข้อความอยู่ เช่น ไข่พะโล้: ไข่ 3 ใบ ถ้าหากมีหลายเมนูให้คั่นด้วย , ถ้าไม่มีให้เป็น null แต่ถ้าเป็นคำว่า "หมด" ไม่ต้องสนใจ
5. payment: คืนค่า "ONLINE" เฉพาะเมื่อพบคำว่า "โอนแล้ว" เท่านั้น ระวังให้ไม่สับสนกับรหัสออเดอร์หรือข้อมูลอื่น

[orderItems]
- ห้ามให้ตัวเลขสลับคอลัมน์เด็ดขาด เช็คตัวเลขออเดอร์ให้ดีก่อนไป Map กับเมนู
- ใส่เฉพาะเมนูที่ลูกค้าสั่ง (amount > 0) โดยใช้ menuId ตามที่กำหนด อ่านตัวเลขให้ดี ห้ามผิดเด็ดขาด คอลัมน์ไหนไม่มีเลขคือลูกค้าไม่ได้สั่งเมนูนั้น
- ตรวจสอบการจัดตำแหน่งของตัวเลขกับเมนูให้แม่นยำ เพราะนี่คือข้อมูลที่สำคัญที่สุด

[ข้อห้าม]
- ห้ามเดาหรือสมมติ ถ้าไม่แน่ใจให้ปล่อยว่างหรือใส่ 0
- ห้ามเปลี่ยนชื่อเมนูที่กำหนด ใช้ตามรายการเมนูเท่านั้น
- ห้ามมีข้อมูลที่ไม่อ่านออกมาจากภาพ

ตอบกลับเป็น JSON อย่างเดียว ห้ามมีข้อความอื่น/Markdown/โค้ดเฟนซ์`;

function buildSharedInstruction(customers: CustomerRef[]): string {
  const customerSection = formatCustomerList(customers);
  return `${SHARED_INTRO}
${customerSection ? `\n[รายชื่อลูกค้าที่รู้จัก] (ไม่บังคับ) หากชื่อในภาพใกล้เคียงกับชื่อในรายการนี้ ให้ใช้ชื่อในรายการแทน แต่ถ้าไม่แน่ใจให้ใช้ชื่อที่อ่านได้จากภาพตามปกติ:\n${customerSection}` : ""}
${ORDER_RULES}`;
}

function buildMenuListMessage(menus: MenuRef[]): string {
  const menuList = menus
    .map((m) => `- ${m.id}: ${m.name} (${m.price} บาท)`)
    .join("\n");
  return `[เมนูที่ใช้ (จากหน้าแรก)] ใช้ menuId ตามรายการนี้เท่านั้น:\n${menuList}`;
}

async function deleteCacheSilently(ai: GoogleGenAI, name: string) {
  try {
    await ai.caches.delete({ name });
    console.log(`[Cache] Deleted: ${name}`);
  } catch {
    // TTL will handle cleanup
  }
}

async function createPromptCache(
  ai: GoogleGenAI,
  model: string,
  systemInstruction: string,
  displayName: string,
  schema: object,
  ttl = "300s",
): Promise<string | null> {
  const allSchemas = JSON.stringify(
    { responseSchema, ordersOnlyResponseSchema },
    null,
    2,
  );
  const fullInstruction = `${systemInstruction}\n\n[Response JSON Schema]\n${JSON.stringify(schema, null, 2)}\n\n[All Schemas Reference]\n${allSchemas}`;
  try {
    const cache = await ai.caches.create({
      model,
      config: {
        systemInstruction: fullInstruction,
        displayName,
        ttl,
      },
    });
    console.log(`[Cache] Created: ${cache.name} (${displayName}, ttl=${ttl})`);
    return cache.name ?? null;
  } catch (err) {
    console.warn(
      `[Cache] Creation failed (${displayName}), using uncached path:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function processFirstPage(
  ai: GoogleGenAI,
  model: string,
  filePart: Part,
  customers: CustomerRef[],
  cacheName: string | null,
): Promise<FirstPageResult> {
  const response = await ai.models.generateContent({
    model,
    contents: createUserContent([FIRST_PAGE_MENU_INSTRUCTIONS, filePart]),
    config: {
      ...(cacheName
        ? { cachedContent: cacheName }
        : { systemInstruction: buildSharedInstruction(customers) }),
      temperature: 1,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });
  return JSON.parse(response.text ?? "{}");
}

async function processSubsequentPage(
  ai: GoogleGenAI,
  model: string,
  filePart: Part,
  menus: MenuRef[],
  customers: CustomerRef[],
  cacheName: string | null,
): Promise<{ orders: GeminiOrder[] }> {
  const response = await ai.models.generateContent({
    model,
    contents: createUserContent([buildMenuListMessage(menus), filePart]),
    config: {
      ...(cacheName
        ? { cachedContent: cacheName }
        : { systemInstruction: buildSharedInstruction(customers) }),
      temperature: 1,
      responseMimeType: "application/json",
      responseSchema: ordersOnlyResponseSchema,
    },
  });
  return JSON.parse(response.text ?? '{"orders":[]}');
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  label: string,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(
        `[Retry] ${label} attempt ${attempt}/${maxAttempts} failed:`,
        err instanceof Error ? err.message : err,
      );
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error("unreachable");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      throw new Error("No files found");
    }

    const limitInBytes = 20 * 1024 * 1024;
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > limitInBytes) {
      throw new Error("files size combined are too large");
    }

    const {
      provider: providerFromDb,
      model,
      subModel,
    } = await getOrCreateGeminiSettings();
    const vercelOidcToken = req.headers.get("x-vercel-oidc-token") ?? undefined;
    const { ai, buildFileParts, provider } = getGeminiProvider({
      providerOverride: providerFromDb,
      vercelOidcToken,
    });
    const subsequentModel = subModel || model;

    const customers = await prisma.customer.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    const sharedInstruction = buildSharedInstruction(customers);
    console.log("[Cache] Creating shared instruction cache...");
    const sharedCacheName = await createPromptCache(
      ai,
      model,
      sharedInstruction,
      "ocr-shared-instruction",
      responseSchema,
    );

    const [firstFilePart] = await buildFileParts([files[0]]);
    console.log("[LOG]: First image uploaded", {
      provider,
      model,
      subsequentModel,
      cacheCreated: !!sharedCacheName,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (text: string) => controller.enqueue(encoder.encode(text));

        try {
          send(
            `PROGRESS:กำลังประมวลผลหน้า 1 จาก ${files.length} หน้า (เมนู + ออเดอร์)...\n`,
          );
          console.log(`[Start] Page 1 at: ${new Date().toLocaleTimeString()}`);

          const remainingUploadPromise =
            files.length > 1
              ? buildFileParts(files.slice(1))
              : Promise.resolve([]);

          const firstPageResult = await processFirstPage(
            ai,
            model,
            firstFilePart,
            customers,
            sharedCacheName,
          );
          send(
            `PROGRESS:หน้า 1 เสร็จสิ้น — พบ ${firstPageResult.menus.length} เมนู, ${firstPageResult.orders.length} ออเดอร์\n`,
          );
          send(`FIRST_PAGE:${JSON.stringify(firstPageResult)}\n`);
          console.log(`[Done] Page 1 at: ${new Date().toLocaleTimeString()}`);

          const remainingFileParts = await remainingUploadPromise;

          if (remainingFileParts.length > 0) {
            const menuRefs: MenuRef[] = firstPageResult.menus.map((m) => ({
              id: m.id,
              name: m.name,
              price: m.price,
            }));

            send(`PROGRESS:ใช้ cache สำหรับหน้าถัดไป ✓\n`);

            send(
              `PROGRESS:กำลังประมวลผลหน้า 2-${files.length} พร้อมกัน (${remainingFileParts.length} หน้า)...\n`,
            );
            console.log(
              `[Start] Pages 2-${files.length} at: ${new Date().toLocaleTimeString()}`,
            );

            try {
              await Promise.all(
                remainingFileParts.map(async (fp, idx) => {
                  const pageNumber = idx + 2;
                  try {
                    const result = await withRetry(
                      () =>
                        processSubsequentPage(
                          ai,
                          subsequentModel,
                          fp,
                          menuRefs,
                          customers,
                          sharedCacheName,
                        ),
                      3,
                      `Page ${pageNumber}`,
                    );
                    send(
                      `PAGE:${pageNumber}:${JSON.stringify({ orders: result.orders, pageNumber })}\n`,
                    );
                    send(
                      `PROGRESS:หน้า ${pageNumber} เสร็จสิ้น — พบ ${result.orders.length} ออเดอร์\n`,
                    );
                    console.log(
                      `[Done] Page ${pageNumber} at: ${new Date().toLocaleTimeString()}`,
                    );
                  } catch (err) {
                    console.error(
                      `[Error] Page ${pageNumber} failed after retries:`,
                      err,
                    );
                    send(
                      `PAGE_ERROR:${pageNumber}:${err instanceof Error ? err.message : "Unknown error"}\n`,
                    );
                    send(
                      `PROGRESS:หน้า ${pageNumber} ล้มเหลว — กรุณาลองใหม่\n`,
                    );
                  }
                }),
              );
            } finally {
              if (sharedCacheName) {
                deleteCacheSilently(ai, sharedCacheName);
              }
            }

            console.log(
              `[Done] All pages at: ${new Date().toLocaleTimeString()}`,
            );
          }

          send(`DONE\n`);
          controller.close();
        } catch (error) {
          console.error(error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
