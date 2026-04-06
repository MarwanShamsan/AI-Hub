import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("db:migrate runs successfully", async () => {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [
      "-r",
      "ts-node/register/transpile-only",
      "services/engine-runner/migrate.ts"
    ],
    {
      env: process.env
    }
  );

  const output = `${stdout}\n${stderr}`;

  assert.match(output, /Migration run completed\./);
});