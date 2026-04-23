import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: "Free",
      slug: "starter",
      description: "Get started with workflow automation.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "500 workflow runs / month",
        "5 workflows",
        "Core integrations",
        "AI builder (10 generations / month)",
        "Community support",
      ],
      apiCallsLimit: 500,
      workflowsLimit: 5,
    },
    {
      name: "Pro",
      slug: "professional",
      description: "For teams that automate daily.",
      monthlyPrice: 1500, // ₹1,500 (~$15), Razorpay uses paise → 150000
      yearlyPrice: 15000,
      features: [
        "10,000 workflow runs / month",
        "25 workflows",
        "All integrations",
        "AI builder (50 generations / month)",
        "Priority support",
        "Execution logs",
      ],
      apiCallsLimit: 10000,
      workflowsLimit: 25,
    },
    {
      name: "Business",
      slug: "enterprise",
      description: "For growing businesses with complex workflows.",
      monthlyPrice: 5000, // ₹5,000 (~$49), Razorpay uses paise → 500000
      yearlyPrice: 50000,
      features: [
        "50,000 workflow runs / month",
        "Unlimited workflows",
        "All integrations + priority access",
        "AI builder (200 generations / month)",
        "Advanced analytics",
        "Priority support",
      ],
      apiCallsLimit: 50000,
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
