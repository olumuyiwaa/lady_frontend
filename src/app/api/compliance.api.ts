import { authFetch } from "./authFetch";

const BASE = "/compliance";

export type ComplianceDocType =
  | "SDS"
  | "RISK_ASSESSMENT"
  | "COSHH_ASSESSMENT"
  | "TRAINING_RECORD"
  | "INSPECTION_REPORT"
  | "CERTIFICATE"
  | "OTHER";

export interface ComplianceDocument {
  id: string;
  type: ComplianceDocType;
  title: string;
  storageKey: string;
  mimeType?: string | null;
  fileSize?: number | null;
  version?: string | null;
  effectiveAt?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
  uploadedById?: string | null;
  createdAt: string;
  updatedAt: string;
  inventoryItems?: { id: string; name: string; sku?: string | null }[];
}

export interface ChemicalTrainingAck {
  id: string;
  cleanerId: string;
  documentId: string;
  acknowledgedAt: string;
  notes?: string | null;
  cleaner?: {
    id: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface ComplianceAudit {
  id: string;
  title: string;
  type: string;
  status: string;
  findings?: any;
  score?: number | null;
  conductedAt: string;
  conductedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

// ─── Documents ────────────────────────────────────────────

/** Presigned upload URL under this business's compliance prefix. The returned storageKey is the only key the API will accept for a document. */
export async function getDocumentUploadUrl(contentType: string, filename: string): Promise<{ uploadUrl: string; storageKey: string }> {
  const result = await authFetch(`${BASE}/documents/upload-url`, {
    method: "POST",
    body: JSON.stringify({ contentType, filename }),
  });
  return result.data;
}

/** Uploads the file straight to object storage and returns its storageKey. */
export async function uploadDocumentFile(file: File): Promise<{ storageKey: string; mimeType: string; fileSize: number }> {
  const mimeType = file.type || "";
  const { uploadUrl, storageKey } = await getDocumentUploadUrl(mimeType, file.name);
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": mimeType }, body: file });
  if (!put.ok) throw new Error("Upload failed. Please try again.");
  return { storageKey, mimeType, fileSize: file.size };
}

export async function listDocuments(params?: {
  type?: ComplianceDocType;
  expiringSoon?: boolean;
}): Promise<ComplianceDocument[]> {
  const q = new URLSearchParams();
  if (params?.type) q.set("type", params.type);
  if (params?.expiringSoon) q.set("expiringSoon", "true");
  const qs = q.toString();
  const result = await authFetch(`${BASE}/documents${qs ? `?${qs}` : ""}`);
  return result.data;
}

export async function getDocument(id: string): Promise<ComplianceDocument> {
  const result = await authFetch(`${BASE}/documents/${id}`);
  return result.data;
}

export async function createDocument(data: {
  type?: ComplianceDocType;
  title: string;
  storageKey: string;
  mimeType?: string;
  fileSize?: number;
  version?: string;
  effectiveAt?: string;
  expiresAt?: string;
  notes?: string;
}): Promise<ComplianceDocument> {
  const result = await authFetch(`${BASE}/documents`, { method: "POST", body: JSON.stringify(data) });
  return result.data;
}

export async function updateDocument(
  id: string,
  data: Partial<{
    type: ComplianceDocType;
    title: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    version: string;
    effectiveAt: string;
    expiresAt: string;
    notes: string;
  }>
): Promise<ComplianceDocument> {
  const result = await authFetch(`${BASE}/documents/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return result.data;
}

export async function deleteDocument(id: string): Promise<void> {
  const result = await authFetch(`${BASE}/documents/${id}`, { method: "DELETE" });
  return result.data;
}

// ─── Training acks ────────────────────────────────────────

export async function listTrainingAcks(params?: {
  cleanerId?: string;
  documentId?: string;
}): Promise<ChemicalTrainingAck[]> {
  const q = new URLSearchParams();
  if (params?.cleanerId) q.set("cleanerId", params.cleanerId);
  if (params?.documentId) q.set("documentId", params.documentId);
  const qs = q.toString();
  const result = await authFetch(`${BASE}/training-acks${qs ? `?${qs}` : ""}`);
  return result.data;
}

export async function recordTrainingAck(data: {
  cleanerId: string;
  documentId: string;
  notes?: string;
}): Promise<ChemicalTrainingAck> {
  const result = await authFetch(`${BASE}/training-acks`, { method: "POST", body: JSON.stringify(data) });
  return result.data;
}

// ─── Audits ───────────────────────────────────────────────

export async function listAudits(params?: { status?: string }): Promise<ComplianceAudit[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  const result = await authFetch(`${BASE}/audits${qs ? `?${qs}` : ""}`);
  return result.data;
}

export async function getAudit(id: string): Promise<ComplianceAudit> {
  const result = await authFetch(`${BASE}/audits/${id}`);
  return result.data;
}

export async function createAudit(data: {
  title: string;
  type: string;
  status?: string;
  findings?: any;
  score?: number;
  conductedAt: string;
  conductedBy?: string;
  notes?: string;
}): Promise<ComplianceAudit> {
  const result = await authFetch(`${BASE}/audits`, { method: "POST", body: JSON.stringify(data) });
  return result.data;
}

export async function updateAudit(
  id: string,
  data: Partial<{
    title: string;
    type: string;
    status: string;
    findings: any;
    score: number;
    conductedAt: string;
    conductedBy: string;
    notes: string;
  }>
): Promise<ComplianceAudit> {
  const result = await authFetch(`${BASE}/audits/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return result.data;
}
