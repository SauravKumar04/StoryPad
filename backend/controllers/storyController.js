import Story from '../models/Story.js';
import Chapter from '../models/Chapter.js';
import { createNotification } from './notificationController.js';
import { io } from '../server.js';

export const createStory = async (req, res) => {
  try {
    const { title, description, category, tags, coverImage, chapters, targetAudience, language, status } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!chapters || !chapters.length) {
      return res.status(400).json({ message: 'At least one chapter is required' });
    }
    
    const story = new Story({
      title: title.trim(),
      description: description?.trim() || '',
      category,
      tags: Array.isArray(tags) ? tags : [],
      coverImage,
      targetAudience,
      language,
      status,
      author: req.userId
    });
    
    await story.save();
    
    // Create chapters
    const createdChapters = [];
    for (let i = 0; i < chapters.length; i++) {
      const chapterData = chapters[i];
      const chapter = new Chapter({
        title: chapterData.title || `Chapter ${i + 1}`,
        content: chapterData.content,
        story: story._id,
        chapterNumber: i + 1,
        author: req.userId,
        notes: chapterData.notes || ''
      });
      
      await chapter.save();
      createdChapters.push(chapter);
    }
    
    await story.populate('author', 'username profilePicture');
    
    // Emit realtime update
    io.to('feed').emit('newStory', story);
    
    res.status(201).json({ story, chapters: createdChapters });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ message: error.message || 'Something went wrong' });
  }
};

export const getStories = async (req, res) => {
  try {
    const stories = await Story.find({ isPublished: true })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture');
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Increment read count
    story.reads += 1;
    await story.save();
    
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const likeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId).populate('author');
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    const hasLiked = story.likes.includes(req.userId);
    
    if (hasLiked) {
      story.likes = story.likes.filter(id => id.toString() !== req.userId);
    } else {
      story.likes.push(req.userId);
      
      // Create notification for story author (if not liking own story)
      if (story.author._id.toString() !== req.userId) {
        await createNotification({
          recipient: story.author._id,
          sender: req.userId,
          type: 'like_story',
          story: story._id,
          message: `Someone liked your story "${story.title}"`
        });
      }
    }
    
    await story.save();
    res.json({ liked: !hasLiked, likesCount: story.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const updateStory = async (req, res) => {
  try {
    const { title, description, category, tags, coverImage } = req.body;
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    if (story.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    story.title = title || story.title;
    story.description = description || story.description;
    story.category = category || story.category;
    story.tags = tags || story.tags;
    story.coverImage = coverImage || story.coverImage;
    story.updatedAt = new Date();
    
    await story.save();
    await story.populate('author', 'username profilePicture');
    
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    if (story.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete all chapters associated with this story
    await Chapter.deleteMany({ story: story._id });
    
    // Delete the story
    await Story.findByIdAndDelete(req.params.storyId);
    
    res.json({ message: 'Story and all its chapters deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const incrementReads = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    story.reads += 1;
    await story.save();
    
    res.json({ reads: story.reads });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};