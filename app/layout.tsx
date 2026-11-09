import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "../lib/site";
import "./globals.css";

const title = "DevStudy — JavaScript Coding Challenges and Study Tools";
const description =
  "Practice JavaScript with 100 coding challenges, automated tests, and 50 study tools. Solve development tickets and track your progress.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DevStudy",
    title,
    description,
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
