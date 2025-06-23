export type Question = {
  questionId: string;
  questionName: string;
  mediaUrl: string;
  answers: string[];
  correctAnswerID: string;
};

export interface QuestionIterator<T> {
  hasNext(): boolean;
  next(): T;
  goTo(index: number): T | null;
  reset(): void;
  getCurrent(): T;
  getCurrentIndex(): number;
}

export interface IterableQuestionCollection<T> {
  createIterator(): QuestionIterator<T>;
}
