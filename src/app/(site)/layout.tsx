import "../globals.css";
import { Footer } from "@/components/layout/footer/Footer";
import { SiteFloatingCart } from "@/components/layout/cart/SiteFloatingCart";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { StorefrontLoadingGate } from "@/components/layout/StorefrontLoadingGate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StorefrontLoadingGate>
      <Navbar />
      {children}
      <SiteFloatingCart />
      <Footer />
    </StorefrontLoadingGate>
  );
}
