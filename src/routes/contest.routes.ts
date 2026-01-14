import { Router } from "express";
import { createContest,getContest,postMcq,submitMcq,postDsa } from "../controller/contests.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createContest);
router.get("/:contestId",authMiddleware,getContest);
router.post("/:contestId/mcq",authMiddleware,postMcq);
router.post("/:contestId/mcq/:questionId/submit",authMiddleware,submitMcq);
router.post("/:contestId/dsa",authMiddleware,postDsa);


export default router;
