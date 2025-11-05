import express from 'express';
import { createStory, getStories, getStory, likeStory, updateStory, deleteStory, incrementReads } from '../controllers/storyController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createStory);
router.get('/', getStories);
router.get('/:storyId', getStory);
router.put('/:storyId', auth, updateStory);
router.delete('/:storyId', auth, deleteStory);
router.post('/:storyId/like', auth, likeStory);
router.patch('/:storyId/read', incrementReads);

export default router;