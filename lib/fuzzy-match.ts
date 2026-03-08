import stringSimilarity from "string-similarity";
import { Customer } from "@/app/types/customer";

const normalizeName = (name: string) =>
  name.replace(/[\s.']/g, "").toLowerCase();

export type MatchResult = {
  suggestedCustomer: Customer | null;
  confidence: number;
  isExactMatch: boolean;
};

export function findBestCustomerMatch(
  aiName: string,
  customers: Customer[],
  threshold = 0.5,
): MatchResult {
  if (!aiName || !customers.length) {
    return { suggestedCustomer: null, confidence: 0, isExactMatch: false };
  }

  const cleanAiName = normalizeName(aiName);
  const nameToCustomerMap = new Map<string, Customer>();
  const allCleanNames: string[] = [];

  for (const customer of customers) {
    const names = [customer.name, ...customer.aliases];

    for (const name of names) {
      const cleanName = normalizeName(name);
      allCleanNames.push(cleanName);
      nameToCustomerMap.set(cleanName, customer);
    }
  }

  const { bestMatch } = stringSimilarity.findBestMatch(
    cleanAiName,
    allCleanNames,
  );

  return {
    suggestedCustomer:
      bestMatch.rating >= threshold
        ? nameToCustomerMap.get(bestMatch.target) || null
        : null,
    confidence: bestMatch.rating,
    isExactMatch: bestMatch.rating > 0.9,
  };
}
