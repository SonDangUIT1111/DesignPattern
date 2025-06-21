import {
  ComicChapterState,
  FreeState,
  PremiumState,
  UnlockedState,
} from "./comic__state";

// Lớp Bóng đèn
export class ComicChapterContext {
  private state: ComicChapterState;
  goToChapterPage: () => void;
  openPaidDialog: () => void;
  buyChapter: () => void;

  constructor({
    isBought,
    isFree,
    openPaidDialog,
    buyChapter,
    goToChapterPage,
  }) {
    const initState = isFree
      ? new FreeState()
      : isBought
      ? new UnlockedState()
      : new PremiumState();
    this.state = initState;
    this.goToChapterPage = goToChapterPage;
    this.openPaidDialog = openPaidDialog;
    this.buyChapter = buyChapter;
  }

  setState(state: ComicChapterState): void {
    this.state = state;
  }

  access(): void {
    this.state.access(this);
  }

  buy(): void {
    this.state.buy(this);
  }

  getIsFree(): boolean {
    return this.state.isFree();
  }
  getIsBought(): boolean {
    return this.state.isBought();
  }
}
