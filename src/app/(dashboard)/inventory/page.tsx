"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import RowActionsMenu from "@/components/tables/RowActionsMenu";
import {
    listItems,
    createItem,
    updateItem,
    listLocations,
    createLocation,
    getStock,
    createMovement,
    InventoryItem,
    InventoryLocation,
    InventoryItemType,
    StockMovementType,
} from "@/app/api/inventory.api";

const ITEM_TYPES: InventoryItemType[] = ["SUPPLY", "CHEMICAL", "EQUIPMENT", "PPE", "OTHER"];
const MOVEMENT_TYPES: StockMovementType[] = ["PURCHASE", "USAGE", "TRANSFER", "ADJUSTMENT", "RETURN", "WRITE_OFF"];

const TYPE_COLOR: Record<InventoryItemType, "success" | "warning" | "error" | "light" | "info"> = {
    SUPPLY: "info",
    CHEMICAL: "warning",
    EQUIPMENT: "success",
    PPE: "light",
    OTHER: "light",
};

export default function InventoryPage() {
  const t = useTranslations("Dashboard.inventory");
  const tc = useTranslations("Dashboard.common");
    const [tab, setTab] = useState<"items" | "stock" | "locations">("items");
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [stock, setStock] = useState<InventoryItem[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [typeFilter, setTypeFilter] = useState<InventoryItemType | "ALL">("ALL");
    const [lowStockOnly, setLowStockOnly] = useState(false);

    const [showItemModal, setShowItemModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [itemForm, setItemForm] = useState({
        name: "",
        sku: "",
        type: "SUPPLY" as InventoryItemType,
        unit: "each",
        reorderPoint: "",
        isHazardous: false,
        manufacturer: "",
    });

    const [locationForm, setLocationForm] = useState({
        name: "",
        type: "WAREHOUSE",
        address: "",
    });

    const [movementForm, setMovementForm] = useState({
        itemId: "",
        type: "PURCHASE" as StockMovementType,
        quantity: "",
        fromLocationId: "",
        toLocationId: "",
        notes: "",
    });

    const loadItems = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await listItems({
                type: typeFilter === "ALL" ? undefined : typeFilter,
            });
            // Previously `data.items || data as any` — a defensive workaround
            // for listItems() returning the raw {success,data} envelope
            // instead of its unwrapped payload. Now that inventory.api.ts
            // unwraps .data itself, `data` really is the {items, total, ...}
            // shape the type declares, so the fallback is gone.
            setItems(data.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [typeFilter, t]);

    const loadStock = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getStock({ lowStock: lowStockOnly || undefined });
            setStock(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [lowStockOnly, t]);

    const loadLocations = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await listLocations();
            setLocations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (tab === "items") loadItems();
        else if (tab === "stock") loadStock();
        else loadLocations();
    }, [tab, loadItems, loadStock, loadLocations]);

    // Also load locations for movement modal dropdowns
    useEffect(() => {
        listLocations().then(setLocations).catch(() => {});
    }, []);

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createItem({
                name: itemForm.name,
                sku: itemForm.sku || undefined,
                type: itemForm.type,
                unit: itemForm.unit || "each",
                reorderPoint: itemForm.reorderPoint ? Number(itemForm.reorderPoint) : undefined,
                isHazardous: itemForm.isHazardous,
                manufacturer: itemForm.manufacturer || undefined,
            });
            setShowItemModal(false);
            setItemForm({ name: "", sku: "", type: "SUPPLY", unit: "each", reorderPoint: "", isHazardous: false, manufacturer: "" });
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("createFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleCreateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createLocation({
                name: locationForm.name,
                type: locationForm.type,
                address: locationForm.address || undefined,
            });
            setShowLocationModal(false);
            setLocationForm({ name: "", type: "WAREHOUSE", address: "" });
            await loadLocations();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("createFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleCreateMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createMovement({
                itemId: movementForm.itemId,
                type: movementForm.type,
                quantity: Number(movementForm.quantity),
                fromLocationId: movementForm.fromLocationId || undefined,
                toLocationId: movementForm.toLocationId || undefined,
                notes: movementForm.notes || undefined,
            });
            setShowMovementModal(false);
            setMovementForm({ itemId: "", type: "PURCHASE", quantity: "", fromLocationId: "", toLocationId: "", notes: "" });
            if (tab === "stock") await loadStock();
            else await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("movementFailed"));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (item: InventoryItem) => {
        try {
            await updateItem(item.id, { isActive: !item.isActive });
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("updateFailed"));
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("subtitle")}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setShowMovementModal(true)}>
                        {t("recordMovement")}
                    </Button>
                    {tab === "locations" ? (
                        <Button onClick={() => setShowLocationModal(true)}>{t("addLocation")}</Button>
                    ) : (
                        <Button onClick={() => setShowItemModal(true)}>{t("addItem")}</Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
                {(["items", "stock", "locations"] as const).map((tabKey) => (
                    <button
                        key={tabKey}
                        onClick={() => setTab(tabKey)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            tab === tabKey
                                ? "bg-brand-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
                        }`}
                    >
                        {tabKey === "items" ? t("items") : tabKey === "stock" ? t("stockLevels") : t("locations")}
                    </button>
                ))}
            </div>

            {/* Type filter (items tab) */}
            {tab === "items" && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {(["ALL", ...ITEM_TYPES] as const).map((typeKey) => (
                        <button
                            key={typeKey}
                            onClick={() => setTypeFilter(typeKey)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                typeFilter === typeKey
                                    ? "bg-brand-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
                            }`}
                        >
                            {typeKey === "ALL" ? t("allTypes") : t(`itemTypes.${typeKey}`)}
                        </button>
                    ))}
                </div>
            )}

            {/* Low stock toggle (stock tab) */}
            {tab === "stock" && (
                <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={lowStockOnly}
                            onChange={(e) => setLowStockOnly(e.target.checked)}
                            className="rounded"
                        />
                        {t("showLowStockOnly")}
                    </label>
                </div>
            )}

            {/* ─── Items table ───────────────────────────────────── */}
            {tab === "items" && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("name")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("skuColumn")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("type")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("unit")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("reorderColumn")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("status")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{tc("actions")}</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={7}>{tc("loading")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading && items.length === 0 && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={7}>{t("emptyItems")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading &&
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                                                {item.name}
                                                {item.isHazardous && (
                                                    <span className="ml-2 text-xs text-warning-500">⚠ {t("hazardous")}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">{item.sku || "—"}</TableCell>
                                            <TableCell className="px-5 py-4">
                                                <Badge color={TYPE_COLOR[item.type]} size="sm">{t(`itemTypes.${item.type}`)}</Badge>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">{item.unit}</TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">
                                                {item.reorderPoint ?? "—"}
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <Badge color={item.isActive ? "success" : "light"} size="sm">
                                                    {item.isActive ? t("active") : t("inactive")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <RowActionsMenu
                                                    label={t("actionsFor", { name: item.name })}
                                                    actions={[
                                                        {
                                                            label: item.isActive ? t("itemActions.deactivate") : t("itemActions.activate"),
                                                            variant: item.isActive ? "danger" as const : "default" as const,
                                                            onClick: () => toggleActive(item),
                                                        },
                                                    ]}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ─── Stock table ───────────────────────────────────── */}
            {tab === "stock" && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("item")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("type")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("totalQuantity")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("reorderPointShort")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("status")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("locations")}</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={6}>{tc("loading")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading && stock.length === 0 && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={6}>{t("noStockData")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading &&
                                    stock.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <Badge color={TYPE_COLOR[item.type]} size="sm">{t(`itemTypes.${item.type}`)}</Badge>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                                                {item.totalQuantity ?? 0} {item.unit}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">
                                                {item.reorderPoint ?? "—"}
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                {item.isLowStock ? (
                                                    <Badge color="error" size="sm">{t("lowStock")}</Badge>
                                                ) : (
                                                    <Badge color="success" size="sm">{t("ok")}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">
                                                {(item.stockLevels || [])
                                                    .map((s) => `${s.location.name}: ${s.quantity}`)
                                                    .join(", ") || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ─── Locations table ───────────────────────────────── */}
            {tab === "locations" && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("name")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("type")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("address")}</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">{t("itemsInStock")}</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>{tc("loading")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading && locations.length === 0 && (
                                    <TableRow>
                                        <TableCell className="px-5 py-6 text-center text-gray-500" colSpan={4}>{t("emptyLocations")}</TableCell>
                                    </TableRow>
                                )}
                                {!loading &&
                                    locations.map((loc) => (
                                        <TableRow key={loc.id}>
                                            <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                                                {loc.name}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">{t(loc.type.toLowerCase())}</TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">{loc.address || "—"}</TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500">
                                                {loc.stockLevels?.length ?? 0}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ─── Create Item Modal ─────────────────────────────── */}
            <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} className="max-w-md p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("addItem")}</h2>
                <form onSubmit={handleCreateItem} className="space-y-4">
                    <div>
                        <Label>{t("name")}</Label>
                        <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{t("sku")}</Label>
                            <Input value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} />
                        </div>
                        <div>
                            <Label>{t("unit")}</Label>
                            <Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder={t("unitExamples")} />
                        </div>
                    </div>
                    <div>
                        <Label>{t("type")}</Label>
                        <select
                            value={itemForm.type}
                            onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as InventoryItemType })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                            {ITEM_TYPES.map((typeKey) => (
                                <option key={typeKey} value={typeKey}>{t(`itemTypes.${typeKey}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>{t("reorderPoint")}</Label>
                        <Input type="number" min="0" value={itemForm.reorderPoint} onChange={(e) => setItemForm({ ...itemForm, reorderPoint: e.target.value })} />
                    </div>
                    <div>
                        <Label>{t("manufacturer")}</Label>
                        <Input value={itemForm.manufacturer} onChange={(e) => setItemForm({ ...itemForm, manufacturer: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={itemForm.isHazardous}
                            onChange={(e) => setItemForm({ ...itemForm, isHazardous: e.target.checked })}
                            className="rounded"
                        />
                        {t("hazardousHint")}
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowItemModal(false)} type="button">{tc("cancel")}</Button>
                        <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("create")}</Button>
                    </div>
                </form>
            </Modal>

            {/* ─── Create Location Modal ─────────────────────────── */}
            <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} className="max-w-md p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("addLocation")}</h2>
                <form onSubmit={handleCreateLocation} className="space-y-4">
                    <div>
                        <Label>{t("name")}</Label>
                        <Input value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} required placeholder={t("locationExamples")} />
                    </div>
                    <div>
                        <Label>{t("type")}</Label>
                        <select
                            value={locationForm.type}
                            onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                            <option value="WAREHOUSE">{t("warehouse")}</option>
                            <option value="VEHICLE">{t("vehicle")}</option>
                            <option value="SITE">{t("site")}</option>
                        </select>
                    </div>
                    <div>
                        <Label>{t("addressOptional")}</Label>
                        <Input value={locationForm.address} onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowLocationModal(false)} type="button">{tc("cancel")}</Button>
                        <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("create")}</Button>
                    </div>
                </form>
            </Modal>

            {/* ─── Movement Modal ────────────────────────────────── */}
            <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} className="max-w-md p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("recordStockMovement")}</h2>
                <form onSubmit={handleCreateMovement} className="space-y-4">
                    <div>
                        <Label>{t("item")}</Label>
                        <select
                            value={movementForm.itemId}
                            onChange={(e) => setMovementForm({ ...movementForm, itemId: e.target.value })}
                            required
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                            <option value="">{t("selectItem")}</option>
                            {items.map((i) => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>{t("type")}</Label>
                        <select
                            value={movementForm.type}
                            onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value as StockMovementType })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                            {MOVEMENT_TYPES.map((m) => (
                                <option key={m} value={m}>{t(`movementTypes.${m}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>{t("quantity")}</Label>
                        <Input type="number" min="1" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} required />
                    </div>
                    {["USAGE", "WRITE_OFF", "TRANSFER"].includes(movementForm.type) && (
                        <div>
                            <Label>{t("fromLocation")}</Label>
                            <select
                                value={movementForm.fromLocationId}
                                onChange={(e) => setMovementForm({ ...movementForm, fromLocationId: e.target.value })}
                                required
                                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                            >
                                <option value="">{t("selectLocation")}</option>
                                {locations.map((l) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {["PURCHASE", "RETURN", "TRANSFER", "ADJUSTMENT"].includes(movementForm.type) && (
                        <div>
                            <Label>{t("toLocation")}</Label>
                            <select
                                value={movementForm.toLocationId}
                                onChange={(e) => setMovementForm({ ...movementForm, toLocationId: e.target.value })}
                                required={movementForm.type !== "ADJUSTMENT"}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                            >
                                <option value="">{t("selectLocation")}</option>
                                {locations.map((l) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <Label>{t("notes")}</Label>
                        <Input value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowMovementModal(false)} type="button">{tc("cancel")}</Button>
                        <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("record")}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}