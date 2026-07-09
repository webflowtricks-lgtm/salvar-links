export interface PostIdea {
  id: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  notes?: string;
  status: "pending" | "drafted" | "published";
  createdAt: string;
  tags?: string[];
  aiSummary?: string;
}
