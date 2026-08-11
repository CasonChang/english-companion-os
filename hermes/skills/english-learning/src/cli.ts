#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { ingestSession } from "./ingest.js";

async function readInput(args: string[]) {
  const path = args.find((arg) => !arg.startsWith("--"));
  if (path) return readFile(path, "utf8");
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

const args = process.argv.slice(2);
try {
  const input = await readInput(args);
  if (!input.trim()) { console.error(JSON.stringify({ ok: false, message: "Send a JSON file path or pipe JSON text to stdin." })); process.exitCode = 2; }
  else {
    const result = await ingestSession(input, { allowDateOutsideWindow: args.includes("--confirm-date") });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (!result.ok) process.exitCode = 1;
  }
} catch {
  console.error(JSON.stringify({ ok: false, message: "I couldn't read that JSON file. Please send it again." }));
  process.exitCode = 2;
}
