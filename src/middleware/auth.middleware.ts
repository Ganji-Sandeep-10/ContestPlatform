import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: "creator" | "contestee";
  };
}

interface JwtPayload {
  userId: number;
  role: "creator" | "contestee";
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token!,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
    });
  }
};
