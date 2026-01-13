import { Router } from "express";
import { createContest } from "../controller/contests.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createContest);

export default router;
