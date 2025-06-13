import { SectionCards } from "@/components/section-cards";
import { DataTable } from "./data-table";

import menu from "./data.json";
import data from "./xd-data.json";

const IndexPage = () => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards data={menu} />
          {/* <div className="px-4 lg:px-6"><ChartAreaInteractive /></div> */}
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
