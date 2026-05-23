/** Detect when a document is imaging (X-ray, CT, photo) — verdict must come from Gemini vision, not OCR labs. */
export type ImagingContext = {
  isImaging: boolean;
  isRadiograph: boolean;
  /** Rules/OCR alone cannot produce a clinical verdict. */
  visionRequired: boolean;
};

const RADIOGRAPH_RE =
  /x-?ray|xray|radiograph|radiology|chest\s*(?:pa|ap|x)|pneumonia|bacteria|infiltrat|opacity|ct\s*scan|mri|ultrasound|sonograph|mammogram|ecg|ekg|dexa|fluoroscopy/i;

export function resolveImagingContext(input: {
  name: string;
  category: string;
  mimeType?: string;
  isImagingStudy?: boolean;
  documentType?: string;
}): ImagingContext {
  const blob = `${input.name} ${input.category}`.toLowerCase();
  const isRadiograph =
    RADIOGRAPH_RE.test(blob) ||
    input.documentType === "xray" ||
    input.documentType === "ct_scan";
  const isImageFile = Boolean(input.mimeType?.startsWith("image/"));
  const isImaging =
    Boolean(input.isImagingStudy) ||
    isImageFile ||
    isRadiograph ||
    input.documentType === "xray" ||
    input.documentType === "ct_scan";

  return {
    isImaging,
    isRadiograph,
    visionRequired: isImaging && (isImageFile || isRadiograph || Boolean(input.isImagingStudy)),
  };
}
