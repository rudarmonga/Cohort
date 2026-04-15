"use client";

import { Provider, useDispatch } from "react-redux";
import { store, AppDispatch } from "@/store/store";
import { useEffect } from "react";
import { getCurrentUser } from "@/store/authSlice";

function InitUser({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <InitUser>{children}</InitUser>
    </Provider>
  );
}