import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "KOU Logistics Command Center",
    description: "Advanced Cargo Management & Optimization System",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-white selection:bg-cyan-500/30">
                    {children}
                </div>
            </body>
        </html>
    );
}
