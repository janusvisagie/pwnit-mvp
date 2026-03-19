import { safeNextPath } from "@/lib/auth";
import LoginClient from "./LoginClient";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: {
    next?: string;
    mode?: string;
  };
}) {
  const nextPath = safeNextPath(searchParams?.next ?? "/");
  const initialMode = String(searchParams?.mode ?? "").toLowerCase() === "register" ? "register" : "login";

  return <LoginClient nextPath={nextPath} initialMode={initialMode as "login" | "register"} />;
}
