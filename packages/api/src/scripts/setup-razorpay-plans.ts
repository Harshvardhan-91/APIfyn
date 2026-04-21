/**
 * One-time script to create Razorpay subscription plans and update the DB.
 *
 * Usage:
 *   npx ts-node src/scripts/setup-razorpay-plans.ts
 *
 * Prerequisites:
 *   - RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env
 *   - Database must be seeded with plans (pnpm db:seed)
 */
import "../load-env";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
    process.exit(1);
  }

  const rz = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const paidPlans = await prisma.plan.findMany({
    where: { monthlyPrice: { gt: 0 } },
  });

  for (const plan of paidPlans) {
    console.log(`\nCreating Razorpay plans for: ${plan.name}`);

    // Monthly plan (price is in paise, monthlyPrice is already in paise-like units)
    // Razorpay expects amount in the smallest currency unit
    const monthlyAmount = plan.monthlyPrice * 100; // convert ₹ to paise
    const yearlyAmount = plan.yearlyPrice * 100;

    try {
      const monthlyPlan = await rz.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: `${plan.name} - Monthly`,
          amount: monthlyAmount,
          currency: "INR",
          description: plan.description,
        },
      });

      console.log(`  Monthly plan created: ${monthlyPlan.id}`);

      const yearlyPlan = await rz.plans.create({
        period: "yearly",
        interval: 1,
        item: {
          name: `${plan.name} - Yearly`,
          amount: yearlyAmount,
          currency: "INR",
          description: plan.description,
        },
      });

      console.log(`  Yearly plan created: ${yearlyPlan.id}`);

      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          razorpayPlanIdM: monthlyPlan.id,
          razorpayPlanIdY: yearlyPlan.id,
        },
      });

      console.log(`  DB updated for ${plan.name}`);
    } catch (err) {
      console.error(`  Failed for ${plan.name}:`, err);
    }
  }

  console.log("\nDone! Razorpay plans created and linked.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
