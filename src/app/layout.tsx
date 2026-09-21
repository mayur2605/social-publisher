import type { Metadata } from "next";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
export const metadata: Metadata = {
  title: "Social Publisher",
  icons: { icon: "/favicon.svg" },
  description: "Your videos. Every channel. One publishing workspace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Theme
          accentColor="blue"
          grayColor="slate"
          radius="medium"
          appearance="light"
        >
          {children}
        </Theme>
      </body>
    </html>
  );
}
