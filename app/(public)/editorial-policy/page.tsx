import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "The Kenya Brief editorial policy on accuracy, fairness, independence, sourcing, and corrections.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <StaticInfoPage
      title="Editorial Policy"
      intro="The Kenya Brief's editorial standards are designed to protect accuracy, fairness, independence, and reader trust."
      sections={[
        { title: "Accuracy", body: ["We verify facts before publication, distinguish reporting from opinion, and update stories when new reliable information changes the record."] },
        { title: "Fairness", body: ["We seek relevant context and avoid misleading framing. People and institutions facing serious claims should be given a reasonable opportunity to respond where practical."] },
        { title: "Independence", body: ["Editorial decisions are made independently from advertisers, sponsors, political actors, and outside interests. Sponsored content must be clearly labelled."] },
        { title: "Automation", body: ["Automated news briefs are rewritten, categorized, deduplicated, and reviewed for clarity and originality before they are presented to readers."] },
      ]}
    />
  );
}
