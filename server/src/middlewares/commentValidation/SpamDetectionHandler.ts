import { BaseCommentHandler, CommentRequest, CommentValidationResult } from './BaseCommentHandler';

export class SpamDetectionHandler extends BaseCommentHandler {
  private static userCommentCount = new Map<string, { count: number; lastReset: Date }>();
  private static recentComments = new Map<string, Date>();

  protected async process(request: CommentRequest): Promise<CommentValidationResult> {
    const userId = request.userId;
    const content = request.content.trim().toLowerCase();
    const now = new Date();

    const userStats = SpamDetectionHandler.userCommentCount.get(userId);
    if (userStats) {
      const timeDiff = now.getTime() - userStats.lastReset.getTime();
      if (timeDiff < 60000) {
        if (userStats.count >= 5) {
          return {
            success: false,
            error: "Bạn đang comment quá nhanh. Vui lòng chờ một chút.",
            errorCode: "RATE_LIMIT_EXCEEDED"
          };
        }
        userStats.count++;
      } else {
        userStats.count = 1;
        userStats.lastReset = now;
      }
    } else {
      SpamDetectionHandler.userCommentCount.set(userId, { count: 1, lastReset: now });
    }
    const contentKey = `${userId}-${content}`;
    const lastCommentTime = SpamDetectionHandler.recentComments.get(contentKey);
    if (lastCommentTime) {
      const timeDiff = now.getTime() - lastCommentTime.getTime();
      if (timeDiff < 30000) { 
        return {
          success: false,
          error: "Bạn vừa comment nội dung tương tự. Vui lòng thử nội dung khác.",
          errorCode: "DUPLICATE_CONTENT"
        };
      }
    }
    SpamDetectionHandler.recentComments.set(contentKey, now);
    this.cleanupOldEntries();

    return { success: true };
  }

  private cleanupOldEntries(): void {
    const now = new Date();
    const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;

    for (const [userId, stats] of SpamDetectionHandler.userCommentCount.entries()) {
      if (stats.lastReset.getTime() < fiveMinutesAgo) {
        SpamDetectionHandler.userCommentCount.delete(userId);
      }
    }

    for (const [key, timestamp] of SpamDetectionHandler.recentComments.entries()) {
      if (timestamp.getTime() < fiveMinutesAgo) {
        SpamDetectionHandler.recentComments.delete(key);
      }
    }
  }
} 