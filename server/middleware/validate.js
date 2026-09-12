const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId in request parameters
 * Returns 400 Bad Request with clean message if ID format is invalid.
 */
const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const id = req.params[param];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid resource identifier format: "${id}". Must be a valid 24-character hexadecimal ObjectId.`
        });
      }
    }
    next();
  };
};

/**
 * Validate Quest creation & update payload
 * Rejects empty or whitespace-only submissions with 400 Bad Request.
 */
const validateQuestInput = (req, res, next) => {
  const { title, category, difficulty, questType } = req.body;

  // On POST / creation, title is mandatory
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Quest title is required and cannot be blank.'
      });
    }
    if (title.trim().length > 140) {
      return res.status(400).json({
        success: false,
        message: 'Quest title cannot exceed 140 characters.'
      });
    }
  }

  // On PATCH / update, if title is provided it must not be blank
  if (req.method === 'PATCH' && title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Quest title cannot be empty.'
      });
    }
    if (title.trim().length > 140) {
      return res.status(400).json({
        success: false,
        message: 'Quest title cannot exceed 140 characters.'
      });
    }
  }

  const validDifficulties = ['trivial', 'easy', 'medium', 'hard', 'epic'];
  if (difficulty && !validDifficulties.includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: `Invalid difficulty rank: "${difficulty}". Must be one of: ${validDifficulties.join(', ')}.`
    });
  }

  const validQuestTypes = ['todo', 'daily', 'boss'];
  if (questType && !validQuestTypes.includes(questType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid quest type: "${questType}". Must be one of: ${validQuestTypes.join(', ')}.`
    });
  }

  next();
};

/**
 * Validate User Signup and Login Input
 */
const validateAuthInput = (isSignup = false) => {
  return (req, res, next) => {
    const { email, password, username } = req.body;

    // Email validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Password validation
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long.'
      });
    }

    // Username validation (only on signup)
    if (isSignup) {
      if (!username || typeof username !== 'string' || username.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Hero username is required and must be at least 2 characters long.'
        });
      }
      if (username.trim().length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Hero username cannot exceed 30 characters.'
        });
      }
    }

    next();
  };
};

module.exports = {
  validateObjectId,
  validateQuestInput,
  validateAuthInput
};
