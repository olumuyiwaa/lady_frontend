import { authFetch } from "@/app/api/authFetch";

export async function listDocuments(params: { cleanerId?: string; type?: string } = {}) {
  const q = new URLSearchParams();
  if (params.cleanerId) q.set("cleanerId", params.cleanerId);
  if (params.type) q.set("type", params.type);
  return authFetch(`/cleaner-documents?${q}`);
}

export async function getUploadUrl(cleanerId: string, contentType: string, filename: string) {
  return authFetch(`/cleaner-documents/upload-url`, {
    method: "POST",
    body: JSON.stringify({ cleanerId, contentType, filename }),
  });
}

export async function createDocument(body: {
  cleanerId: string;
  title: string;
  storageKey: string;
  type?: string;
  mimeType?: string;
  fileSize?: number;
  expiresAt?: string;
  notes?: string;
}) {
  return authFetch(`/cleaner-documents`, { method: "POST", body: JSON.stringify(body) });
}

export async function getDownloadUrl(id: string) {
  return authFetch(`/cleaner-documents/${id}/download-url`);
}

export async function deleteDocument(id: string) {
  return authFetch(`/cleaner-documents/${id}`, { method: "DELETE" });
}
