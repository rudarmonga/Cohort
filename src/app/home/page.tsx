"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function HomePage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("alreadyLoggedIn")) {
      toast("You're already logged in 👀");
    }
  }, [searchParams]);

  return <div>Home Page</div>;
}