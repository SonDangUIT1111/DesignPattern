import { ComicChapterContext } from "./comic_chapter_context";

export interface ComicChapterState {
  access(context: ComicChapterContext): void;
  buy(context: ComicChapterContext): void;
  isFree(): boolean;
  isBought(): boolean;
}

export class FreeState implements ComicChapterState {
  access(context: ComicChapterContext): void {
    console.log("Chương miễn phí, đọc thôithôi");
    context.goToChapterPage();
  }
  buy(): void {
    console.log("Này miễn phí khỏi mua");
  }
  isFree(): boolean {
    return true;
  }
  isBought(): boolean {
    return false;
  }
}

export class PremiumState implements ComicChapterState {
  access(context: ComicChapterContext): void {
    console.log("Truyện này tính phí, vui lòng thanh toán");
    context.openPaidDialog();
  }
  buy(context: ComicChapterContext): void {
    console.log("Oke để mua");
    context.buyChapter();
    context.setState(new UnlockedState());
  }
  isFree(): boolean {
    return false;
  }
  isBought(): boolean {
    return false;
  }
}

export class UnlockedState implements ComicChapterState {
  access(context: ComicChapterContext): void {
    console.log("Đã mua, Chuyển sang trang đọc");
    context.goToChapterPage();
  }
  buy(): void {
    console.log("Đã mua rồi nhé");
  }
  isFree(): boolean {
    return false;
  }
  isBought(): boolean {
    return true;
  }
}
