
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

console.log("Prisma client keys:", Object.keys(prisma).filter((key) => key.toLowerCase().includes("timetable")));
console.log("Timetable delegate exists:", Boolean(prisma.timetableEntry));

await prisma.$disconnect();
