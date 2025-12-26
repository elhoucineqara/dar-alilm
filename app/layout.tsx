import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dar Al-Ilm - Online Learning Platform",
  description: "Learn at your own pace with Dar Al-Ilm. Access hundreds of courses created by experts.",
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: "Dar Al-Ilm - Transform Your Learning Journey",
    description: "Discover thousands of expert-led courses designed to help you master new skills, advance your career, and achieve your learning goals.",
    url: "https://dar-alilm.vercel.app",
    siteName: "Dar Al-Ilm",
    images: [
      {
        url: "https://dar-alilm.vercel.app/api/og?title=Dar%20Al-Ilm&description=Transform%20Your%20Learning%20Journey",
        width: 1200,
        height: 630,
        alt: "Dar Al-Ilm - Online Learning Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dar Al-Ilm - Transform Your Learning Journey",
    description: "Discover thousands of expert-led courses designed to help you master new skills, advance your career, and achieve your learning goals.",
    images: ["https://dar-alilm.vercel.app/api/og?title=Dar%20Al-Ilm&description=Transform%20Your%20Learning%20Journey"],
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
