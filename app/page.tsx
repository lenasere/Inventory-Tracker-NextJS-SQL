"use client";

import { useEffect, useMemo, useState } from "react";

type UnitKey =
  | "foods"
  | "drinks"
  | "cleaning-chemicals"
  | "clothes"
  | "utilities";

type InventoryItem = {
  id: number;
  item_name: string;
  unit: string;
  quantity_in_stock: number;
  reorder_level: number;
  unit_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ApiListResponse = {
  data: InventoryItem[];
};

type ApiItemResponse = {
  data: InventoryItem;
};

type UnitConfig = {
  key: UnitKey;
  label: string;
};

type ItemForm = {
  item_name: string;
  unit: string;
  quantity_in_stock: string;
  reorder_level: string;
  unit_cost: string;
  notes: string;
};

const API_BASE = process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? "http://localhost:4000";

const units: UnitConfig[] = [
  { key: "foods", label: "Foods" },
  { key: "drinks", label: "Drinks" },
  { key: "cleaning-chemicals", label: "Cleaning/Chemicals" },
  { key: "clothes", label: "Clothes" },
  { key: "utilities", label: "Utilities" },
];

const emptyForm: ItemForm = {
  item_name: "",
  unit: "",
  quantity_in_stock: "",
  reorder_level: "",
  unit_cost: "",
  notes: "",
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 2,
  }).format(value);
};

async function fetchUnitItems(unit: UnitKey): Promise<InventoryItem[]> {
  const res = await fetch(`${API_BASE}/api/${unit}`);
  if (!res.ok) {
    throw new Error(`Failed to load ${unit}`);
  }
  const json = (await res.json()) as ApiListResponse;
  return json.data;
}

export default function Home() {
  const [selectedUnit, setSelectedUnit] = useState<UnitKey>("foods");
  const [allData, setAllData] = useState<Record<UnitKey, InventoryItem[]>>({
    foods: [],
    drinks: [],
    "cleaning-chemicals": [],
    clothes: [],
    utilities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(units.map((unit) => fetchUnitItems(unit.key)));
      setAllData({
        foods: results[0],
        drinks: results[1],
        "cleaning-chemicals": results[2],
        clothes: results[3],
        utilities: results[4],
      });
    } catch {
      setError(`Unable to reach API at ${API_BASE}. Ensure API is running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const selectedItems = allData[selectedUnit];

  const stats = useMemo(() => {
    const merged = Object.values(allData).flat();
    const totalItems = merged.length;
    const lowStockItems = merged.filter(
      (item) => item.quantity_in_stock <= item.reorder_level,
    ).length;
    const totalStockValue = merged.reduce(
      (sum, item) => sum + item.quantity_in_stock * item.unit_cost,
      0,
    );

    return { totalItems, lowStockItems, totalStockValue };
  }, [allData]);

  const unitTotals = useMemo(() => {
    return units.map((unit) => {
      const items = allData[unit.key];
      const qty = items.reduce((sum, item) => sum + item.quantity_in_stock, 0);
      return { ...unit, qty, itemsCount: items.length };
    });
  }, [allData]);

  const maxUnitQty = Math.max(1, ...unitTotals.map((unit) => unit.qty));
  const maxSelectedStock = Math.max(
    1,
    ...selectedItems.map((item) => item.quantity_in_stock),
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const onEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      item_name: item.item_name,
      unit: item.unit,
      quantity_in_stock: String(item.quantity_in_stock),
      reorder_level: String(item.reorder_level),
      unit_cost: String(item.unit_cost),
      notes: item.notes ?? "",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      item_name: form.item_name.trim(),
      unit: form.unit.trim(),
      quantity_in_stock: Number(form.quantity_in_stock),
      reorder_level: Number(form.reorder_level),
      unit_cost: Number(form.unit_cost),
      notes: form.notes.trim() || null,
    };

    try {
      const isEditing = editingId !== null;
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `${API_BASE}/api/${selectedUnit}/${editingId}`
        : `${API_BASE}/api/${selectedUnit}`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as ApiItemResponse;
      const item = json.data;

      setAllData((previous) => {
        const current = previous[selectedUnit];
        const next = isEditing
          ? current.map((i) => (i.id === item.id ? item : i))
          : [item, ...current];

        return { ...previous, [selectedUnit]: next };
      });

      resetForm();
    } catch {
      setError("Could not save item. Check data and API status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/${selectedUnit}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setAllData((previous) => ({
        ...previous,
        [selectedUnit]: previous[selectedUnit].filter((item) => item.id !== id),
      }));

      if (editingId === id) {
        resetForm();
      }
    } catch {
      setError("Could not delete item.");
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 py-10 md:px-10">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Restaurant Inventory
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Inventory Dashboard
        </h1>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total inventory items</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalItems}</p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm text-rose-700">Low-stock alerts</p>
          <p className="mt-2 text-3xl font-semibold text-rose-900">{stats.lowStockItems}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total stock value</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(stats.totalStockValue)}
          </p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="text-lg font-semibold text-slate-900">Quantity by storage unit</h2>
          <div className="mt-5 space-y-4">
            {unitTotals.map((unit) => {
              const width = Math.round((unit.qty / maxUnitQty) * 100);
              return (
                <div key={unit.key}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{unit.label}</span>
                    <span className="text-slate-500">
                      {unit.qty} units / {unit.itemsCount} items
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            {units.find((u) => u.key === selectedUnit)?.label} stock levels
          </h2>
          <div className="mt-5 flex h-56 items-end gap-2">
            {(selectedItems.length > 0 ? selectedItems : [{ id: 0, item_name: "-", unit: "", quantity_in_stock: 0, reorder_level: 0, unit_cost: 0, notes: null, created_at: "", updated_at: "" }]).slice(0, 8).map((item) => {
              const height = Math.max(
                4,
                Math.round((item.quantity_in_stock / maxSelectedStock) * 100),
              );
              return (
                <div key={item.id} className="group flex min-w-0 flex-1 flex-col items-center">
                  <div className="flex h-44 w-full items-end">
                    <div
                      className="w-full rounded-t bg-sky-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="mt-2 truncate text-[10px] text-slate-500" title={item.item_name}>
                    {item.item_name}
                  </span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Update Item" : "Add Item"}
          </h2>

          <div className="mt-4">
            <label className="mb-1 block text-sm text-slate-600">Storage unit</label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedUnit}
              onChange={(event) => {
                setSelectedUnit(event.target.value as UnitKey);
                resetForm();
              }}
            >
              {units.map((unit) => (
                <option key={unit.key} value={unit.key}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Item name"
              required
              value={form.item_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, item_name: event.target.value }))
              }
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Unit (kg, liters, pieces...)"
              required
              value={form.unit}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, unit: event.target.value }))
              }
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="number"
              min="0"
              placeholder="Quantity in stock"
              required
              value={form.quantity_in_stock}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, quantity_in_stock: event.target.value }))
              }
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="number"
              min="0"
              placeholder="Reorder level"
              required
              value={form.reorder_level}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, reorder_level: event.target.value }))
              }
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit cost"
              required
              value={form.unit_cost}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, unit_cost: event.target.value }))
              }
            />
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Notes (optional)"
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />

            <div className="flex gap-2 pt-1">
              <button
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                type="submit"
              >
                {submitting ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {units.find((u) => u.key === selectedUnit)?.label} inventory
            </h2>
            <button
              type="button"
              onClick={() => void loadAll()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading inventory...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Reorder</th>
                    <th className="px-3 py-2">Unit cost</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item) => {
                    const low = item.quantity_in_stock <= item.reorder_level;
                    return (
                      <tr key={item.id} className="bg-slate-50 text-sm">
                        <td className="rounded-l-xl px-3 py-3 font-medium text-slate-800">
                          <div>{item.item_name}</div>
                          <div className="text-xs text-slate-500">{item.unit}</div>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{item.quantity_in_stock}</td>
                        <td className="px-3 py-3 text-slate-700">{item.reorder_level}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {formatCurrency(item.unit_cost)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={
                              low
                                ? "rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800"
                                : "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"
                            }
                          >
                            {low ? "Low" : "Healthy"}
                          </span>
                        </td>
                        <td className="rounded-r-xl px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
                              className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
