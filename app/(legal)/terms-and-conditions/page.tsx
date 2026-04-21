import { LegalPage } from "@/features/landing/legal-page";

export default function Page() {
  return (
    <LegalPage
      title="Terms and Conditions"
      updatedAt="July 20, 2025"
      sections={[
        [
          "Agreement",
          "By accessing APIfyn, you agree to these terms. If you do not agree, you may not use the service.",
        ],
        [
          "Service Description",
          "APIfyn provides tools for creating and managing automated workflows that connect third-party services and APIs.",
        ],
        [
          "User Accounts",
          "You are responsible for providing accurate account information and maintaining the confidentiality of your account access.",
        ],
        [
          "Subscriptions and Payments",
          "Paid features require an active subscription. Fees and renewal details are shown before purchase.",
        ],
        [
          "Acceptable Use",
          "You may not use APIfyn to violate laws, infringe rights, transmit malicious code, or gain unauthorized system access.",
        ],
        ["Contact", "For legal questions, contact legal@apifyn.com."],
      ]}
    />
  );
}
