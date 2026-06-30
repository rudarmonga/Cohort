"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, clearUser } from "@/store/authSlice";

interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  profilePicture: string | null;
}

export default function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: AuthUser | null;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (initialUser) {
      dispatch(setUser(initialUser));
    } else {
      dispatch(clearUser());
    }
  }, [dispatch, initialUser]);

  return <>{children}</>;
}