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
    const convertedName = `${Date.now()}-${nameWithoutExtension}.webp`;
    const blob = bucket.file(convertedName);

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

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const compressed = await compressToWebpBuffer(file);
      const processedName = file.name.replace(/\.[^.]+$/, ".webp");
      const processedMimeType = "image/webp";

      const uploadFile: File | Blob = FileCtor
        ? new FileCtor([new Uint8Array(compressed)], processedName, {
            type: processedMimeType,
          })
        : new Blob([new Uint8Array(compressed)], { type: processedMimeType });

      return ai.files.upload({
        file: uploadFile,
        config: {
          displayName: processedName,
          mimeType: processedMimeType,
        },
      });
    }),
  );

  return uploaded.map((f) => createPartFromUri(f.uri as string, f.mimeType as string));
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

