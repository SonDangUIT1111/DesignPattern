import {
  ComicChapterState,
  FreeState,
  PremiumState,
  UnlockedState,
} from "./comic__state";

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
    this.goToChapterPage = goToChapterPage;
    this.openPaidDialog = openPaidDialog;
    this.buyChapter = buyChapter;
    const initState = isFree
      ? new FreeState()
      : isBought
      ? new UnlockedState()
      : new PremiumState();
    initState.setContext(this);
    this.setState(initState);
  }

  setState(state: ComicChapterState): void {
    this.state = state;
  }

  access(): void {
    this.state.access();
  }

  buy(): void {
    this.state.buy();
  }

  getIsFree(): boolean {
    return this.state.getIsFree();
  }
  getIsBought(): boolean {
    return this.state.getIsBought();
  }
}
