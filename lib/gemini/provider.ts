import { Storage } from "@google-cloud/storage";
import { createPartFromUri, GoogleGenAI } from "@google/genai";
import { getVercelOidcToken } from "@vercel/oidc";
import type { GoogleAuthOptions } from "google-auth-library";
import { ExternalAccountClient } from "google-auth-library";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

export type GeminiProviderName = "vertex" | "studio";

type UploadedFilePart = {
  uri: string;
  mimeType: string;
};

let cachedGoogleApplicationCredentialsPath: string | undefined;

function getGeminiProviderName(): GeminiProviderName {
  const raw = (process.env.GEMINI_PROVIDER ?? "vertex").toLowerCase();
  if (raw === "vertex" || raw === "studio") return raw;
  return "vertex";
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function ensureGoogleApplicationCredentialsFromJsonEnv() {
  const raw = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  if (!raw) return;

  if (cachedGoogleApplicationCredentialsPath) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ??
      cachedGoogleApplicationCredentialsPath;
    return;
  }

  // Vercel/serverless: write credentials to a temporary file and let Google SDKs
  // pick it up via GOOGLE_APPLICATION_CREDENTIALS (ADC-compatible).
  const parsed = JSON.parse(raw) as { type?: string; client_email?: string; private_key?: string };
  if (parsed?.type === "external_account") {
    // Workload Identity Federation / external account JSON.
  } else if (!parsed?.client_email || !parsed?.private_key) {
    throw new Error(
      "Invalid GOOGLE_CLOUD_CREDENTIALS_JSON: expected a service account JSON or external_account JSON.",
    );
  }

  const tmpPath = path.join(os.tmpdir(), "google-application-credentials.json");

  if (!fs.existsSync(tmpPath)) {
    fs.writeFileSync(tmpPath, raw, { encoding: "utf8" });
  }

  cachedGoogleApplicationCredentialsPath = tmpPath;
  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ?? tmpPath;
}

function resolveVercelOidcJwt(opts?: { vercelOidcToken?: string }) {
  return (
    opts?.vercelOidcToken?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() ||
    undefined
  );
}

function createVercelWorkloadIdentityAuthClient(opts?: {
  vercelOidcToken?: string;
}) {
  const projectNumber = requireEnv(
    "GCP_PROJECT_NUMBER",
    process.env.GCP_PROJECT_NUMBER,
  );
  const poolId = requireEnv(
    "GCP_WORKLOAD_IDENTITY_POOL_ID",
    process.env.GCP_WORKLOAD_IDENTITY_POOL_ID,
  );
  const providerId = requireEnv(
    "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
    process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID,
  );
  const serviceAccountEmail = requireEnv(
    "GCP_SERVICE_ACCOUNT_EMAIL",
    process.env.GCP_SERVICE_ACCOUNT_EMAIL,
  );

  const audience = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;

  const explicitJwt = resolveVercelOidcJwt(opts);

  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      // Prefer an explicit JWT captured from the incoming request header on Vercel.
      // Fall back to Vercel's helper (uses VERCEL_OIDC_TOKEN during builds / runtime).
      getSubjectToken: async () => {
        if (explicitJwt) return explicitJwt;
        return await getVercelOidcToken();
      },
    },
  });

  if (!authClient) {
    throw new Error("Failed to initialize ExternalAccountClient for Workload Identity Federation.");
  }

  return authClient;
}

function wrapAuthClientForGenaiHeadersIterable<
  T extends { getRequestHeaders: (...args: never[]) => Promise<unknown> },
>(
  authClient: T,
) {
  const orig = authClient.getRequestHeaders.bind(authClient);
  return {
    ...authClient,
    getRequestHeaders: (async (...args: never[]) => {
      const headers = await orig(...args);
      // google-auth-library returns Record<string, string>, while `@google/genai`
      // expects an iterable of entries.
      return Object.entries(headers as Record<string, string>);
    }) as unknown as T["getRequestHeaders"],
  };
}

function getVertexGoogleAuthOptions(opts?: {
  vercelOidcToken?: string;
}): GoogleAuthOptions | undefined {
  // Preferred on Vercel: Workload Identity Federation using the Vercel OIDC JWT.
  if (
    process.env.GCP_PROJECT_NUMBER &&
    process.env.GCP_WORKLOAD_IDENTITY_POOL_ID &&
    process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID &&
    process.env.GCP_SERVICE_ACCOUNT_EMAIL
  ) {
    const authClient = createVercelWorkloadIdentityAuthClient(opts);
    // For GenAI we wrap headers to be iterable; for GCS we must keep the original
    // google-auth-library semantics (plain object headers) to avoid anonymous calls.
    const genaiAuthClient = wrapAuthClientForGenaiHeadersIterable(authClient);
    return { authClient: genaiAuthClient as unknown as GoogleAuthOptions["authClient"] };
  }

  // Local/dev: allow classic key JSON via env, or ambient ADC via GOOGLE_APPLICATION_CREDENTIALS.
  if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    ensureGoogleApplicationCredentialsFromJsonEnv();
  }

  return undefined;
}

async function compressToWebpBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  return sharp(inputBuffer)
    .rotate()
    .resize(2048, 2048, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 75,
      effort: 4,
      lossless: false,
    })
    .toBuffer();
}

async function buildVertexFileParts(files: File[], authOpts?: GoogleAuthOptions) {
  const bucketName = requireEnv(
    "GOOGLE_CLOUD_STORAGE_BUCKET",
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
  );

  const storage =
    authOpts?.authClient
      ? new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT,
          // GCS client expects google-auth-library style headers (plain object),
          // so we intentionally do NOT pass the GenAI-wrapped authClient here.
          authClient: createVercelWorkloadIdentityAuthClient() as never,
        })
      : new Storage();

  async function uploadToGCS(file: File): Promise<UploadedFilePart> {
    const bucket = storage.bucket(bucketName);

    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
    const convertedName = `${nameWithoutExtension}.webp`;
    const blob = bucket.file(convertedName);

    const [exists] = await blob.exists();
    if (exists) {
      return {
        uri: `gs://${bucketName}/${convertedName}`,
        mimeType: "image/webp",
      };
    }

    const compressedBuffer = await compressToWebpBuffer(file);

    await blob.save(compressedBuffer, {
      metadata: {
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000",
      },
    });

    return {
      uri: `gs://${bucketName}/${convertedName}`,
      mimeType: "image/webp",
    };
  }

  const uploaded = await Promise.all(files.map(uploadToGCS));
  return uploaded.map((f) => createPartFromUri(f.uri, f.mimeType));
}

async function buildStudioFileParts(ai: GoogleGenAI, files: File[]) {
  const FileCtor: undefined | (new (bits: BlobPart[], name: string, options?: FilePropertyBag) => File) =
    // Some Node runtimes (e.g. node:18-alpine) may not provide global File.
    typeof File !== "undefined" ? File : undefined;

  const existingFiles = new Map<string, { uri: string; mimeType: string }>();
  try {
    const pager = await ai.files.list({ config: { pageSize: 100 } });
    for (const f of pager.page ?? []) {
      if (f.displayName && f.uri && f.state === "ACTIVE") {
        existingFiles.set(f.displayName, {
          uri: f.uri,
          mimeType: f.mimeType ?? "image/webp",
        });
      }
    }
  } catch {
    // If listing fails, proceed with fresh uploads
  }

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const processedName = file.name.replace(/\.[^.]+$/, ".webp");
      const processedMimeType = "image/webp";

      const existing = existingFiles.get(processedName);
      if (existing) {
        return existing;
      }

      const compressed = await compressToWebpBuffer(file);

      const uploadFile: File | Blob = FileCtor
        ? new FileCtor([new Uint8Array(compressed)], processedName, {
            type: processedMimeType,
          })
        : new Blob([new Uint8Array(compressed)], { type: processedMimeType });

      const result = await ai.files.upload({
        file: uploadFile,
        config: {
          displayName: processedName,
          mimeType: processedMimeType,
        },
      });
      return { uri: result.uri as string, mimeType: result.mimeType as string };
    }),
  );

  return uploaded.map((f) => createPartFromUri(f.uri, f.mimeType));
}

export function getGeminiProvider(opts?: {
  providerOverride?: GeminiProviderName;
  vercelOidcToken?: string;
}) {
  const provider = opts?.providerOverride ?? getGeminiProviderName();

  if (provider === "studio") {
    const apiKey = requireEnv(
      "GEMINI_STUDIO_API_KEY",
      process.env.GEMINI_STUDIO_API_KEY,
    );

    const ai = new GoogleGenAI({ apiKey });
    return {
      provider,
      ai,
      buildFileParts: (files: File[]) => buildStudioFileParts(ai, files),
    } as const;
  }

  const googleAuthOptions = getVertexGoogleAuthOptions({
    vercelOidcToken: opts?.vercelOidcToken,
  });

  if (
    process.env.VERCEL === "1" &&
    !googleAuthOptions?.authClient &&
    !process.env.GOOGLE_CLOUD_CREDENTIALS_JSON &&
    !process.env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    throw new Error(
      "Vertex on Vercel requires Workload Identity Federation env vars (GCP_PROJECT_NUMBER, GCP_WORKLOAD_IDENTITY_POOL_ID, GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID, GCP_SERVICE_ACCOUNT_EMAIL) or classic credentials via GOOGLE_CLOUD_CREDENTIALS_JSON / GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }

  // Vertex: relies on GOOGLE_GENAI_USE_VERTEXAI + project/location envs that the SDK reads.
  const ai = new GoogleGenAI({
    vertexai: true,
    googleAuthOptions: googleAuthOptions as never,
  });
  return {
    provider,
    ai,
    buildFileParts: (files: File[]) => buildVertexFileParts(files, googleAuthOptions),
  } as const;
}

