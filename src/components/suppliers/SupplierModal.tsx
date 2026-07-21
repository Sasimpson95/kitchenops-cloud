"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Truck, X } from "lucide-react";

import type { Supplier, SupplierType } from "@/data/suppliers";
import { createSupplier, updateSupplier } from "@/lib/supplierStore";
import { useBusinessSites } from "@/lib/useBusinessSites";

type SupplierModalProps = {
  supplier?: Supplier | null;
  onClose: () => void;
  onSaved?: (supplier: Supplier) => void;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const inputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800";

export default function SupplierModal({
  supplier = null,
  onClose,
  onSaved,
}: SupplierModalProps) {
  const { sites, loading: loadingSites } = useBusinessSites();

  const [supplierType, setSupplierType] =
    useState<SupplierType>("external");
  const [linkedSiteId, setLinkedSiteId] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryDays, setDeliveryDays] = useState<string[]>([]);
  const [leadTime, setLeadTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(supplier);
  const linkedSite = useMemo(
    () => sites.find((site) => site.id === linkedSiteId),
    [linkedSiteId, sites]
  );

  useEffect(() => {
    if (!supplier) {
      setSupplierType("external");
      setLinkedSiteId("");
      setName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setDeliveryDays([]);
      setLeadTime("");
      setNotes("");
      setError("");
      return;
    }

    setSupplierType(supplier.supplierType ?? "external");
    setLinkedSiteId(supplier.linkedSiteId ?? "");
    setName(supplier.name);
    setContactName(supplier.contactName);
    setEmail(supplier.email);
    setPhone(supplier.phone);
    setDeliveryDays(supplier.deliveryDays);
    setLeadTime(supplier.leadTime);
    setNotes(supplier.notes);
    setError("");
  }, [supplier]);

  function chooseType(type: SupplierType): void {
    setSupplierType(type);
    setError("");

    if (type === "internal") {
      setContactName("KitchenOps internal transfer");
      setEmail("");
      setPhone("");
      setLeadTime("Same day");
      setDeliveryDays([...DAYS]);
    }
  }

  function chooseSite(siteId: string): void {
    setLinkedSiteId(siteId);
    const site = sites.find((item) => item.id === siteId);
    if (site) {
      setName(`${site.name} Kitchen`);
    }
  }

  function toggleDay(day: string): void {
    setDeliveryDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day]
    );
  }

  function handleSave(): void {
    if (saving) return;

    setError("");

    try {
      setSaving(true);

      const input = {
        name,
        supplierType,
        linkedSiteId: supplierType === "internal" ? linkedSiteId : "",
        linkedSiteName:
          supplierType === "internal" ? linkedSite?.name ?? "" : "",
        contactName,
        email,
        phone,
        deliveryDays,
        leadTime,
        notes,
      };

      const savedSupplier = supplier
        ? updateSupplier(supplier.id, input)
        : createSupplier(input);

      onSaved?.(savedSupplier);
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The supplier could not be saved."
      );
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-800">Catalogue</p>
            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              {isEditing ? "Edit Supplier" : "New Supplier"}
            </h2>
            <p className="mt-2 text-gray-600">
              Add an external supplier or use another KitchenOps site as an internal supplier.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-gray-600 hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseType("external")}
            className={`rounded-2xl border p-5 text-left transition ${
              supplierType === "external"
                ? "border-violet-800 bg-violet-50"
                : "border-gray-200 hover:bg-slate-50"
            }`}
          >
            <Truck size={22} className="text-violet-800" />
            <p className="mt-3 font-bold text-gray-950">External Supplier</p>
            <p className="mt-1 text-sm text-gray-500">
              Brakes, Kerry, local wholesalers and other outside suppliers.
            </p>
          </button>

          <button
            type="button"
            onClick={() => chooseType("internal")}
            className={`rounded-2xl border p-5 text-left transition ${
              supplierType === "internal"
                ? "border-violet-800 bg-violet-50"
                : "border-gray-200 hover:bg-slate-50"
            }`}
          >
            <Building2 size={22} className="text-violet-800" />
            <p className="mt-3 font-bold text-gray-950">Internal Kitchen</p>
            <p className="mt-1 text-sm text-gray-500">
              A KitchenOps site that supplies stock or prep to another site.
            </p>
          </button>
        </div>

        {supplierType === "internal" ? (
          <div className="mt-7 rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Supplying Site
            </label>
            <select
              value={linkedSiteId}
              onChange={(event) => chooseSite(event.target.value)}
              className={inputClass}
              disabled={loadingSites}
            >
              <option value="">
                {loadingSites ? "Loading sites..." : "Choose a site"}
              </option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>

            {sites.length === 0 && !loadingSites && (
              <p className="mt-3 text-sm font-semibold text-amber-700">
                Create a site first before adding an internal kitchen supplier.
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <div className={supplierType === "internal" ? "md:col-span-2" : ""}>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Supplier Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={
                supplierType === "internal"
                  ? "Automatically set from the site"
                  : "Example: Brakes"
              }
              className={inputClass}
            />
          </div>

          {supplierType === "external" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Contact Name
                </label>
                <input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Account manager"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="orders@company.co.uk"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0115 123 4567"
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div className={supplierType === "internal" ? "md:col-span-2" : ""}>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Lead Time
            </label>
            <input
              value={leadTime}
              onChange={(event) => setLeadTime(event.target.value)}
              placeholder="Example: Next day"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-7 border-t pt-7">
          <h3 className="text-xl font-bold text-gray-950">Delivery Days</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select every day this supplier normally supplies the business.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {DAYS.map((day) => {
              const selected = deliveryDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold transition ${
                    selected
                      ? "border-violet-800 bg-violet-50 text-violet-900"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
                  }`}
                >
                  {selected && <Check size={17} />}
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Supplier Notes
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Account numbers, cut-off times or useful ordering notes..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving Supplier..."
              : isEditing
                ? "Save Changes"
                : "Save Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}
