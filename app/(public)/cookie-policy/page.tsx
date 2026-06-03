import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The Kenya Brief cookie policy explaining essential, analytics, and preference cookies.",
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <StaticInfoPage
      title="Cookie Policy"
      intro="The Kenya Brief uses cookies and similar technologies to operate the website, understand performance, and improve reader services."
      sections={[
        { title: "Essential Cookies", body: ["Essential cookies help authentication, security, forms, and core site features work correctly."] },
        { title: "Analytics Cookies", body: ["Analytics tools help us understand page performance, popular sections, traffic sources, and technical issues."] },
        { title: "Managing Cookies", body: ["Readers can manage cookies through browser settings. Blocking some cookies may affect sign-in, comments, or saved preferences."] },
      ]}
    />
  );
}
