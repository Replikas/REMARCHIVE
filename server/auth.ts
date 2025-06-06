import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await storage.getUserById(decoded.userId);
    if (!user || user.isBanned) {
      return res.status(401).json({ message: 'User not found or banned' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      try {
        const user = await storage.getUserById(decoded.userId);
        if (user && !user.isBanned) {
          req.user = {
            id: user.id,
            email: user.email,
            username: user.username
          };
        }
      } catch (error) {
        console.error('Optional auth error:', error);
      }
    }
  }
  next();
}

// Moderation middleware
export async function requireModerator(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await storage.getUserById(decoded.userId);
    if (!user || user.isBanned) {
      return res.status(401).json({ message: 'User not found or banned' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account banned' });
    }

    if (user.role !== 'moderator' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Moderator access required' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username
    };
    next();
  } catch (error) {
    console.error('Moderation auth error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await storage.getUserById(decoded.userId);
    if (!user || user.isBanned) {
      return res.status(401).json({ message: 'User not found or banned' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account banned' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username
    };
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
}

// Age verification middleware for 18+ content
export async function requireAgeVerification(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await storage.getUserById(decoded.userId);
    if (!user || user.isBanned) {
      return res.status(401).json({ message: 'User not found or banned' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account banned' });
    }

    if (!user.ageVerified) {
      return res.status(403).json({ message: 'Age verification required for 18+ content' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username
    };
    next();
  } catch (error) {
    console.error('Age verification error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
}