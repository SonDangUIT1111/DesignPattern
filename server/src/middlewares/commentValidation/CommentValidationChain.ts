import {
  BaseCommentHandler,
  CommentRequest,
  CommentValidationResult,
} from "./BaseCommentHandler";
import { ContentValidationHandler } from "./ContentValidationHandler";
import { UserValidationHandler } from "./UserValidationHandler";
import { ChapterValidationHandler } from "./ChapterValidationHandler";
import { SpamDetectionHandler } from "./SpamDetectionHandler";
import { CommentSaveHandler } from "./CommentSaveHandler";

export class CommentValidationChain {
  private chain: BaseCommentHandler;

  constructor() {
    const contentValidator = new ContentValidationHandler();
    const userValidator = new UserValidationHandler();
    const chapterValidator = new ChapterValidationHandler();
    const spamDetector = new SpamDetectionHandler();
    const commentSaver = new CommentSaveHandler();

    userValidator
      .setNext(contentValidator)
      .setNext(chapterValidator)
      .setNext(spamDetector)
      .setNext(commentSaver);

    this.chain = userValidator;
  }

  public async validateAndSaveComment(
    request: CommentRequest
  ): Promise<CommentValidationResult> {
    return await this.chain.handle(request);
  }

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

  public static createContentValidationChain(): BaseCommentHandler {
    return new ContentValidationHandler();
  }

  public static async validateContentOnly(
    content: string
  ): Promise<CommentValidationResult> {
    const contentValidator = new ContentValidationHandler();
    const request: CommentRequest = {
      userId: "temp",
      chapterId: "temp",
      content: content,
    };

    return await contentValidator.handle(request);
  }
}
