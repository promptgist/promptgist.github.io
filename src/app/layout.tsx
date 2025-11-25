import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PromptGist",
  description: "A Markdown editor for creative writing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen flex-col`}>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-gray-100 p-4 dark:bg-gray-800">
            {/* Sidebar */}
            <p>Sidebar</p>
          </aside>
          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
        <footer className="bg-gray-200 p-2 text-center text-sm dark:bg-gray-700">
          {/* Status Bar */}
          <p>Status Bar</p>
        </footer>
      </body>
    </html>
  );
}
