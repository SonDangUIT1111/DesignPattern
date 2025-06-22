export interface CommentRequest {
  userId: string;
  chapterId: string;
  content: string;
  commentId?: string;
  user?: any;
  chapter?: any;
}

export interface CommentValidationResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  data?: any;
}

export abstract class BaseCommentHandler {
  protected nextHandler: BaseCommentHandler | null = null;

  public setNext(handler: BaseCommentHandler): BaseCommentHandler {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(request: CommentRequest): Promise<CommentValidationResult> {
    const result = await this.process(request);
    
    if (!result.success) {
      return result;
    }

    if (this.nextHandler) {
      return await this.nextHandler.handle(request);
    }

    return result;
  }

  protected abstract process(request: CommentRequest): Promise<CommentValidationResult>;
} 