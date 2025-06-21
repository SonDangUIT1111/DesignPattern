import { Question,  QIterator } from "./question";

export class QuestionIterator implements QIterator<Question> {
  private index = 0;

  constructor(private questions: Question[]) {}

  hasNext(): boolean {
    return this.index < this.questions.length - 1;
  }

  next(): Question {
    return this.questions[++this.index];
  }

  goTo(index: number): Question | null {
    if (index >= this.questions.length) return null;
    this.index = index;
    return this.questions[this.index]
  }

  reset(): void {
    this.index = -1;
  }

  getCurrentIndex(): number {
    return this.index;
  }

  getCurrent(): Question {
    return this.questions[this.index];
  }
}
