import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const Loading = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <section className="space-y-4 px-2">
        {/* หัวข้อ */}
        <div className="flex items-center gap-2 px-4 pt-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-[140px]" />
        </div>

        <div className="rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-slate-50/50">
              <tr>
                <th className="p-4 w-[40%]">
                  <Skeleton className="h-4 w-[60px]" />
                </th>
                <th className="p-4 w-[25%]">
                  <Skeleton className="h-4 w-[50px]" />
                </th>
                <th className="p-4 w-[25%]">
                  <Skeleton className="h-4 w-[50px]" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 px-2 mt-8">
        {/* หัวข้อ */}
        <div className="flex items-center gap-2 px-4 pt-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-[180px]" />
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden px-4 grid gap-4 py-4">
          {[1, 2].map((index) => (
            <div key={index}>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4 md:py-4">
                <div>
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="space-y-3 pt-2">
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-4 w-[60%]" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-[60px] w-full rounded-md" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-[60px] w-full rounded-md" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-[60px] w-full rounded-md" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-[60px] w-full rounded-md" />
                </div>
              </div>

              {index !== 2 && <Separator className="mt-2" />}
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end py-6 px-2">
        <Skeleton className="h-10 w-[140px] rounded-md" />
      </div>
    </div>
  );
};

export default Loading;
