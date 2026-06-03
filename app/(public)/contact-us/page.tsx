import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact The Kenya Brief newsroom, advertising, corrections, and audience support teams.",
  alternates: { canonical: "/contact-us" },
};

export default function ContactUsPage() {
  return (
    <StaticInfoPage
      title="Contact Us"
      intro="Reach The Kenya Brief for newsroom tips, corrections, advertising, partnerships, and reader support."
      sections={[
        { title: "Newsroom", body: ["Send news tips, documents, or story ideas to news@kenyabrief.co.ke. Include dates, locations, and supporting evidence where possible."] },
        { title: "Corrections", body: ["For corrections, email corrections@kenyabrief.co.ke with the article link and the specific issue you want reviewed."] },
        { title: "Office", body: ["The Kenya Brief, Waiyaki Way, Westlands, Nairobi, Kenya. Phone: +254 700 000 000."] },
      ]}
    />
  );
}
