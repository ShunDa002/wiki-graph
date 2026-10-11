import type { Metadata } from "next";
import React from "react";
import "./globals.css";

import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "LLM Wiki Graph - Interactive Knowledge Base Graph View",
  description: "Explore the connections and concepts across the LLM Wiki knowledge base with interactive React Flow graph visualization.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0d14] text-neutral-100 antialiased overflow-hidden font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
