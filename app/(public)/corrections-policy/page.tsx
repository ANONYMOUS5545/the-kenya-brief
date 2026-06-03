import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description: "How The Kenya Brief reviews, corrects, clarifies, and updates published journalism.",
  alternates: { canonical: "/corrections-policy" },
};

export default function CorrectionsPolicyPage() {
  return (
    <StaticInfoPage
      title="Corrections Policy"
      intro="The Kenya Brief corrects material errors promptly and transparently when our reporting needs clarification or amendment."
      sections={[
        { title: "Submitting a Correction", body: ["Email corrections@kenyabrief.co.ke with the article URL, the disputed text, supporting evidence, and your contact details."] },
        { title: "Review Process", body: ["Editors review correction requests, check available evidence, consult relevant records, and update the article when a correction or clarification is warranted."] },
        { title: "Updates", body: ["Material corrections are reflected in the article and may include a note explaining the change. Minor typographical fixes may be corrected silently."] },
      ]}
    />
  );
}
