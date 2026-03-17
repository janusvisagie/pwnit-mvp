import { AuthStatus } from "@/components/AuthStatus";
import { getCurrentUserSummary } from "@/lib/auth";

export async function AuthStatusShell() {
  const summary = await getCurrentUserSummary();

  return (
    <AuthStatus
      initial={{
        isGuest: summary.isGuest,
        actorLabel: summary.actorLabel,
        email: summary.email,
        emailVerified: summary.emailVerified,
      }}
    />
  );
}

export default AuthStatusShell;
