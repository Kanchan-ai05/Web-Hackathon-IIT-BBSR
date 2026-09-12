const express = require('express');
const router = express.Router();
const { getHeroStats, getGuildLeaderboard } = require('../controllers/statsController');
const { protectHero } = require('../middleware/auth');

router.get('/leaderboard', getGuildLeaderboard);
router.get('/overview', protectHero, getHeroStats);

module.exports = router;
