// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ReduxProvider } from "@/components/layout/ReduxProvider";
import AuthProvider from "@/components/layout/authProvider";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "COHORT — Collaborate on What Matters",
  description:
    "Create, discover, and join collaborative projects with developers, designers, and founders.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getCurrentUser();

  const initialUser = payload
    ? await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          profilePicture: true,
        },
      })
    : null;

  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <AuthProvider initialUser={initialUser}>
            {children}
          </AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1e1e35",
                color: "#e2e8f0",
                border: "1px solid #2a2a4a",
                borderRadius: "10px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#6171f2", secondary: "#1e1e35" },
              },
              error: {
                iconTheme: { primary: "#f87171", secondary: "#1e1e35" },
              },
            }}
          />
        </ReduxProvider>
      </body>
    </html>
  );
}
