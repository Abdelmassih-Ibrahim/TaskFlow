import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppNavigation } from "@/components/app-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow — Make space for meaningful work",
  description:
    "A thoughtful project and task management workspace. This preview uses demo data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppNavigation />
        {children}
      </body>
    </html>
  );
}
