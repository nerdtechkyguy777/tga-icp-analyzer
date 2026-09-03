"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(value: string) {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border-2 border-tga-teal-200 rounded-lg focus-within:border-tga-teal-500 focus-within:ring-2 focus-within:ring-tga-teal-200 min-h-[42px] bg-white">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-tga-teal-100 text-tga-teal-800 rounded-md px-2 py-0.5 text-sm font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="hover:text-brand-900"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent py-0.5"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ""}
      />
    </div>
  );
}
