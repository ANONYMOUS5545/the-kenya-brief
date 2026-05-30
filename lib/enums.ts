// Local enum definitions matching Prisma schema
// These mirror the enums in prisma/schema.prisma

export enum Role {
  READER = "READER",
  JUNIOR_EDITOR = "JUNIOR_EDITOR",
  SENIOR_EDITOR = "SENIOR_EDITOR",
  ADMIN = "ADMIN",
}

export enum ArticleStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
  ARCHIVED = "ARCHIVED",
}

export enum CommentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  FLAGGED = "FLAGGED",
}

// Re-export as Prisma namespace mock for compatibility
export const Prisma = {
  Role,
  ArticleStatus,
  CommentStatus,
};
