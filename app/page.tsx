import { SectionCards } from "@/components/section-cards";
import { columns, Payment } from "./columns";
import { DataTable } from "./data-table";

import menu from "./data.json";

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ];
}

const IndexPage = async () => {
  const data = await getData();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards data={menu} />
          {/* <div className="px-4 lg:px-6"><ChartAreaInteractive /></div> */}
          <DataTable columns={columns} data={data} />
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
