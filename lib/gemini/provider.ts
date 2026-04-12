import { Storage } from "@google-cloud/storage";
import { createPartFromUri, GoogleGenAI } from "@google/genai";
import sharp from "sharp";

export type GeminiProviderName = "vertex" | "studio";

type UploadedFilePart = {
  uri: string;
  mimeType: string;
};

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

async function buildVertexFileParts(files: File[]) {
  const bucketName = requireEnv(
    "GOOGLE_CLOUD_STORAGE_BUCKET",
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
  );

  // Uses ambient GCP credentials (ADC).
  const storage = new Storage();

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

export function getGeminiProvider(opts?: { providerOverride?: GeminiProviderName }) {
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

  // Vertex: relies on GOOGLE_GENAI_USE_VERTEXAI + project/location envs that the SDK reads.
  const ai = new GoogleGenAI({vertexai: true});
  return {
    provider,
    ai,
    buildFileParts: (files: File[]) => buildVertexFileParts(files),
  } as const;
}

