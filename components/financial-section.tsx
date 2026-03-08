import { PaymentStatus } from "@/app/types/dashboard";
import {
  IconCash,
  IconCreditCardOff,
  IconCreditCardPay,
} from "@tabler/icons-react";
import { PiggyBank } from "lucide-react";

type FinancialSectionProps = {
  data: PaymentStatus | undefined;
};

const FinancialItem = ({
  children,
  title,
  value,
}: {
  children?: React.ReactNode;
  title: string;
  value: string;
}) => {
  return (
    <div className="grid grid-cols-6 gap-4 items-center content-center">
      <div className="col-span-2 xl:col-span-2 self-center 2xl:p-4">
        {children}
      </div>
      <div className="flex flex-col text-start md:text-end col-span-4 xl:col-span-4 items-center md:items-start md:border-e">
        <span className="text-muted-foreground text-nowrap">{title}</span>
        <span className="text-4xl font-medium">{value}</span>
      </div>
    </div>
  );
};

const FinancialSection = ({ data }: FinancialSectionProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 md:gap-4 border shadow-md rounded-2xl md:py-6 2xl:p-2 p-3">
      <FinancialItem title="ยอดขายวันนี้" value={`฿${data?.total}`}>
        <PiggyBank className="w-full h-auto text-primary" />
      </FinancialItem>
      <FinancialItem title="เงินสด" value={`฿${data?.cash}`}>
        <IconCash className="w-full h-auto text-primary" />
      </FinancialItem>
      <FinancialItem title="โอน" value={`฿${data?.online}`}>
        <IconCreditCardPay className="w-full h-auto text-primary" />
      </FinancialItem>
      <FinancialItem title="ไม่ได้จ่ายหน้าร้าน" value={`฿${data?.unknown}`}>
        <IconCreditCardOff className="w-full h-auto text-primary" />
      </FinancialItem>
    </div>
  );
};

export default FinancialSection;
