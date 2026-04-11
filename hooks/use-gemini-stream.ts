import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";
import { formatOrderPrefix } from "@/lib/utils";
import { create } from "zustand";

type GeminiStreamState = {
  menus: StoreMenu[];
  ordersByPage: Record<number, StoreOrder[]>;
  totalPages: number;
  isStreaming: boolean;
  progressMessages: string[];
  error: string | null;
  firstPageReady: boolean;
  allPagesReady: boolean;
};

type GeminiStreamActions = {
  startUpload: (files: File[]) => void;
  reset: () => void;
};

type RawOrder = {
  customerName: string;
  delivery: boolean;
  note?: string | null;
  payment: string | null;
  orderItems: { menuId: string; amount: number }[];
};

function formatRawOrders(
  raw: RawOrder[],
  pageNumber: number,
): StoreOrder[] {
  return raw.map((o, i) => ({
    id: `order_p${pageNumber}_${i + 1}`,
    customerName: formatOrderPrefix(o.customerName),
    inputName: formatOrderPrefix(o.customerName),
    delivery: o.delivery,
    note: o.note ?? null,
    payment: o.payment as StoreOrder["payment"],
    orderItems: o.orderItems,
    sortOrder: 0,
    pageNumber,
  }));
}

function recalculateOrderMeta(
  ordersByPage: Record<number, StoreOrder[]>,
): Record<number, StoreOrder[]> {
  const result: Record<number, StoreOrder[]> = {};
  let counter = 0;
  for (const pn of Object.keys(ordersByPage)
    .map(Number)
    .sort((a, b) => a - b)) {
    result[pn] = ordersByPage[pn].map((o, i) => ({
      ...o,
      id: `order_${counter + i + 1}`,
      sortOrder: counter + i + 1,
    }));
    counter += ordersByPage[pn].length;
  }
  return result;
}

function saveToSessionStorage(
  menus: StoreMenu[],
  ordersByPage: Record<number, StoreOrder[]>,
) {
  try {
    const allOrders: StoreOrder[] = [];
    for (const pn of Object.keys(ordersByPage)
      .map(Number)
      .sort((a, b) => a - b)) {
      allOrders.push(...ordersByPage[pn]);
    }
    sessionStorage.setItem(
      "geminiPreviewData",
      JSON.stringify({ menus, orders: allOrders }),
    );
  } catch {
    /* sessionStorage full or unavailable */
  }
}

const INITIAL: GeminiStreamState = {
  menus: [],
  ordersByPage: {},
  totalPages: 0,
  isStreaming: false,
  progressMessages: [],
  error: null,
  firstPageReady: false,
  allPagesReady: false,
};

export const useGeminiStream = create<GeminiStreamState & GeminiStreamActions>(
  (set, get) => ({
    ...INITIAL,

    startUpload: (files) => {
      set({
        ...INITIAL,
        totalPages: files.length,
        isStreaming: true,
        progressMessages: ["กำลังเริ่มต้นอัพโหลดรูปภาพ..."],
      });

      const formData = new FormData();
      files.forEach((img) => formData.append("images", img));

      (async () => {
        try {
          const res = await fetch("/api/gemini-upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const body = await res
              .json()
              .catch(() => ({ message: "Upload failed" }));
            throw new Error(body.message || "Upload failed");
          }

          set((s) => ({
            progressMessages: [
              ...s.progressMessages,
              "อัพโหลดรูปภาพเสร็จสิ้น!",
            ],
          }));

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response stream");

          const decoder = new TextDecoder();
          let buf = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";

            for (const raw of lines) {
              const line = raw.trim();
              if (!line) continue;

              if (line.startsWith("PROGRESS:")) {
                set((s) => ({
                  progressMessages: [...s.progressMessages, line.slice(9)],
                }));
              } else if (line.startsWith("FIRST_PAGE:")) {
                const data = JSON.parse(line.slice(11));
                const orders = formatRawOrders(data.orders, 1);

                set((s) => {
                  const newOrdersByPage = recalculateOrderMeta({
                    ...s.ordersByPage,
                    1: orders,
                  });
                  return {
                    menus: data.menus,
                    ordersByPage: newOrdersByPage,
                    firstPageReady: true,
                  };
                });
                const st = get();
                saveToSessionStorage(st.menus, st.ordersByPage);
              } else if (line.startsWith("PAGE:")) {
                const idx = line.indexOf(":", 5);
                if (idx === -1) continue;
                const pn = parseInt(line.slice(5, idx), 10);
                const data = JSON.parse(line.slice(idx + 1));
                const orders = formatRawOrders(data.orders, pn);

                set((s) => {
                  const newOrdersByPage = recalculateOrderMeta({
                    ...s.ordersByPage,
                    [pn]: orders,
                  });
                  return { ordersByPage: newOrdersByPage };
                });
                const st = get();
                saveToSessionStorage(st.menus, st.ordersByPage);
              } else if (line.startsWith("PAGE_ERROR:")) {
                const idx = line.indexOf(":", 11);
                if (idx === -1) continue;
                const pn = parseInt(line.slice(11, idx), 10);
                const msg = line.slice(idx + 1);
                console.error(`Page ${pn} failed: ${msg}`);
                set((s) => ({
                  progressMessages: [
                    ...s.progressMessages,
                    `หน้า ${pn} ล้มเหลว: ${msg}`,
                  ],
                }));
              } else if (line === "DONE") {
                set({ allPagesReady: true, isStreaming: false });
                const st = get();
                saveToSessionStorage(st.menus, st.ordersByPage);
              }
            }
          }

          if (buf.trim() === "DONE") {
            set({ allPagesReady: true, isStreaming: false });
          }

          if (!get().allPagesReady) {
            set({ allPagesReady: true, isStreaming: false });
            const st = get();
            saveToSessionStorage(st.menus, st.ordersByPage);
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
            isStreaming: false,
          });
        }
      })();
    },

    reset: () => set(INITIAL),
  }),
);
