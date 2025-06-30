import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-[120px] w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-[295px]" />
        <Skeleton className="h-[295px]" />
        <Skeleton className="h-[295px]" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-[200px] rounded-xl" />
        <Skeleton className="h-8 w-[90px] rounded-xl" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-8 w-[430px] rounded-xl" />
        <Skeleton className="h-8 w-[460px] rounded-xl" />
      </div>
      <Skeleton className="h-[70vh] w-full rounded-xl" />
    </div>
  );
};

export default Loading;
