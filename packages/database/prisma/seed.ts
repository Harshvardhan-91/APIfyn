import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: "Starter",
      slug: "starter",
      description:
        "Perfect for individuals getting started with automation workflows.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Up to 100 API calls per month",
        "2 automation workflows",
        "GitHub & Slack integrations",
        "Community support",
      ],
      apiCallsLimit: 100,
      workflowsLimit: 2,
    },
    {
      name: "Professional",
      slug: "professional",
      description: "For growing teams that need more power.",
      monthlyPrice: 2000, // ₹2000 = $20 equivalent, Razorpay uses paise
      yearlyPrice: 19200,
      features: [
        "Up to 10,000 API calls per month",
        "20 automation workflows",
        "All integrations",
        "Priority support",
        "Execution logs",
      ],
      apiCallsLimit: 10000,
      workflowsLimit: 20,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "For organizations with advanced needs.",
      monthlyPrice: 3000,
      yearlyPrice: 30000,
      features: [
        "Unlimited API calls",
        "Unlimited workflows",
        "Custom integrations",
        "SLA guarantee",
        "Dedicated support",
        "SSO & SAML",
      ],
      apiCallsLimit: -1,
      workflowsLimit: -1,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  console.log("Seed data created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
