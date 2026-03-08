import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { customerNames } from "@/lib/customerNames";
import { responseSchema } from "@/lib/gemini-response-type";
import { ApiResponse, GeminiResponse } from "@/app/types/gemini";

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

    const imageParts = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        return {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        };
      }),
    );

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

    [ส่วนของ ออเดอร์ (orders) - การจัดเรียงและรายละเอียดอื่นๆ]
    1. การระวังบรรทัด (สำคัญ): ตารางในภาพไม่ได้ตีเส้นบรรทัดชัดเจน ให้คุณกวาดสายตาจากซ้ายไปขวาอย่างระมัดระวัง เพื่อไม่ให้ตัวเลขสั่งอาหารสลับบรรทัดกัน
    2. การจัดลำดับ (sortOrder): ให้รันเลข 1, 2, 3... ตามลำดับบรรทัดจากบนลงล่าง
    3. การส่ง (delivery): หากมีเครื่องหมายติ๊กถูก (/) อยู่บริเวณชื่อลูกค้า ให้ตั้งค่าเป็น true หากไม่มีเป็น false
    4. การชำระเงิน (payment): หากมีคำว่า "โอนแล้ว" เขียนอยู่ในแถวนั้น ให้ตั้งค่าเป็น "ONLINE" หากไม่มีให้ตั้งเป็น "UNKNOWN"
    5. หมายเหตุ (note): หากมีคำอธิบายพิเศษเช่น "แยกน้ำ" ให้ใส่ใน note หากไม่มีให้ปล่อยว่างหรือ null
    6. ให้สร้าง "id" ของออเดอร์ เช่น "order_1", "order_2"

    [ส่วนของ รายการที่สั่ง (orderItems)]
    1. ให้ใช้ "menuId" ให้ตรงกับ "id" ที่คุณสร้างไว้ในส่วนของ menus 
    2. ให้ใส่เฉพาะเมนูที่ลูกค้าสั่ง (จำนวนมากกว่า 0) เท่านั้น`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: createUserContent([prompt, ...imageParts]),
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (!response.text) {
      throw new Error("AI returned an empty response");
    }
    const result = JSON.parse(response.text) as GeminiResponse;
    return NextResponse.json<ApiResponse>(
      { success: true, data: result },
      { status: 200 },
    );
  } catch (error) {
    console.error(error); // Log the error for server-side debugging

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
