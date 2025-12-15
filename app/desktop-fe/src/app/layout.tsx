import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai_Looped } from "next/font/google";
import "@scss/global.scss";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { I18nProvider } from "@/lib/i18n";
import LanguageSwitcher from "@/components/language-switcher";

const inter = Inter({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

const notoSansThaiLooped = Noto_Sans_Thai_Looped({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "latin-ext", "thai"],
  variable: "--font-noto-sans-thai-looped",
});

export const metadata: Metadata = {
  title: "Invento - Desktop Inventory Manager",
  description: "Powerered by KruPaul",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSansThaiLooped.variable}`}>
        <I18nProvider>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: 12 }}>
            <LanguageSwitcher />
          </div>
          <AuthProvider>
            <SupabaseProvider>{children}</SupabaseProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
