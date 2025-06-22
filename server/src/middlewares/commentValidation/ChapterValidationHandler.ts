import { BaseCommentHandler, CommentRequest, CommentValidationResult } from './BaseCommentHandler';
import ComicChapterModel from '../../models/comicChapter';
import mongoose from 'mongoose';

export class ChapterValidationHandler extends BaseCommentHandler {
  protected async process(request: CommentRequest): Promise<CommentValidationResult> {
    // Validate chapterId format
    if (!mongoose.isValidObjectId(request.chapterId)) {
      return {
        success: false,
        error: "ID chapter không hợp lệ",
        errorCode: "INVALID_CHAPTER_ID"
      };
    }

    // Find chapter
    const chapter = await ComicChapterModel.findById(request.chapterId);
    if (!chapter) {
      return {
        success: false,
        error: "Chapter không tồn tại",
        errorCode: "CHAPTER_NOT_FOUND"
      };
    }

    // Check if chapter allows comments (could add business logic here)
    // For now, all chapters allow comments

    // Store chapter in request for next handlers
    request.chapter = chapter;

    return { success: true };
  }
} 