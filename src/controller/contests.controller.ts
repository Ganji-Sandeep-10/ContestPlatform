import type { Response } from "express";
import { prisma } from "../lib/prisma";
import { createContestSchema } from "../types/zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export const createContest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
    });
  }

  if (req.user.role !== "creator") {
    return res.status(403).json({
      success: false,
      data: null,
      error: "FORBIDDEN",
    });
  }

  const parsed = createContestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  const { title, description, startTime, endTime } = parsed.data;

  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  try {
    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        creatorId: req.user.userId,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: contest.id,
        title: contest.title,
        description: contest.description,
        creatorId: contest.creatorId,
        startTime: contest.startTime.toISOString(),
        endTime: contest.endTime.toISOString(),
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
