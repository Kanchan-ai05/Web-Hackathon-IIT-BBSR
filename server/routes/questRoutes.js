const express = require('express');
const router = express.Router();
const {
  getQuests,
  getQuestById,
  createQuest,
  updateQuest,
  completeQuest,
  undoQuest,
  deleteQuest,
  toggleBossSubtask
} = require('../controllers/questController');
const { protect } = require('../middleware/auth');
const { validateObjectId, validateQuestInput } = require('../middleware/validate');

// All quest / task operations are protected and isolated by user
router.use(protect);

router.route('/')
  .get(getQuests)
  .post(validateQuestInput, createQuest);

router.route('/:id')
  .all(validateObjectId('id'))
  .get(getQuestById)
  .put(validateQuestInput, updateQuest)
  .patch(validateQuestInput, updateQuest)
  .delete(deleteQuest);

router.post('/:id/complete', validateObjectId('id'), completeQuest);
router.post('/:id/undo', validateObjectId('id'), undoQuest);
router.patch('/:id/subtasks/:subtaskId', validateObjectId('id', 'subtaskId'), toggleBossSubtask);

module.exports = router;
