import { ConcreateQuestionIterator } from "./ConcreateIterator";
import {
  IterableQuestionCollection,
  Question,
  QuestionIterator,
} from "./question";

export class ConcreateQuestionCollection
  implements IterableQuestionCollection<Question>
{
  private questions: Question[] = [];

  addQuestion(question: Question) {
    this.questions.push(question);
  }

  getQuestions(): Question[] {
    return this.questions;
  }

  createIterator(): QuestionIterator<Question> {
    return new ConcreateQuestionIterator(this);
  }
}
