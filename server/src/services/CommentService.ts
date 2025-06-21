import { CommentValidationChain, CommentRequest, CommentValidationResult } from '../middlewares/commentValidation';

export class CommentService {
  private validationChain: CommentValidationChain;

  constructor() {
    this.validationChain = new CommentValidationChain();
  }

  /**
   * Add a root comment to a chapter
   */
  public async addRootComment(
    chapterId: string,
    userId: string,
    content: string
  ): Promise<CommentValidationResult> {
    const request: CommentRequest = {
      chapterId,
      userId,
      content
    };

    return await this.validationChain.validateAndSaveComment(request);
  }

  /**
   * Add a child comment (reply) to a parent comment
   */
  public async addChildComment(
    chapterId: string,
    userId: string,
    content: string,
    parentCommentId: string
  ): Promise<CommentValidationResult> {
    const request: CommentRequest = {
      chapterId,
      userId,
      content,
      commentId: parentCommentId
    };

    return await this.validationChain.validateAndSaveComment(request);
  }

  /**
   * Validate comment content only (for API validation)
   */
  public static async validateContent(content: string): Promise<CommentValidationResult> {
    return await CommentValidationChain.validateContentOnly(content);
  }

  /**
   * Check if user can comment (not banned)
   */
  public static async canUserComment(userId: string): Promise<CommentValidationResult> {
    const { UserValidationHandler } = await import('../middlewares/commentValidation');
    const userValidator = new UserValidationHandler();
    
    const request: CommentRequest = {
      userId,
      chapterId: "temp", // dummy value
      content: "temp" // dummy value
    };

    return await userValidator.handle(request);
  }
} 