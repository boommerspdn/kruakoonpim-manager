import { responseSchema } from "@/lib/gemini-response-type";
import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      throw new Error("No files found");
    }

    const limitInBytes = 20 * 1024 * 1024;

    const totalSize = files.reduce((acc, file) => {
      return acc + file.size;
    }, 0);

    if (totalSize > limitInBytes) {
      throw new Error("files size combined are too large");
    }

    const uploadPromises = files.map(async (file) => {
      return ai.files.upload({
        file: file,
        config: {
          displayName: file.name,
          mimeType: file.type,
        },
      });
    });
    const uploadedFiles = await Promise.all(uploadPromises);
    const fileParts = uploadedFiles.map((file) =>
      createPartFromUri(file.uri as string, file.mimeType as string),
    );
    console.log("[LOG]: Upload completed");

    const prompt = `คุณคือผู้เชี่ยวชาญด้าน OCR (Optical Character Recognition) หน้าที่ของคุณคือแกะตัวหนังสือจากตารางจดออเดอร์อาหารและแปลงเป็น JSON 
    กฎการอ่านและสกัดข้อมูล (สำคัญมาก ห้ามเดาข้อมูลเด็ดขาด):

    [ส่วนของ เมนู (menus)]
    1. แถวบนสุดคือ "ราคา" (price) เช่น 50, 40, 200
    2. แถวที่สองคือ "ยอดคงเหลือ" (amount) ให้ยึดตัวเลขที่มากที่สุดในหน้าแรกเป็นหลัก
    3. แถวที่สามคือ "ชื่อเมนู" (name) เช่น ต้มยำไก่, แกงหมูฟักทอง
    4. ให้สร้าง "id" สำหรับแต่ละเมนู เช่น "menu_1", "menu_2" เพื่อนำไปใช้อ้างอิง

    [ส่วนของ ออเดอร์ (orders) - การอ่านชื่อลูกค้า]
    1. คอลัมน์แรกสุดคือ "ชื่อลูกค้า" (customerName) ให้อ่านและสะกดตัวอักษร "ตามที่คุณเห็นในภาพแบบเป๊ะๆ"
    2. ห้ามเดาชื่อจากบริบท: ห้ามแปลงชื่อ ห้ามพยายามทำให้เป็นคำที่มีความหมาย หากลายมือตวัดหรืออ่านยาก ให้พยายามแกะทีละตัวอักษรตามรูปร่างที่เห็น
    3. การแยกชื่อและยอดรวม: ชื่อลูกค้าและยอดรวมจะอยู่ติดกัน (เช่น "โอ๊ค 150" หรือ "P'อ๊อด 200") ให้สกัดเฉพาะส่วนที่เป็น "ชื่อ" ออกมา และตัดตัวเลขด้านหลังทิ้งไป
    4. หากมีการขีดค่าชื่อและจำนวนสั่งซื้อ(line through) ให้ปล่อยไว้ไม่ต้องสนใจ

    [ส่วนของ ออเดอร์ (orders) - การจัดเรียงและรายละเอียดอื่นๆ]
    1. การระวังบรรทัด (สำคัญ): ตารางในภาพไม่ได้ตีเส้นบรรทัดชัดเจน ให้คุณกวาดสายตาจากซ้ายไปขวาอย่างระมัดระวัง เพื่อไม่ให้ตัวเลขสั่งอาหารสลับบรรทัดกัน
    2. การจัดลำดับ (sortOrder): ให้รันเลข 1, 2, 3... ตามลำดับบรรทัดจากบนลงล่าง
    3. การส่ง (delivery): หากมีเครื่องหมายติ๊กถูก (/) อยู่บริเวณชื่อลูกค้า ให้ตั้งค่าเป็น true หากไม่มีเป็น false
    4. การชำระเงิน (payment): หากมีคำว่า "โอนแล้ว" เขียนอยู่ในแถวนั้น ให้ตั้งค่าเป็น "ONLINE" หากไม่มีให้ตั้งเป็น "UNKNOWN"
    5. หมายเหตุ (note): หากมีคำอธิบายพิเศษเช่น "แยกน้ำ" ให้ใส่ใน note หากไม่มีให้ปล่อยว่างหรือ null
    6. ให้สร้าง "id" ของออเดอร์ เช่น "order_1", "order_2"
    7. ในบางวันจะมีเมนูผัดหอยลาย เผา/เทียม ให้แยกออกต่างหากเป็น 2 เมนู เช่น ผัดหอยลาย (เผา) และ ผัดหอยลาย (กระเทียม)

    [ส่วนของ รายการที่สั่ง (orderItems)]
    1. ให้ใช้ "menuId" ให้ตรงกับ "id" ที่คุณสร้างไว้ในส่วนของ menus 
    2. ให้ใส่เฉพาะเมนูที่ลูกค้าสั่ง (จำนวนมากกว่า 0) เท่านั้น`;

    console.log(
      `[Start] Request initiated at: ${new Date().toLocaleTimeString()}`,
    );
    const response = await ai.models.generateContentStream({
      model: "gemini-3.1-pro-preview",
      contents: createUserContent([prompt, ...fileParts]),
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const content = chunk.text;
            console.log(content);
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
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
