import { authFetch } from "./authFetch";

const BASE = "/inventory";

export type InventoryItemType = "SUPPLY" | "CHEMICAL" | "EQUIPMENT" | "PPE" | "OTHER";
export type StockMovementType =
  | "PURCHASE"
  | "ADJUSTMENT"
  | "USAGE"
  | "TRANSFER"
  | "RETURN"
  | "WRITE_OFF";

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string | null;
  type: InventoryItemType;
  description?: string | null;
  unit: string;
  reorderPoint?: number | null;
  reorderQuantity?: number | null;
  isActive: boolean;
  isHazardous: boolean;
  manufacturer?: string | null;
  casNumber?: string | null;
  hazardClass?: string | null;
  sdsId?: string | null;
  sds?: { id: string; title: string; version?: string | null; expiresAt?: string | null } | null;
  stockLevels?: {
    id: string;
    quantity: number;
    location: { id: string; name: string; type: string };
  }[];
  totalQuantity?: number;
  isLowStock?: boolean;
  createdAt: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  type: string;
  address?: string | null;
  isActive: boolean;
  stockLevels?: {
    id: string;
    quantity: number;
    item: { id: string; name: string; unit: string; type: string };
  }[];
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: StockMovementType;
  quantity: number;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  bookingId?: string | null;
  notes?: string | null;
  createdAt: string;
}

// ─── Items ────────────────────────────────────────────────

export async function listItems(params?: {
  type?: InventoryItemType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: InventoryItem[]; total: number; page: number; limit: number }> {
  const q = new URLSearchParams();
  if (params?.type) q.set("type", params.type);
  if (params?.isActive !== undefined) q.set("isActive", String(params.isActive));
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  const result = await authFetch(`${BASE}/items${qs ? `?${qs}` : ""}`);
  return result.data;
}

export async function getItem(id: string): Promise<InventoryItem> {
  const result = await authFetch(`${BASE}/items/${id}`);
  return result.data;
}

export async function createItem(data: {
  name: string;
  sku?: string;
  type?: InventoryItemType;
  description?: string;
  unit?: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  isHazardous?: boolean;
  manufacturer?: string;
  casNumber?: string;
  hazardClass?: string;
  sdsId?: string;
}): Promise<InventoryItem> {
  const result = await authFetch(`${BASE}/items`, { method: "POST", body: JSON.stringify(data) });
  return result.data;
}

export async function updateItem(
  id: string,
  data: Partial<{
    name: string;
    sku: string;
    type: InventoryItemType;
    description: string;
    unit: string;
    reorderPoint: number;
    reorderQuantity: number;
    isActive: boolean;
    isHazardous: boolean;
    manufacturer: string;
    casNumber: string;
    hazardClass: string;
    sdsId: string;
  }>
): Promise<InventoryItem> {
  const result = await authFetch(`${BASE}/items/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return result.data;
}

// ─── Locations ────────────────────────────────────────────

export async function listLocations(): Promise<InventoryLocation[]> {
  const result = await authFetch(`${BASE}/locations`);
  return result.data;
}

export async function createLocation(data: {
  name: string;
  type?: string;
  address?: string;
}): Promise<InventoryLocation> {
  const result = await authFetch(`${BASE}/locations`, { method: "POST", body: JSON.stringify(data) });
  return result.data;
}

export async function updateLocation(
  id: string,
  data: Partial<{ name: string; type: string; address: string; isActive: boolean }>
): Promise<InventoryLocation> {
  const result = await authFetch(`${BASE}/locations/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return result.data;
}

// ─── Stock ────────────────────────────────────────────────

export async function getStock(params?: {
  locationId?: string;
  lowStock?: boolean;
}): Promise<InventoryItem[]> {
  const q = new URLSearchParams();
  if (params?.locationId) q.set("locationId", params.locationId);
  if (params?.lowStock) q.set("lowStock", "true");
  const qs = q.toString();
  const result = await authFetch(`${BASE}/stock${qs ? `?${qs}` : ""}`);
  return result.data;
}

// ─── Movements ────────────────────────────────────────────

export async function createMovement(data: {
  itemId: string;
  type: StockMovementType;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  bookingId?: string;
  notes?: string;
}): Promise<StockMovement> {
  const result = await authFetch(`${BASE}/movements`, { method: "POST", body: JSON.stringify(data) });
  return result.data;
}
