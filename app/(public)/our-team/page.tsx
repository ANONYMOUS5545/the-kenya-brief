import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet the editorial and operations team behind The Kenya Brief.",
  alternates: { canonical: "/our-team" },
};

export default function OurTeamPage() {
  return (
    <StaticInfoPage
      title="Our Team"
      intro="The Kenya Brief is operated by editors, reporters, contributors, and product staff committed to reliable Kenyan journalism."
      sections={[
        { title: "Editorial Desk", body: ["Our editorial desk plans coverage, reviews stories, verifies claims, and maintains publishing standards across all sections."] },
        { title: "Contributors", body: ["We work with contributors who understand local context and report responsibly on counties, institutions, communities, and public policy."] },
        { title: "Product and Audience", body: ["Our product team maintains the publishing platform, reader experience, newsletters, analytics, and performance systems."] },
      ]}
    />
  );
}
