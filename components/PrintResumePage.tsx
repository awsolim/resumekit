"use client";

export default function PrintResumePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 text-slate-950">
      <section className="w-full max-w-md">
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
          ResumeKit
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Sign in required
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          ResumeKit resumes are only available from your signed-in account. Open
          the app, sign in, and use Download from your resume list.
        </p>
      </section>
    </main>
  );
}
