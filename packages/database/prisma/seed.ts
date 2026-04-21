import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.deleteMany();

  const plans = [
    {
      name: "Starter",
      description:
        "Perfect for individuals getting started with automation workflows.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Up to 100 API calls per month",
        "5 automation workflows",
        "Basic integrations",
        "Email notifications",
        "Community support",
        "Standard templates",
      ],
      apiCallsLimit: 100,
      workflowsLimit: 5,
    },
    {
      name: "Professional",
      description: "Advanced automation for growing teams and businesses.",
      monthlyPrice: 2000,
      yearlyPrice: 19200,
      features: [
        "Up to 10,000 API calls per month",
        "Unlimited automation workflows",
        "Premium integrations",
        "Real-time monitoring and alerts",
        "Priority email support",
        "Advanced analytics dashboard",
      ],
      apiCallsLimit: 10000,
      workflowsLimit: -1,
    },
    {
      name: "Enterprise",
      description: "Complete automation solution for large-scale operations.",
      monthlyPrice: 3000,
      yearlyPrice: 30000,
      features: [
        "Unlimited API calls",
        "Advanced workflow automation",
        "All premium integrations",
        "24/7 dedicated support",
        "Custom onboarding",
        "SLA guarantees",
      ],
      apiCallsLimit: -1,
      workflowsLimit: -1,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
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
