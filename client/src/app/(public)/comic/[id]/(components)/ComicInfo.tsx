"use client";

import { useComic } from "@/hooks/useComic";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Divider, Image, Spinner } from "@nextui-org/react";
import { Book, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loader from "@/components/Loader";
import { FaClipboardList, FaEye, FaRegThumbsUp } from "react-icons/fa";
import { convertTagArrayToStr } from "@/app/(public)/anime/[id]/page";
import { IoWalletOutline } from "react-icons/io5";
import { useUser } from "@/hooks/useUser";
import { MdErrorOutline } from "react-icons/md";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { GoQuestion } from "react-icons/go";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { ComicChapterItem } from "./state/ComicChapterItem";

export function convertUtcToGmtPlus7(utcString) {
  const utcDate = new Date(utcString);
  const gmtPlus7Offset = 7 * 60;
  const localDate = new Date(utcDate.getTime() + gmtPlus7Offset * 60 * 1000);
  const formattedDate = localDate
    .toLocaleDateString("es-CL")
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");
  return formattedDate;
}

const ComicInfo = ({ id, session }) => {
  const userId = session?.user?.id;
  // const userId = "";
  const router = useRouter();
  const { getPaymentHistories, paySkycoin, fetchUserInfoById } = useUser();
  const { getChapter } = useComic();
  const [processPayment, setProcessPayment] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoadingUserBoughtDetail, setIsLoadingUserBoughtDetail] =
    useState(true);
  const [verifyBuy, setVerifyBuy] = useState(false);
  const [boughtChapterList, setBoughtChapterList] = useState([]);
  const [boughtInfo, setBoughtInfo] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const { data: userInfo } = useQuery({
    queryKey: ["user", "info"],
    queryFn: async () => {
      if (!session?.user?.id) return {};
      const res = await fetchUserInfoById(session?.user?.id);
      return res;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["comic", id],
    queryFn: async () => {
      const res = await getChapter(id);
      return res;
    },
  });

  useEffect(() => {
    const fetchUserBoughtDetail = async () => {
      if (!userId) {
        setIsLoadingUserBoughtDetail(false);
        return;
      }
      const result = await getPaymentHistories(userId);
      setBoughtChapterList(result);
      setIsLoadingUserBoughtDetail(false);
    };
    fetchUserBoughtDetail();
  }, []);

  const processBuyChapter = async ({
    chapterId,
    unlockPrice,
    chapterName,
    coverImage,
  }) => {
    onOpen();
    setProcessPayment(true);
    try {
      await paySkycoin(userId, unlockPrice, chapterId);
      setBoughtChapterList([...boughtChapterList, chapterId]);
      setBoughtInfo({
        chapterId,
        unlockPrice,
        chapterName,
        coverImage,
      });
    } catch (error) {
      setErrorMessage(
        "Giao dịch thất bại, vui lòng kiểm tra lại số dư và thử lại"
      );
    }
    setProcessPayment(false);
  };

  // Ensure data is available before rendering
  if (isLoading || isLoadingUserBoughtDetail || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <div className="-mt-[50px] md:-mt-[76px] relative min-h-screen text-white pb-[200px]">
        {/* Blurred Background */}
        <div
          className="hidden md:block absolute top-0 left-0 inset-0 bg-cover bg-center bg-no-repeat opacity-100"
          style={{
            backgroundImage: `url(${data[0].landspaceImage})`,
            filter: "blur(14px) brightness(30%)",
          }}
        ></div>
        <div
          className="md:hidden absolute top-0 left-0 inset-0 bg-cover bg-center bg-no-repeat opacity-100"
          style={{
            backgroundImage: `url(${data[0].landspaceImage})`,
            filter: "blur(1px) brightness(30%)",
          }}
        ></div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto py-8 px-4 pt-[50px] md:pt-[76px] sm:px-20 px-8">
          <div className="grid gap-8 md:grid-cols-[200px_1fr]">
            {/* Comic Cover */}
            <div className="hidden md:block relative bg-emerald-500">
              <Image
                src={data[0].coverImage}
                alt="Comic Cover"
                width={200}
                height={270}
                className="rounded-lg absolute"
              />
              {/* <div className="absolute inset-x-0 -bottom-2 left-0 z-10 w-full flex justify-center">
                <Button
                  size="sm"
                  className="w-2/3 z-10 transition-colors transition-transform transition-shadow transition-all duration-500 bg-left hover:bg-right shadow-[#A958FE] hover:shadow-md"
                  style={{
                    backgroundSize: "200% auto",
                    backgroundImage:
                      "var(--button_primary_background_color, linear-gradient(90deg, #A958FE, #DA5EF0 50%, #A958FE))",
                  }}
                  onClick={() => {
                    router.push(
                      `/comic/${id}/chapter?chapterId=${data[0].detailChapterList[0]?._id}`
                    );
                  }}
                >
                  📖 ĐỌC NGAY
                </Button>
              </div> */}
            </div>

            {/* Comic Details */}
            <div className="space-y-3 w-full">
              <h1 className="text-2xl font-bold text-center sm:text-start">
                {data[0].comicName}
              </h1>
              <div className="flex flex-row gap-10 mt-2 mb-2 justify-center items-center sm:justify-start sm:items-start">
                <div className="flex flex-col gap-1 justify-center items-center">
                  <FaRegThumbsUp className="text-white" />
                  <p className="text-xs text-[#8E8E8E]">
                    <span className="text-fuchsia-500">
                      {data[0].totalLikes.toLocaleString("de-DE")}
                    </span>{" "}
                    lượt thích
                  </p>
                </div>
                <div className="flex flex-col gap-1 justify-center items-center">
                  <FaEye className="text-white" />
                  <p className="text-xs text-[#8E8E8E]">
                    <span className="text-fuchsia-500">
                      {data[0].totalViews.toLocaleString("de-DE")}
                    </span>{" "}
                    lượt đọc
                  </p>
                </div>
                <div className="flex flex-col gap-1 justify-center items-center">
                  <FaClipboardList className="text-white" />
                  <p className="text-xs text-[#8E8E8E]">
                    <span className="text-fuchsia-500">
                      {data[0].chapterList.length}
                    </span>{" "}
                    chương
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-2">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-[#8E8E8E]">
                    Tác Giả:
                  </span>
                  <span className="text-sm font-medium text-violet-500">
                    {data[0].author}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-[#8E8E8E]">
                    Họa Sĩ:
                  </span>
                  <span className="text-sm font-medium text-fuchsia-500">
                    {data[0].artist}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-[#8E8E8E]">
                    Thể Loại:
                  </span>
                  <p className="text-sm font-medium text-fuchsia-500">
                    {convertTagArrayToStr(data[0].genreNames)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-[#8E8E8E]">
                    Dành cho độ tuổi:
                  </span>
                  <span className="text-sm font-medium text-violet-500">
                    {data[0].ageFor}
                  </span>
                </div>
              </div>

              <p className="text-zinc-300 line-clamp-3 text-sm">
                <span className="font-semibold text-white">Mô Tả: </span>
                {data[0].description}
              </p>
            </div>
          </div>
        </div>
        {/* Chapter List */}
        <div className="relative mt-8 h-fit z-10 sm:px-20 px-8">
          <h2 className="text-2xl text-[#DA5EF0] font-bold">
            Danh sách chương
          </h2>
          <Divider className="my-2 h-1 bg-gradient-to-r from-[#A958FE] to-[#DA5EF0] rounded-full" />
          <h2 className="text-xl font-semibold pb-1">
            {data[0].detailChapterList.length} chương
          </h2>
          <h3 className="text-gray-400 pb-4">{data[0].newChapterTime}</h3>
          <div className="flex justify-center h-full">
            <div className="space-y-6 h-full bg-[#141414] rounded-2xl w-full md:w-2/3 p-10 ">
              {" "}
              {/* Increased vertical spacing */}
              {data[0].detailChapterList.map((chapter, index) => (
                <div key={index}>
                  {index !== 0 && (
                    <Divider className="my-2 h-[0.8px] bg-[#353434] rounded-full mb-5" />
                  )}
                  <ComicChapterItem
                    comicId={id}
                    isBought={boughtChapterList.includes(chapter?._id)}
                    chapter={chapter}
                    index={index}
                    comicName={data[0].comicName}
                    userId={userId}
                    userCoin={(userInfo?.coinPoint || "0")?.toLocaleString(
                      "de-DE"
                    )}
                    setVerifyBuy={setVerifyBuy}
                    processBuyChapter={processBuyChapter}
                    router={router}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="bg-[#141414]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1"></ModalHeader>
              <ModalBody>
                {userInfo?.coinPoint < boughtInfo?.unlockPrice ||
                errorMessage ? (
                  <div className="text-white w-full h-full text-center flex flex-row gap-2 items-start">
                    <MdErrorOutline className="text-red-500 w-5 h-5" />
                    {errorMessage ||
                      "Số dư hiện tại không đủ, vui lòng nạp thêm"}
                  </div>
                ) : verifyBuy ? (
                  <div className="w-full h-full flex justify-center items-center">
                    {processPayment ? (
                      <Spinner
                        label="Đang xử lý giao dịch"
                        color="danger"
                        labelColor="danger"
                      />
                    ) : (
                      <div className="flex flex-col gap-3 w-full">
                        <div className="text-emerald-500 w-full h-full text-center flex flex-row gap-2 items-center">
                          <IoIosCheckmarkCircleOutline className="text-emerald-500 w-5 h-5" />
                          Mua chương truyện thành công
                        </div>
                        <div className=" px-1 flex flex-row justify-between items-center">
                          <div className="flex flex-row gap-3 mt-3 items-center">
                            <Image
                              src={boughtInfo?.coverImage}
                              alt="Comic Cover"
                              width={50}
                              height={50}
                              className="rounded-lg"
                            />
                            <div className="flex flex-col gap-1">
                              <span className="text-[#DA5EF0] font-semibold">
                                {data[0].comicName}
                              </span>
                              <span className="text-sm text-slate-400">
                                {boughtInfo?.chapterName}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row gap-1 text-white font-semibold text-sm">
                            {boughtInfo?.unlockPrice}
                            <img src="/skycoin.png" width={20} height={10} />
                          </div>
                        </div>
                        <Divider className="h-[0.8px] bg-[#686868] rounded-full" />
                        <div className="flex flex-col gap-1 justify-center w-full items-center">
                          <span className="text-[#A958FE] font-semibold text-base">
                            Cảm ơn bạn đã chọn Skylark
                          </span>
                          <span className="text-gray-300 font-medium text-sm">
                            Chúc bạn có một trải nghiệm vui vẻ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="text-white w-full h-full text-center flex flex-row gap-2 items-center">
                      <GoQuestion className="text-fuchsia-500 w-5 h-5" />
                      Bạn có chắc chắn muốn mua chương này
                    </div>
                    <div className="flex flex-row gap-3 w-full mt-4">
                      <Button
                        className="basis-1/2 p-0 bg-transparent border-solid border-2 border-[#DA5EF0] text-[#DA5EF0] hover:bg-[#DA5EF0] hover:text-white"
                        onClick={onClose}
                      >
                        Hủy
                      </Button>
                      <Button
                        className="basis-1/2 p-0 bg-gradient-to-r from-[#A958FE] to-[#DA5EF0] transition ease-in-out duration-300 hover:scale-[1.01]"
                        onClick={() => {
                          setVerifyBuy(true);
                          processBuyChapter();
                        }}
                      >
                        Xác nhận
                      </Button>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter></ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ComicInfo;
