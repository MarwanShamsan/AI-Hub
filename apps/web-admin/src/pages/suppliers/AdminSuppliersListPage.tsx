import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiJson } from "../../lib/apiClient";

type AdminSupplierListItem = {
  supplier_id: string;
  tenant_id: string;
  owner_user_id: string;
  qualification_status: string;
  last_decision_reason_code: string | null;
  last_decision_reason_text: string | null;
  supplier_created_at: string;
  supplier_updated_at: string;

  supplier_type: string | null;
  legal_name: string | null;
  registration_number: string | null;
  registration_country: string | null;
  business_category: string | null;
  product_categories: string[];
  operational_contact_name: string | null;
  operational_contact_email: string | null;
  operational_contact_phone: string | null;
  declared_license_expiry_date: string | null;
  profile_created_at: string | null;
  profile_updated_at: string | null;

  latest_review_id: string | null;
  latest_review_decision_status: string | null;
  latest_review_reason_code: string | null;
  latest_review_reason_text: string | null;
  latest_review_decided_at: string | null;

  uploaded_files_count: number;
};

type AdminSuppliersResponse = {
  status: string;
  count: number;
  suppliers: AdminSupplierListItem[];
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function displayValue(value: string | null | undefined): string {
  return value && value.trim() ? value : "-";
}

export default function AdminSuppliersListPage() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<AdminSupplierListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await apiJson<AdminSuppliersResponse>(
        "request",
        "/admin/suppliers",
        { method: "GET" }
      );

      setSuppliers(data.suppliers);
    } catch (err: any) {
      setError(err?.message || "ADMIN_SUPPLIERS_FETCH_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Suppliers</h1>
          <p style={{ marginTop: 8, color: "#5f6b7a" }}>
            Review supplier onboarding status, uploaded files, and open document
            review for each supplier.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "#111827",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div
          style={{
            border: "1px solid #ef4444",
            background: "#fef2f2",
            color: "#991b1b",
            padding: 16,
            borderRadius: 12
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          border: "1px solid #d9e0ea",
          borderRadius: 16,
          background: "#fff",
          overflow: "hidden"
        }}
      >
        {loading ? (
          <div style={{ padding: 20 }}>Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div style={{ padding: 20 }}>No suppliers found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1200
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Legal name
                  </th>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Supplier type
                  </th>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Status
                  </th>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Uploaded files
                  </th>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Registration number
                  </th>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Contact email
                  </th>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Latest review
                  </th>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Updated at
                  </th>
                  <th style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.supplier_id}>
                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {displayValue(supplier.legal_name)}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                        {supplier.supplier_id}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      {displayValue(supplier.supplier_type)}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      <div>{displayValue(supplier.qualification_status)}</div>
                      <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                        {displayValue(supplier.last_decision_reason_code)}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      {supplier.uploaded_files_count}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      {displayValue(supplier.registration_number)}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      {displayValue(supplier.operational_contact_email)}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      <div>
                        {displayValue(supplier.latest_review_decision_status)}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                        {displayValue(supplier.latest_review_reason_code)}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      {formatDateTime(supplier.supplier_updated_at)}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #f1f5f9",
                        verticalAlign: "top"
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/app/suppliers/${supplier.supplier_id}/documents`)
                        }
                        style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid #cbd5e1",
                          background: "#111827",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        Open documents review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}