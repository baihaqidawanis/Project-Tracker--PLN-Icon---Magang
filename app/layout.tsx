import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLN Icon Plus - Project Tracker",
  description: "Partnership Project Tracker System",
  icons: {
    icon: '/image.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}