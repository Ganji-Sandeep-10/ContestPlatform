import { Router } from 'express';
import { getProblem, submitProblem } from '../controller/problem.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router=Router();

router.get("/:problemId",authMiddleware,getProblem);
router.post("/:problemId/submit",authMiddleware,submitProblem);

export default router;
