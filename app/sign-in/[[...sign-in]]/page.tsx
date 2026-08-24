import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";

export default function Page() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue building summaries, quizzes, and smarter revision sessions."
      footerText="New to StudyForge?"
      footerHref="/sign-up"
      footerLabel="Create an account"
      authCard={<AuthForm mode="sign-in" />}
    />
  );
}
