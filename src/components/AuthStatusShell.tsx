import { AuthStatus } from "@/components/AuthStatus";
import { getCurrentUserSummary } from "@/lib/auth";

export async function AuthStatusShell() {
  const summary = await getCurrentUserSummary();

  return (
    <AuthStatus
      initial={{
        isGuest: summary.isGuest,
        isDemoUser: summary.isDemoUser,
        isLocalDev: summary.isLocalDev,
        demoUserKey: summary.demoUserKey,
        actorLabel: summary.actorLabel,
        email: summary.email,
        emailVerified: summary.emailVerified,
      }}
    />
  );
}

export default AuthStatusShell;
