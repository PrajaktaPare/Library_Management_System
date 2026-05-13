const express = require('express');
const { IssueController } = require('../controllers');
const { validateMiddleware, authMiddleware, roleMiddleware } = require('../middleware');
const { createIssueSchema, updateIssueSchema } = require('../validators');

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['student']), validateMiddleware(createIssueSchema, 'body'), IssueController.createIssue);
router.get('/', authMiddleware, roleMiddleware(['admin']), IssueController.getIssues);
router.get('/:id', authMiddleware, IssueController.getIssueById);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), validateMiddleware(updateIssueSchema, 'body'), IssueController.updateIssue);

module.exports = router;
