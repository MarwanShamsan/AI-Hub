import type { RequestExtractionRecord } from "../../services/request-client";

export type CustomerFacingField = {
  label: string;
  value: string;
};

export type CustomerFacingSection = {
  title: string;
  fields: CustomerFacingField[];
};

export type CustomerFacingProposedField = {
  key: string;
  label: string;
  value: string;
  editable: boolean;
};

export type CustomerFacingExtractionView = {
  summary: CustomerFacingField[];
  sections: CustomerFacingSection[];
  proposedRequest: CustomerFacingProposedField[];
  missingFields: string[];
  warnings: string[];
};

export function mapExtractionToCustomerView(
  extraction: RequestExtractionRecord
): CustomerFacingExtractionView {
  const payload = extraction.extracted_payload ?? {};

  const documentProfile = asRecord(payload["document_profile"]);
  const generalSpecs = asRecord(payload["general_specs"]);
  const packingInfo = asRecord(generalSpecs["packaging_info"]);
  const categorySpecific = asRecord(payload["category_specific_specs"]);
  const categoryFields = asRecord(categorySpecific["fields"]);
  const mergedRequest = asRecord(payload["merged_request_payload"]);

  const summary: CustomerFacingField[] = compactFields([
    {
      label: "نوع المستند",
      value: prettifyDocumentType(asString(payload["document_type"]))
    },
    {
      label: "فئة المنتج",
      value: prettifyCategory(asString(documentProfile["product_category"]))
    },
    {
      label: "اسم المنتج",
      value: asString(documentProfile["product_name"])
    },
    {
      label: "الموديل",
      value: asString(documentProfile["model_number"])
    },
    {
      label: "الشركة المصنعة",
      value: asString(documentProfile["manufacturer_name"])
    },
    {
      label: "العلامة التجارية",
      value: asString(documentProfile["brand_name"])
    },
    {
      label: "بلد المورد المرجح",
      value: asString(documentProfile["declared_country_hint"])
    }
  ]);

  const sections: CustomerFacingSection[] = [
    {
      title: "بيانات المنتج",
      fields: compactFields([
        {
          label: "عنوان المستند",
          value: asString(documentProfile["document_title"])
        },
        {
          label: "اسم المنتج",
          value: asString(documentProfile["product_name"])
        },
        {
          label: "الموديل",
          value: asString(documentProfile["model_number"])
        },
        {
          label: "الإصدار / Variant",
          value: asString(categoryFields["variant"])
        },
        {
          label: "الشركة المصنعة",
          value: asString(documentProfile["manufacturer_name"])
        },
        {
          label: "العلامة التجارية",
          value: asString(documentProfile["brand_name"])
        }
      ])
    },
    {
      title: "المواصفات العامة",
      fields: compactFields([
        {
          label: "الأبعاد",
          value: asString(generalSpecs["dimensions"])
        },
        {
          label: "الوزن",
          value: asString(generalSpecs["weight"])
        },
        {
          label: "العلامات / الشهادات المكتشفة",
          value: asArray(documentProfile["detected_marks"]).join(", ")
        }
      ])
    },
    {
      title: "التغليف والشحن",
      fields: compactFields([
        {
          label: "عدد القطع لكل منصة",
          value: asString(packingInfo["pcs_per_pallet"])
        },
        {
          label: "عدد المنصات لكل 40HQ",
          value: asString(packingInfo["pallets_per_40hq"])
        },
        {
          label: "إجمالي القطع لكل 40HQ",
          value: asString(packingInfo["pcs_per_40hq"])
        }
      ])
    },
    {
      title: "المواصفات الفنية",
      fields: compactFields(
        Object.entries(categoryFields).map(([key, value]) => ({
          label: prettifySpecKey(key),
          value: formatUnknown(value)
        }))
      )
    }
  ].filter((section) => section.fields.length > 0);

  const proposedRequest: CustomerFacingProposedField[] = [
    {
      key: "request_title",
      label: "عنوان الطلب المقترح",
      value: asString(mergedRequest["request_title"]),
      editable: true
    },
    {
      key: "request_brief",
      label: "وصف الطلب المقترح",
      value: asString(mergedRequest["request_brief"]),
      editable: true
    },
    {
      key: "destination_country",
      label: "الدولة المستهدفة",
      value: asString(mergedRequest["destination_country"]),
      editable: true
    },
    {
      key: "quantity_value",
      label: "الكمية",
      value: asString(mergedRequest["quantity_value"]),
      editable: true
    },
    {
      key: "quantity_unit",
      label: "وحدة الكمية",
      value: asString(mergedRequest["quantity_unit"]),
      editable: true
    },
    {
      key: "preferred_supplier_country",
      label: "الدولة المفضلة للمورد",
      value: asString(mergedRequest["preferred_supplier_country"]),
      editable: true
    },
    {
      key: "certifications_required",
      label: "الشهادات المطلوبة",
      value: asString(mergedRequest["certifications_required"]),
      editable: true
    },
    {
      key: "packaging_requirements",
      label: "متطلبات التغليف",
      value: asString(mergedRequest["packaging_requirements"]),
      editable: true
    },
    {
      key: "shipping_preference",
      label: "تفضيل الشحن",
      value: asString(mergedRequest["shipping_preference"]),
      editable: true
    },
    {
      key: "budget_range",
      label: "نطاق الميزانية",
      value: asString(mergedRequest["budget_range"]),
      editable: true
    },
    {
      key: "target_delivery_timeline",
      label: "الجدول الزمني للتسليم",
      value: asString(mergedRequest["target_delivery_timeline"]),
      editable: true
    }
  ];

  return {
    summary,
    sections,
    proposedRequest,
    missingFields: asArrayOfStrings(extraction.missing_fields),
    warnings: asArrayOfStrings(extraction.warnings)
  };
}

function compactFields(fields: CustomerFacingField[]): CustomerFacingField[] {
  return fields.filter((field) => field.value.trim().length > 0);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

function asArrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

function formatUnknown(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(String).join(", ");
  return JSON.stringify(value);
}

function prettifyDocumentType(value: string): string {
  switch (value) {
    case "PRODUCT_DATASHEET":
      return "ورقة بيانات منتج";
    case "PRODUCT_CATALOG":
      return "كتالوج منتج";
    case "PRODUCT_SPECIFICATION":
      return "مواصفة منتج";
    case "GENERIC_PRODUCT_DOCUMENT":
      return "مستند منتج عام";
    default:
      return value;
  }
}

function prettifyCategory(value: string): string {
  switch (value) {
    case "SOLAR_MODULE":
      return "وحدة طاقة شمسية";
    case "BATTERY":
      return "بطارية";
    case "PUMP":
      return "مضخة";
    case "GENERATOR":
      return "مولد";
    case "MOTOR":
      return "محرك";
    case "TEXTILE":
      return "منسوجات";
    case "FOOD_PRODUCT":
      return "منتج غذائي";
    case "GENERIC_INDUSTRIAL_PRODUCT":
      return "منتج صناعي عام";
    default:
      return value;
  }
}

function prettifySpecKey(key: string): string {
  const map: Record<string, string> = {
    variant: "الإصدار / Variant",
    rated_power: "القدرة الاسمية",
    module_efficiency: "الكفاءة",
    peak_power: "القدرة القصوى",
    max_power_voltage: "الجهد عند القدرة القصوى",
    max_power_current: "التيار عند القدرة القصوى",
    open_circuit_voltage: "جهد الدائرة المفتوحة",
    short_circuit_current: "تيار القصر",
    operating_temperature: "درجة حرارة التشغيل",
    max_system_voltage: "أقصى جهد للنظام",
    solar_cells: "نوع الخلايا",
    arrangement: "ترتيب الخلايا",
    front_glass: "الزجاج الأمامي",
    back_glass: "الزجاج الخلفي",
    frame: "الإطار",
    junction_box: "صندوق التوصيل",
    cables: "الكابلات",
    connectors: "الموصلات",
    bifaciality: "ثنائية الوجه",
    max_load_capacity: "أقصى حمل",
    nominal_operating_cell_temperature: "درجة حرارة التشغيل الاسمية",
    temperature_coefficient_pmax: "معامل الحرارة للقدرة",
    temperature_coefficient_voc: "معامل الحرارة للجهد المفتوح",
    temperature_coefficient_isc: "معامل الحرارة لتيار القصر",
    nominal_voltage: "الجهد الاسمي",
    capacity: "السعة",
    cycle_life: "العمر الدوري",
    chemistry: "الكيمياء",
    flow_rate: "معدل التدفق",
    head: "الرفع",
    motor_power: "قدرة المحرك",
    voltage: "الجهد",
    frequency: "التردد",
    speed: "السرعة",
    material: "الخامة",
    gsm: "وزن GSM",
    width: "العرض",
    net_weight: "الوزن الصافي",
    shelf_life: "مدة الصلاحية",
    ingredients: "المكونات"
  };

  return map[key] ?? key.replace(/_/g, " ");
}