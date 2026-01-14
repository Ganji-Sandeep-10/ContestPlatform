import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from "../lib/prisma";


export const getProblem = async (req: AuthenticatedRequest, res: Response) => {
    const problemId = Number(req.params.problemId);
    if (!problemId || isNaN(problemId)) {
        return res.status(400).json({
            "success": false,
            "data": null,
            "error": "INVALID_REQUEST"
        })
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