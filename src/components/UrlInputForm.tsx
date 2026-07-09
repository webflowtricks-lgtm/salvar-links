import React, { useState } from "react";
import { Link, Sparkles, AlertCircle, Loader2, Plus, MessageSquare, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UrlInputFormProps {
  onSave: (url: string, notes: string, tags: string[]) => Promise<void>;
}

export default function UrlInputForm({ onSave }: UrlInputFormProps) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isExpanding, setIsExpanding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Por favor, digite ou cole um link válido.");
      return;
    }

    setIsLoading(true);
    try {
      const parsedTags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      await onSave(trimmedUrl, notes.trim(), parsedTags);
      
      // Clear fields upon success
      setUrl("");
      setNotes("");
      setTagsInput("");
      setIsExpanding(false);
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neu-bg rounded-3xl shadow-neu-flat p-6 md:p-8 max-w-3xl mx-auto border border-white/60">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="url-input" className="text-xs font-black text-[#ec4899] tracking-wider uppercase block">
            Salvar Nova Ideia de Link
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400">
              <Link className="w-5 h-5 text-slate-400" />
            </div>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsExpanding(true)}
              placeholder="Cole aqui o link do post, artigo, vídeo ou site de inspiração..."
              className="w-full pl-12 pr-4 py-4 bg-neu-bg shadow-neu-pressed border-0 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none transition-all font-medium"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Collapsible section for notes/tags */}
        <AnimatePresence>
          {isExpanding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-4 pt-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes Input */}
                <div className="space-y-2">
                  <label htmlFor="notes-input" className="text-xs font-black text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#ec4899]" />
                    Minhas Anotações (Opcional)
                  </label>
                  <textarea
                    id="notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Quais insights você teve ao ver este link? Ideias de tópicos..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neu-bg shadow-neu-pressed border-0 rounded-2xl text-slate-800 text-xs focus:outline-none transition-all placeholder-slate-400 resize-none font-medium"
                    disabled={isLoading}
                  />
                </div>

                {/* Tags Input */}
                <div className="space-y-2">
                  <label htmlFor="tags-input" className="text-xs font-black text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#f97316]" />
                    Tags / Categorias (Opcional)
                  </label>
                  <input
                    id="tags-input"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Ex: inspiração, dicas, design (separados por vírgula)"
                    className="w-full px-4 py-3 bg-neu-bg shadow-neu-pressed border-0 rounded-2xl text-slate-800 text-xs focus:outline-none transition-all placeholder-slate-400 font-medium"
                    disabled={isLoading}
                  />
                  <p className="text-[10px] text-slate-400 font-semibold pl-1">
                    Use vírgulas para separar as categorias e organizá-las.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 text-rose-600 bg-neu-bg shadow-neu-flat px-4 py-3 rounded-2xl text-xs border border-rose-100"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span className="font-bold">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-400 font-semibold">
            {isLoading && (
              <span className="flex items-center gap-2 text-[#ec4899]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Extraindo prévia e salvando no banco...
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isExpanding && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setIsExpanding(false);
                  setUrl("");
                  setNotes("");
                  setTagsInput("");
                  setError(null);
                }}
                className="px-5 py-2.5 bg-neu-bg shadow-neu-flat hover:shadow-neu-pressed text-slate-500 hover:text-slate-700 rounded-full text-xs font-bold transition-all border border-white/60"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !url}
              className="px-6 py-3 bg-gradient-to-r from-[#ec4899] via-[#ef4444] to-[#f97316] hover:brightness-105 active:scale-[0.98] text-white rounded-full text-xs font-extrabold flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Salvar Link
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
