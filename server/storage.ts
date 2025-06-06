import {
  users,
  fanworks,
  tags,
  fanworkTags,
  likes,
  comments,
  bookmarks,
  reports,
  type User,
  type UpsertUser,
  type Fanwork,
  type InsertFanwork,
  type Tag,
  type InsertTag,
  type Comment,
  type InsertComment,
  type Like,
  type Bookmark,
  type Report,
  type InsertReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations for email/password auth
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<UpsertUser>): Promise<User>;
  
  // Fanwork operations
  getFanworks(filters?: {
    type?: string[];
    rating?: string[];
    tags?: string[];
    search?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Fanwork[]>;
  getFanwork(id: number): Promise<Fanwork | undefined>;
  createFanwork(fanwork: InsertFanwork): Promise<Fanwork>;
  updateFanwork(id: number, fanwork: Partial<InsertFanwork>): Promise<Fanwork>;
  deleteFanwork(id: number): Promise<void>;
  
  // Tag operations
  getTags(): Promise<Tag[]>;
  getOrCreateTag(name: string): Promise<Tag>;
  addTagsToFanwork(fanworkId: number, tagNames: string[]): Promise<void>;
  getFanworkTags(fanworkId: number): Promise<Tag[]>;
  
  // Interaction operations
  toggleLike(userId: number, fanworkId: number): Promise<boolean>;
  toggleBookmark(userId: number, fanworkId: number): Promise<boolean>;
  isLiked(userId: number, fanworkId: number): Promise<boolean>;
  isBookmarked(userId: number, fanworkId: number): Promise<boolean>;
  getFanworkCounts(fanworkId: number): Promise<{
    likes: number;
    comments: number;
    bookmarks: number;
  }>;
  
  // Comment operations
  getComments(fanworkId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number, userId: number): Promise<void>;

  // Moderation operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  updateReport(id: number, data: Partial<Report>): Promise<Report>;
  banUser(userId: string, data: { banReason: string; bannedBy: string; bannedAt: Date }): Promise<User>;
  unbanUser(userId: string): Promise<User>;
  hideFanwork(fanworkId: number, data: { moderationReason: string; moderatedBy: string; moderatedAt: Date }): Promise<Fanwork>;
  unhideFanwork(fanworkId: number): Promise<Fanwork>;
  updateUserRole(userId: string, role: string): Promise<User>;
  verifyUserAge(userId: number): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations for email/password authentication
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Fanwork operations
  async getFanworks(filters?: {
    type?: string[];
    rating?: string[];
    tags?: string[];
    search?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Fanwork[]> {
    let query = db.select().from(fanworks);

    const conditions = [];

    if (filters?.type?.length) {
      conditions.push(inArray(fanworks.type, filters.type));
    }
    if (filters?.rating?.length) {
      conditions.push(inArray(fanworks.rating, filters.rating));
    }
    if (filters?.search) {
      conditions.push(
        sql`${fanworks.title} ILIKE ${`%${filters.search}%`} OR ${fanworks.description} ILIKE ${`%${filters.search}%`}`
      );
    }
    if (filters?.authorId) {
      conditions.push(eq(fanworks.authorId, parseInt(filters.authorId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query
      .orderBy(desc(fanworks.createdAt))
      .limit(filters?.limit || 20)
      .offset(filters?.offset || 0);

    return result;
  }

  async getFanwork(id: number): Promise<Fanwork | undefined> {
    const [fanwork] = await db.select().from(fanworks).where(eq(fanworks.id, id));
    return fanwork || undefined;
  }

  async createFanwork(fanwork: InsertFanwork): Promise<Fanwork> {
    const [created] = await db.insert(fanworks).values(fanwork).returning();
    return created;
  }

  async updateFanwork(id: number, fanwork: Partial<InsertFanwork>): Promise<Fanwork> {
    const [updated] = await db
      .update(fanworks)
      .set({ ...fanwork, updatedAt: new Date() })
      .where(eq(fanworks.id, id))
      .returning();
    return updated;
  }

  async deleteFanwork(id: number): Promise<void> {
    await db.delete(fanworks).where(eq(fanworks.id, id));
  }

  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  async getOrCreateTag(name: string): Promise<Tag> {
    const [existing] = await db.select().from(tags).where(eq(tags.name, name));
    
    if (existing) {
      return existing;
    }

    const [created] = await db.insert(tags).values({ name }).returning();
    return created;
  }

  async addTagsToFanwork(fanworkId: number, tagNames: string[]): Promise<void> {
    for (const tagName of tagNames) {
      const tag = await this.getOrCreateTag(tagName);
      
      // Check if relationship already exists
      const [existing] = await db
        .select()
        .from(fanworkTags)
        .where(and(eq(fanworkTags.fanworkId, fanworkId), eq(fanworkTags.tagId, tag.id)));

      if (!existing) {
        await db.insert(fanworkTags).values({
          fanworkId,
          tagId: tag.id,
        });
      }
    }
  }

  async getFanworkTags(fanworkId: number): Promise<Tag[]> {
    const result = await db
      .select({ tag: tags })
      .from(fanworkTags)
      .innerJoin(tags, eq(fanworkTags.tagId, tags.id))
      .where(eq(fanworkTags.fanworkId, fanworkId));

    return result.map(r => r.tag);
  }

  // Interaction operations
  async toggleLike(userId: number, fanworkId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.fanworkId, fanworkId)));

    if (existing) {
      await db
        .delete(likes)
        .where(and(eq(likes.userId, userId), eq(likes.fanworkId, fanworkId)));
      return false;
    } else {
      await db.insert(likes).values({ userId, fanworkId });
      return true;
    }
  }

  async toggleBookmark(userId: number, fanworkId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.fanworkId, fanworkId)));

    if (existing) {
      await db
        .delete(bookmarks)
        .where(and(eq(bookmarks.userId, userId), eq(bookmarks.fanworkId, fanworkId)));
      return false;
    } else {
      await db.insert(bookmarks).values({ userId, fanworkId });
      return true;
    }
  }

  async isLiked(userId: number, fanworkId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.fanworkId, fanworkId)));
    return !!existing;
  }

  async isBookmarked(userId: number, fanworkId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.fanworkId, fanworkId)));
    return !!existing;
  }

  async getFanworkCounts(fanworkId: number): Promise<{
    likes: number;
    comments: number;
    bookmarks: number;
  }> {
    const [likesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.fanworkId, fanworkId));

    const [commentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.fanworkId, fanworkId));

    const [bookmarksCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.fanworkId, fanworkId));

    return {
      likes: likesCount?.count || 0,
      comments: commentsCount?.count || 0,
      bookmarks: bookmarksCount?.count || 0,
    };
  }

  async getComments(fanworkId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.fanworkId, fanworkId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async deleteComment(id: number, userId: number): Promise<void> {
    await db
      .delete(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)));
  }

  // Moderation operations
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async updateReport(id: number, data: Partial<Report>): Promise<Report> {
    const [updatedReport] = await db
      .update(reports)
      .set(data)
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async banUser(userId: string, data: { banReason: string; bannedBy: string; bannedAt: Date }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isBanned: true,
        banReason: data.banReason,
        bannedBy: data.bannedBy,
        bannedAt: data.bannedAt,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async unbanUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isBanned: false,
        banReason: null,
        bannedBy: null,
        bannedAt: null,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async hideFanwork(fanworkId: number, data: { moderationReason: string; moderatedBy: string; moderatedAt: Date }): Promise<Fanwork> {
    const [fanwork] = await db
      .update(fanworks)
      .set({
        isHidden: true,
        moderationReason: data.moderationReason,
        moderatedBy: data.moderatedBy,
        moderatedAt: data.moderatedAt,
      })
      .where(eq(fanworks.id, fanworkId))
      .returning();
    return fanwork;
  }

  async unhideFanwork(fanworkId: number): Promise<Fanwork> {
    const [fanwork] = await db
      .update(fanworks)
      .set({
        isHidden: false,
        moderationReason: null,
        moderatedBy: null,
        moderatedAt: null,
      })
      .where(eq(fanworks.id, fanworkId))
      .returning();
    return fanwork;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async verifyUserAge(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ageVerified: true })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();