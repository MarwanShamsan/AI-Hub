import { hashPassword } from "./password";

async function main(): Promise<void> {
  const password = process.argv[2];

  if (!password) {
    console.error("Usage: ts-node src/utils/hash-password.ts <password>");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  console.log(hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});