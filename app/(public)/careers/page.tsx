import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Careers",
  description: "Career opportunities at The Kenya Brief for journalists, editors, audience specialists, and product talent.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <StaticInfoPage
      title="Careers"
      intro="The Kenya Brief welcomes talented people who care about public-service journalism, clear writing, audience trust, and modern digital publishing."
      sections={[
        { title: "Current Opportunities", body: ["Open roles are published here when available. We regularly consider freelance reporters, copy editors, audience editors, and multimedia contributors."] },
        { title: "What We Value", body: ["We value accuracy, fairness, independence, curiosity, strong ethics, and a willingness to explain complex issues plainly."] },
        { title: "Applications", body: ["Send a short cover note, CV, and relevant work samples to careers@kenyabrief.co.ke. We review applications based on role fit and editorial standards."] },
      ]}
    />
  );
}
