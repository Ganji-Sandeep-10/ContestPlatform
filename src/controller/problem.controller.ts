import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from "../lib/prisma";
import { submitProblemSchema } from '../types/zod';
import { judgeSolution } from "../services/judge"


export const getProblem = async (req: AuthenticatedRequest, res: Response) => {
    const problemId = Number(req.params.problemId);

    if (Number.isNaN(problemId)) {
        return res.status(404).json({
            success: false,
            data: null,
            error: "PROBLEM_NOT_FOUND",
        });
    }

    try {
        if (!req.user) {
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
            })
        }
        const problem = await prisma.dsaProblem.findUnique({
            where: { id: problemId }, select: {
                id: true,
                contestId: true,
                title: true,
                description: true,
                tags: true,
                points: true,
                timeLimit: true,
                memoryLimit: true,
                testCases:{
                    where:{isHidden:false,},
                    select:{
                        input: true,
                        expectedOutput: true,
                    }
                }
            }
        });
        if (!problem) {
            return res.status(404).json({
                "success": false,
                "data": null,
                "error": "PROBLEM_NOT_FOUND"
            })
        }
        return res.status(200).json({
            "success": true,
            "data":problem,
            "error":null,
        })
    } catch {
        return res.status(500).json({
            success: false,
            data: null,
            error: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const submitProblem = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const problemId = Number(req.params.problemId);

    if (!problemId || isNaN(problemId)) {
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

    const parsed = submitProblemSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "INVALID_REQUEST",
        });
    }

    try {
        const problem = await prisma.dsaProblem.findUnique({
            where: { id: problemId },
            include: {
                testCases: true, 
                contest: true,
            },
        });

        if (!problem) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "PROBLEM_NOT_FOUND",
            });
        }
        if (req.user.role === "creator" && problem.contest.creatorId === req.user.userId) {
            return res.status(403).json({
                success: false,
                data: null,
                error: "FORBIDDEN",
            });
        }
        const now = new Date();
        if (now < problem.contest.startTime || now > problem.contest.endTime) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "CONTEST_NOT_ACTIVE",
            });
        }

        const totalTestCases = problem.testCases.length;

        // Judge (mock for now)
        const judgeResult = judgeSolution(
            parsed.data.code,
            totalTestCases
        );


        const pointsEarned = Math.floor(
            (judgeResult.testCasesPassed / judgeResult.totalTestCases) *
            problem.points
        );

        await prisma.dsaSubmission.create({
            data: {
                userId: req.user.userId,
                problemId,
                code: parsed.data.code,
                language: parsed.data.language,
                status: judgeResult.status,
                pointsEarned,
                testCasesPassed: judgeResult.testCasesPassed,
                totalTestCases: judgeResult.totalTestCases,
            },
        });

        return res.status(201).json({
            success: true,
            data: {
                status: judgeResult.status,
                pointsEarned,
                testCasesPassed: judgeResult.testCasesPassed,
                totalTestCases: judgeResult.totalTestCases,
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
