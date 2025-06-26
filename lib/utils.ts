import { Menu, Order } from "@/app/generated/prisma";
import { useDateStore } from "@/hooks/use-date";
import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const fetcher = (url: string) => fetch(url).then((r) => r.json());

export async function getOrderData(date: Date | undefined) {
  const API_URL = `/api/order?date=${date?.toISOString()}`;

  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    // Axios errors have a specific structure
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(
          "API Error (Response):",
          error.response.status,
          error.response.data,
        );
        throw new Error(
          `API Error: ${error.response.status} - ${JSON.stringify(
            error.response.data || error.message,
          )}`,
        );
      } else if (error.request) {
        console.error("API Error (No Response):", error.request);
        throw new Error("Network Error: No response received from server.");
      } else {
        console.error("API Error (Request Setup):", error.message);
        throw new Error(`Request Error: ${error.message}`);
      }
    } else {
      console.error("Unknown Error during API call:", error);
      throw new Error(
        `An unexpected error occurred: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

export function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
