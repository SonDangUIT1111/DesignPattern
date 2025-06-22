import { BaseCommentHandler, CommentRequest, CommentValidationResult } from './BaseCommentHandler';
import mongoose from 'mongoose';

export class CommentSaveHandler extends BaseCommentHandler {
  protected async process(request: CommentRequest): Promise<CommentValidationResult> {
    try {
      const { user, chapter, content, commentId } = request;

      if (!user || !chapter) {
        return {
          success: false,
          error: "Thiếu thông tin user hoặc chapter",
          errorCode: "MISSING_DATA"
        };
      }

      if (commentId) {
        return await this.saveChildComment(request);
      } else {
        return await this.saveRootComment(request);
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      return {
        success: false,
        error: "Có lỗi xảy ra khi lưu comment",
        errorCode: "SAVE_ERROR"
      };
    }
  }

  private async saveRootComment(request: CommentRequest): Promise<CommentValidationResult> {
    const { user, chapter, content } = request;

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(user._id),
      likes: new mongoose.Types.Array(),
      replies: new mongoose.Types.Array(),
      content: content,
      avatar: user.avatar,
      userName: user.username || "",
      createdAt: new Date()
    };

    chapter.comments.push(newComment);
    await chapter.save();

    return {
      success: true,
      data: {
        comment: newComment,
        chapter: chapter
      }
    };
  }

  private async saveChildComment(request: CommentRequest): Promise<CommentValidationResult> {
    const { user, chapter, content, commentId } = request;

    const parentComment = chapter.comments.find(
      (comment: any) => comment._id.toString() === commentId
    );

    if (!parentComment) {
      return {
        success: false,
        error: "Comment gốc không tồn tại",
        errorCode: "PARENT_COMMENT_NOT_FOUND"
      };
    }

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(user._id),
      likes: new mongoose.Types.Array(),
      content: content,
      avatar: user.avatar,
      userName: user.username || "",
      createdAt: new Date()
    };

    parentComment.replies.push(newReply);
    await chapter.save();

    return {
      success: true,
      data: {
        reply: newReply,
        parentComment: parentComment,
        chapter: chapter
      }
    };
  }
} 