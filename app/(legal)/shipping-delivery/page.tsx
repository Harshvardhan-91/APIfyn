import { LegalPage } from "@/features/landing/legal-page";

export default function Page() {
  return (
    <LegalPage
      title="Shipping and Delivery"
      updatedAt="July 20, 2025"
      sections={[
        [
          "Digital Service Delivery",
          "APIfyn is a cloud software service. Access is delivered digitally after account creation and successful payment when applicable.",
        ],
        [
          "Service Activation",
          "Free access starts after sign-in. Paid features activate after payment confirmation.",
        ],
        [
          "Availability",
          "The platform is designed for continuous availability with occasional maintenance windows.",
        ],
        [
          "Support",
          "Support response times depend on plan level and issue severity.",
        ],
        [
          "Contact",
          "For service delivery questions, contact support@apifyn.com.",
        ],
      ]}
    />
  );
}
