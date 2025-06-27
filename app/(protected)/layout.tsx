import { SiteHeader } from "@/components/site-header";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("start");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (data) console.log("finished");
  if (error || !data?.user) {
    redirect("/login");
  }
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
