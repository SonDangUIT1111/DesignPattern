import { Divider, Image, Spinner } from "@nextui-org/react";
import { Button } from "@/components/ui/button";
import { convertUtcToGmtPlus7 } from "../ComicInfo";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IoWalletOutline } from "react-icons/io5";
import { ComicChapterContext } from "./comic_chapter_context";
import { useState } from "react";
export const ComicChapterItem = ({
  comicId,
  chapter,
  index,
  isBought,
  comicName,
  userId,
  userCoin,
  setVerifyBuy,
  processBuyChapter,
  router,
}) => {
  const [openSheet, setOpenSheet] = useState(false);
  const myComicChapter = new ComicChapterContext({
    isBought,
    isFree: chapter?.unlockPrice === 0,
    openPaidDialog: () => {
      setOpenSheet(true);
    },
    buyChapter: () => {
      processBuy();
    },
    goToChapterPage: () => {
      router.push(`/comic/${comicId}/chapter?chapterId=${chapter?._id}`);
    },
  });

  const processBuy = () => {
    setVerifyBuy(true);
    processBuyChapter({
      chapterId: chapter?._id,
      unlockPrice: chapter?.unlockPrice,
      chapterName: chapter?.chapterName,
      coverImage: chapter?.coverImage,
    });
  };
  return (
    <div className="flex items-center justify-between rounded-lg bg-transparent">
      <div className="flex items-center gap-6">
        <Image
          src={chapter.coverImage}
          alt={`Chapter ${index + 1} Cover`}
          width={120}
          height={120}
          className="rounded-lg"
        />
        <div className="flex flex-col gap-3">
          <span className="block text-lg font-semibold">
            {chapter.chapterName}
          </span>
          <span className="block text-base text-[#8E8E8E]">
            {convertUtcToGmtPlus7(chapter.publicTime)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Button
          className={`text-[#DA5EF0] text-lg w-[100px] ${
            myComicChapter.getIsFree()
              ? "text-[#DA5EF0] bg-transparent"
              : myComicChapter.getIsBought()
              ? "bg-transparent text-gray-500"
              : "bg-[#1b1b1b]"
          }`}
          onClick={() => myComicChapter.access()}
        >
          {myComicChapter.getIsFree()
            ? "Miễn phí"
            : myComicChapter.getIsBought()
            ? "Đã mua"
            : chapter?.unlockPrice}
          {!myComicChapter.getIsBought() && !myComicChapter.getIsFree() && (
            <img src="/skycoin.png" width={20} height={20} className="ml-2" />
          )}
        </Button>
        <Button
          size={"sm"}
          className="h-[6px] text-[6px]"
          onClick={() => {
            const isFree = myComicChapter.getIsFree();
            const isBought = myComicChapter.getIsBought();
            console.log(
              isFree
                ? "State free"
                : isBought
                ? "State unlocked"
                : "State premium"
            );
          }}
        >
          Get state
        </Button>
      </div>
      <Sheet
        key={"bottom"}
        open={openSheet}
        onOpenChange={(open) => {
          setOpenSheet(open);
        }}
      >
        <SheetContent side={"bottom"} className="bg-[#2b2b2b]">
          <SheetHeader>
            <SheetTitle className="text-white px-8">
              Mở khóa truyện để tiếp tục đọc nhé!
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div className=" px-8 flex flex-row justify-between items-center">
              <div className="flex flex-row gap-3 mt-3 items-center">
                <Image
                  src={chapter.coverImage}
                  alt="Comic Cover"
                  width={120}
                  height={120}
                  className="rounded-lg"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-[#DA5EF0] font-semibold text-xl">
                    {comicName}
                  </span>
                  <span className="text-lg text-slate-400">
                    {chapter.chapterName}
                  </span>
                </div>
              </div>
              <div className="flex flex-row gap-2 text-white font-semibold text-xl">
                {chapter?.unlockPrice}
                <img src="/skycoin.png" width={30} height={30} />
              </div>
            </div>
            <Divider className="h-[0.8px] bg-[#686868] rounded-full" />
            <div className=" px-8 flex flex-row justify-between items-center">
              <div className="flex flex-row gap-2">
                <IoWalletOutline className="text-[#DA5EF0] w-6 h-6" />
                <span className="text-lg text-white">Bạn hiện đang có:</span>
              </div>
              <div className="flex flex-row gap-2 text-white font-semibold text-xl">
                {userCoin}
                <img src="/skycoin.png" width={30} height={30} />
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              {userId ? (
                <div className="flex flex-row gap-3 w-full mt-4 px-8">
                  <Button
                    className="basis-1/2 bg-transparent border-solid border-2 border-[#DA5EF0] text-[#DA5EF0] hover:bg-[#DA5EF0] hover:text-white"
                    onClick={() => {
                      router.push(
                        "https://anime-entertainment-payment.vercel.app/"
                      );
                    }}
                  >
                    Nạp thêm
                  </Button>
                  <Button
                    className="basis-1/2 bg-gradient-to-r from-[#A958FE] to-[#DA5EF0] transition ease-in-out duration-300 hover:scale-[1.01]"
                    onClick={() => {
                      myComicChapter.buy();
                    }}
                  >
                    Mua ngay
                  </Button>
                </div>
              ) : (
                <Button
                  className="mt-4 w-full px-8 mx-8 bg-gradient-to-r from-[#A958FE] to-[#DA5EF0] hover:scale-[1.01] transition ease-in-out duration-300"
                  onClick={() => {
                    router.push("/auth/login");
                  }}
                >
                  Đăng nhập để mua chương
                </Button>
              )}
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
