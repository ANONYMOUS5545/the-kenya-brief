import type { Metadata } from "next";
import StaticInfoPage from "@/components/static/StaticInfoPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for accessing The Kenya Brief website, content, accounts, and reader services.",
  alternates: { canonical: "/terms-of-use" },
};

export default function TermsOfUsePage() {
  return (
    <StaticInfoPage
      title="Terms of Use"
      intro="By using The Kenya Brief, readers agree to use the platform lawfully, respectfully, and in a way that protects editorial work and other users."
      sections={[
        { title: "Use of Content", body: ["Articles, images, graphics, and other materials are protected by copyright and may not be republished without permission except where law allows limited fair use."] },
        { title: "Accounts and Comments", body: ["Users are responsible for their accounts and comments. We may moderate, reject, or remove unlawful, abusive, misleading, or spam content."] },
        { title: "Service Availability", body: ["We work to keep the site available and accurate, but we may update, suspend, or change services for maintenance, security, legal, or editorial reasons."] },
        { title: "Contact", body: ["Questions about these terms may be sent to legal@kenyabrief.co.ke."] },
      ]}
    />
  );
}
