import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Advertise",
  description: "Advertise with The Kenya Brief and reach an engaged Kenyan news audience.",
  alternates: { canonical: "/advertise" },
};

export default function AdvertisePage() {
  return (
    <StaticInfoPage
      title="Advertise"
      intro="The Kenya Brief offers responsible advertising opportunities for brands, institutions, and organizations seeking to reach informed Kenyan readers."
      sections={[
        { title: "Advertising Options", body: ["Available placements include display advertising, newsletter sponsorship, sponsored explainers, and campaign packages that are clearly labelled."] },
        { title: "Standards", body: ["Advertising must meet legal, brand safety, and audience trust standards. Sponsored content is reviewed and labelled to avoid confusing readers."] },
        { title: "Contact", body: ["For rates and availability, contact ads@kenyabrief.co.ke with your campaign goals, timing, and preferred sections."] },
      ]}
    />
  );
}
