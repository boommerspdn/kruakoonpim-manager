import { CreditCard, PiggyBank } from "lucide-react";
import { Separator } from "./ui/separator";
import {
  IconCash,
  IconCreditCardOff,
  IconCreditCardPay,
} from "@tabler/icons-react";

const FinancialItem = ({
  children,
  title,
  value,
  hideSeparator,
}: {
  children?: React.ReactNode;
  title: string;
  value: string;
  hideSeparator?: Boolean;
}) => {
  return (
    <div className="flex justify-center gap-4">
      {children}
      <div className="flex flex-col text-end">
        <span className="text-muted-foreground">{title}</span>
        <span className="text-4xl font-medium">{value}</span>
      </div>
      <Separator
        orientation="vertical"
        className={`ms-6 ${hideSeparator && "hidden"}`}
      />
    </div>
  );
};

const FinancialSection = () => {
  return (
    <div className="grid grid-cols-4 gap-4 border shadow-md rounded-2xl py-6">
      <FinancialItem title="ยอดเงินรวม" value="฿4,415">
        <PiggyBank className="h-full w-[70px] text-primary" />
      </FinancialItem>
      <FinancialItem title="เงินสด" value="฿4,415">
        <IconCash className="h-full w-[70px] text-primary" />
      </FinancialItem>
      <FinancialItem title="โอน" value="฿4,415">
        <IconCreditCardPay className="h-full w-[70px] text-primary" />
      </FinancialItem>
      <FinancialItem
        title="ไม่ได้จ่ายหน้าร้าน"
        value="฿4,415"
        hideSeparator={true}
      >
        <IconCreditCardOff className="h-full w-[70px] text-primary" />
      </FinancialItem>
    </div>
  );
};

export default FinancialSection;
