import type { Response } from "express";
import { prisma } from "../lib/prisma";
import {
  createContestSchema,
  postDsaSchema,
  postMcqSchema,
  submitMcqSchema,
} from "../types/zod";
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

export const getContest = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
    });
  }

  const contestId = Number(req.params.contestId);
  if (!contestId || isNaN(contestId)) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "CONTEST_NOT_FOUND",
    });
  }

  try {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        creatorId: true,
        mcqs: {
          select: {
            id: true,
            questionText: true,
            options: true,
            correctOptionIndex: true,
            points: true,
          },
        },
        dsaProblems: {
          select: {
            id: true,
            title: true,
            description: true,
            tags: true,
            points: true,
            timeLimit: true,
            memoryLimit: true,
          },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      });
    }

    const responseData = {
      ...contest,
      mcqs:
        req.user.role === "contestee"
          ? contest.mcqs.map(({ correctOptionIndex, ...rest }) => rest)
          : contest.mcqs,
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const postMcq = async (req: AuthenticatedRequest, res: Response) => {
  const contestId = Number(req.params.contestId);
  if (!contestId || isNaN(contestId)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
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
  const parse = postMcqSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  try {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });
    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      });
    }
    if (contest.creatorId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      });
    }

    const newmcq = await prisma.mcqQuestion.create({
      data: {
        contestId: contestId,
        questionText: parse.data.questionText,
        options: parse.data.options,
        correctOptionIndex: parse.data.correctOptionIndex,
        points: parse.data.points,
      },
    });
    return res.status(201).json({
      success: true,
      data: {
        id: newmcq.id,
        contestId: newmcq.contestId,
      },
      error: null,
    });
  } catch {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const submitMcq = async (req: AuthenticatedRequest, res: Response) => {
  const contestId = Number(req.params.contestId);
  const questionId = Number(req.params.questionId);
  if (!contestId || !questionId || isNaN(contestId) || isNaN(questionId)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
    });
  }

  const parsed = submitMcqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
  try {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });
    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      });
    }
    if (
      req.user.role === "creator" &&
      contest.creatorId === req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      });
    }
    const now = new Date();

    if (now < contest.startTime || now > contest.endTime) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_ACTIVE",
      });
    }

    const question = await prisma.mcqQuestion.findFirst({
      where: {
        id: questionId,
        contestId: contestId,
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "QUESTION_NOT_FOUND",
      });
    }
    const existingMcqSubmission = await prisma.mcqSubmission.findUnique({
      where: {
        userId_questionId: {
          userId: req.user.userId,
          questionId,
        },
      },
    });

    if (existingMcqSubmission) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "ALREADY_SUBMITTED",
      });
    }
    const check =
      question.correctOptionIndex === parsed.data.selectedOptionIndex;
    const newSubmition = await prisma.mcqSubmission.create({
      data: {
        userId: req.user.userId,
        questionId,
        selectedOptionIndex: parsed.data.selectedOptionIndex,
        isCorrect: check,
        pointsEarned: check ? question.points : 0,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        isCorrect: newSubmition.isCorrect,
        pointsEarned: newSubmition.pointsEarned,
      },
      error: null,
    });
  } catch {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const postDsa = async (req: AuthenticatedRequest, res: Response) => {
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

  const contestId = Number(req.params.contestId);
  if (!contestId || isNaN(contestId)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  const parsed = postDsaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  try {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      });
    }

    if (contest.creatorId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "NOT_CONTEST_OWNER",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const dsa = await tx.dsaProblem.create({
        data: {
          contestId,
          title: parsed.data.title,
          description: parsed.data.description,
          tags: parsed.data.tags,
          points: parsed.data.points,
          timeLimit: parsed.data.timeLimit,
          memoryLimit: parsed.data.memoryLimit,
        },
      });

      await tx.testCase.createMany({
        data: parsed.data.testCases.map(tc => ({
          problemId: dsa.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
        })),
      });

      return dsa;
    });

    return res.status(201).json({
      success: true,
      data: {
        id: result.id,
        contestId: result.contestId,
      },
      error: null,
    });
  } catch {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const getLeaderboard = async (
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

  const contestId = Number(req.params.contestId);

  if (Number.isNaN(contestId)) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "CONTEST_NOT_FOUND",
    });
  }


  try {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND",
      });
    }

    // MCQ POINTS PER USER

    const mcqAgg = await prisma.mcqSubmission.groupBy({
      by: ["userId"],
      where: {
        question: {
          contestId,
        },
      },
      _sum: {
        pointsEarned: true,
      },
    });

    const mcqPointsMap = new Map<number, number>();
    for (const row of mcqAgg) {
      mcqPointsMap.set(row.userId, row._sum.pointsEarned ?? 0);
    }

    // DSA BEST POINTS PER (USER, PROBLEM)

    const dsaAgg = await prisma.dsaSubmission.groupBy({
      by: ["userId", "problemId"],
      where: {
        problem: {
          contestId,
        },
      },
      _max: {
        pointsEarned: true,
      },
    });

    // Sum best DSA scores per user

    const dsaPointsMap = new Map<number, number>();
    for (const row of dsaAgg) {
      const prev = dsaPointsMap.get(row.userId) ?? 0;
      dsaPointsMap.set(
        row.userId,
        prev + (row._max.pointsEarned ?? 0)
      );
    }

    // MERGE TOTAL POINTS

    const userIds = new Set<number>([
      ...mcqPointsMap.keys(),
      ...dsaPointsMap.keys(),
    ]);

    if (userIds.size === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        error: null,
      });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(userIds) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const leaderboardRaw = users.map(u => {
      const mcq = mcqPointsMap.get(u.id) ?? 0;
      const dsa = dsaPointsMap.get(u.id) ?? 0;

      return {
        userId: u.id,
        name: u.name,
        totalPoints: mcq + dsa,
      };
    });

    // SORT + ASSIGN RANKS

    leaderboardRaw.sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    let currentRank = 1;
    let lastPoints: number | null = null;

    const leaderboard = leaderboardRaw.map((entry, index) => {
      if (lastPoints !== null && entry.totalPoints < lastPoints) {
        currentRank = index + 1;
      }
      lastPoints = entry.totalPoints;

      return {
        ...entry,
        rank: currentRank,
      };
    });

    return res.status(200).json({
      success: true,
      data: leaderboard,
      error: null,
    });
  } catch {
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};
