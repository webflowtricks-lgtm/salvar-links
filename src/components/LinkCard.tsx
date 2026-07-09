import React, { useState } from "react";
import { Link, Calendar, Trash2, Edit3, Check, Loader2, Sparkles, MessageSquare, Tag, Plus, X, Globe, Eye, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PostIdea } from "../types";

interface LinkCardProps {
  key?: React.Key;
  idea: PostIdea;
  onUpdate: (id: string, updates: Partial<PostIdea>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenAiIdeas: (title: string, url: string, ideas: string) => void;
}

export default function LinkCard({ idea, onUpdate, onDelete, onOpenAiIdeas }: LinkCardProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(idea.notes || "");
  const [newTag, setNewTag] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const formattedDate = new Date(idea.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const handleUpdateNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdate(idea.id, { notes: notesDraft });
      setIsEditingNotes(false);
    } catch (err) {
      console.error("Erro ao atualizar notas:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase();
    if (!tag) return;

    const currentTags = idea.tags || [];
    if (currentTags.includes(tag)) {
      setNewTag("");
      return;
    }

    try {
      await onUpdate(idea.id, { tags: [...currentTags, tag] });
      setNewTag("");
    } catch (err) {
      console.error("Erro ao adicionar tag:", err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const currentTags = idea.tags || [];
    try {
      await onUpdate(idea.id, { tags: currentTags.filter((t) => t !== tagToRemove) });
    } catch (err) {
      console.error("Erro ao remover tag:", err);
    }
  };

  const handleStatusChange = async (newStatus: "pending" | "drafted" | "published") => {
    try {
      await onUpdate(idea.id, { status: newStatus });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  const handleGenerateAiIdeas = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const response = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: idea.url,
          title: idea.title,
          description: idea.description,
          notes: idea.notes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate ideas");
      }

      await onUpdate(idea.id, { aiSummary: data.ideas });
      onOpenAiIdeas(idea.title, idea.url, data.ideas);
    } catch (err: any) {
      setAiError(err.message || "Erro ao conectar com a IA");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-neu-bg rounded-3xl shadow-neu-flat border border-white/60 hover:shadow-neu-flat-lg transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      {/* Link Header Preview Image */}
      <div className="relative aspect-[16/10] w-full bg-neu-bg flex-shrink-0 group overflow-hidden border-b border-white/30">
        {idea.image ? (
          <img
            src={idea.image}
            alt={idea.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = ""; // Clear to trigger fallback layout
            }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-neu-bg shadow-neu-pressed flex flex-col items-center justify-center p-6 text-center">
            <Globe className="w-10 h-10 text-slate-300 mb-2" />
            <span className="text-xs font-mono text-slate-400 max-w-full truncate px-4">
              {idea.siteName || "Previa indisponível"}
            </span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full bg-neu-bg/90 backdrop-blur shadow-neu-flat-sm text-slate-600 border border-white/40">
            <Globe className="w-3.5 h-3.5 text-[#ec4899]" />
            {idea.siteName || "Webpage"}
          </span>
        </div>

        {/* Quick Delete Floating Button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-neu-bg/90 backdrop-blur shadow-neu-flat border border-white/50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-neu-pressed active:scale-95 transition-all z-10"
          title="Excluir link"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Custom Neumorphic Delete Confirmation Overlay */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neu-bg/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-neu-bg shadow-neu-flat flex items-center justify-center p-[2.5px] border border-white/50 mb-3">
                <div className="w-full h-full rounded-[11px] bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white animate-pulse">
                  <Trash2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs font-extrabold text-slate-800 mb-4 px-4 leading-snug">
                Deseja realmente excluir este link?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await onDelete(idea.id);
                    } catch (err) {
                      console.error("Erro ao excluir:", err);
                    } finally {
                      setIsDeleting(false);
                      setShowDeleteConfirm(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-105 active:scale-95 text-white text-[11px] font-black rounded-full shadow-[0_4px_10px_rgba(244,63,94,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Sim, Excluir"
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-neu-bg shadow-neu-flat hover:shadow-neu-pressed active:scale-95 text-slate-500 hover:text-slate-700 rounded-full text-[11px] font-bold border border-white/60 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
        {/* URL Meta Information */}
        <div className="space-y-2.5">
          <a
            href={idea.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/title block focus:outline-none"
          >
            <h3 className="font-extrabold text-slate-800 group-hover/title:text-[#ec4899] transition-colors line-clamp-2 leading-snug text-base">
              {idea.title}
            </h3>
          </a>
          {idea.description && (
            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
              {idea.description}
            </p>
          )}
          <div className="flex items-center text-[10px] text-slate-400 font-bold gap-1.5 mt-1 tracking-wider uppercase">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Salvo em {formattedDate}
          </div>
        </div>

        {/* Status Pills with Neumorphic sliding channel style */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-[#ec4899] tracking-wider uppercase block pl-1">
            Status da Ideia
          </span>
          <div className="grid grid-cols-3 gap-1 bg-neu-bg shadow-neu-pressed p-1 rounded-2xl border border-white/30">
            <button
              onClick={() => handleStatusChange("pending")}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                idea.status === "pending"
                  ? "bg-neu-bg shadow-neu-flat text-amber-600 border border-white/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Eye className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Nova</span>
            </button>
            <button
              onClick={() => handleStatusChange("drafted")}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                idea.status === "drafted"
                  ? "bg-neu-bg shadow-neu-flat text-[#ec4899] border border-white/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Roteiro</span>
            </button>
            <button
              onClick={() => handleStatusChange("published")}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                idea.status === "published"
                  ? "bg-neu-bg shadow-neu-flat text-emerald-600 border border-white/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Pronto</span>
            </button>
          </div>
        </div>

        {/* User Notes Block with Deep Neumorphic slot */}
        <div className="space-y-2 bg-neu-bg shadow-neu-pressed rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#ec4899]" />
              Minhas Anotações
            </span>
            {!isEditingNotes ? (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-xs text-[#ec4899] hover:text-pink-600 font-bold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="text-xs text-slate-400 font-bold hover:text-slate-600"
                  disabled={isSavingNotes}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateNotes}
                  className="text-xs text-emerald-600 font-extrabold flex items-center gap-0.5"
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Salvar
                </button>
              </div>
            )}
          </div>

          {!isEditingNotes ? (
            <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3 font-medium">
              {idea.notes ? `"${idea.notes}"` : "Nenhuma anotação adicionada ainda. Escreva o que você pensou para este post."}
            </p>
          ) : (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="w-full text-xs bg-neu-bg shadow-neu-pressed rounded-xl p-3 border-0 focus:outline-none focus:ring-0 font-medium"
              rows={3}
              placeholder="Digite insights, ideias de título, público-alvo ou o que planeja fazer com esse link..."
              disabled={isSavingNotes}
            />
          )}
        </div>

        {/* Dynamic Tags Area */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 tracking-wider uppercase pl-1">
            <Tag className="w-3.5 h-3.5 text-[#f97316]" />
            Tags / Categorias
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {idea.tags &&
              idea.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-[11px] font-bold bg-neu-bg shadow-neu-flat text-slate-600 pl-3 pr-1.5 py-1 rounded-full border border-white/50"
                >
                  #{t}
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white/40 transition-all"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

            {/* Quick Tag Form with neat inset design */}
            <form onSubmit={handleAddTag} className="flex items-center">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="+ Nova tag"
                className="w-24 text-[10.5px] border-b border-dashed border-slate-300 focus:border-[#ec4899] bg-transparent py-0.5 px-1.5 text-slate-500 focus:outline-none placeholder-slate-400 font-bold"
              />
            </form>
          </div>
        </div>

        {/* Action Button: AI Ideas Generation */}
        <div className="pt-2 space-y-2">
          {aiError && (
            <div className="flex items-center gap-1.5 text-rose-500 bg-neu-bg shadow-neu-pressed px-3 py-2 rounded-xl text-[10.5px] border border-rose-100 font-bold">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
              <span className="truncate">{aiError}</span>
            </div>
          )}
          {idea.aiSummary ? (
            <button
              onClick={() => onOpenAiIdeas(idea.title, idea.url, idea.aiSummary!)}
              className="w-full py-3 px-4 bg-neu-bg shadow-neu-flat hover:shadow-neu-pressed active:scale-[0.98] text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#f97316] rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all border border-white/60"
            >
              <Sparkles className="w-4 h-4 text-[#ec4899]" />
              Ver Ideias Criadas pela IA
            </button>
          ) : (
            <button
              onClick={handleGenerateAiIdeas}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#ec4899] via-[#ef4444] to-[#f97316] hover:brightness-105 active:scale-[0.98] text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(236,72,153,0.3)] disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando roteiro com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  Criar Ideias de Posts (IA)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
