import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { Request, Response } from "express";
import { authenticateToken, optionalAuth, requireModerator, requireAdmin, AuthRequest, hashPassword, comparePassword, generateToken } from "./auth";
import { insertFanworkSchema, insertCommentSchema, insertReportSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { z } from "zod";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ao3ImportSchema = z.object({
  ao3Url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Configure multer with Cloudinary storage
  const multerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'rickorty-archive',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx'],
      resource_type: 'auto',
    },
  });

  const upload = multer({ 
    storage: multerStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only images and documents are allowed'));
      }
    }
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        email: validatedData.email,
        username: validatedData.username,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName
      });

      const token = generateToken(user.id);
      res.json({ 
        user: { id: user.id, email: user.email, username: user.username }, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || user.isBanned) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await comparePassword(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      res.json({ 
        user: { id: user.id, email: user.email, username: user.username }, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/user', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        ageVerified: user.ageVerified,
        createdAt: user.createdAt,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Fanwork routes
  app.get('/api/fanworks', optionalAuth as any, async (req: AuthRequest, res) => {
    try {
      const filters = {
        type: req.query.type ? (Array.isArray(req.query.type) ? req.query.type as string[] : [req.query.type as string]) : undefined,
        rating: req.query.rating ? (Array.isArray(req.query.rating) ? req.query.rating as string[] : [req.query.rating as string]) : undefined,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags as string[] : [req.query.tags as string]) : undefined,
        search: req.query.search as string,
        authorId: req.query.authorId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const fanworks = await storage.getFanworks(filters);
      res.json(fanworks);
    } catch (error) {
      console.error('Error fetching fanworks:', error);
      res.status(500).json({ message: 'Failed to fetch fanworks' });
    }
  });

  app.get('/api/fanworks/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const fanwork = await storage.getFanwork(id);
      
      if (!fanwork) {
        return res.status(404).json({ message: 'Fanwork not found' });
      }

      res.json(fanwork);
    } catch (error) {
      console.error('Error fetching fanwork:', error);
      res.status(500).json({ message: 'Failed to fetch fanwork' });
    }
  });

  app.post('/api/fanworks', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      const fanworkData = insertFanworkSchema.parse({
        ...req.body,
        authorId: req.user!.id,
        contentUrl: req.file ? (req.file as any).path : undefined,
      });

      const fanwork = await storage.createFanwork(fanworkData);
      
      // Add tags if provided
      if (req.body.tags) {
        const tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
        await storage.addTagsToFanwork(fanwork.id, tags);
      }

      res.status(201).json(fanwork);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating fanwork:', error);
      res.status(500).json({ message: 'Failed to create fanwork' });
    }
  });

  // AO3 Import functionality
  app.post('/api/fanworks/import/ao3', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { ao3Url, title, description } = ao3ImportSchema.parse(req.body);
      
      // Extract AO3 work ID from URL
      const ao3WorkIdMatch = ao3Url.match(/\/works\/(\d+)/);
      if (!ao3WorkIdMatch) {
        return res.status(400).json({ message: 'Invalid AO3 URL format' });
      }
      
      const ao3WorkId = ao3WorkIdMatch[1];

      // Create fanwork with AO3 import data
      const fanworkData = {
        title: title || `Imported from AO3 Work ${ao3WorkId}`,
        description: description || 'Imported from Archive of Our Own',
        type: 'fanfiction',
        rating: 'teen', // Default rating, can be updated later
        authorId: req.user!.id,
        ao3WorkId,
        ao3Url,
        importedAt: new Date(),
        content: `This work was imported from Archive of Our Own: ${ao3Url}\n\nPlease visit the original link for the full content.`,
      };

      const fanwork = await storage.createFanwork(fanworkData);
      res.status(201).json(fanwork);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error importing from AO3:', error);
      res.status(500).json({ message: 'Failed to import from AO3' });
    }
  });

  // Like/Unlike fanwork
  app.post('/api/fanworks/:id/like', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const fanworkId = parseInt(req.params.id);
      const isLiked = await storage.toggleLike(req.user!.id, fanworkId);
      res.json({ isLiked });
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  });

  // Bookmark/Unbookmark fanwork
  app.post('/api/fanworks/:id/bookmark', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const fanworkId = parseInt(req.params.id);
      const isBookmarked = await storage.toggleBookmark(req.user!.id, fanworkId);
      res.json({ isBookmarked });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      res.status(500).json({ message: 'Failed to toggle bookmark' });
    }
  });

  // Get fanwork counts (likes, comments, bookmarks)
  app.get('/api/fanworks/:id/counts', async (req, res) => {
    try {
      const fanworkId = parseInt(req.params.id);
      const counts = await storage.getFanworkCounts(fanworkId);
      res.json(counts);
    } catch (error) {
      console.error('Error fetching counts:', error);
      res.status(500).json({ message: 'Failed to fetch counts' });
    }
  });

  // Comments
  app.get('/api/fanworks/:id/comments', async (req, res) => {
    try {
      const fanworkId = parseInt(req.params.id);
      const comments = await storage.getComments(fanworkId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  app.post('/api/fanworks/:id/comments', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const fanworkId = parseInt(req.params.id);
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId: req.user!.id,
        fanworkId,
      });

      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });

  // Reports and moderation
  app.post('/api/reports', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId: req.user!.id,
      });

      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating report:', error);
      res.status(500).json({ message: 'Failed to create report' });
    }
  });

  // Admin/Moderator routes
  app.get('/api/admin/reports', requireModerator, async (req: AuthRequest, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.patch('/api/admin/reports/:id', requireModerator, async (req: AuthRequest, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { status, moderationAction } = req.body;
      
      const report = await storage.updateReport(reportId, {
        status,
        moderationAction,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      });
      
      res.json(report);
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ message: 'Failed to update report' });
    }
  });

  app.post('/api/admin/users/:id/ban', requireModerator, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;
      
      const user = await storage.banUser(userId, {
        banReason: reason,
        bannedBy: req.user!.id,
        bannedAt: new Date(),
      });
      
      res.json(user);
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ message: 'Failed to ban user' });
    }
  });

  app.post('/api/admin/users/:id/unban', requireModerator, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      
      const user = await storage.unbanUser(userId);
      res.json(user);
    } catch (error) {
      console.error('Error unbanning user:', error);
      res.status(500).json({ message: 'Failed to unban user' });
    }
  });

  app.patch('/api/admin/fanworks/:id/hide', requireModerator, async (req: AuthRequest, res) => {
    try {
      const fanworkId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const fanwork = await storage.hideFanwork(fanworkId, {
        moderationReason: reason,
        moderatedBy: req.user!.id,
        moderatedAt: new Date(),
      });
      
      res.json(fanwork);
    } catch (error) {
      console.error('Error hiding fanwork:', error);
      res.status(500).json({ message: 'Failed to hide fanwork' });
    }
  });

  app.patch('/api/admin/fanworks/:id/unhide', requireModerator, async (req: AuthRequest, res) => {
    try {
      const fanworkId = parseInt(req.params.id);
      
      const fanwork = await storage.unhideFanwork(fanworkId);
      res.json(fanwork);
    } catch (error) {
      console.error('Error unhiding fanwork:', error);
      res.status(500).json({ message: 'Failed to unhide fanwork' });
    }
  });

  app.delete('/api/admin/fanworks/:id', requireModerator, async (req: AuthRequest, res) => {
    try {
      const fanworkId = parseInt(req.params.id);
      await storage.deleteFanwork(fanworkId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting fanwork:', error);
      res.status(500).json({ message: 'Failed to delete fanwork' });
    }
  });

  app.patch('/api/admin/users/:id/role', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      
      if (!['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      const user = await storage.updateUserRole(userId, role);
      res.json(user);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  app.post('/api/auth/verify-age', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { confirmed } = req.body;
      
      if (!confirmed) {
        return res.status(400).json({ message: 'Age verification confirmation required' });
      }
      
      const user = await storage.verifyUserAge(req.user!.id);
      res.json(user);
    } catch (error) {
      console.error('Error verifying age:', error);
      res.status(500).json({ message: 'Failed to verify age' });
    }
  });

  // Tags
  app.get('/api/tags', async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ message: 'Failed to fetch tags' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}