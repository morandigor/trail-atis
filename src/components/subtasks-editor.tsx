"use client";

import { useMemo, useState } from "react";

type Props = {
  name: string;
  defaultValue?: string[];
};

export function SubtasksEditor({ name, defaultValue = [] }: Props) {
  const [items, setItems] = useState<string[]>(defaultValue.length > 0 ? defaultValue : [""]);

  const serialized = useMemo(
    () => items.map((item) => item.trim()).filter(Boolean).join("\n"),
    [items],
  );

  const updateItem = (index: number, value: string) => {
    setItems((current) => current.map((item, i) => (i === index ? value : item)));
  };

  const addItem = () => {
    setItems((current) => [...current, ""]);
  };

  const removeItem = (index: number) => {
    setItems((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length === 0 ? [""] : next;
    });
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[--color-navy]/70">Subtasks</p>
      <div className="space-y-2 rounded-lg border border-[--color-navy]/15 bg-white p-3">
        {items.map((item, index) => (
          <div key={`${name}-${index}`} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              placeholder={`Subtask ${index + 1}`}
              className="w-full rounded-lg border border-[--color-navy]/25 bg-white px-3 py-2"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="rounded-lg border border-red-300 px-2 py-2 text-xs font-semibold text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="rounded-lg border border-[--color-navy]/30 px-3 py-2 text-xs font-semibold text-[--color-navy]"
        >
          + Add subtask
        </button>
      </div>
      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}
