import { QuestionIterator } from "./ConcreateIterator";
import { IterableCollection, Question, QIterator } from "./question";

export class QuestionCollection implements IterableCollection<Question> {
  private questions: Question[] = [];

  addQuestion(question: Question) {
    this.questions.push(question);
  }

  createIterator(): QIterator<Question> {
    return new QuestionIterator(this.questions);
  }
}