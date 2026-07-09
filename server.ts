import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { parse as parseHtml } from "node-html-parser";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // Helper to resolve Instagram links
  async function resolveInstagramMetadata(urlString: string) {
    const isInstagram = /instagram\.com/i.test(urlString);
    if (!isInstagram) return null;

    try {
      const cleanUrl = urlString.split("?")[0].split("#")[0].replace(/\/+$/, "");
      const urlObj = new URL(cleanUrl);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      
      let title = "Publicação no Instagram";
      let description = "Link do Instagram salvo para inspiração de conteúdo.";
      let image = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80";
      
      if (pathParts.length > 0) {
        if (pathParts[0] === "p" || pathParts[0] === "reel" || pathParts[0] === "reels" || pathParts[0] === "tv") {
          const code = pathParts[1];
          title = pathParts[0] === "reel" || pathParts[0] === "reels" ? "Reel do Instagram" : "Post do Instagram";
          if (code) {
            image = `https://images.weserv.nl/?url=www.instagram.com/p/${code}/media/?size=l`;
          }
        } else {
          const username = pathParts[0];
          title = `@${username} no Instagram`;
          description = `Perfil de @${username} no Instagram para inspiração de postagens.`;
        }
      }

      return {
        title,
        description,
        image,
        siteName: "Instagram",
        url: urlString
      };
    } catch (err) {
      console.error("Error parsing Instagram URL:", err);
      return {
        title: "Instagram Link",
        description: "Link do Instagram salvo para inspiração.",
        image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80",
        siteName: "Instagram",
        url: urlString
      };
    }
  }

  // Helper to resolve Designi links (both short and standard item links)
  async function resolveDesigniMetadata(urlString: string) {
    const isDesigni = /designi\.com\.br/i.test(urlString);
    if (!isDesigni) return null;

    const cleanUrl = urlString.split("?")[0].split("#")[0].replace(/\/+$/, "");

    // Type 1: Standard Item URL with Slug and ID
    // e.g. https://designi.com.br/item/story-pastelaria-morada-do-pastel-venhas-nos-conhecer-psd-editavel-13772690
    const itemMatch = cleanUrl.match(/\/item\/([a-zA-Z0-9\-]+)-(\d+)$/i) || cleanUrl.match(/\/([a-zA-Z0-9\-]+)-(\d+)$/);
    
    if (itemMatch) {
      const slug = itemMatch[1];
      const id = itemMatch[2];
      
      const title = slug
        .replace(/item/gi, "")
        .split(/[-_]+/)
        .map(word => {
          if (!word) return "";
          const lower = word.toLowerCase();
          if (lower === "psd") return "PSD";
          if (lower === "png") return "PNG";
          if (lower === "editavel") return "Editável";
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .filter(Boolean)
        .join(" ");

      return {
        title: title || "Recurso Gráfico Designi",
        description: "Recurso gráfico premium editável disponível no Designi.",
        image: `https://img.cdndsgni.com/preview/${id}.jpg`,
        siteName: "Designi",
        url: urlString
      };
    }

    // Type 2: Shortlink
    // e.g. https://www.designi.com.br/1d53301fc233861b
    const segments = cleanUrl.split("/");
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment && /^[a-fA-F0-9]{16}$/.test(lastSegment)) {
      try {
        const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdWV1enVhdWRkcWh1b2pzc2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzcwODAsImV4cCI6MjA4MjAxMzA4MH0.rrT9f6Y0igImXG-lQq72I7zwaOvHxCtCNtW6XkOyEAU";
        const sfUrl = "https://soueuzuauddqhuojssek.supabase.co/functions/v1/meilisearch-proxy";
        const sfBody = {
          action: "getDesignFromDatabase",
          documentId: lastSegment
        };
        
        const response = await fetch(sfUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`,
            "apikey": anonKey
          },
          body: JSON.stringify(sfBody)
        });
        
        if (response.ok) {
          const body = await response.json() as any;
          if (body && body.design) {
            const design = body.design;
            const originalFilename = design.originalFilename || "";
            
            let title = originalFilename
              .replace(/\.[a-zA-Z0-9]+$/, "") // remove extension
              .split(/[-_]+/)
              .map((word: string) => {
                if (!word) return "";
                const lower = word.toLowerCase();
                if (lower === "psd") return "PSD";
                if (lower === "png") return "PNG";
                if (lower === "editavel") return "Editável";
                return word.charAt(0).toUpperCase() + word.slice(1);
              })
              .filter(Boolean)
              .join(" ");

            if (!title && design.description) {
              title = design.description;
            }

            const image = design.id 
              ? `https://img.cdndsgni.com/preview/${design.id}.jpg`
              : (design.image_url || "");

            const desc = design.description || "Recurso gráfico premium editável disponível no Designi.";

            return {
              title: title || "Recurso Gráfico Designi",
              description: desc,
              image,
              siteName: "Designi",
              url: urlString
            };
          }
        }
      } catch (err) {
        console.error("Failed to query Supabase for shortlink:", err);
      }
    }

    // Fallback for other Designi structures
    const digitMatch = cleanUrl.match(/\d{5,12}/g);
    if (digitMatch) {
      const id = digitMatch[digitMatch.length - 1];
      return {
        title: "Recurso Gráfico Designi",
        description: "Recurso gráfico premium editável disponível no Designi.",
        image: `https://img.cdndsgni.com/preview/${id}.jpg`,
        siteName: "Designi",
        url: urlString
      };
    }

    return {
      title: "Recurso Gráfico Designi",
      description: "Recurso gráfico premium editável disponível no Designi.",
      image: "",
      siteName: "Designi",
      url: urlString
    };
  }

  // API Route: Extract metadata from URL
  app.get("/api/preview", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      res.status(400).json({ error: "URL parameter is required" });
      return;
    }

    let urlString = targetUrl.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = "https://" + urlString;
    }

    try {
      // 1. Try Designi-specific resolver first
      const designiMeta = await resolveDesigniMetadata(urlString);
      if (designiMeta) {
        res.json(designiMeta);
        return;
      }

      // 1.5 Try Instagram-specific resolver
      const instagramMeta = await resolveInstagramMetadata(urlString);
      if (instagramMeta) {
        res.json(instagramMeta);
        return;
      }

      // 2. Standard scraper for other URLs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(urlString, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const root = parseHtml(html);

      // Extract basic tags
      let title = "";
      
      const h1Elements = root.querySelectorAll("h1");
      let longestH1 = "";
      for (const h1 of h1Elements) {
        const text = h1.text.trim();
        if (text && text.length > longestH1.length) {
          longestH1 = text;
        }
      }
      if (longestH1) {
        title = longestH1;
      }

      if (!title) {
        title = root.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
                root.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ||
                root.querySelector("title")?.text ||
                urlString;
      }

      const description = root.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
                          root.querySelector('meta[name="description"]')?.getAttribute("content") ||
                          root.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ||
                          "Sem descrição disponível para esta página.";

      let image = root.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
                  root.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
                  "";

      // Relative path handling for images
      if (image && !/^https?:\/\//i.test(image)) {
        try {
          const base = new URL(urlString);
          image = new URL(image, base.origin).toString();
        } catch {
          image = "";
        }
      }

      let siteName = root.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ||
                     root.querySelector('meta[name="twitter:site"]')?.getAttribute("content") ||
                     "";

      if (!siteName) {
        try {
          siteName = new URL(urlString).hostname.replace("www.", "");
        } catch {
          siteName = "Link";
        }
      }

      res.json({
        title: title.trim().substring(0, 200),
        description: description.trim().substring(0, 500),
        image,
        siteName: siteName.trim(),
        url: urlString
      });
    } catch (error: any) {
      console.error("Meta extraction failed, applying fallbacks:", error.message || error);
      
      let fallbackTitle = "";
      try {
        fallbackTitle = new URL(urlString).hostname;
      } catch {
        fallbackTitle = urlString;
      }

      res.json({
        title: fallbackTitle,
        description: "Metadados básicos do link salvos com sucesso!",
        image: "",
        siteName: fallbackTitle,
        url: urlString
      });
    }
  });

  // API Route: Generate Post Ideas with Gemini
  app.post("/api/generate-ideas", async (req, res) => {
    const { url, title, description, notes } = req.body;
    if (!url) {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    try {
      const aiKey = process.env.GEMINI_API_KEY;
      if (!aiKey) {
        res.status(500).json({ error: "A chave de API do Gemini não está configurada." });
        return;
      }

      const ai = new GoogleGenAI({ apiKey: aiKey });
      const prompt = `Você é um especialista em marketing digital e criação de conteúdo estratégico. O usuário salvou um link de inspiração para ideias de postagem:
- URL de referência: ${url}
- Título da página: ${title || "Sem título"}
- Descrição da página: ${description || "Sem descrição"}
- Anotações do usuário: ${notes || "Sem anotações adicionais"}

Com base nessa referência, gere exatamente 3 ideias criativas de posts de alto engajamento. Cada ideia deve conter:
1. Um título atraente (com emojis adequados)
2. O formato recomendado (ex: Carrossel no Instagram, Texto longo no LinkedIn, Vídeo curto de 30s no TikTok)
3. Um gancho (hook) forte para os primeiros segundos/linhas
4. Um breve roteiro ou tópicos principais do conteúdo
5. Sugestão de Call-to-Action (chamada para ação)

Gere a resposta em português brasileiro, formatada em Markdown claro e atraente com espaçamento de visualização agradável.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ ideas: response.text });
    } catch (err: any) {
      console.error("Gemini call failed:", err);
      res.status(500).json({ error: "Falha ao gerar ideias de posts com IA: " + (err.message || err) });
    }
  });

  // Vite middleware setup for development, static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || "development"} mode)`);
  });
}

startServer();
