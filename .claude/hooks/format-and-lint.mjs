#!/usr/bin/env node
// PostToolUse hook (Write|Edit): formats the touched file with Prettier and
// runs ESLint --fix on JS/TS files. Scoped to this project only.
//
// Reads the tool-call JSON from stdin, so no `jq` dependency is needed
// (jq isn't installed on this machine).

import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..", "..");
const ESLINT_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const EXCLUDED_DIRS = ["node_modules", ".next", ".git"];

function readStdin() {
  try {
    return fs.readFileSync(0, "utf-8");
  } catch {
    return "";
  }
}

function getFilePath(payload) {
  return payload?.tool_response?.filePath ?? payload?.tool_input?.file_path ?? null;
}

function isInsideProject(absPath) {
  const rel = path.relative(PROJECT_ROOT, absPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return false;
  const segments = rel.split(path.sep);
  return !EXCLUDED_DIRS.some((dir) => segments.includes(dir));
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readStdin());
  } catch {
    process.exit(0);
  }

  const rawPath = getFilePath(payload);
  if (!rawPath) process.exit(0);

  const filePath = path.resolve(rawPath);
  if (!fs.existsSync(filePath) || !isInsideProject(filePath)) process.exit(0);

  try {
    // 1. Prettier — best-effort, never blocks the flow.
    const prettierBin = path.join(PROJECT_ROOT, "node_modules", "prettier", "bin", "prettier.cjs");
    if (fs.existsSync(prettierBin)) {
      spawnSync(process.execPath, [prettierBin, "--write", "--ignore-unknown", filePath], {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
      });
    }

    // 2. ESLint --fix — only for JS/TS files.
    const ext = path.extname(filePath);
    if (!ESLINT_EXTENSIONS.has(ext)) process.exit(0);

    const eslintBin = path.join(PROJECT_ROOT, "node_modules", "eslint", "bin", "eslint.js");
    if (!fs.existsSync(eslintBin)) process.exit(0);

    const result = spawnSync(process.execPath, [eslintBin, "--fix", filePath], {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
    });

    if (result.status !== 0) {
      process.stderr.write(result.stdout || "");
      process.stderr.write(result.stderr || "");
      process.exit(2);
    }

    process.exit(0);
  } catch (err) {
    process.stderr.write(String(err?.stack ?? err));
    process.exit(0);
  }
}

main();
