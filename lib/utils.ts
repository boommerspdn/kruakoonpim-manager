import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import isEqual from "lodash/isEqual";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export async function getDashboardData(date: Date | undefined) {
  const API_URL = `/api/dashboard?date=${date?.toISOString()}`;

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

interface Identifiable {
  id: string; // Or number, depending on your database ID type
}

interface UpdatedItemPayload<T extends Identifiable> {
  id: string; // The ID of the item being updated
  changes: Partial<T>; // An object containing only the properties that have changed
}

interface DiffResult<T extends Identifiable> {
  toCreate: Omit<T, "id">[]; // New items won't have an ID yet
  toUpdate: UpdatedItemPayload<T>[]; // Array of partial update payloads
  toDeleteIds: string[]; // Only need the IDs for deletion
}

function getChangedFields<T extends Identifiable>(
  initial: T,
  submitted: T,
): Partial<T> | null {
  let hasChanges = false;
  const changedFields: Partial<T> = {};

  // Check properties present in submitted object
  for (const key in submitted) {
    if (Object.prototype.hasOwnProperty.call(submitted, key)) {
      // If property is new or value is different, add it to changedFields
      if (
        !Object.prototype.hasOwnProperty.call(initial, key) ||
        !isEqual(initial[key], submitted[key])
      ) {
        if (key !== "id") {
          // 'id' is used for identification, not considered a 'change' for the patch payload itself
          changedFields[key as keyof T] = submitted[key];
          hasChanges = true;
        }
      }
    }
  }

  return hasChanges ? changedFields : null;
}

export function easyDiff<T extends Identifiable>(
  initialArray: T[],
  submittedArray: T[],
): DiffResult<T> {
  const toCreate: Omit<T, "id">[] = [];
  const toUpdate: UpdatedItemPayload<T>[] = []; // Updated to hold partial payloads
  const toDeleteIds: string[] = [];

  // Create maps for efficient lookups
  const initialMap = new Map<string, T>(
    initialArray.map((item) => [item.id, item]),
  );

  submittedArray.forEach((submittedItem) => {
    const isNewClientSideItem =
      !submittedItem.id || !initialMap.has(submittedItem.id);

    if (isNewClientSideItem) {
      const newItem: Omit<T, "id"> = { ...submittedItem };
      if ("id" in newItem) {
        delete newItem.id;
      }
      toCreate.push(newItem);
    } else {
      const initialItem = initialMap.get(submittedItem.id);

      if (initialItem) {
        const changes = getChangedFields(initialItem, submittedItem);
        if (changes) {
          toUpdate.push({ id: submittedItem.id, changes: changes });
        }
      }
    }
  });

  // Find deletions
  initialArray.forEach((initialItem) => {
    // If an initial item's ID is not found in the submitted array, it's deleted
    const isDeleted = !submittedArray.some(
      (submittedItem) => submittedItem.id === initialItem.id,
    );
    if (isDeleted) {
      toDeleteIds.push(initialItem.id);
    }
  });

  return { toCreate, toUpdate, toDeleteIds };
}

export const formatOrderPrefix = (name: string) => {
  if (!name) return "";

  return name
    .trim()
    .replace(/^([PNK])[\s\.'"]*(\S)/i, (match, prefix, firstChar) => {
      return `${prefix.toUpperCase()}'${firstChar}`;
    });
};

export function getRawName(name: string): string {
  if (!name) return "";

  const prefixRegex = /^([pnkPNK]')(.+)$/;
  const match = name.trim().match(prefixRegex);

  if (match) {
    return match[2].trim();
  }

  return name.trim();
}
