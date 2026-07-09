import React, { useState } from "react";
import { X, Copy, Check, Sparkles, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AiIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  ideas: string;
}

export function renderSimpleMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();

    // Headings
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={idx} className="text-sm font-extrabold text-slate-800 mt-5 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider pl-1 border-l-2 border-[#ec4899]">
          {parseInlineFormatting(trimmed.replace("### ", ""))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={idx} className="text-base font-black text-[#ec4899] mt-6 mb-3 border-b pb-1.5 border-white/40">
          {parseInlineFormatting(trimmed.replace("## ", ""))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={idx} className="text-lg font-black text-slate-800 mt-8 mb-4">
          {parseInlineFormatting(trimmed.replace("# ", ""))}
        </h2>
      );
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      return (
        <li key={idx} className="ml-5 list-disc text-slate-700 my-1.5 pl-1.5 font-medium">
          {parseInlineFormatting(content)}
        </li>
      );
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <div key={idx} className="ml-2 my-2.5 flex items-start gap-3">
          <span className="flex-shrink-0 flex items-center justify-center w-5.5 h-5.5 rounded-full bg-neu-bg shadow-neu-flat border border-white/50 text-[#ec4899] text-[11px] font-black mt-0.5">
            {numMatch[1]}
          </span>
          <span className="text-slate-700 text-xs leading-relaxed font-semibold">
            {parseInlineFormatting(numMatch[2])}
          </span>
        </div>
      );
    }

    // Divider
    if (trimmed === "---") {
      return <hr key={idx} className="my-5 border-white/30" />;
    }

    // Empty line
    if (trimmed === "") {
      return <div key={idx} className="h-2" />;
    }

    // Standard paragraph
    return (
      <p key={idx} className="text-slate-600 my-1.5 leading-relaxed text-xs font-medium">
        {parseInlineFormatting(line)}
      </p>
    );
  });
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Match bold formatting like **bold text**
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-slate-800 bg-[#ec4899]/10 px-1.5 py-0.5 rounded text-xs">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function AiIdeasModal({ isOpen, onClose, title, url, ideas }: AiIdeasModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ideas);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1e222b]/45 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-2xl bg-neu-bg rounded-3xl shadow-neu-flat-lg border border-white/60 overflow-hidden flex flex-col max-h-[85vh] z-10"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/40 bg-neu-bg flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-neu-bg shadow-neu-flat flex items-center justify-center p-[2.5px] border border-white/50">
                  <div className="w-full h-full rounded-[11px] bg-gradient-to-tr from-[#ec4899] via-[#ef4444] to-[#f97316] flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base md:text-lg flex items-center gap-1.5">
                    Ideias Criativas Geradas por IA
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold truncate max-w-[320px] md:max-w-[420px] mt-0.5">
                    Inspirado em: <span className="font-bold text-slate-500">{title}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-neu-bg shadow-neu-flat border border-white/60 flex items-center justify-center hover:shadow-neu-pressed active:scale-95 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Reference Info Card */}
              <div className="p-4 bg-neu-bg shadow-neu-pressed rounded-2xl border border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 gap-3">
                <div className="truncate font-semibold">
                  <span className="text-slate-500 font-bold">Link Original:</span>{" "}
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#ec4899] hover:underline font-bold">
                    {url}
                  </a>
                </div>
                <span className="text-[10px] bg-neu-bg shadow-neu-flat border border-white/60 px-3 py-1 rounded-full text-slate-500 font-bold tracking-wider uppercase flex-shrink-0">
                  Ref: Gemini 2.5 Flash
                </span>
              </div>

              {/* Generated Content */}
              <div className="prose prose-indigo max-w-none text-slate-700 space-y-4 pr-1.5">
                {renderSimpleMarkdown(ideas)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/40 bg-neu-bg flex items-center justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-neu-bg shadow-neu-flat hover:shadow-neu-pressed text-slate-500 hover:text-slate-700 rounded-full text-xs font-bold transition-all border border-white/60"
              >
                Fechar
              </button>
              <button
                onClick={handleCopy}
                className={`px-6 py-3 text-xs font-extrabold rounded-full flex items-center gap-2 shadow-[0_4px_14px_rgba(236,72,153,0.3)] transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  copied
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    : "bg-gradient-to-r from-[#ec4899] via-[#ef4444] to-[#f97316] text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Roteiro
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
