import LegalDoc from "@/components/LegalDoc";
import { legalDocs } from "@/lib/legalContent";

export const metadata = { title: "Terms · PwnIt" };

export default function Page() {
  return <LegalDoc doc={legalDocs.terms} />;
}
