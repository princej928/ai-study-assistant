import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#b45309",
          colorBackground: "#fcfaf7",
          colorInputBackground: "#f8f2e8",
          colorInputText: "#1c1917",
          colorText: "#1c1917",
          colorTextSecondary: "#78716c",
          colorNeutral: "#d6d3d1",
          borderRadius: "1rem",
        },
        elements: {
          formButtonPrimary:
            "bg-stone-900 text-white shadow-[0_16px_40px_rgba(28,25,23,0.18)] hover:bg-stone-800 transition rounded-2xl",
          card: "shadow-none",
          socialButtonsBlockButton:
            "rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
          socialButtonsBlockButtonText: "font-medium",
          formFieldInput:
            "rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-600 focus:ring-amber-600",
          formFieldLabel: "text-stone-700 font-medium",
          footerActionLink: "text-amber-700 hover:text-amber-800 font-semibold",
          identityPreviewText: "text-stone-700",
          formResendCodeLink: "text-amber-700 hover:text-amber-800",
          otpCodeFieldInput:
            "rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-600",
          alertText: "text-sm",
        },
      }}
    >
      <html lang="en">
        <body className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
