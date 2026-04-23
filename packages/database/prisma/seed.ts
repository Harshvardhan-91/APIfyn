import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** If another plan row already uses this slug, rename it so the seed row can take it. */
async function releaseSlug(keepId: string, slug: string) {
  const other = await prisma.plan.findFirst({
    where: { slug, NOT: { id: keepId } },
  });
  if (other) {
    await prisma.plan.update({
      where: { id: other.id },
      data: { slug: `${other.slug}-superseded-${other.id.slice(0, 8)}` },
    });
  }
}

/** If another plan row already uses this display name, rename it. */
async function releaseName(keepId: string, name: string) {
  const other = await prisma.plan.findFirst({
    where: { name, NOT: { id: keepId } },
  });
  if (other) {
    await prisma.plan.update({
      where: { id: other.id },
      data: { name: `${other.name} (${other.id.slice(0, 6)})` },
    });
  }
}

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
    const existing = await prisma.plan.findFirst({
      where: { OR: [{ slug: plan.slug }, { name: plan.name }] },
    });
    if (existing) {
      await releaseSlug(existing.id, plan.slug);
      await releaseName(existing.id, plan.name);
      await prisma.plan.update({ where: { id: existing.id }, data: plan });
    } else {
      await prisma.plan.create({ data: plan });
    }
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
