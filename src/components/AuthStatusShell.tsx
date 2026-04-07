import { AuthStatus } from "@/components/AuthStatus";

type Summary = {
  isGuest: boolean;
  isDemoUser?: boolean;
  isLocalDev?: boolean;
  demoUserKey?: string | null;
  actorLabel: string;
  email: string | null;
  emailVerified: boolean;
};

const fallbackSummary: Summary = {
  isGuest: true,
  isDemoUser: false,
  isLocalDev: false,
  demoUserKey: null,
  actorLabel: "Playing as Guest",
  email: null,
  emailVerified: false,
};

export function AuthStatusShell() {
  return <AuthStatus initial={fallbackSummary} />;
}

export default AuthStatusShell;
