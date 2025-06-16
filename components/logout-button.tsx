"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Button
      onClick={logout}
      className="place-self-end"
      variant={"outline"}
      size={"icon"}
    >
      <IconLogout />
    </Button>
  );
}
