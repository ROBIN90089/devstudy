import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "DevStudy — Build your skills",
  description:
    "100 coding challenges and 50 practical study tools. Learn by solving real development tickets.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
