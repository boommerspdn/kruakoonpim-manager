import { Customer } from "@/app/types/customer";
import { formatOrderPrefix, getRawName } from "./utils";
import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";

type StoreMenuOrder = {
  menus: StoreMenu[];
  orders: StoreOrder[];
};

export const matchAiNamesWithCustomers = (
  customers: Customer[],
  aiDetectedNames: string[],
): Map<string, string[]> => {
  const matchMap = new Map<string, string[]>();

  for (const aiName of aiDetectedNames) {
    const matchesForThisAiName: string[] = [];
    const rawAiName = getRawName(aiName).toLowerCase();

    for (const customer of customers) {
      const isAliasMatch = customer.aliases.some(
        (alias) => getRawName(alias).toLowerCase() === rawAiName,
      );

      const rawDbName = getRawName(customer.name).toLowerCase();
      const isNameMatch = rawDbName === rawAiName;

      if (isAliasMatch || isNameMatch) {
        matchesForThisAiName.push(customer.name);
      }
    }

    matchMap.set(aiName, matchesForThisAiName);
  }

  return matchMap;
};

export const matchRawNames = (
  customers: Customer[],
  menusOrders: StoreMenuOrder,
): StoreMenuOrder => {
  const formattedData: StoreMenuOrder = {
    ...menusOrders,
    orders: menusOrders.orders.map((order) => {
      const rawAiName = getRawName(order.customerName).toLowerCase();

      const foundCustomer = customers.find((customer) => {
        const rawDbName = getRawName(customer.name).toLowerCase();
        const isNameMatch = rawDbName === rawAiName;

        return isNameMatch;
      });

      const finalName = foundCustomer ? foundCustomer.name : order.customerName;

      return {
        ...order,
        customerName: formatOrderPrefix(finalName),
        inputName: formatOrderPrefix(finalName),
      };
    }),
  };

  return formattedData;
};
