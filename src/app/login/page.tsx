import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = typeof searchParams?.next === "string" ? searchParams.next : "/";
  return <LoginClient nextPath={next} />;
}
