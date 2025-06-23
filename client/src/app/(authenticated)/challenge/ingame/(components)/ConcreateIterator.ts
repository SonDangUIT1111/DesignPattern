import { Question, QuestionIterator } from "./question";
import { ConcreateQuestionCollection } from "./ConcreateCollection";

export class ConcreateQuestionIterator implements QuestionIterator<Question> {
  private iterationState = 0;
  private collection: ConcreateQuestionCollection;

  constructor(collection: ConcreateQuestionCollection) {
    this.collection = collection;
  }

  hasNext(): boolean {
    console.log(
      this.iterationState < this.collection.getQuestions().length - 1
        ? "Có câu hỏi kế tiếp"
        : "Hết gòi"
    );
    return this.iterationState < this.collection.getQuestions().length - 1;
  }

  next(): Question {
    console.log("Đang lấy câu hỏi ở vị trí thứ ", this.iterationState + 1);
    return this.collection.getQuestions()[++this.iterationState];
  }

  goTo(iterationState: number): Question | null {
    if (iterationState >= this.collection.getQuestions().length) return null;
    this.iterationState = iterationState;
    console.log("Đi tới câu hỏi số ", iterationState + 1);
    return this.collection.getQuestions()[this.iterationState];
  }

  reset(): void {
    this.iterationState = -1;
  }

  getCurrentIndex(): number {
    return this.iterationState;
  }

  getCurrent(): Question {
    return this.collection.getQuestions()[this.iterationState];
  }
}
