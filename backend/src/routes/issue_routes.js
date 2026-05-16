import express from 'express';
import { IssueController } from '../controllers/index.js';
import { validateMiddleware, authMiddleware, roleMiddleware } from '../middleware/index.js';
import { createIssueSchema, updateIssueSchema } from '../validators/index.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['student']), validateMiddleware(createIssueSchema, 'body'), IssueController.createIssue);
router.get('/', authMiddleware, roleMiddleware(['admin']), IssueController.getIssues);
router.get('/:id', authMiddleware, IssueController.getIssueById);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), validateMiddleware(updateIssueSchema, 'body'), IssueController.updateIssue);

export default router;
