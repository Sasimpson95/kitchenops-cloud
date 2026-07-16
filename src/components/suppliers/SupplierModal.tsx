"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  X,
} from "lucide-react";

import type {
  Supplier,
} from "@/data/suppliers";

import {
  createSupplier,
  updateSupplier,
} from "@/lib/supplierStore";

type SupplierModalProps = {
  supplier?: Supplier | null;

  onClose: () => void;

  onSaved?: (
    supplier: Supplier
  ) => void;
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

export default function SupplierModal({
  supplier = null,
  onClose,
  onSaved,
}: SupplierModalProps) {
  const [name, setName] =
    useState("");

  const [
    contactName,
    setContactName,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    deliveryDays,
    setDeliveryDays,
  ] = useState<string[]>([]);

  const [leadTime, setLeadTime] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const isEditing =
    Boolean(supplier);

  useEffect(() => {
    if (!supplier) {
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

    setName(supplier.name);

    setContactName(
      supplier.contactName
    );

    setEmail(supplier.email);

    setPhone(supplier.phone);

    setDeliveryDays(
      supplier.deliveryDays
    );

    setLeadTime(
      supplier.leadTime
    );

    setNotes(supplier.notes);

    setError("");
  }, [supplier]);

  function toggleDay(
    day: string
  ): void {
    setDeliveryDays(
      (currentDays) =>
        currentDays.includes(day)
          ? currentDays.filter(
              (currentDay) =>
                currentDay !== day
            )
          : [...currentDays, day]
    );
  }

  function handleSave(): void {
    if (saving) {
      return;
    }

    setError("");

    try {
      setSaving(true);

      const input = {
        name,
        contactName,
        email,
        phone,
        deliveryDays,
        leadTime,
        notes,
      };

      const savedSupplier =
        supplier
          ? updateSupplier(
              supplier.id,
              input
            )
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
    >
      <div
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-800">
              Operations
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              {isEditing
                ? "Edit Supplier"
                : "New Supplier"}
            </h2>

            <p className="mt-2 text-gray-600">
              Set contact details, lead
              times and delivery days.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-gray-600 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Supplier Name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Example: Brakes"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Contact Name
            </label>

            <input
              value={contactName}
              onChange={(event) =>
                setContactName(
                  event.target.value
                )
              }
              placeholder="Example: Account Manager"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="orders@company.co.uk"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Phone
            </label>

            <input
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
              placeholder="0115 123 4567"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Lead Time
            </label>

            <input
              value={leadTime}
              onChange={(event) =>
                setLeadTime(
                  event.target.value
                )
              }
              placeholder="Example: Next day"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </div>
        </div>

        <div className="mt-7 border-t pt-7">
          <h3 className="text-xl font-bold text-gray-950">
            Delivery Days
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Select every day this supplier
            normally delivers.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {DAYS.map((day) => {
              const selected =
                deliveryDays.includes(day);

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() =>
                    toggleDay(day)
                  }
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold transition ${
                    selected
                      ? "border-violet-800 bg-violet-50 text-violet-900"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
                  }`}
                >
                  {selected && (
                    <Check size={17} />
                  )}

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
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            rows={4}
            placeholder="Any useful supplier information..."
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
          />
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 border-t pt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
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
