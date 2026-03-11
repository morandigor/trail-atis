import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { get, put } from "@vercel/blob";

const SEED_PATH = path.join(process.cwd(), "data", "checklist.json");
const LOCAL_DB_PATH =
  process.env.LOCAL_DB_PATH ||
  (process.env.VERCEL ? "/tmp/checklist.json" : path.join(process.cwd(), "data", "checklist.json"));
const BLOB_PATHNAME = process.env.CHECKLIST_BLOB_PATHNAME || "checklist/db.json";

async function readSeedFile() {
  return readFile(SEED_PATH, "utf8");
}

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlobText() {
  const result = await get(BLOB_PATHNAME, {
    access: "private",
    useCache: false,
  });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return new Response(result.stream).text();
}

async function writeBlobText(value: string) {
  await put(BLOB_PATHNAME, value, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function ensureLocalDb() {
  await mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });

  try {
    await readFile(LOCAL_DB_PATH, "utf8");
  } catch {
    await writeFile(LOCAL_DB_PATH, await readSeedFile(), "utf8");
  }
}

async function ensureBlobDb() {
  const existing = await readBlobText();
  if (existing !== null) {
    return;
  }

  await writeBlobText(await readSeedFile());
}

export async function ensureChecklistStorage() {
  if (hasBlobStorage()) {
    await ensureBlobDb();
    return;
  }

  await ensureLocalDb();
}

export async function readChecklistStorage() {
  await ensureChecklistStorage();

  if (hasBlobStorage()) {
    const value = await readBlobText();
    if (value === null) {
      throw new Error("Checklist blob storage is unavailable.");
    }

    return value;
  }

  return readFile(LOCAL_DB_PATH, "utf8");
}

export async function writeChecklistStorage(value: string) {
  if (hasBlobStorage()) {
    await writeBlobText(value);
    return;
  }

  await mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
  await writeFile(LOCAL_DB_PATH, value, "utf8");
}

export function getChecklistStorageMode() {
  return hasBlobStorage() ? "blob" : "local";
}
