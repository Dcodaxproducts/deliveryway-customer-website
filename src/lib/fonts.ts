import localFont from "next/font/local";

export const onest = localFont({
  src: "./fonts/onest-latin.woff2",
  weight: "400 900",
  display: "swap",
  variable: "--font-onest",
});

export const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-400.woff2", weight: "400" },
    { path: "./fonts/poppins-latin-500.woff2", weight: "500" },
    { path: "./fonts/poppins-latin-600.woff2", weight: "600" },
    { path: "./fonts/poppins-latin-700.woff2", weight: "700" },
  ],
  display: "swap",
});

export const roboto = localFont({
  src: [
    { path: "./fonts/roboto-latin.woff2", weight: "400" },
    { path: "./fonts/roboto-latin.woff2", weight: "500" },
    { path: "./fonts/roboto-latin.woff2", weight: "700" },
  ],
  display: "swap",
});
