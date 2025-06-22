import { BaseCommentHandler, CommentRequest, CommentValidationResult } from './BaseCommentHandler';
import UserModel from '../../models/user';
import mongoose from 'mongoose';

export class UserValidationHandler extends BaseCommentHandler {
  protected async process(request: CommentRequest): Promise<CommentValidationResult> {
    if (!mongoose.isValidObjectId(request.userId)) {
      return {
        success: false,
        error: "ID người dùng không hợp lệ",
        errorCode: "INVALID_USER_ID"
      };
    }

    const user = await UserModel.findById(request.userId);
    if (!user) {
      return {
        success: false,
        error: "Người dùng không tồn tại",
        errorCode: "USER_NOT_FOUND"
      };
    }

    const accessDate = user.accessCommentDate;
    if (accessDate && accessDate > new Date()) {
      return {
        success: false,
        error: `Bạn đã bị cấm comment đến ${accessDate.toLocaleString()}`,
        errorCode: "USER_BANNED",
        data: { bannedUntil: accessDate }
      };
    }

    // Store user in request for next handlers
    request.user = user;

    return { success: true };
  }
} 