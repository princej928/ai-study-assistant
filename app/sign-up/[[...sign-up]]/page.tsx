import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";

export default function Page() {
  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start with one upload and turn your study material into a focused revision system."
      footerText="Already have a StudyForge account?"
      footerHref="/sign-in"
      footerLabel="Sign in"
      authCard={
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none bg-transparent border-0 p-0",
              header: "hidden",
              footer: "hidden",
            },
          }}
        />
      }
    />
  );
}
