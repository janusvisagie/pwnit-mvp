import LegalDoc from "@/components/LegalDoc";
import { legalDocs } from "@/lib/legalContent";

export const metadata = { title: "Privacy · PwnIt" };

export default function Page() {
  return <LegalDoc doc={legalDocs.privacy} />;
}
