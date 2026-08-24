"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  return <button onClick={async () => { await fetch("/api/auth/sign-out", { method: "POST" }); router.push("/sign-in"); router.refresh(); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Sign out</button>;
}
