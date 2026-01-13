import type { Response, Request } from "express";
import bcrypt from "bcrypt";
import { loginSchema, signupSchema } from "../types/zod";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";

export const signup = async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  const { name, email, password, role } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role ?? "contestee", 
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      error: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};


export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      data: { token },
      error: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};
