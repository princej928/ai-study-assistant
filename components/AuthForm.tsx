"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setError(data.error || "Something went wrong.");
    router.push("/dashboard"); router.refresh();
  }

  return <form onSubmit={submit} className="space-y-4">
    {isSignUp && <label className="block text-sm font-medium text-stone-700">Name<input required name="name" className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-amber-600" /></label>}
    <label className="block text-sm font-medium text-stone-700">Email address<input required type="email" name="email" autoComplete="email" className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-amber-600" /></label>
    <label className="block text-sm font-medium text-stone-700">Password<input required type="password" name="password" minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-amber-600" /></label>
    {error && <p className="text-sm text-red-600">{error}</p>}
    <button disabled={loading} className="w-full rounded-2xl bg-stone-900 px-4 py-3 font-semibold text-white hover:bg-stone-800 disabled:opacity-60">{loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}</button>
  </form>;
}
