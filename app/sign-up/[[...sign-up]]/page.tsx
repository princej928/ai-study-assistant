import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";

export default function Page() {
  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start with one upload and turn your study material into a focused revision system."
      footerText="Already have a StudyForge account?"
      footerHref="/sign-in"
      footerLabel="Sign in"
      authCard={<AuthForm mode="sign-up" />}
    />
  );
}
