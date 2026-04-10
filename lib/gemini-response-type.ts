import { Type } from "@google/genai";

const orderItemSchema = {
  type: Type.OBJECT,
  properties: {
    menuId: {
      type: Type.STRING,
      description: "ต้องตรงกับ id ใน array ของ menus",
    },
    amount: { type: Type.INTEGER, description: "จำนวนที่สั่ง" },
  },
  required: ["menuId", "amount"],
};

const orderSchema = {
  type: Type.OBJECT,
  properties: {
    customerName: {
      type: Type.STRING,
      description: "ชื่อลูกค้า (ไม่รวมยอดรวม หรือสัญลักษณ์อื่น)",
    },
    note: {
      type: Type.STRING,
      description:
        "หมายเหตุของเมนูนี้ (ถ้ามีหลายโน้ตในช่องเดียวให้คั่นด้วย ,)",
      nullable: true,
    },
    delivery: {
      type: Type.BOOLEAN,
      description:
        "เป็น true หากมีเครื่องหมายติ๊กถูก (/) อยู่ข้างชื่อ หรือในบรรทัดนั้น",
    },
    payment: {
      type: Type.STRING,
      nullable: true,
      enum: ["ONLINE"],
      description:
        "สถานะการจ่ายเงิน: คืนค่า 'ONLINE' เฉพาะเมื่อพบคำว่า 'โอนแล้ว' ในข้อมูลต้นทาง เท่านั้น",
    },
    orderItems: {
      type: Type.ARRAY,
      description:
        "รายการเมนูที่ลูกค้ารายนี้สั่ง (เฉพาะเมนูที่จำนวนมากกว่า 0)",
      items: orderItemSchema,
    },
  },
  required: ["customerName", "delivery", "payment", "orderItems"],
};

export const responseSchema = {
  type: Type.OBJECT,
  properties: {
    menus: {
      type: Type.ARRAY,
      description: "รายการเมนูอาหารทั้งหมดในภาพ",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "ID ของเมนู เช่น 'menu_1', 'menu_2' (ต้องไม่ซ้ำกัน)",
          },
          name: { type: Type.STRING, description: "ชื่อเมนู" },
          price: { type: Type.INTEGER, description: "ราคา" },
          amount: {
            type: Type.INTEGER,
            description: "ยอดคงเหลือในหน้าแรกสุด (ตัวเลขใต้ราคา)",
          },
        },
        required: ["id", "name", "price", "amount"],
      },
    },
    orders: {
      type: Type.ARRAY,
      description: "รายการสั่งซื้อของลูกค้าแต่ละคนเรียงตามลำดับในภาพ",
      items: orderSchema,
    },
  },
  required: ["menus", "orders"],
};

export const ordersOnlyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    orders: {
      type: Type.ARRAY,
      description: "รายการสั่งซื้อของลูกค้าแต่ละคนเรียงตามลำดับในภาพ",
      items: orderSchema,
    },
  },
  required: ["orders"],
};
