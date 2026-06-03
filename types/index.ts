// Type definitions for The Kenya Brief

export type Role = "READER" | "JUNIOR_EDITOR" | "SENIOR_EDITOR" | "ADMIN";
export type ArticleStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  bio?: string | null;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: Date;
}

export interface ArticleWithRelations {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
  imageCaption?: string | null;
  imageCredit?: string | null;
  videoUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceAuthor?: string | null;
  sourcePublishedAt?: Date | null;
  isAutomated?: boolean;
  status: ArticleStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isBreaking: boolean;
  viewCount: number;
  readTime?: number | null;
  publishedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; image?: string | null };
  category: { id: string; name: string; slug: string; color?: string | null };
  tags: Array<{ tag: { id: string; name: string; slug: string } }>;
  _count?: { comments: number };
}

export interface CommentWithRelations {
  id: string;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  guestName?: string | null;
  guestEmail?: string | null;
  user?: { id: string; name: string; image?: string | null } | null;
  replies?: CommentWithRelations[];
  _count?: { replies: number };
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  icon?: string | null;
  _count: { articles: number };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
}
