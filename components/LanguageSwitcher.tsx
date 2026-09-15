"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Globe, Check } from "lucide-react";
import { Language } from "@/lib/translations";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; native: string }[] = [
    { code: "en", label: "English", native: "English" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
    { code: "hi", label: "Hindi", native: "हिंदी" },
  ];

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bento-btn py-2 px-3 rounded-2xl flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
        title="Switch Language / மொழி மாற்றுக / भाषा बदलें"
        aria-label="Language Switcher"
      >
        <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span>{current.native}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 clay-card p-2 z-50 animate-in fade-in slide-in-from-top-1 border border-white/70 dark:border-slate-700 shadow-xl">
          <div className="space-y-1">
            {languages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setLanguage(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs">{item.native}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {item.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
