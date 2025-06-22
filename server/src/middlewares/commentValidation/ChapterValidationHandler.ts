import { BaseCommentHandler, CommentRequest, CommentValidationResult } from './BaseCommentHandler';
import ComicChapterModel from '../../models/comicChapter';
import mongoose from 'mongoose';

export class ChapterValidationHandler extends BaseCommentHandler {
  protected async process(request: CommentRequest): Promise<CommentValidationResult> {
    if (!mongoose.isValidObjectId(request.chapterId)) {
      return {
        success: false,
        error: "ID chapter không hợp lệ",
        errorCode: "INVALID_CHAPTER_ID"
      };
    }

    const chapter = await ComicChapterModel.findById(request.chapterId);
    if (!chapter) {
      return {
        success: false,
        error: "Chapter không tồn tại",
        errorCode: "CHAPTER_NOT_FOUND"
      };
    }
    request.chapter = chapter;

    return { success: true };
  }
} 