import LegalDoc from "@/components/LegalDoc";
import { legalDocs } from "@/lib/legalContent";

export const metadata = { title: "Refunds · PwnIt" };

export default function Page() {
  return <LegalDoc doc={legalDocs.refund} />;
}
