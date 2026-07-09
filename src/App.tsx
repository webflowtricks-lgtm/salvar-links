import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Sparkles, Library, Filter, Search, Grid, List, Plus, LayoutGrid, CheckCircle2, FileText, Eye, RefreshCw, Bookmark, HelpCircle } from "lucide-react";
import { db, testConnection } from "./firebase";
import { PostIdea } from "./types";
import UrlInputForm from "./components/UrlInputForm";
import LinkCard from "./components/LinkCard";
import AiIdeasModal from "./components/AiIdeasModal";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "drafted" | "published">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modal State for AI Ideas
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState("");
  const [aiModalUrl, setAiModalUrl] = useState("");
  const [aiModalIdeas, setAiModalIdeas] = useState("");

  // Connection testing and initial setup
  useEffect(() => {
    testConnection();

    const q = query(collection(db, "post_ideas"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedIdeas: PostIdea[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loadedIdeas.push({
            id: doc.id,
            url: data.url,
            title: data.title,
            description: data.description,
            image: data.image,
            siteName: data.siteName,
            notes: data.notes,
            status: data.status,
            createdAt: data.createdAt,
            tags: data.tags,
            aiSummary: data.aiSummary
          });
        });
        setIdeas(loadedIdeas);
        setIsLoading(false);
      },
      (error) => {
        console.error("Erro ao escutar mudanças em tempo real:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save new idea
  const handleSaveIdea = async (targetUrl: string, notes: string, tags: string[]) => {
    try {
      // 1. Fetch preview from Express backend
      const response = await fetch(`/api/preview?url=${encodeURIComponent(targetUrl)}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar a prévia do link.");
      }
      
      const previewData = await response.json();

      // 2. Add document to Firestore
      const newIdeaData = {
        url: previewData.url || targetUrl,
        title: previewData.title || targetUrl,
        description: previewData.description || "",
        image: previewData.image || "",
        siteName: previewData.siteName || "",
        notes: notes,
        status: "pending", // Default to 'pending'
        createdAt: new Date().toISOString(),
        tags: tags,
        aiSummary: ""
      };

      await addDoc(collection(db, "post_ideas"), newIdeaData);
    } catch (error: any) {
      console.error("Erro ao salvar ideia:", error);
      throw new Error(error.message || "Erro de conexão ao salvar link.");
    }
  };

  // Update idea fields (notes, tags, status, etc.)
  const handleUpdateIdea = async (id: string, updates: Partial<PostIdea>) => {
    try {
      const ideaRef = doc(db, "post_ideas", id);
      await updateDoc(ideaRef, updates);
    } catch (error) {
      console.error("Erro ao atualizar ideia:", error);
    }
  };

  // Delete idea
  const handleDeleteIdea = async (id: string) => {
    try {
      const ideaRef = doc(db, "post_ideas", id);
      await deleteDoc(ideaRef);
    } catch (error) {
      console.error("Erro ao excluir ideia:", error);
    }
  };

  // Handle open modal with generated AI ideas
  const handleOpenAiIdeas = (title: string, url: string, ideasText: string) => {
    setAiModalTitle(title);
    setAiModalUrl(url);
    setAiModalIdeas(ideasText);
    setIsAiModalOpen(true);
  };

  // Extract all unique tags
  const allUniqueTags = Array.from(
    new Set(ideas.flatMap((idea) => idea.tags || []))
  ).sort();

  // Filter ideas based on search, status and tags
  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (idea.description && idea.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (idea.notes && idea.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      idea.url.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || idea.status === statusFilter;

    const matchesTag = !selectedTag || (idea.tags && idea.tags.includes(selectedTag));

    return matchesSearch && matchesStatus && matchesTag;
  });

  // Count stats
  const totalCount = ideas.length;
  const pendingCount = ideas.filter((i) => i.status === "pending").length;
  const draftedCount = ideas.filter((i) => i.status === "drafted").length;
  const publishedCount = ideas.filter((i) => i.status === "published").length;

  return (
    <div className="min-h-screen bg-neu-bg flex flex-col pb-16 selection:bg-pink-100 selection:text-pink-900">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-neu-bg/90 backdrop-blur-md px-4 md:px-8 py-4 border-b border-white/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo with Neumorphic extrusion and gradient icon */}
            <div className="w-12 h-12 rounded-2xl bg-neu-bg shadow-neu-flat flex items-center justify-center p-[3px] border border-white/50">
              <div className="w-full h-full rounded-[13px] bg-gradient-to-tr from-[#ec4899] via-[#ef4444] to-[#f97316] flex items-center justify-center text-white shadow-inner">
                <Bookmark className="w-5.5 h-5.5" />
              </div>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
                IdeiasPost
                {/* Neumorphic Inset Channel for live status */}
                <span className="text-[10px] bg-neu-bg shadow-neu-pressed font-mono font-bold px-3 py-1 rounded-full text-slate-600 flex items-center gap-1.5 border border-white/30">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 animate-pulse shadow-md shadow-emerald-400/50"></span>
                  Tempo Real
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block font-medium mt-0.5">
                Colete referências e crie roteiros estruturados de postagens instantaneamente
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-neu-bg shadow-neu-flat hover:shadow-neu-pressed active:shadow-neu-pressed rounded-full text-slate-500 hover:text-slate-800 transition-all text-xs font-semibold flex items-center gap-2 border border-white/60"
            >
              <HelpCircle className="w-4 h-4 text-[#ef4444]" />
              <span>Como funciona?</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 pt-8 space-y-10">
        
        {/* Welcome Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          {/* Accent decoration line */}
          <div className="w-12 h-1.5 bg-gradient-to-r from-[#ec4899] to-[#f97316] rounded-full mx-auto mb-4 shadow-[0_2px_10px_rgba(236,72,153,0.3)]" />
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 leading-tight">
            Guarde suas inspirações de posts em segundos
          </h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Cole links do Instagram, TikTok, blogs ou qualquer página da web. Nós geramos a prévia visual e ajudamos você a criar roteiros com Inteligência Artificial.
          </p>
        </div>

        {/* URL Parser Input Form Component */}
        <div className="relative z-10">
          <UrlInputForm onSave={handleSaveIdea} />
        </div>

       

        {/* Filter and Tools Section */}
        <div className="bg-neu-bg rounded-3xl shadow-neu-flat p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-white/50">
          
          {/* Left search & filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-grow max-w-3xl">
            {/* Search Box with Neumorphic Inset */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por palavras-chave ou anotações..."
                className="w-full pl-11 pr-4 py-3 bg-neu-bg shadow-neu-pressed border-0 rounded-2xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
              />
            </div>

            {/* Status Selector - Neumorphic tab switcher channel */}
            <div className="flex items-center gap-1.5 bg-neu-bg shadow-neu-pressed p-1.5 rounded-2xl border border-white/30">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === "all"
                    ? "bg-neu-bg shadow-neu-flat text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#f97316]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === "pending"
                    ? "bg-neu-bg shadow-neu-flat text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#f97316]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Novas
              </button>
              <button
                onClick={() => setStatusFilter("drafted")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === "drafted"
                    ? "bg-neu-bg shadow-neu-flat text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#f97316]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Roteiros
              </button>
              <button
                onClick={() => setStatusFilter("published")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === "published"
                    ? "bg-neu-bg shadow-neu-flat text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#f97316]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Prontas
              </button>
            </div>
          </div>

          {/* Tag Filter selection display */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Filtro:</span>
            <div className="flex items-center gap-2 overflow-x-auto max-w-[280px] sm:max-w-[400px] lg:max-w-none py-1">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 text-xs rounded-full font-bold transition-all ${
                  !selectedTag 
                    ? "bg-gradient-to-r from-[#ec4899] to-[#f97316] text-white shadow-[0_2px_8px_rgba(236,72,153,0.3)]" 
                    : "bg-neu-bg shadow-neu-flat text-slate-500 border border-white/60 hover:text-slate-800"
                }`}
              >
                Tags (Tudo)
              </button>
              {allUniqueTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1.5 text-xs rounded-full font-bold transition-all whitespace-nowrap ${
                    tag === selectedTag 
                      ? "bg-gradient-to-r from-[#ec4899] to-[#f97316] text-white shadow-[0_2px_8px_rgba(236,72,153,0.3)]" 
                      : "bg-neu-bg shadow-neu-flat text-slate-500 border border-white/60 hover:text-slate-800"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ideas Grid Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 bg-neu-bg rounded-3xl shadow-neu-pressed p-8 border border-white/30">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-bold text-slate-500 tracking-wide">Buscando seus links salvos no banco de dados...</p>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="bg-neu-bg rounded-3xl shadow-neu-pressed py-20 px-6 text-center max-w-2xl mx-auto space-y-5 border border-white/30">
            <div className="w-16 h-16 rounded-full bg-neu-bg shadow-neu-flat flex items-center justify-center text-slate-400 mx-auto border border-white/50">
              <Filter className="w-7 h-7 text-[#ec4899]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Nenhum link correspondente</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 font-medium">
                {ideas.length === 0
                  ? "Seu mural está vazio. Cole seu primeiro link acima para começar a guardar e transformar ideias!"
                  : "Nenhuma ideia ou link atende aos filtros de pesquisa atuais. Tente limpar os termos de busca ou mudar a categoria."}
              </p>
            </div>
            {ideas.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSelectedTag(null);
                }}
                className="px-5 py-3 bg-neu-bg shadow-neu-flat hover:shadow-neu-pressed text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#f97316] text-xs font-black rounded-xl transition-all border border-white/60"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredIdeas.map((idea) => (
                <LinkCard
                  key={idea.id}
                  idea={idea}
                  onUpdate={handleUpdateIdea}
                  onDelete={handleDeleteIdea}
                  onOpenAiIdeas={handleOpenAiIdeas}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* AI Ideas Preview Modal */}
      <AiIdeasModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title={aiModalTitle}
        url={aiModalUrl}
        ideas={aiModalIdeas}
      />
    </div>
  );
}
