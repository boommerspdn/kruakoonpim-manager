import {
  ordersOnlyResponseSchema,
  responseSchema,
} from "@/lib/gemini-response-type";
import { getGeminiProvider } from "@/lib/gemini/provider";
import { getOrCreateGeminiSettings } from "@/lib/gemini/settings";
import { createUserContent, GoogleGenAI, Part } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

type MenuRef = { id: string; name: string; price: number };

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

const ORDER_RULES = `
[ออเดอร์ - ชื่อลูกค้า]
1. คอลัมน์แรกสุดคือชื่อลูกค้า (customerName)
3. ตัดตัวเลขยอดรวมที่ติดท้ายชื่อออก (เช่น "P'อ๊อด 200" → "P'อ๊อด")

[ออเดอร์ - รายละเอียด]
1. ระวังบรรทัด: กวาดสายตาซ้ายไปขวาอย่างระมัดระวัง ห้ามให้ตัวเลขสลับบรรทัด
2. delivery: true หากมีเครื่องหมายติ๊กถูก อยู่บริเวณชื่อลูกค้าบางทีอาจอยู่ในคอลัมน์ของเมนูแรก ให้ดูให้ดี เครื่องหมายติ๊กถูกไม่ใช้ตัวเลข
3. amount: อ่านเฉพาะตัวเลข ห้ามใส่จุด (.) หรือสัญลักษณ์อื่น
4. note: ถ้ามีข้อความในช่องเมนู (เช่น "แยกน้ำ") ให้ใส่ใน note ถ้าไม่มีให้เป็น null แต่ถ้าเป็นคำว่า "หมด" ไม่ต้องสนใจ
5. payment: คืนค่า "ONLINE" เฉพาะเมื่อพบคำว่า "โอนแล้ว" เท่านั้น

[orderItems]
- ใส่เฉพาะเมนูที่ลูกค้าสั่ง (amount > 0) โดยใช้ menuId ตามที่กำหนด อ่านตัวเลขให้ดี ห้ามผิดเด็ดขาด คอลัมน์ไหนไม่มีเลขคือลูกค้าไม่ได้สั่งเมนูนั้น

ตอบกลับเป็น JSON อย่างเดียว ห้ามมีข้อความอื่น/Markdown/โค้ดเฟนซ์`;

function buildFirstPagePrompt(): string {
  return `${SHARED_INTRO}

[เมนู]
1. แถวบนสุด = ราคา (price)
2. แถวที่สอง = ยอดคงเหลือ (amount) ให้ยึดตัวเลขที่มากที่สุด
3. แถวที่สาม = ชื่อเมนู (name)
4. สร้าง id สำหรับแต่ละเมนู เช่น "menu_1", "menu_2"
5. ในบางวันจะมีเมนูผัดหอยลาย เผา/เทียม ให้แยกเป็น 2 เมนู เช่น ผัดหอยลาย (เผา) และ ผัดหอยลาย (กระเทียม)
${ORDER_RULES}`;
}

function buildSubsequentPagePrompt(
  menus: MenuRef[],
): string {
  const menuList = menus
    .map((m) => `- ${m.id}: ${m.name} (${m.price} บาท)`)
    .join("\n");

  return `${SHARED_INTRO}

[เมนูที่ใช้ (จากหน้าแรก)] ใช้ menuId ตามรายการนี้เท่านั้น:
${menuList}
${ORDER_RULES}`;
}

async function processFirstPage(
  ai: GoogleGenAI,
  model: string,
  filePart: Part,
): Promise<FirstPageResult> {
  const response = await ai.models.generateContent({
    model,
    contents: createUserContent([buildFirstPagePrompt(), filePart]),
    config: {
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
): Promise<{ orders: GeminiOrder[] }> {
  const response = await ai.models.generateContent({
    model,
    contents: createUserContent([buildSubsequentPagePrompt(menus), filePart]),
    config: {
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

    const { provider: providerFromDb, model, subModel } =
      await getOrCreateGeminiSettings();
    const { ai, buildFileParts, provider } = getGeminiProvider({
      providerOverride: providerFromDb,
    });
    const subsequentModel = subModel || model;

    const [firstFilePart] = await buildFileParts([files[0]]);
    console.log("[LOG]: First image uploaded", {
      provider,
      model,
      subsequentModel,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (text: string) =>
          controller.enqueue(encoder.encode(text));

        try {
          send(
            `PROGRESS:กำลังประมวลผลหน้า 1 จาก ${files.length} หน้า (เมนู + ออเดอร์)...\n`,
          );
          console.log(
            `[Start] Page 1 at: ${new Date().toLocaleTimeString()}`,
          );

          const remainingUploadPromise =
            files.length > 1
              ? buildFileParts(files.slice(1))
              : Promise.resolve([]);

          const firstPageResult = await processFirstPage(
            ai,
            model,
            firstFilePart,
          );
          send(
            `PROGRESS:หน้า 1 เสร็จสิ้น — พบ ${firstPageResult.menus.length} เมนู, ${firstPageResult.orders.length} ออเดอร์\n`,
          );
          send(`FIRST_PAGE:${JSON.stringify(firstPageResult)}\n`);
          console.log(`[Done] Page 1 at: ${new Date().toLocaleTimeString()}`);

          const remainingFileParts = await remainingUploadPromise;

          if (remainingFileParts.length > 0) {
            send(
              `PROGRESS:กำลังประมวลผลหน้า 2-${files.length} พร้อมกัน (${remainingFileParts.length} หน้า)...\n`,
            );
            console.log(
              `[Start] Pages 2-${files.length} at: ${new Date().toLocaleTimeString()}`,
            );

            const menuRefs: MenuRef[] = firstPageResult.menus.map((m) => ({
              id: m.id,
              name: m.name,
              price: m.price,
            }));

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
