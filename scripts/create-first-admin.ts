
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const studentId = "2024521460106";
const email = `${studentId}@course-manager.local`;

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("Run this script in an interactive terminal.");
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    let password = "";

    process.stdout.write("Enter a NEW strong admin password: ");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };

    const onData = (input: string | Buffer) => {
      const char = input.toString();

      if (char === "\u0003") {
        cleanup();
        reject(new Error("Cancelled."));
        return;
      }

      if (char === "\r" || char === "\n") {
        cleanup();
        process.stdout.write("\n");
        resolve(password);
        return;
      }

      if (char === "\u007f" || char === "\b") {
        password = password.slice(0, -1);
        return;
      }

      if (char >= " " && char !== "\u007f") {
        password += char;
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: studentId }, { email }],
    },
  });

  if (existing) {
    throw new Error(
      "An account with this Student ID or internal email already exists."
    );
  }

  const password = await readPassword();

  if (password.length < 12) {
    throw new Error("Use a password of at least 12 characters.");
  }

  const result = await auth.api.signUpEmail({
    body: {
      name: "Course Manager Admin",
      email,
      password,
      username: studentId,
      displayUsername: studentId,
    },
  });

  if (!result?.user?.id) {
    throw new Error("Better Auth did not return the new user.");
  }

  await prisma.user.update({
    where: { id: result.user.id },
    data: {
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log("Admin account created successfully.");
  console.log(`Student ID: ${studentId}`);
  console.log("Role: ADMIN");
}

main()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
