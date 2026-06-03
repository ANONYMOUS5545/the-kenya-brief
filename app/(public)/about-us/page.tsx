import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about The Kenya Brief, an independent digital newsroom covering Kenya with clarity and public-service focus.",
  alternates: { canonical: "/about-us" },
};

export default function AboutUsPage() {
  return (
    <StaticInfoPage
      title="About Us"
      intro="The Kenya Brief is a digital newsroom built to help readers understand Kenya's most important public affairs, business, community, culture, and policy developments."
      sections={[
        { title: "Our Mission", body: ["We publish timely, clear, and useful journalism for readers who need the facts quickly without losing context.", "Our newsroom prioritizes accuracy, fairness, public interest, and accountability in every story we publish."] },
        { title: "What We Cover", body: ["The Kenya Brief covers politics, business, technology, sports, entertainment, health, education, environment, counties, and breaking national developments."] },
        { title: "How We Work", body: ["Editors review stories for factual accuracy, relevance, tone, and clarity before publication. Automated news briefs are rewritten and classified by topic before they appear on the site."] },
      ]}
    />
  );
}
