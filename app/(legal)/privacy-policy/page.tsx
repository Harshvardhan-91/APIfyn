import { LegalPage } from "@/features/landing/legal-page";

export default function Page() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedAt="July 20, 2025"
      sections={[
        [
          "Introduction",
          "At APIfyn, we take your privacy seriously. This policy explains how we collect, use, and protect information when you use our automation services.",
        ],
        [
          "Information We Collect",
          "We collect account details, billing information when applicable, workflow configuration, and integration metadata needed to provide the product.",
        ],
        [
          "How We Use Information",
          "We use your information to operate APIfyn, process payments, send important service updates, improve reliability, and respond to support requests.",
        ],
        [
          "Security",
          "We use reasonable technical and organizational safeguards, but no internet transmission or storage system can be guaranteed to be absolutely secure.",
        ],
        ["Contact", "For privacy questions, contact privacy@apifyn.com."],
      ]}
    />
  );
}
