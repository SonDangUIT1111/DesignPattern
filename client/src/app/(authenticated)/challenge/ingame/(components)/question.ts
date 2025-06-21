export type Question = {
  questionId: string;
  questionName: string;
  mediaUrl: string;
  answers: string[];
  correctAnswerID: string;
};

export interface QIterator<T> {
  hasNext(): boolean;
  next(): T;
  goTo(index: number): T | null;
  reset(): void;
  getCurrent(): T;
  getCurrentIndex(): number;
}

export interface IterableCollection<T> {
  createIterator(): QIterator<T>;
}