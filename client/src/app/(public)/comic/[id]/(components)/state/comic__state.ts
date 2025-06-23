import { ComicChapterContext } from "./comic_chapter_context";

export interface ComicChapterState {
  access(): void;
  buy(): void;
  getIsFree(): boolean;
  getIsBought(): boolean;
}

export class FreeState implements ComicChapterState {
  context: ComicChapterContext;

  setContext(context: ComicChapterContext) {
    this.context = context;
  }
  access(): void {
    console.log("Chương miễn phí, đọc thôithôi");
    this.context.goToChapterPage();
  }
  buy(): void {
    console.log("Này miễn phí khỏi mua");
  }
  getIsFree(): boolean {
    return true;
  }
  getIsBought(): boolean {
    return false;
  }
}

export class PremiumState implements ComicChapterState {
  context: ComicChapterContext;

  setContext(context: ComicChapterContext) {
    this.context = context;
  }

  access(): void {
    console.log("Truyện này tính phí, vui lòng thanh toán");
    this.context.openPaidDialog();
  }
  buy(): void {
    console.log("Oke để mua");
    this.context.buyChapter();
    this.context.setState(new UnlockedState());
  }
  getIsFree(): boolean {
    return false;
  }
  getIsBought(): boolean {
    return false;
  }
}

export class UnlockedState implements ComicChapterState {
  context: ComicChapterContext;

  setContext(context: ComicChapterContext) {
    this.context = context;
  }

  access(): void {
    console.log("Đã mua, Chuyển sang trang đọc");
    this.context.goToChapterPage();
  }
  buy(): void {
    console.log("Đã mua rồi nhé");
  }
  getIsFree(): boolean {
    return false;
  }
  getIsBought(): boolean {
    return true;
  }
}
