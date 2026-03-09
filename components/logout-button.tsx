"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import axios from "axios";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await axios.post("/api/logout");

    router.push("/login");
  };

  return (
    <Button onClick={logout} variant={"outline"} size={"icon"}>
      <IconLogout />
    </Button>
  );
}
