import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { onest } from "@/lib/fonts";
import { Toaster } from "sonner";
import { Providers } from "@/app/providers";
import { getFaviconMetadata, getRequestHost } from "@/lib/favicon";
import { fetchTenantBrandingContext } from "@/lib/server-favicon";

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://deliveryway.dcodax.co",
);
const siteTitle = "DeliveryWay | Frische Essenslieferung";
const siteDescription =
  "Bestellen Sie mit DeliveryWay frische Gerichte bei Ihrem Restaurant vor Ort. Entdecken Sie Angebote, Favoriten, Lieferung, Abholung, Reservierungen und Geschenkkarten.";

const baseMetadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteTitle,
    template: "%s | DeliveryWay",
  },
  description: siteDescription,
  applicationName: "DeliveryWay",
  keywords: [
    "DeliveryWay",
    "Essenslieferung",
    "Restaurant-Lieferservice",
    "Abholung",
    "Essen online bestellen",
    "Restaurantangebote",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DeliveryWay",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Vorschau des DeliveryWay-Lieferservices",
      },
    ],
    locale: "de_DE",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = getRequestHost(requestHeaders);
  const context = await fetchTenantBrandingContext(host);

  return {
    ...baseMetadata,
    icons: getFaviconMetadata(context?.brandingVersion),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={`${onest.className} ${onest.variable}`}>
        <Providers>
          <Toaster position="top-right" richColors />

          {children}
        </Providers>
      </body>
    </html>
  );
}
