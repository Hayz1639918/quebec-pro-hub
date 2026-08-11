import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const PAGE_SIZE = 1000;
const MAX_ATTEMPTS = 3;

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function storagePath(...segments) {
  return segments
    .flatMap((segment) => segment.split("/"))
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function safeDestination(root, ...segments) {
  const destination = path.resolve(root, ...segments);
  const prefix = `${root}${path.sep}`;
  if (destination !== root && !destination.startsWith(prefix)) {
    throw new Error("A Storage object path attempted to escape the backup directory");
  }
  return destination;
}

function isFolder(entry) {
  return entry.id == null && entry.metadata == null;
}

async function pause(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request(url, options, label) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      const responseText = (await response.text()).slice(0, 500);
      const error = new Error(`${label} failed with HTTP ${response.status}: ${responseText}`);
      error.retryable = response.status >= 500 || response.status === 429;
      if (!error.retryable) throw error;
      lastError = error;
    } catch (error) {
      if (error?.retryable === false) throw error;
      lastError = error;
      if (attempt === MAX_ATTEMPTS) break;
    }

    await pause(1000 * attempt);
  }

  throw lastError;
}

async function main() {
  const projectUrl = requiredEnvironment("SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const outputRoot = path.resolve(process.argv[2] ?? "backup/storage");
  const manifestPath = path.resolve(
    process.argv[3] ?? path.join(outputRoot, "storage-manifest.json"),
  );

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  await mkdir(outputRoot, { recursive: true, mode: 0o700 });

  const bucketResponse = await request(
    `${projectUrl}/storage/v1/bucket`,
    { headers },
    "List Storage buckets",
  );
  const buckets = await bucketResponse.json();
  if (!Array.isArray(buckets)) {
    throw new Error("Supabase returned an invalid bucket list");
  }
  const manifest = {
    generated_at: new Date().toISOString(),
    project_url: projectUrl,
    buckets: buckets.map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      file_size_limit: bucket.file_size_limit ?? null,
      allowed_mime_types: bucket.allowed_mime_types ?? null,
    })),
    objects: [],
  };

  async function downloadFolder(bucketId, prefix = "") {
    let offset = 0;

    while (true) {
      const listResponse = await request(
        `${projectUrl}/storage/v1/object/list/${storagePath(bucketId)}`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            prefix,
            limit: PAGE_SIZE,
            offset,
            sortBy: { column: "name", order: "asc" },
          }),
        },
        `List objects in bucket ${bucketId}`,
      );
      const entries = await listResponse.json();
      if (!Array.isArray(entries)) {
        throw new Error(`Supabase returned an invalid object list for bucket ${bucketId}`);
      }

      for (const entry of entries) {
        const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (isFolder(entry)) {
          await downloadFolder(bucketId, objectPath);
          continue;
        }

        const destination = safeDestination(outputRoot, bucketId, ...objectPath.split("/"));
        await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });

        const downloadResponse = await request(
          `${projectUrl}/storage/v1/object/${storagePath(bucketId, objectPath)}`,
          { headers },
          `Download object from bucket ${bucketId}`,
        );
        if (!downloadResponse.body) {
          throw new Error(`Storage returned an empty body for an object in ${bucketId}`);
        }

        await pipeline(Readable.fromWeb(downloadResponse.body), createWriteStream(destination, { mode: 0o600 }));
        manifest.objects.push({
          bucket_id: bucketId,
          path: objectPath,
          id: entry.id,
          size: entry.metadata?.size ?? null,
          content_type: entry.metadata?.mimetype ?? null,
          cache_control: entry.metadata?.cacheControl ?? null,
          updated_at: entry.updated_at ?? null,
        });
      }

      if (entries.length < PAGE_SIZE) break;
      offset += entries.length;
    }
  }

  for (const bucket of buckets) {
    await downloadFolder(bucket.id);
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  console.log(`Backed up ${manifest.objects.length} Storage objects from ${buckets.length} buckets.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
