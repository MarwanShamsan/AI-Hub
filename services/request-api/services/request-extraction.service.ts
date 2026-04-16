import pdfParse from "pdf-parse";
import type { RequestFileBlobRecord } from "../repositories/request-file.repository";

export type ExtractionResult = {
  source_type: "PDF_TEXT" | "PDF_OCR" | "IMAGE_OCR" | "MANUAL_MERGE";
  extracted_text: string | null;
  extracted_payload: Record<string, unknown>;
  confidence_payload: Record<string, unknown>;
  missing_fields: string[];
  warnings: string[];
};

type ProductCategory =
  | "SOLAR_MODULE"
  | "BATTERY"
  | "PUMP"
  | "GENERATOR"
  | "MOTOR"
  | "TEXTILE"
  | "FOOD_PRODUCT"
  | "GENERIC_INDUSTRIAL_PRODUCT"
  | "UNKNOWN";

export class RequestExtractionService {
  async extractFromFile(input: {
    file: RequestFileBlobRecord;
    fallbackRequestData: Record<string, unknown>;
  }): Promise<ExtractionResult> {
    const { file, fallbackRequestData } = input;

    const isPdf =
      file.content_type.includes("pdf") ||
      file.file_name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return this.buildFallbackExtraction({
        fallbackRequestData,
        warning: `Unsupported extraction source for now: ${file.file_name}`
      });
    }

    const parsed = await pdfParse(file.file_data);
    const rawText = normalizePdfText(parsed.text || "");

    if (!rawText) {
      return this.buildFallbackExtraction({
        fallbackRequestData,
        warning: `PDF text extraction returned empty text for ${file.file_name}. OCR fallback is not implemented yet.`
      });
    }

    const lines = getNonEmptyLines(rawText);

    const documentType = classifyDocument(rawText, file.file_name);
    const productCategory = classifyProductCategory(rawText, file.file_name);

    const documentTitle = extractDocumentTitle(lines, file.file_name);
    const manufacturerName = extractManufacturer(lines, rawText);
    const brandName = extractBrandName(lines);
    const modelNumber = extractModelNumber(lines, file.file_name);
    const productName = extractProductName(lines, rawText, productCategory);
    const countryHint = inferCountryFromText(rawText);
    const detectedMarks = extractCertificationMarks(rawText);
    const dimensions = extractDimensions(lines, rawText);
    const weight = extractWeight(lines, rawText);
    const packagingInfo = extractPackagingInfo(lines, rawText);
    const summary = buildSummary({
      productName,
      modelNumber,
      manufacturerName,
      productCategory
    });

    const genericProfile = removeEmptyValues({
      document_title: documentTitle,
      manufacturer_name: manufacturerName,
      brand_name: brandName,
      product_name: productName,
      model_number: modelNumber,
      product_category: productCategory,
      declared_country_hint: countryHint,
      detected_marks: detectedMarks
    });

    const generalSpecs = removeEmptyValues({
      dimensions,
      weight,
      packaging_info: packagingInfo
    });

    const categorySpecificSpecs = this.extractCategorySpecificSpecs({
      productCategory,
      lines,
      rawText
    });

    const mergedRequestPayload = {
      request_title: firstNonEmpty(
        buildRequestTitle({
          productName,
          modelNumber,
          categorySpecificSpecs
        }),
        normalizeFallbackValue(fallbackRequestData["request_title"])
      ),
      destination_country: normalizeFallbackValue(
        fallbackRequestData["destination_country"]
      ),
      quantity_value: normalizeFallbackValue(
        fallbackRequestData["quantity_value"]
      ),
      quantity_unit: normalizeFallbackValue(
        fallbackRequestData["quantity_unit"]
      ),
      request_brief: firstNonEmpty(
        buildRequestBrief({
          productName,
          modelNumber,
          manufacturerName,
          productCategory,
          categorySpecificSpecs
        }),
        normalizeFallbackValue(fallbackRequestData["request_brief"]),
        summary
      ),
      preferred_supplier_country: firstNonEmpty(
        normalizeFallbackValue(fallbackRequestData["preferred_supplier_country"]),
        countryHint
      ),
      certifications_required: firstNonEmpty(
        normalizeFallbackValue(fallbackRequestData["certifications_required"]),
        detectedMarks.join(", ")
      ),
      packaging_requirements: firstNonEmpty(
        normalizeFallbackValue(fallbackRequestData["packaging_requirements"]),
        formatPackagingInfo(packagingInfo)
      ),
      shipping_preference: normalizeFallbackValue(
        fallbackRequestData["shipping_preference"]
      ),
      budget_range: normalizeFallbackValue(fallbackRequestData["budget_range"]),
      target_delivery_timeline: normalizeFallbackValue(
        fallbackRequestData["target_delivery_timeline"]
      )
    };

    const extractedPayload: Record<string, unknown> = {
      document_type: documentType,
      document_profile: genericProfile,
      general_specs: generalSpecs,
      category_specific_specs: {
        schema: categorySpecificSpecs.schema,
        fields: categorySpecificSpecs.fields
      },
      merged_request_payload: mergedRequestPayload
    };

    const confidencePayload = removeEmptyValues({
      document_type: documentType === "PRODUCT_DATASHEET" ? 0.97 : 0.8,
      document_title: documentTitle ? 0.8 : 0.2,
      manufacturer_name: manufacturerName ? 0.88 : 0.2,
      brand_name: brandName ? 0.72 : 0.15,
      product_name: productName ? 0.9 : 0.25,
      model_number: modelNumber ? 0.92 : 0.2,
      product_category: productCategory !== "UNKNOWN" ? 0.85 : 0.25,
      country_hint: countryHint ? 0.7 : 0.1,
      detected_marks: detectedMarks.length > 0 ? 0.72 : 0.1,
      dimensions: dimensions ? 0.9 : 0.2,
      weight: weight ? 0.9 : 0.2,
      packaging_info: Object.keys(packagingInfo).length > 0 ? 0.84 : 0.15,
      category_specific_specs:
        Object.keys(categorySpecificSpecs.fields).length > 0 ? 0.86 : 0.2
    });

    const missingFields = [
      !mergedRequestPayload.destination_country ? "destination_country" : null,
      !mergedRequestPayload.quantity_value ? "quantity_value" : null,
      !mergedRequestPayload.quantity_unit ? "quantity_unit" : null,
      !mergedRequestPayload.shipping_preference ? "shipping_preference" : null,
      !mergedRequestPayload.budget_range ? "budget_range" : null,
      !mergedRequestPayload.target_delivery_timeline
        ? "target_delivery_timeline"
        : null
    ].filter(Boolean) as string[];

    const warnings: string[] = [];

    if (!manufacturerName) {
      warnings.push("Manufacturer name was not confidently identified.");
    }

    if (!productName) {
      warnings.push("Product name was not confidently identified.");
    }

    if (!modelNumber) {
      warnings.push("Model number was not confidently identified.");
    }

    if (productCategory === "UNKNOWN") {
      warnings.push(
        "Product category could not be confidently classified; generic extraction was used."
      );
    }

    if (detectedMarks.length > 0) {
      warnings.push(
        "Certification marks were detected from document content only; authoritative verification is not performed at request layer."
      );
    }

    if (rawText.length < 100) {
      warnings.push("Extracted PDF text is unusually short; OCR fallback may be needed.");
    }

    return {
      source_type: "PDF_TEXT",
      extracted_text: rawText,
      extracted_payload: extractedPayload,
      confidence_payload: confidencePayload,
      missing_fields: missingFields,
      warnings
    };
  }

  private extractCategorySpecificSpecs(input: {
    productCategory: ProductCategory;
    lines: string[];
    rawText: string;
  }): {
    schema: string;
    fields: Record<string, unknown>;
  } {
    const { productCategory, lines, rawText } = input;

    switch (productCategory) {
      case "SOLAR_MODULE":
        return {
          schema: "solar_module",
          fields: removeEmptyValues({
            variant: extractVariant(lines),
            rated_power: extractRatedPower(lines),
            module_efficiency: extractModuleEfficiency(lines),
            peak_power: extractPeakPower(lines),
            max_power_voltage: extractVmp(lines),
            max_power_current: extractImp(lines),
            open_circuit_voltage: extractVoc(lines),
            short_circuit_current: extractIsc(lines),
            operating_temperature: extractOperatingTemperature(lines),
            max_system_voltage: extractMaxSystemVoltage(lines),
            solar_cells: extractSolarCells(lines),
            arrangement: extractArrangement(lines),
            front_glass: extractFrontGlass(lines),
            back_glass: extractBackGlass(lines),
            frame: extractFrame(lines),
            junction_box: extractJunctionBox(lines),
            cables: extractCables(lines),
            connectors: extractConnectors(lines),
            bifaciality: extractBifaciality(lines),
            max_load_capacity: extractMaximumLoad(lines),
            nominal_operating_cell_temperature: extractNmot(lines),
            temperature_coefficient_pmax: extractTempCoeffPmax(lines),
            temperature_coefficient_voc: extractTempCoeffVoc(lines),
            temperature_coefficient_isc: extractTempCoeffIsc(lines)
          })
        };

      case "BATTERY":
        return {
          schema: "battery",
          fields: removeEmptyValues({
            nominal_voltage: extractLooseByKeywords(
              lines,
              [/nominal voltage/i, /rated voltage/i],
              /(\d+(?:\.\d+)?\s?V)\b/i
            ),
            capacity: extractLooseByKeywords(
              lines,
              [/capacity/i, /rated capacity/i],
              /(\d+(?:\.\d+)?\s?(?:Ah|mAh|Wh|kWh))\b/i
            ),
            cycle_life: extractLooseByKeywords(
              lines,
              [/cycle life/i],
              /(\d+(?:,\d+)?\+?\s?cycles?)\b/i
            ),
            chemistry: extractLooseByKeywords(
              lines,
              [/chemistry/i, /cell type/i],
              /(LiFePO4|LFP|NMC|Lithium[-\s]?ion|Lead[-\s]?acid)/i
            )
          })
        };

      case "PUMP":
        return {
          schema: "pump",
          fields: removeEmptyValues({
            flow_rate: extractLooseByKeywords(
              lines,
              [/flow rate/i, /\bflow\b/i, /capacity/i],
              /(\d+(?:\.\d+)?\s?(?:m3\/h|L\/min|m³\/h|gpm))\b/i
            ),
            head: extractLooseByKeywords(
              lines,
              [/head/i, /max head/i],
              /(\d+(?:\.\d+)?\s?m)\b/i
            ),
            motor_power: extractLooseByKeywords(
              lines,
              [/power/i, /motor power/i],
              /(\d+(?:\.\d+)?\s?(?:kW|W|HP))\b/i
            )
          })
        };

      case "GENERATOR":
        return {
          schema: "generator",
          fields: removeEmptyValues({
            rated_power: extractLooseByKeywords(
              lines,
              [/rated power/i, /power output/i],
              /(\d+(?:\.\d+)?\s?(?:kW|W|kVA|VA))\b/i
            ),
            voltage: extractLooseByKeywords(
              lines,
              [/voltage/i],
              /(\d+(?:\.\d+)?\s?V)\b/i
            ),
            frequency: extractLooseByKeywords(
              lines,
              [/frequency/i],
              /(\d+(?:\.\d+)?\s?Hz)\b/i
            )
          })
        };

      case "MOTOR":
        return {
          schema: "motor",
          fields: removeEmptyValues({
            rated_power: extractLooseByKeywords(
              lines,
              [/rated power/i, /power/i],
              /(\d+(?:\.\d+)?\s?(?:kW|W|HP))\b/i
            ),
            voltage: extractLooseByKeywords(
              lines,
              [/voltage/i],
              /(\d+(?:\.\d+)?\s?V)\b/i
            ),
            speed: extractLooseByKeywords(
              lines,
              [/speed/i, /\brpm\b/i],
              /(\d+(?:\.\d+)?\s?rpm)\b/i
            )
          })
        };

      case "TEXTILE":
        return {
          schema: "textile",
          fields: removeEmptyValues({
            material: extractLooseByKeywords(
              lines,
              [/material/i, /composition/i, /fabric/i],
              /(cotton|polyester|nylon|wool|silk|viscose|spandex|blend)/i
            ),
            gsm: extractLooseByKeywords(
              lines,
              [/gsm/i, /weight/i],
              /(\d+(?:\.\d+)?\s?gsm)\b/i
            ),
            width: extractLooseByKeywords(
              lines,
              [/width/i],
              /(\d+(?:\.\d+)?\s?(?:cm|mm|m|inch|in))\b/i
            )
          })
        };

      case "FOOD_PRODUCT":
        return {
          schema: "food_product",
          fields: removeEmptyValues({
            net_weight: extractLooseByKeywords(
              lines,
              [/net weight/i, /weight/i],
              /(\d+(?:\.\d+)?\s?(?:kg|g|lb|lbs))\b/i
            ),
            shelf_life: extractLooseByKeywords(
              lines,
              [/shelf life/i],
              /(\d+(?:\.\d+)?\s?(?:months?|days?|years?))\b/i
            ),
            ingredients: extractLineTail(
              lines,
              /ingredients/i,
              /ingredients[:\s]+(.+)/i
            )
          })
        };

      case "GENERIC_INDUSTRIAL_PRODUCT":
      case "UNKNOWN":
      default:
        return {
          schema: "generic_product",
          fields: removeEmptyValues({
            rated_power: extractLooseByKeywords(
              lines,
              [/rated power/i, /\bpower\b/i],
              /(\d+(?:\.\d+)?\s?(?:kW|W|HP|kVA|VA))\b/i
            ),
            voltage: extractLooseByKeywords(
              lines,
              [/voltage/i],
              /(\d+(?:\.\d+)?\s?V)\b/i
            ),
            capacity: extractLooseByKeywords(
              lines,
              [/capacity/i],
              /(\d+(?:\.\d+)?\s?(?:Ah|mAh|Wh|kWh|L|m3\/h|m³\/h|kg\/h))\b/i
            )
          })
        };
    }
  }

  private buildFallbackExtraction(input: {
    fallbackRequestData: Record<string, unknown>;
    warning: string;
  }): ExtractionResult {
    return {
      source_type: "MANUAL_MERGE",
      extracted_text: null,
      extracted_payload: {
        document_type: "UNKNOWN",
        merged_request_payload: input.fallbackRequestData
      },
      confidence_payload: {},
      missing_fields: [],
      warnings: [input.warning]
    };
  }
}

function normalizePdfText(input: string): string {
  return input
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getNonEmptyLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitSections(text: string): {
  identity: string;
  electrical: string;
  mechanical: string;
  packing: string;
  dimensions: string;
  temperature: string;
  full: string;
} {
  return {
    identity:
      sliceByHeading(text, /TOPCon|Mono-crystalline|PV Module|Datasheet/i, /Electrical Specifications/i) ||
      text,
    electrical: sliceByHeading(
      text,
      /Electrical Specifications/i,
      /Mechanical Specifications/i
    ),
    mechanical: sliceByHeading(
      text,
      /Mechanical Specifications/i,
      /Packing Configuration/i
    ),
    packing: sliceByHeading(
      text,
      /Packing Configuration/i,
      /Dimensions of PV Module/i
    ),
    dimensions: sliceByHeading(
      text,
      /Dimensions of PV Module/i,
      /Temperature Characteristics/i
    ),
    temperature: sliceByHeading(
      text,
      /Temperature Characteristics/i,
      /I-V & P-V Curves/i
    ),
    full: text
  };
}

function sliceByHeading(text: string, start: RegExp, end?: RegExp): string {
  const startMatch = text.match(start);
  if (!startMatch || startMatch.index == null) return "";

  const from = startMatch.index;
  const next = end ? text.slice(from).match(end) : null;
  const to =
    next && next.index != null
      ? from + next.index
      : text.length;

  return text.slice(from, to).trim();
}

function classifyDocument(text: string, fileName: string): string {
  const lower = `${fileName} ${text}`.toLowerCase();

  if (
    lower.includes("datasheet") ||
    lower.includes("electrical specifications") ||
    lower.includes("mechanical specifications")
  ) {
    return "PRODUCT_DATASHEET";
  }

  if (lower.includes("catalog")) {
    return "PRODUCT_CATALOG";
  }

  if (lower.includes("specification")) {
    return "PRODUCT_SPECIFICATION";
  }

  return "GENERIC_PRODUCT_DOCUMENT";
}

function classifyProductCategory(text: string, fileName: string): ProductCategory {
  const lower = `${fileName} ${text}`.toLowerCase();

  if (
    lower.includes("pv module") ||
    lower.includes("solar pv") ||
    lower.includes("bifacial") ||
    lower.includes("topcon") ||
    lower.includes("mono-crystalline")
  ) {
    return "SOLAR_MODULE";
  }

  if (
    lower.includes("battery") ||
    lower.includes("lifepo4") ||
    lower.includes("lithium-ion") ||
    lower.includes("lithium ion") ||
    lower.includes("cell voltage")
  ) {
    return "BATTERY";
  }

  if (
    lower.includes("pump") ||
    lower.includes("flow rate") ||
    lower.includes("max head")
  ) {
    return "PUMP";
  }

  if (
    lower.includes("generator") ||
    lower.includes("genset") ||
    lower.includes("power output")
  ) {
    return "GENERATOR";
  }

  if (
    lower.includes("motor") ||
    lower.includes("rpm") ||
    lower.includes("torque")
  ) {
    return "MOTOR";
  }

  if (
    lower.includes("fabric") ||
    lower.includes("textile") ||
    lower.includes("gsm") ||
    lower.includes("composition")
  ) {
    return "TEXTILE";
  }

  if (
    lower.includes("ingredients") ||
    lower.includes("nutrition") ||
    lower.includes("shelf life")
  ) {
    return "FOOD_PRODUCT";
  }

  if (
    lower.includes("module") ||
    lower.includes("specification") ||
    lower.includes("datasheet")
  ) {
    return "GENERIC_INDUSTRIAL_PRODUCT";
  }

  return "UNKNOWN";
}

function extractDocumentTitle(lines: string[], fileName: string): string {
  const title =
    lines.find((line) =>
      /datasheet|catalog|specification|product sheet/i.test(line)
    ) ||
    lines.find((line) =>
      /(PV Module|Solar PV Modules?|Battery|Pump|Generator|Motor|Textile|Fabric)/i.test(
        line
      )
    );

  return title ? cleanInlineValue(title) : stripPdfExtension(fileName);
}

function extractManufacturer(lines: string[], fullText: string): string {
  const exact =
    lines.find((line) => /Ningbo Zhongyi New Energy Co\., Ltd\./i.test(line)) ||
    lines.find((line) => /\b[A-Z][A-Za-z&.,\-\s]+Co\., Ltd\.\b/i.test(line));

  if (exact) return cleanInlineValue(exact);

  const textMatch = fullText.match(/\b([A-Z][A-Za-z&.,\-\s]+Co\., Ltd\.)\b/i);
  return textMatch?.[1] ? cleanInlineValue(textMatch[1]) : "";
}

function extractBrandName(lines: string[]): string {
  const candidates = [
    lines.find((line) => /renepv/i.test(line)),
    lines.find((line) => /brand[:\s]/i.test(line))
  ].filter(Boolean) as string[];

  if (candidates.length === 0) return "";

  const brandLine = candidates[0];
  const match = brandLine.match(/(renepv|brand[:\s]+.+)$/i);
  if (!match) return cleanInlineValue(brandLine);

  return cleanInlineValue(
    match[1].replace(/^brand[:\s]+/i, "")
  );
}

function extractModelNumber(lines: string[], fileName: string): string {
  const direct =
    lines.find((line) => /\bZY\d+[A-Z0-9\-]+\b/i.test(line)) ||
    lines.find((line) => /\b[A-Z0-9]{6,}-[A-Z0-9\-]{2,}\b/.test(line)) ||
    "";

  if (direct) {
    const match =
      direct.match(/\b(ZY\d+[A-Z0-9\-]+)\b/i) ||
      direct.match(/\b([A-Z0-9]{6,}-[A-Z0-9\-]{2,})\b/);
    if (match?.[1]) return cleanInlineValue(match[1]);
  }

  const byLabel = valueFromNeighborLine(
    lines,
    /Module Type|Model/i,
    /\b(ZY\d+[A-Z0-9\-]+|[A-Z0-9]{6,}-[A-Z0-9\-]{2,})\b/i,
    3
  );
  if (byLabel) return byLabel;

  return stripPdfExtension(fileName);
}

function extractProductName(
  lines: string[],
  fullText: string,
  productCategory: ProductCategory
): string {
  const preferred =
    lines.find((line) => /TOPCon Mono-crystalline Bifacial Module/i.test(line)) ||
    lines.find((line) => /TOPCon Mono-crystalline PV Module/i.test(line)) ||
    lines.find((line) => /Mono-crystalline Solar PV Modules?/i.test(line)) ||
    lines.find((line) =>
      /(battery|pump|generator|motor|fabric|textile)/i.test(line)
    );

  if (preferred) return cleanInlineValue(preferred);

  switch (productCategory) {
    case "BATTERY":
      return firstMatchingText(fullText, [
        /(Lithium[-\s]?ion Battery)/i,
        /(LiFePO4 Battery)/i,
        /(Battery Pack)/i
      ]);

    case "PUMP":
      return firstMatchingText(fullText, [
        /(Water Pump)/i,
        /(Centrifugal Pump)/i,
        /(Pump)/i
      ]);

    case "GENERATOR":
      return firstMatchingText(fullText, [
        /(Diesel Generator)/i,
        /(Generator Set)/i,
        /(Generator)/i
      ]);

    case "MOTOR":
      return firstMatchingText(fullText, [
        /(Electric Motor)/i,
        /(AC Motor)/i,
        /(DC Motor)/i,
        /(Motor)/i
      ]);

    case "TEXTILE":
      return firstMatchingText(fullText, [
        /(Textile Fabric)/i,
        /(Fabric)/i,
        /(Woven Fabric)/i,
        /(Knitted Fabric)/i
      ]);

    default:
      return "";
  }
}

function extractDimensions(lines: string[], fullText: string): string {
  return (
    valueFromNeighborLine(
      lines,
      /Module Dimensions|Dimensions|Overall Dimensions|Size/i,
      /(\d{2,5}\s?[*x×]\s?\d{2,5}\s?[*x×]\s?\d{1,4}\s?(?:mm|cm|m|inch|in))/i,
      3
    ) ||
    extractDimensionsLoose(fullText)
  );
}

function extractWeight(lines: string[], fullText: string): string {
  return (
    valueFromNeighborLine(
      lines,
      /Module Weight|Net Weight|Weight/i,
      /(\d+(?:\.\d+)?\s?(?:kg|g|lb|lbs))/i,
      2
    ) ||
    extractLooseByKeywords(
      lines,
      [/weight/i],
      /(\d+(?:\.\d+)?\s?(?:kg|g|lb|lbs))/i
    ) ||
    extractLooseByKeywords(
      getNonEmptyLines(fullText),
      [/weight/i],
      /(\d+(?:\.\d+)?\s?(?:kg|g|lb|lbs))/i
    )
  );
}

function extractPackagingInfo(
  lines: string[],
  fullText: string
): Record<string, string> {
  const line =
    lines.find((l) => /40'?HQ Container/i.test(l)) ||
    lines.find((l) => /pcs\/pallet/i.test(l)) ||
    getNonEmptyLines(fullText).find((l) => /40'?HQ Container/i.test(l));

  if (!line) {
    return {};
  }

  return removeEmptyValues({
    pcs_per_pallet: line.match(/(\d+)\s*pcs\/pallet/i)?.[1] || "",
    pallets_per_40hq: line.match(/(\d+)\s*pallets\/40'?HQ/i)?.[1] || "",
    pcs_per_40hq:
      line.match(/40'?HQ.*?(\d+)\s*pcs\b/i)?.[1] ||
      line.match(/(\d+)\s*pcs\s*$/i)?.[1] ||
      ""
  });
}

function extractCertificationMarks(text: string): string[] {
  const candidates = ["ISO", "IEC", "TUV SUD", "TUV", "CE", "UL", "RoHS", "FCC"];

  return candidates.filter((item) => {
    const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });
}

function extractVariant(lines: string[]): string {
  const line = lines.find((l) => /\bM\d{3}-\d{2}[A-Z]?\b/i.test(l));
  if (!line) return "";
  const match = line.match(/\b(M\d{3}-\d{2}[A-Z]?)\b/i);
  return match?.[1] ? cleanInlineValue(match[1]) : "";
}

function extractRatedPower(lines: string[]): string {
  const exact = lines.find((line) => /\b\d{2,4}W\b/i.test(line));
  if (exact) {
    const match = exact.match(/\b(\d{2,4}W)\b/i);
    if (match?.[1]) return cleanInlineValue(match[1]);
  }

  const fromLabel = valueFromNeighborLine(
    lines,
    /Peak Power\(Pmax\)|Rated Power|Power Output/i,
    /(\d+(?:\.\d+)?\s?(?:W|kW|HP|kVA|VA))/i,
    2
  );

  return fromLabel;
}

function extractModuleEfficiency(lines: string[]): string {
  return valueFromNeighborLine(
    lines,
    /Module efficiency|Efficiency/i,
    /(\d{1,2}(?:\.\d+)?)%/i,
    2
  );
}

function extractPeakPower(lines: string[]): string {
  return valueFromNeighborLine(lines, /Peak Power\(Pmax\)|Rated Power/i, /(\d+(?:\.\d+)?)/, 2);
}

function extractVmp(lines: string[]): string {
  return valueFromNeighborLine(lines, /Max\.?Power Voltage\(Vmp\)/i, /(\d+(?:\.\d+)?)/, 2);
}

function extractImp(lines: string[]): string {
  return valueFromNeighborLine(lines, /Max\.?Power Current/i, /(\d+(?:\.\d+)?)/, 2);
}

function extractVoc(lines: string[]): string {
  return valueFromNeighborLine(lines, /Open-circuit Voltage\(Voc\)/i, /(\d+(?:\.\d+)?)/, 2);
}

function extractIsc(lines: string[]): string {
  return valueFromNeighborLine(lines, /Short-circuit Current/i, /(\d+(?:\.\d+)?)/, 2);
}

function extractOperatingTemperature(lines: string[]): string {
  return valueFromNeighborLine(lines, /Operating Temperature/i, /(-?\d+\s?~\s?\+?\d+)/, 2).replace(/\s+/g, "");
}

function extractMaxSystemVoltage(lines: string[]): string {
  return valueFromNeighborLine(
    lines,
    /Max\.?\s*System Voltage/i,
    /(\d+(?:\.\d+)?\s*\(?[A-Z]*\)?)/i,
    2
  );
}

function extractSolarCells(lines: string[]): string {
  return extractLineTail(lines, /Solar Cells/i, /Solar Cells\s+(.+)/i);
}

function extractArrangement(lines: string[]): string {
  return extractLineTail(lines, /Arrangement/i, /Arrangement\s+(.+)/i);
}

function extractFrontGlass(lines: string[]): string {
  return extractLineTail(lines, /Front Glass/i, /Front Glass\s+(.+)/i);
}

function extractBackGlass(lines: string[]): string {
  return extractLineTail(lines, /Back Glass/i, /Back Glass\s+(.+)/i);
}

function extractFrame(lines: string[]): string {
  return extractLineTail(lines, /^Frame\b/i, /Frame\s+(.+)/i);
}

function extractJunctionBox(lines: string[]): string {
  return extractLineTail(lines, /Junction Box/i, /Junction Box\s+(.+)/i);
}

function extractCables(lines: string[]): string {
  return extractLineTail(lines, /Cables/i, /Cables\s+(.+)/i);
}

function extractConnectors(lines: string[]): string {
  return extractLineTail(lines, /Connectors/i, /Connectors\s+(.+)/i);
}

function extractBifaciality(lines: string[]): string {
  return extractLineTail(lines, /Bifaciality/i, /Bifaciality\s+(.+)/i);
}

function extractMaximumLoad(lines: string[]): string {
  return extractLineTail(lines, /Maximum Load Capacity/i, /Maximum Load Capacity\s+(.+)/i);
}

function extractNmot(lines: string[]): string {
  return extractLineTail(
    lines,
    /Nominal Operating Cell Temperature/i,
    /Nominal Operating Cell Temperature.*?([A-Za-z0-9.+\-°\s]+)/i
  );
}

function extractTempCoeffPmax(lines: string[]): string {
  return extractSignedTail(lines, /Temperature Coeffcient \(Pmax\)|Temperature Coefficient \(Pmax\)/i);
}

function extractTempCoeffVoc(lines: string[]): string {
  return extractSignedTail(lines, /Temperature Coefficient \(Voc\)/i);
}

function extractTempCoeffIsc(lines: string[]): string {
  return extractSignedTail(lines, /Temperature Coefficient \(Isc\)/i);
}

function findLineIndex(lines: string[], pattern: RegExp): number {
  return lines.findIndex((line) => pattern.test(line));
}

function valueFromNeighborLine(
  lines: string[],
  labelPattern: RegExp,
  valuePattern: RegExp,
  lookAhead = 2
): string {
  const idx = findLineIndex(lines, labelPattern);
  if (idx < 0) return "";

  for (let i = idx; i <= Math.min(idx + lookAhead, lines.length - 1); i++) {
    const match = lines[i].match(valuePattern);
    if (match?.[1]) return cleanInlineValue(match[1]);
    if (match?.[0]) return cleanInlineValue(match[0]);
  }

  return "";
}

function extractLineTail(
  lines: string[],
  finder: RegExp,
  extractor: RegExp
): string {
  const line = lines.find((l) => finder.test(l));
  if (!line) return "";
  const match = line.match(extractor);
  return match?.[1] ? cleanInlineValue(match[1]) : "";
}

function extractSignedTail(lines: string[], finder: RegExp): string {
  const line = lines.find((l) => finder.test(l));
  if (!line) return "";
  const match = line.match(/([+\-]?\d+(?:\.\d+)?)/);
  return match?.[1] ? cleanInlineValue(match[1]) : "";
}

function extractLooseByKeywords(
  lines: string[],
  keywordPatterns: RegExp[],
  valuePattern: RegExp
): string {
  for (const line of lines) {
    if (keywordPatterns.some((pattern) => pattern.test(line))) {
      const match = line.match(valuePattern);
      if (match?.[1]) return cleanInlineValue(match[1]);
      if (match?.[0]) return cleanInlineValue(match[0]);
    }
  }
  return "";
}

function extractDimensionsLoose(text: string): string {
  const match = text.match(/\b(\d{2,5}\s?[*x×]\s?\d{2,5}\s?[*x×]\s?\d{1,4}\s?(?:mm|cm|m|inch|in))\b/i);
  return match?.[1] ? cleanInlineValue(match[1]) : "";
}

function inferCountryFromText(text: string): string {
  const countries = [
    "China",
    "Germany",
    "Turkey",
    "UAE",
    "Saudi Arabia",
    "India",
    "Italy",
    "France",
    "Spain",
    "USA"
  ];

  for (const country of countries) {
    const re = new RegExp(`\\b${country}\\b`, "i");
    if (re.test(text)) return country;
  }

  return "";
}

function buildRequestTitle(input: {
  productName: string;
  modelNumber: string;
  categorySpecificSpecs: { schema: string; fields: Record<string, unknown> };
}): string {
  const ratedPower =
    typeof input.categorySpecificSpecs.fields["rated_power"] === "string"
      ? input.categorySpecificSpecs.fields["rated_power"]
      : "";

  return firstNonEmpty(
    joinNonEmpty([input.productName, ratedPower]),
    input.productName,
    input.modelNumber
  );
}

function buildRequestBrief(input: {
  productName: string;
  modelNumber: string;
  manufacturerName: string;
  productCategory: ProductCategory;
  categorySpecificSpecs: { schema: string; fields: Record<string, unknown> };
}): string {
  const importantSpecs = summarizeCategorySpecificSpecs(
    input.productCategory,
    input.categorySpecificSpecs.fields
  );

  return joinNonEmpty(
    [
      input.productName,
      input.modelNumber ? `Model ${input.modelNumber}` : "",
      importantSpecs,
      input.manufacturerName ? `Manufacturer ${input.manufacturerName}` : ""
    ],
    " | "
  );
}

function summarizeCategorySpecificSpecs(
  category: ProductCategory,
  fields: Record<string, unknown>
): string {
  switch (category) {
    case "SOLAR_MODULE":
      return joinNonEmpty(
        [
          asLabeled(fields["variant"], "Variant"),
          asLabeled(fields["rated_power"], "Rated power"),
          asLabeled(fields["module_efficiency"], "Module efficiency")
        ],
        " | "
      );

    case "BATTERY":
      return joinNonEmpty(
        [
          asLabeled(fields["chemistry"], "Chemistry"),
          asLabeled(fields["nominal_voltage"], "Voltage"),
          asLabeled(fields["capacity"], "Capacity")
        ],
        " | "
      );

    case "PUMP":
      return joinNonEmpty(
        [
          asLabeled(fields["flow_rate"], "Flow"),
          asLabeled(fields["head"], "Head"),
          asLabeled(fields["motor_power"], "Power")
        ],
        " | "
      );

    case "GENERATOR":
    case "MOTOR":
    case "GENERIC_INDUSTRIAL_PRODUCT":
    case "UNKNOWN":
    default:
      return joinNonEmpty(
        [
          asLabeled(fields["rated_power"], "Rated power"),
          asLabeled(fields["voltage"], "Voltage"),
          asLabeled(fields["capacity"], "Capacity")
        ],
        " | "
      );
  }
}

function asLabeled(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return `${label} ${value}`;
}

function buildSummary(input: {
  productName: string;
  modelNumber: string;
  manufacturerName: string;
  productCategory: ProductCategory;
}): string {
  return joinNonEmpty(
    [
      input.productName,
      input.modelNumber ? `Model ${input.modelNumber}` : "",
      input.manufacturerName ? `Manufacturer ${input.manufacturerName}` : "",
      input.productCategory !== "UNKNOWN"
        ? `Category ${input.productCategory}`
        : ""
    ],
    " | "
  );
}

function firstMatchingText(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanInlineValue(match[1]);
    if (match?.[0]) return cleanInlineValue(match[0]);
  }
  return "";
}

function cleanInlineValue(value: string): string {
  return value
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\|\s+/g, " | ")
    .trim();
}

function joinNonEmpty(values: string[], separator = " "): string {
  return values.filter(Boolean).join(separator).trim();
}

function firstNonEmpty(...values: string[]): string {
  return values.find((value) => !!value && value.trim().length > 0) || "";
}

function stripPdfExtension(name: string): string {
  return name.replace(/\.pdf$/i, "").trim();
}

function normalizeFallbackValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (trimmed.length === 1) return "";
  if (/^(q|n\/a|null|undefined)$/i.test(trimmed)) return "";

  return trimmed;
}

function removeEmptyValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value == null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value as object).length > 0;
      return true;
    })
  ) as Partial<T>;
}

function mergeObjects(
  a: Record<string, string>,
  b: Record<string, string>
): Record<string, string> {
  return removeEmptyValues({ ...a, ...b }) as Record<string, string>;
}

function formatPackagingInfo(packingInfo: Record<string, string>): string {
  return joinNonEmpty(
    [
      packingInfo.pcs_per_pallet
        ? `${packingInfo.pcs_per_pallet} pcs/pallet`
        : "",
      packingInfo.pallets_per_40hq
        ? `${packingInfo.pallets_per_40hq} pallets/40'HQ`
        : "",
      packingInfo.pcs_per_40hq
        ? `${packingInfo.pcs_per_40hq} pcs/40'HQ`
        : ""
    ],
    ", "
  );
}