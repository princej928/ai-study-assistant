"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface AuthShellProps {
  title: string;
  subtitle: string;
  authCard: ReactNode;
  footerText: string;
  footerHref: string;
  footerLabel: string;
}

const featurePills = [
  "AI summaries in seconds",
  "Flashcards with spaced repetition",
  "Quiz practice from your notes",
];

export default function AuthShell({
  title,
  subtitle,
  authCard,
  footerText,
  footerHref,
  footerLabel,
}: AuthShellProps) {
  return (
    <main className="studyforge-auth-shell min-h-screen overflow-hidden px-5 py-8 text-stone-100 sm:px-8 lg:px-12">
      <div className="studyforge-auth-glow" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center justify-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative z-10 max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/20 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/90 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.95)]" />
              StudyForge
            </div>

            <div className="space-y-5">
              <p className="max-w-md text-sm font-medium uppercase tracking-[0.32em] text-amber-100/70">
                AI study workspace
              </p>
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-stone-50 sm:text-6xl lg:text-7xl">
                Focus under the light. Forge sharper revision.
              </h1>
              <p className="max-w-xl text-base leading-8 text-stone-300 sm:text-lg">
                Turn dense notes, textbook pages, and lecture handouts into a study system that
                actually helps you revise with clarity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {featurePills.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-white/10 bg-white/7 px-4 py-2 text-sm text-stone-200 backdrop-blur-md"
                >
                  {feature}
                </span>
              ))}
            </div>

            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              <div className="studyforge-auth-panel">
                <p className="text-2xl font-semibold text-white">150s</p>
                <p className="mt-1 text-sm text-stone-300">average path from upload to summary</p>
              </div>
              <div className="studyforge-auth-panel">
                <p className="text-2xl font-semibold text-white">SRS</p>
                <p className="mt-1 text-sm text-stone-300">flashcards that return when due</p>
              </div>
              <div className="studyforge-auth-panel">
                <p className="text-2xl font-semibold text-white">1 hub</p>
                <p className="mt-1 text-sm text-stone-300">notes, quizzes, and revision in one place</p>
              </div>
            </div>
          </section>

          <section className="relative z-10 mx-auto w-full max-w-md">
            <div className="studyforge-auth-card">
              <div className="mb-6 space-y-2 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700/80">
                  StudyForge
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-stone-900">{title}</h2>
                <p className="text-sm leading-6 text-stone-500">{subtitle}</p>
              </div>

              {authCard}

              <p className="mt-6 text-center text-sm text-stone-500">
                {footerText}{" "}
                <Link href={footerHref} className="font-semibold text-amber-700 transition hover:text-amber-800">
                  {footerLabel}
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
