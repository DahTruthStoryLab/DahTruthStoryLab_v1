// src/components/storylab/CharacterModal.jsx
import React, { useState, useEffect } from "react";
import { X, Users, Tag } from "lucide-react";

export default function CharacterModal({ character, onClose, onSave }) {
  const [form, setForm] = useState(character || {});

  useEffect(() => {
    setForm(character || {});
  }, [character]);

  if (!character) return null;

  const updateField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-border shadow-xl w-[90%] max-w-md relative p-6 space-y-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-ink">Character Details</h2>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted">
            Name
            <input
              value={form.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full border border-border rounded-lg p-2 mt-1"
              placeholder="Character name"
            />
          </label>

          <label className="block text-sm font-medium text-muted">
            Role
            <input
              value={form.role || ""}
              onChange={(e) => updateField("role", e.target.value)}
              className="w-full border border-border rounded-lg p-2 mt-1"
              placeholder="Role in story"
            />
          </label>

          <label className="block text-sm font-medium text-muted">
            Relationship / Notes
            <textarea
              value={form.rel || ""}
              onChange={(e) => updateField("rel", e.target.value)}
              className="w-full border border-border rounded-lg p-2 mt-1 resize-none"
              rows={3}
              placeholder="Relationship to others or notes"
            />
          </label>

          <label className="block text-sm font-medium text-muted">
            Traits (comma separated)
            <div className="flex items-center gap-2 mt-1">
              <Tag className="h-4 w-4 text-muted" />
              <input
                value={(form.traits || []).join(", ")}
                onChange={(e) =>
                  updateField(
                    "traits",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full border border-border rounded-lg p-2"
                placeholder="brave, quiet, loyal"
              />
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
