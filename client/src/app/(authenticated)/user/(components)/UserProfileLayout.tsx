"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider, Image, useDisclosure } from "@nextui-org/react";
import { useUser } from "@/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/Loader";
import AvatarDialog from "./AvatarDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import Link from "next/link";
import { signOut } from "next-auth/react";
import LogoutIcon from "@/components/logouticon";
import { VscSaveAs } from "react-icons/vsc";
import { MdOutlineEdit } from "react-icons/md";
import { TbPencilCancel } from "react-icons/tb";
import { FaWallet } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { FaLayerGroup, FaRankingStar, FaSquarePlus } from "react-icons/fa6";
import { LuBuilding2 } from "react-icons/lu";
import { useDonate } from "@/hooks/useDonate";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Avatar,
} from "@nextui-org/react";

const UserProfileLayout = ({ session }) => {
  console.log("UserProfileLayout session:", session);
  console.log("UserProfileLayout session.user:", session?.user);
  console.log("UserProfileLayout session.user.id:", session?.user?.id);
  
  const { fetchUserInfoById, getAvatarList, updateAvatar, updateUsername } =
    useUser();
  const [username, setUsername] = useState(session?.user?.name || session?.user?.username || "");
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const { getDonatorList } = useDonate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [rankList, setRankList] = useState();

  const fetchRank = async () => {
    setIsLoading(true);
    const result = await getDonatorList();
    setRankList(result);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRank();
    }
  }, [isOpen]);

  const {
    data: userInfo,
    isLoading: isUserInfoLoading,
    refetch: refetchUserInfo,
    error,
  } = useQuery({
    queryKey: ["user", "info", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.log("No session user ID available");
        return {};
      }
      console.log("Fetching user info for ID:", session?.user?.id);
      const res = await fetchUserInfoById(session?.user?.id);
      console.log("fetchUserInfoById response:", res);
      
      // Handle the response properly
      const userData = res || {};
      if (userData?.username) {
        setUsername(userData.username);
      }
      return userData;
    },
    enabled: !!session?.user?.id,
    staleTime: 0, // Disable caching temporarily
    cacheTime: 0, // Disable caching temporarily
  });

  console.log("Query state - userInfo:", userInfo);
  console.log("Query state - isLoading:", isUserInfoLoading);
  console.log("Query state - error:", error);

  // Fallback to session data if API fails
  const displayUserInfo = userInfo || {
    id: session?.user?.id,
    username: session?.user?.name || session?.user?.username,
    avatar: session?.user?.image || session?.user?.avatar,
    coinPoint: session?.user?.coinPoint || 0,
    phone: session?.user?.phone || session?.user?.email,
  };

  const { data: avatarList, isLoading: isAvatarListLoading } = useQuery({
    queryKey: ["avatar", "list"],
    queryFn: async () => {
      const res = await getAvatarList();
      return res;
    },
  });

  const handleUpdateUsername = async () => {
    try {
      const data = {
        userId: session?.user?.id,
        username: username,
      };
      setIsEditing(false);
      await updateUsername(data);
      await refetchUserInfo();
      toast.success("Cập nhật tên thành công");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật tên");
      console.error(error);
    }
  };

  if (isUserInfoLoading || isAvatarListLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <div className="relative flex justify-center items-center">
        <div className="w-full h-[500px] bg-gradient-to-b from-[#A958FE] to-[#DA5EF0] absolute -top-[350px] left-0 rounded-[50px] md:rounded-[90px]"></div>
        <div className="p-8 z-10 w-full flex justify-center">
          <Card className="w-full max-w-7xl mx-8 border-[#242424] bg-[#242424] rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 p-10">
              {/* Left side - Avatar section */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#DA5EF0]">
                    <Image
                      src={displayUserInfo?.avatar || "/placeholder.svg"}
                      alt="Profile picture"
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute bottom-2 right-0 z-10">
                    <AvatarDialog
                      avatarList={avatarList}
                      currentAvatar={displayUserInfo?.avatar}
                      onUpdateAvatar={updateAvatar}
                      userId={session?.user?.id}
                      refetchUserInfo={refetchUserInfo}
                    />
                  </div>
                </div>
                {isEditing ? (
                  <div className="ml-[46px] flex flex-row items-center">
                    <Input
                      className="text-center text-white text-lg font-semibold rounded-none border-t-0 border-l-0 border-r-0 border-b-1.5 border-gray-500 focus-visible:ring-0 w-fit"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={displayUserInfo?.username || "Không có dữ liệu"}
                    />
                    <div className="w-[46px] h-[46px] flex justify-center items-center">
                      <Button
                        onClick={handleUpdateUsername}
                        disabled={!username}
                        className="group p-0 bg-transparent hover:bg-transparent h-fit transition ease-in-out duration-1000 hover:bg-emerald-400 hover:p-3 hover:rounded-full"
                      >
                        <VscSaveAs className="w-5 h-5 text-emerald-400 group-hover:text-white transition ease-in-out duration-300 group-hover:scale-[0.8]" />
                      </Button>
                    </div>
                    <div className="w-[46px] h-[46px] flex justify-center items-center">
                      <Button
                        onClick={() => {
                          setUsername(displayUserInfo?.username);
                          setIsEditing(false);
                        }}
                        className="group p-0 bg-transparent hover:bg-transparent h-fit transition ease-in-out duration-1000 hover:bg-red-400 hover:p-3 hover:rounded-full"
                      >
                        <TbPencilCancel className="w-5 h-5 text-red-400 group-hover:text-white transition ease-in-out duration-300 group-hover:scale-[0.8]" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="ml-[46px] flex flex-row items-center gap-3">
                    <span className="text-center text-white text-lg font-semibold">
                      {displayUserInfo?.username || "Không có dữ liệu"}
                    </span>
                    <div className="w-[46px] h-[46px] flex justify-center items-center">
                      <Button
                        onClick={() => setIsEditing(true)}
                        disabled={!username}
                        className="group p-0 bg-transparent hover:bg-transparent h-fit transition ease-in-out duration-1000 hover:bg-emerald-400 hover:p-3 hover:rounded-full"
                      >
                        <MdOutlineEdit className="w-5 h-5 text-emerald-400 group-hover:text-white transition ease-in-out duration-1000 group-hover:scale-[0.8]" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex flex-row gap-2">
                  <span className="text-gray-500 text-sm">UserId:</span>
                  <span className="text-[#DA5EF0] text-sm">{displayUserInfo?.id}</span>
                </div>

                <div className="flex flex-row gap-2 mt-12 w-full justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="text-gray-400 text-sm">
                      SKY COINS CỦA TÔI:
                    </span>
                    <div className="flex flex-row gap-2 text-white font-medium text-base">
                      <img src="/skycoin.png" className="w-[24px] h-[24px]" />
                      Hiện có {displayUserInfo?.coinPoint?.toLocaleString(
                        "de-DE"
                      )}{" "}
                      skycoins
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-[250px] h-full transition-colors transition-transform transition-shadow transition-all duration-500 bg-left hover:bg-right hover:shadow-[#A958FE] hover:shadow-md data-[hover=true]:opacity-100"
                    style={{
                      backgroundSize: "200% auto",
                      backgroundImage:
                        "var(--button_primary_background_color, linear-gradient(90deg, #A958FE, #DA5EF0 50%, #A958FE))",
                    }}
                    onClick={() => {
                      router.push(
                        "https://anime-entertainment-payment.vercel.app/"
                      );
                    }}
                  >
                    <span className="text-white font-medium h-full flex flex-row items-center gap-3">
                      <FaWallet className="text-white w-6 h-6" />
                      Nạp ngay
                    </span>
                  </Button>
                </div>

                <Divider className="mt-4 mb-2 bg-gray-500" />
                <Button
                  size="sm"
                  className="w-full bg-transparent py-3 justify-start"
                  onClick={() => {
                    router.push("/transaction/history");
                  }}
                >
                  <span className="text-white font-medium h-full flex flex-row items-center gap-3">
                    <FaLayerGroup className="text-white w-6 h-6" />
                    Lịch sử giao dịch
                  </span>
                </Button>
                <Divider className="mt-2 mb-2 bg-gray-500" />
              </div>

              {/* Right side - Information section */}
              <div className="text-white">
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    className="w-full h-full bg-transparent py-3 justify-start"
                    onClick={() => {
                      router.push("/bookmark");
                    }}
                  >
                    <span className="text-white font-medium h-full flex flex-row items-center gap-3">
                      <FaSquarePlus className="text-white w-6 h-6" />
                      Yêu thích
                    </span>
                  </Button>
                  <Divider className="my-1 bg-gray-500" />
                  <Button
                    size="sm"
                    className="w-full h-full bg-transparent py-3 justify-start"
                    onClick={onOpen}
                  >
                    <span className="text-white font-medium h-full flex flex-row items-center gap-3">
                      <FaRankingStar className="text-white w-6 h-6" />
                      Bảng xếp hạng đóng góp
                    </span>
                  </Button>
                  <Divider className="my-1 bg-gray-500" />
                  <Button
                    size="sm"
                    className="w-full h-full bg-transparent py-3 justify-start"
                    onClick={() => {
                      router.push("/about-us");
                    }}
                  >
                    <span className="text-white font-medium h-full flex flex-row items-center gap-3">
                      <LuBuilding2 className="text-white w-6 h-6" />
                      Về chúng tôi
                    </span>
                  </Button>
                  <Divider className="my-1 bg-gray-500" />
                  <Link href="/donate">
                    <img
                      src="/donatebanner.png"
                      className="w-full rounded-md"
                    />
                  </Link>
                  <Link
                    key="logout"
                    onClick={() => signOut()}
                    href={"/auth/login"}
                  >
                    <div className="mt-1 bg-transparent border-[#DA5EF0] border-2 text-[#DA5EF0] rounded text-center p-3 font-medium transition ease-in-out duration-300 hover:bg-[#DA5EF0] hover:text-white">
                      Đăng xuất
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="bg-black">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-row items-center gap-2 text-white">
                <img src="/goldtrophy.png" width={20} />{" "}
                <span>Bảng xếp hạng donate</span>
              </ModalHeader>
              <ModalBody>
                {isLoading ? (
                  <div className="bg-[#141414] flex h-full items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                    {rankList?.map((item, index) => (
                      <div className="flex flex-row gap-4 items-center">
                        <span
                          className={`text-${
                            index === 0
                              ? "[#DA5EF0]"
                              : index === 1
                              ? "emerald-500"
                              : index === 2
                              ? "blue-500"
                              : "gray-500"
                          } font-extrabold text-2xl`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex flex-row items-center justify-between rounded-lg p-3 gap-2 bg-[#141414] w-full">
                          <div className="flex flex-row gap-2">
                            <Avatar src={item?.avatar} />
                            <div className="flex flex-col gap-1">
                              <span className="text-white font-semibold">
                                {item?.username}
                              </span>
                              <span className="text-[#DA5EF0] text-sm font-medium">
                                Đã donate {item?.donationCount} lần
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row justify-center items-center text-white font-medium">
                            {item?.totalCoins.toLocaleString("de-DE")}{" "}
                            <img src="/skycoin.png" className="ml-2 w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))}
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

export default UserProfileLayout;
