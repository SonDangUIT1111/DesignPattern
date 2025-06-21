import { BaseCommentHandler, CommentRequest, CommentValidationResult } from './BaseCommentHandler';
import { ContentValidationHandler } from './ContentValidationHandler';
import { UserValidationHandler } from './UserValidationHandler';
import { ChapterValidationHandler } from './ChapterValidationHandler';
import { SpamDetectionHandler } from './SpamDetectionHandler';
import { CommentSaveHandler } from './CommentSaveHandler';

export class CommentValidationChain {
  private chain: BaseCommentHandler;

  constructor() {
    const contentValidator = new ContentValidationHandler();
    const userValidator = new UserValidationHandler();
    const chapterValidator = new ChapterValidationHandler();
    const spamDetector = new SpamDetectionHandler();
    const commentSaver = new CommentSaveHandler();

    // Build the chain
    this.chain = contentValidator
      .setNext(userValidator)
      .setNext(chapterValidator)
      .setNext(spamDetector)
      .setNext(commentSaver);
  }

  public async validateAndSaveComment(request: CommentRequest): Promise<CommentValidationResult> {
    return await this.chain.handle(request);
  }

  // Factory method for creating validation-only chain (without saving)
  public static createValidationOnlyChain(): BaseCommentHandler {
    const contentValidator = new ContentValidationHandler();
    const userValidator = new UserValidationHandler();
    const chapterValidator = new ChapterValidationHandler();
    const spamDetector = new SpamDetectionHandler();

    return contentValidator
      .setNext(userValidator)
      .setNext(chapterValidator)
      .setNext(spamDetector);
  }

  // Factory method for creating content-only validation chain
  public static createContentValidationChain(): BaseCommentHandler {
    return new ContentValidationHandler();
  }

  // Method to validate comment content only (for API endpoint)
  public static async validateContentOnly(content: string): Promise<CommentValidationResult> {
    const contentValidator = new ContentValidationHandler();
    const request: CommentRequest = {
      userId: "temp", // dummy value for content-only validation
      chapterId: "temp", // dummy value for content-only validation
      content: content
    };

    return await contentValidator.handle(request);
  }
} 