import { prisma } from "../src/lib/prisma";

async function main() {
  const tables = await prisma.$queryRaw<
    Array<{ table_name: string }>
  >`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log("Tables visible to the application:");
  console.table(tables);

  const columns = await prisma.$queryRaw<
    Array<{ table_name: string; column_name: string }>
  >`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND LOWER(table_name) IN (
        'user',
        'session',
        'account',
        'verification'
      )
    ORDER BY table_name, ordinal_position
  `;

  console.log("Authentication table columns:");
  console.table(columns);
}

main()
  .catch((error) => {
    console.error("Database inspection failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });