import { BaseCommentHandler, CommentRequest, CommentValidationResult } from './BaseCommentHandler';

export class ContentValidationHandler extends BaseCommentHandler {
  private sensitiveWords = [
    "fuck", "dick", "pussy", "fucker", "cặc", "lồn", "loz", "cak", "địt", "đụ", "cc"
  ];

  protected async process(request: CommentRequest): Promise<CommentValidationResult> {
    const content = request.content.toLowerCase();

    if (content.includes("https") || content.includes("http")) {
      return {
        success: false,
        error: "Comment không được chứa đường link",
        errorCode: "CONTAINS_URL"
      };
    }

    for (const word of this.sensitiveWords) {
      if (content.includes(word)) {
        return {
          success: false,
          error: "Comment chứa từ ngữ không phù hợp",
          errorCode: "SENSITIVE_WORD"
        };
      }
    }

    if (content.trim().length === 0) {
      return {
        success: false,
        error: "Comment không được để trống",
        errorCode: "EMPTY_CONTENT"
      };
    }

    if (content.length > 1000) {
      return {
        success: false,
        error: "Comment không được quá 1000 ký tự",
        errorCode: "CONTENT_TOO_LONG"
      };
    }

    return { success: true };
  }
} 