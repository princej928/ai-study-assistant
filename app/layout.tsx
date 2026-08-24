import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-900">{children}</body></html>;
}
