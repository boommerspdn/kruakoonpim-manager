import { Financial } from "@/app/api/dashboard/route";
import {
  IconCash,
  IconCreditCardOff,
  IconCreditCardPay,
} from "@tabler/icons-react";
import { PiggyBank } from "lucide-react";
import { Separator } from "./ui/separator";

type FinancialSectionProps = {
  data: Financial | undefined;
};

const FinancialItem = ({
  children,
  title,
  value,
  hideSeparator,
}: {
  children?: React.ReactNode;
  title: string;
  value: string;
  hideSeparator?: boolean;
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

const FinancialSection = ({ data }: FinancialSectionProps) => {
  return (
    <div className="grid grid-cols-4 gap-4 border shadow-md rounded-2xl py-6">
      <FinancialItem title="ยอดขายวันนี้" value={`฿${data?.total}`}>
        <PiggyBank className="h-full w-[70px] text-primary" />
      </FinancialItem>
      <FinancialItem title="เงินสด" value={`฿${data?.cash}`}>
        <IconCash className="h-full w-[70px] text-primary" />
      </FinancialItem>
      <FinancialItem title="โอน" value={`฿${data?.online}`}>
        <IconCreditCardPay className="h-full w-[70px] text-primary" />
      </FinancialItem>
      <FinancialItem
        title="ไม่ได้จ่ายหน้าร้าน"
        value={`฿${data?.unknown}`}
        hideSeparator={true}
      >
        <IconCreditCardOff className="h-full w-[70px] text-primary" />
      </FinancialItem>
    </div>
  );
};

export default FinancialSection;
