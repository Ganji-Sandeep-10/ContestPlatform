import { Router } from 'express';
import { getProblem } from '../controller/problem.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router=Router();

router.get("/:problemId",authMiddleware,getProblem);

export default router;
