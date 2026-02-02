import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מערכת כתיבת ספר - משיאים",
  description: "כלי לכתיבה ועריכה של ספרים וחוברות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
