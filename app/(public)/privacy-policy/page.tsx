import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "The Kenya Brief privacy policy covering reader data, newsletters, analytics, and account information.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <StaticInfoPage
      title="Privacy Policy"
      intro="This policy explains how The Kenya Brief collects, uses, protects, and manages information related to readers, subscribers, contributors, and account holders."
      sections={[
        { title: "Information We Collect", body: ["We may collect account details, newsletter email addresses, comments, device information, analytics data, and information readers choose to send to the newsroom."] },
        { title: "How We Use Information", body: ["We use information to provide the site, manage accounts, send newsletters, moderate comments, improve performance, analyze audience trends, and protect the platform."] },
        { title: "Protection and Retention", body: ["We limit access to personal data, use secure authentication practices, and retain information only as long as needed for operational, legal, or editorial reasons."] },
        { title: "Reader Choices", body: ["Readers may unsubscribe from newsletters, request account support, or contact privacy@kenyabrief.co.ke for privacy-related questions."] },
      ]}
    />
  );
}
