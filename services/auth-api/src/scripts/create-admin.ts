import "dotenv/config";
import { createInternalAdmin } from "../services/auth.service";

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  const tenantId =
    process.env.ADMIN_BOOTSTRAP_TENANT_ID?.trim() || "internal-admin-tenant";

  if (!email || !password) {
    throw new Error(
      "Missing ADMIN_BOOTSTRAP_EMAIL or ADMIN_BOOTSTRAP_PASSWORD in environment."
    );
  }

  const result = await createInternalAdmin({
    email,
    password,
    tenantId,
    userAgent: "admin-bootstrap-script",
    ipAddress: null
  });

  console.log(
    JSON.stringify(
      {
        status: "ADMIN_CREATED",
        email,
        tenant_id: result.user.tenant_id,
        role: result.user.role,
        user_id: result.user.sub
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("CREATE_ADMIN_FAILED");
  console.error(error);
  process.exit(1);
});