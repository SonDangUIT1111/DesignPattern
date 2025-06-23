"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaThumbsUp } from "react-icons/fa";
import Image from "next/image";
import { useAnime } from "@/hooks/useAnime";
import { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BsFillSendFill } from "react-icons/bs";
import toast from "react-hot-toast";
import { useQuest } from "@/hooks/useQuest";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Input } from "@/components/ui/input";
import { MdCancel } from "react-icons/md";
import { useComic } from "@/hooks/useComic";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useNotification } from "@/hooks/useNotification";
import Loader from "@/components/Loader";
import { useReport } from "@/hooks/useReport";

const FormSchema = z.object({
  comment: z.string().min(1, {
    message: "Bình luận không được trống",
  }),
});

export const ChapterComment = ({ chapterId, userId }) => {
  const {
    getComicChapterComments,
    addRootChapterComment,
    addChildChapterComment,
    updateUserLikeParentComment,
    updateUserLikeChildComment,
  } = useComic();
  const { checkUserBanned, checkValidCommentContent, banUser } = useComic();
  const { sendPushNoti, addCommentNotiToUser } = useNotification();
  const { sendUserReport } = useReport();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);
  const [commentTree, setCommentTree] = useState();
  const [userNameReplied, setUserNameReplied] = useState("");
  const [commentIdReplied, setCommentIdReplied] = useState("");
  const [userIdReplied, setUserIdReplied] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const getChapterComment = async () => {
    setIsLoading(true);
    const result = await getComicChapterComments(chapterId);
    setCommentTree(result);
    setIsLoading(false);
  };

  useEffect(() => {
    getChapterComment();
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      comment: "",
    },
  });

  const checkUserCommentStatus = async (content) => {
    if (!userId) return true;
    const result = await checkUserBanned(userId);
    if (result.toString().includes("2020")) {
      const checkRes = await checkValidCommentContent(content);
      if (!checkRes) {
        await banUser(userId);
        setModalMessage(
          `Bình luận của bạn vi phạm quy tắc cộng đồng. Bạn sẽ bị cấm bình luận trong 3 ngày.`
        );
        onOpen();
        return false;
      }
    } else {
      const dateRes = new Date(result.toString());
      const formattedDate = `${dateRes.getDate()}/${
        dateRes.getMonth() + 1
      }/${dateRes.getFullYear()} ${dateRes.getHours()}:${dateRes.getMinutes()}:${dateRes.getSeconds()}`;
      setModalMessage(
        `Bạn đang bị cấm bình luận vì vi phạm quy tắc cộng đồng. Thời gian bạn có thể bình luận tiếp là ${formattedDate}`
      );
      onOpen();
      return false;
    }
    return true;
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const commentContent = data.comment;
    form.reset({ comment: "" });
    const checkRes = await checkUserCommentStatus(commentContent);
    if (!checkRes) {
      form.reset({ comment: "" });
      return;
    }
    if (commentIdReplied) {
      setUserNameReplied("");
      setUserIdReplied("");
      await addChildChapterComment(
        chapterId,
        commentIdReplied,
        userId,
        commentContent
      );
      await sendPushNoti(userIdReplied);
      await addCommentNotiToUser(userIdReplied, chapterId, "commentChapter");
      setCommentIdReplied("");
      getChapterComment();
    } else {
      await addRootChapterComment(chapterId, userId, commentContent);
      getChapterComment();
    }
  }

  return (
    <>
      {isLoading ? (
        <div className="flex h-[200px] w-full items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="relative h-full w-full">
          <AspectRatio ratio={9 / 10} className="absolute w-full">
            <div className="h-full w-full overflow-y-auto scrollbar-thin pb-24">
              <div className="pl-2 pb-3 text-white text-xl font-semibold cursor-default">
                Bình luận
              </div>
              {commentTree?.map((item) => (
                <div className="flex flex-col w-full items-end" key={item?._id}>
                  <div className="flex flex-row gap-3 px-2 mt-3 w-full">
                    <Avatar>
                      <AvatarImage src={item?.avatar} />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex flex-col gap-[2px] bg-[#2A2A2A] rounded-md p-3 py-2 w-full">
                        <p className="text-white font-semibold text-[13px] cursor-default">
                          {item?.userName}
                        </p>
                        <div className="w-full text-[#cecece] font-normal text-[13px] text-wrap break-all cursor-default">
                          {item?.content}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex flex-row gap-5 ml-3">
                          <div
                            className={`${
                              item?.likes?.includes(userId)
                                ? "text-[#DA5EF0]"
                                : "text-white"
                            } text-[12px] font-semibold cursor-default`}
                            onClick={async () => {
                              if (!userId) {
                                setModalMessage(
                                  `Vui lòng đăng nhập trước khi thực hiện thao tác`
                                );
                                onOpen();
                                return;
                              }
                              const updatedArray = commentTree?.map((cm) => {
                                if (cm._id === item?._id) {
                                  if (cm.likes?.includes(userId))
                                    return {
                                      ...cm,
                                      likes: cm?.likes?.filter(
                                        (e) => e !== userId
                                      ),
                                    };
                                  else
                                    return {
                                      ...cm,
                                      likes: [...cm?.likes, userId],
                                    };
                                }
                                return cm;
                              });
                              setCommentTree(updatedArray);
                              await updateUserLikeParentComment(
                                chapterId,
                                userId,
                                item?._id
                              );
                            }}
                          >
                            {item?.likes?.includes(userId)
                              ? "Đã thích"
                              : "Thích"}
                          </div>
                          <div
                            className="text-white text-[12px] font-semibold cursor-default"
                            onClick={() => {
                              if (!userId) {
                                setModalMessage(
                                  `Vui lòng đăng nhập trước khi thực hiện thao tác`
                                );
                                onOpen();
                                return;
                              }
                              setUserNameReplied(item?.userName);
                              setUserIdReplied(item?.userId);
                              setCommentIdReplied(item?._id);
                            }}
                          >
                            Trả lời
                          </div>
                          {/* <Dropdown className="bg-[#141414]">
                            <DropdownTrigger>
                              <div
                                className="text-white text-[12px] font-semibold cursor-default"
                                onClick={() => {
                                  if (!userId) {
                                    setModalMessage(
                                      `Vui lòng đăng nhập trước khi thực hiện thao tác`
                                    );
                                    onOpen();
                                    return;
                                  }
                                }}
                              >
                                Báo cáo
                              </div>
                            </DropdownTrigger>
                            {userId && (
                              <DropdownMenu
                                aria-label="report"
                                className="bg-[#141414] text-white ring-[#141414] border-[#141414]"
                              >
                                <DropdownItem
                                  onClick={async () => {
                                    await sendUserReport(
                                      "Ngôn ngữ thô tục",
                                      item?.userId,
                                      userId,
                                      "comic",
                                      chapterId,
                                      item?._id
                                    );
                                  }}
                                >
                                  Ngôn ngữ thô tục
                                </DropdownItem>
                                <DropdownItem
                                  onClick={async () => {
                                    await sendUserReport(
                                      "Nội dung công kích",
                                      item?.userId,
                                      userId,
                                      "comic",
                                      chapterId,
                                      item?._id
                                    );
                                  }}
                                >
                                  Nội dung công kích
                                </DropdownItem>
                                <DropdownItem
                                  onClick={async () => {
                                    await sendUserReport(
                                      "Khác",
                                      item?.userId,
                                      userId,
                                      "comic",
                                      chapterId,
                                      item?._id
                                    );
                                  }}
                                >
                                  Khác
                                </DropdownItem>
                              </DropdownMenu>
                            )}
                          </Dropdown> */}
                        </div>
                        {item?.likes?.length > 0 && (
                          <p className="flex flex-row gap-1 justify-center items-center text-[#DA5EF0] text-[12px] font-semibold">
                            {item?.likes?.length} <FaThumbsUp />
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-[90%]">
                    {item?.replies?.map((child) => (
                      <div
                        className="flex flex-row gap-3 px-2 mt-3 w-full"
                        key={child?._id}
                      >
                        <Avatar>
                          <AvatarImage src={child?.avatar} />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex flex-col gap-[2px] bg-[#2A2A2A] rounded-md p-3 py-2 w-full">
                            <p className="text-white font-semibold text-[13px] cursor-default">
                              {child?.userName}
                            </p>
                            <div className="w-full text-[#cecece] font-normal text-[13px] text-wrap break-all cursor-default">
                              {child?.content}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex flex-row gap-5 ml-3">
                              <div
                                className={`${
                                  child?.likes?.includes(userId)
                                    ? "text-[#DA5EF0]"
                                    : "text-white"
                                } text-[12px] font-semibold cursor-default`}
                                onClick={async () => {
                                  if (!userId) {
                                    setModalMessage(
                                      `Vui lòng đăng nhập trước khi thực hiện thao tác`
                                    );
                                    onOpen();
                                    return;
                                  }
                                  const updatedArray = item?.replies?.map(
                                    (e1) => {
                                      if (e1?._id === child?._id) {
                                        if (e1?.likes?.includes(userId))
                                          return {
                                            ...e1,
                                            likes: e1?.likes?.filter(
                                              (m) => m !== userId
                                            ),
                                          };
                                        else
                                          return {
                                            ...e1,
                                            likes: [...e1?.likes, userId],
                                          };
                                      }
                                      return e1;
                                    }
                                  );
                                  const updatedTree = commentTree?.map((e2) =>
                                    e2?._id === item?._id
                                      ? { ...e2, replies: updatedArray }
                                      : e2
                                  );
                                  setCommentTree(updatedTree);
                                  await updateUserLikeChildComment(
                                    chapterId,
                                    userId,
                                    item?._id,
                                    child?._id
                                  );
                                }}
                              >
                                {child?.likes?.includes(userId)
                                  ? "Đã thích"
                                  : "Thích"}
                              </div>
                              {/* <Dropdown className="bg-[#141414]">
                                <DropdownTrigger>
                                  <div
                                    className="text-white text-[12px] font-semibold cursor-default"
                                    onClick={() => {
                                      if (!userId) {
                                        setModalMessage(
                                          `Vui lòng đăng nhập trước khi thực hiện thao tác`
                                        );
                                        onOpen();
                                        return;
                                      }
                                    }}
                                  >
                                    Báo cáo
                                  </div>
                                </DropdownTrigger>
                                {userId && (
                                  <DropdownMenu
                                    aria-label="report"
                                    className="bg-[#141414] text-white ring-[#141414] border-[#141414]"
                                  >
                                    <DropdownItem
                                      onClick={async () => {
                                        await sendUserReport(
                                          "Ngôn ngữ thô tục",
                                          child?.userId,
                                          userId,
                                          "comic",
                                          chapterId,
                                          child?._id
                                        );
                                      }}
                                    >
                                      Ngôn ngữ thô tục
                                    </DropdownItem>
                                    <DropdownItem
                                      onClick={async () => {
                                        await sendUserReport(
                                          "Nội dung công kích",
                                          child?.userId,
                                          userId,
                                          "comic",
                                          chapterId,
                                          child?._id
                                        );
                                      }}
                                    >
                                      Nội dung công kích
                                    </DropdownItem>
                                    <DropdownItem
                                      onClick={async () => {
                                        await sendUserReport(
                                          "Khác",
                                          child?.userId,
                                          userId,
                                          "comic",
                                          chapterId,
                                          child?._id
                                        );
                                      }}
                                    >
                                      Khác
                                    </DropdownItem>
                                  </DropdownMenu>
                                )}
                              </Dropdown> */}
                            </div>
                            {child?.likes?.length > 0 && (
                              <p className="flex flex-row gap-1 justify-center items-center text-[#DA5EF0] text-[12px] font-semibold">
                                {child?.likes?.length} <FaThumbsUp />
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {commentTree?.length === 0 && (
                <div className="flex justify-center items-center">
                  <div className="flex flex-col gap-1 justify-center items-center">
                    <img src="\commentempty.png" width={180} height={180} />
                    <p className="text-white font-medium">
                      Chưa có bình luận nào
                    </p>
                    <p className="text-slate-400 text-sm">
                      Hãy là người đầu tiên bình luận nào
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AspectRatio>
          {userIdReplied && (
            <div className="absolute w-[98%] left-0 bottom-[72px] bg-black px-2 flex flex-row justify-between pt-2">
              <div className="pl-3 text-[13px] text-white font-medium">
                Đang trả lời{" "}
                <p className="text-[13px] font-semibold text-fuchsia-500">
                  {userNameReplied}
                </p>
              </div>
              <div
                className="mr-4"
                onClick={() => {
                  setUserNameReplied("");
                  setUserIdReplied("");
                  setCommentIdReplied("");
                }}
              >
                <MdCancel className="text-white h-4 w-4" />
              </div>
            </div>
          )}
          <div className="w-full h-10 bottom-8 left-0 z-10 absolute flex flex-col gap-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-[98%] flex flex-row pl-4 pr-2 bg-black py-2 pb-3"
              >
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl className="w-full">
                        <Input
                          placeholder="Viết bình luận"
                          {...field}
                          className="w-full rounded-full text-white"
                        />
                      </FormControl>
                      <FormMessage className="bg-transparent" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="bg-transparent hover:bg-transparent min-w-[40px] data-[focus-visible=true]:outline-none data-[focus-visible=true]:outline-0 data-[focus-visible=true]:outline-offset-0"
                >
                  <BsFillSendFill className="text-lg text-white" />
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
      <Modal size={"md"} isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Thông báo
              </ModalHeader>
              <ModalBody>
                <p>{modalMessage}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Okay
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
