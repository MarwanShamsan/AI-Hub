import sharp from "sharp";

export type ImageVariantName =
  | "NORMALIZED_COLOR"
  | "NORMALIZED_GRAYSCALE"
  | "HIGH_CONTRAST";

export type PreprocessedImageVariant = {
  name: ImageVariantName;
  buffer: Buffer;
};

function readPositiveInteger(
  environmentVariable: string,
  fallback: number
): number {
  const rawValue = process.env[environmentVariable]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function clampThreshold(value: number): number {
  return Math.min(255, Math.max(0, value));
}

/**
 * Creates several derived OCR images from the original evidence.
 *
 * Important:
 * - The original uploaded document must remain unchanged.
 * - These buffers are only temporary OCR inputs.
 * - They must never replace the original evidence object.
 */
export async function createImageVariants(
  input: Buffer
): Promise<PreprocessedImageVariant[]> {
  if (!Buffer.isBuffer(input) || input.length === 0) {
    throw new Error("OCR_IMAGE_BUFFER_EMPTY");
  }

  const targetWidth = readPositiveInteger(
    "OCR_PREPROCESS_WIDTH",
    2400
  );

  const threshold = clampThreshold(
    readPositiveInteger("OCR_BINARY_THRESHOLD", 175)
  );

  const basePipeline = sharp(input, {
    failOn: "error",
    limitInputPixels: 80_000_000
  })
    // Reads EXIF orientation and rotates the image automatically.
    .rotate()
    // Removes transparent backgrounds that can confuse OCR.
    .flatten({
      background: {
        r: 255,
        g: 255,
        b: 255
      }
    })
    // Enlarges small mobile images to make characters easier to read.
    .resize({
      width: targetWidth,
      fit: "inside",
      withoutEnlargement: false,
      fastShrinkOnLoad: true
    });

  const normalizedColor = await basePipeline
    .clone()
    .normalize()
    .sharpen({
      sigma: 1.1
    })
    .png({
      compressionLevel: 6
    })
    .toBuffer();

  const normalizedGrayscale = await basePipeline
    .clone()
    .grayscale()
    .normalize()
    .sharpen({
      sigma: 1.2
    })
    .png({
      compressionLevel: 6
    })
    .toBuffer();

  const highContrast = await basePipeline
    .clone()
    .grayscale()
    .normalize()
    .median(3)
    .threshold(threshold)
    .png({
      compressionLevel: 6
    })
    .toBuffer();

  return [
    {
      name: "NORMALIZED_COLOR",
      buffer: normalizedColor
    },
    {
      name: "NORMALIZED_GRAYSCALE",
      buffer: normalizedGrayscale
    },
    {
      name: "HIGH_CONTRAST",
      buffer: highContrast
    }
  ];
}