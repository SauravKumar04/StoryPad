import Bookmark from '../models/Bookmark.js';
import Story from '../models/Story.js';

export const toggleBookmark = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    const existingBookmark = await Bookmark.findOne({
      user: req.userId,
      story: storyId
    });
    
    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      res.json({ bookmarked: false });
    } else {
      const bookmark = new Bookmark({
        user: req.userId,
        story: storyId
      });
      await bookmark.save();
      res.json({ bookmarked: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.userId })
      .populate({
        path: 'story',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json(bookmarks.map(b => b.story));
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};