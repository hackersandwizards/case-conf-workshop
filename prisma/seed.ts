import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create superuser
  const superuserEmail = process.env.FIRST_SUPERUSER_EMAIL || "dev@example.com";
  const superuserPassword = process.env.FIRST_SUPERUSER_PASSWORD || "DevPassword";
  const hashedPassword = await bcrypt.hash(superuserPassword, 10);

  const superuser = await prisma.user.upsert({
    where: { email: superuserEmail },
    update: {},
    create: {
      email: superuserEmail,
      hashedPassword,
      fullName: "Dev Admin",
      isActive: true,
      isSuperuser: true,
    },
  });
  console.log(`Created superuser: ${superuser.email}`);

  // Create test users
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      hashedPassword: await bcrypt.hash("AlicePassword123", 10),
      fullName: "Alice Johnson",
      isActive: true,
      isSuperuser: false,
    },
  });
  console.log(`Created user: ${alice.email}`);

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      hashedPassword: await bcrypt.hash("BobPassword123", 10),
      fullName: "Bob Smith",
      isActive: true,
      isSuperuser: false,
    },
  });
  console.log(`Created user: ${bob.email}`);

  // Create sample contacts for superuser
  const superuserContacts = [
    { organisation: "OpenAI", description: "AI research company" },
    { organisation: "Anthropic", description: "AI safety company" },
    { organisation: "Google DeepMind", description: "AI research lab" },
    { organisation: "Meta AI", description: "AI research division" },
    { organisation: "Microsoft Research", description: "Technology research" },
  ];

  for (const contact of superuserContacts) {
    const existingContact = await prisma.contact.findFirst({
      where: {
        organisation: contact.organisation,
        ownerId: superuser.id,
      },
    });
    if (!existingContact) {
      await prisma.contact.create({
        data: {
          organisation: contact.organisation,
          description: contact.description,
          ownerId: superuser.id,
        },
      });
    }
  }
  console.log(`Created ${superuserContacts.length} contacts for superuser`);

  // Create sample contacts for Alice
  const aliceContacts = [
    { organisation: "Acme Corp", description: "Manufacturing company" },
    { organisation: "TechStart Inc", description: "Startup accelerator" },
  ];

  for (const contact of aliceContacts) {
    const existingContact = await prisma.contact.findFirst({
      where: {
        organisation: contact.organisation,
        ownerId: alice.id,
      },
    });
    if (!existingContact) {
      await prisma.contact.create({
        data: {
          organisation: contact.organisation,
          description: contact.description,
          ownerId: alice.id,
        },
      });
    }
  }
  console.log(`Created ${aliceContacts.length} contacts for Alice`);

  // Create sample contacts for Bob
  const bobContacts = [
    { organisation: "DataFlow Systems", description: "Data analytics" },
    { organisation: "CloudNine Hosting", description: "Cloud infrastructure" },
    { organisation: "SecureNet", description: "Cybersecurity services" },
  ];

  for (const contact of bobContacts) {
    const existingContact = await prisma.contact.findFirst({
      where: {
        organisation: contact.organisation,
        ownerId: bob.id,
      },
    });
    if (!existingContact) {
      await prisma.contact.create({
        data: {
          organisation: contact.organisation,
          description: contact.description,
          ownerId: bob.id,
        },
      });
    }
  }
  console.log(`Created ${bobContacts.length} contacts for Bob`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
