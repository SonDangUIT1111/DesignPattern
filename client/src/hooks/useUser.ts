import { getRequest, postRequest, putRequest } from "@/lib/fetch";
import toast from "react-hot-toast";

export const useUser = () => {
  const getPaymentHistories = async (userId) => {
    const res = await getRequest({
      endPoint: `https://skylark-entertainment.vercel.app/api/users/getPaymentHistories?userId=${userId}`,
    });
    return res;
  };

  const paySkycoin = async (userId, coin, chapterId) => {
    const res = await putRequest({
      endPoint: `https://skylark-entertainment.vercel.app/api/users/paySkycoin`,
      isFormData: false,
      formData: {
        userId,
        coin,
        chapterId,
      },
    });
    return res;
  };

  const fetchUserInfoById = async (id) => {
    const res = await getRequest({
      endPoint: `/api/user?id=${id}`,
    });
    console.log(res);
    return res;
  };

  const updateUserInfo = async (data) => {
    try {
      const res = await postRequest({
        endPoint: "/api/admin/users/update",
        isFormData: false,
        formData: data,
      });
      toast.success("Thông tin hồ sơ đã được lưu");
      return res;
    } catch (e) {
      console.log(e);
      toast.error("Cập nhật thông tin thất bại");
      return false;
    }
  };
  const uploadUserInfo1 = async (data) => {
    try {
      const res = await postRequest({
        endPoint: "/api/user/update-information",
        isFormData: false,
        formData: data,
      });
      toast.success("Thông tin hồ sơ đã được lưu");
    } catch (e) {
      console.log(e);
    }
  };

  const getUserCoinAndChallenge = async (id) => {
    const res = await getRequest({
      endPoint: `/api/user/getUserCoinAndChallenge?id=${id}`,
    });
    return res;
  };

  const getAvatarList = async () => {
    const res = await getRequest({
      endPoint: "https://skylark-entertainment.vercel.app/api/users/getAvatarList",
    });
    return res;
  }

  const updateAvatar = async (data) => {
    const res = await postRequest({
      endPoint: "https://skylark-entertainment.vercel.app/api/users/updateAvatar",
      isFormData: false,
      formData: data,
    });
    return res;
  }

  const updateUsername = async (data) => {
    const res = await postRequest({
      endPoint: "https://skylark-entertainment.vercel.app/api/users/updateUsername",
      isFormData: false,
      formData: data,
    });
    return res;
  }

  const getBookmarkList = async (userId) => {
    const res = await getRequest({
      endPoint: `https://skylark-entertainment.vercel.app/api/users/getBookmarkList?userId=${userId}`,
    }
    )
    return res;
  }

  const removeBookmark = async (userId, bookmarksToRemove) => {
    const res = await postRequest({
      endPoint: `https://skylark-entertainment.vercel.app/api/users/removeBookmark`,
      isFormData: false,
      formData: {
        userId,
        bookmarksToRemove
      }
    }
    );
    return res;
  }

  return {
    getPaymentHistories,
    paySkycoin,
    fetchUserInfoById,
    updateUserInfo,
    uploadUserInfo1,
    getUserCoinAndChallenge,
    getAvatarList,
    updateAvatar,
    updateUsername,
    getBookmarkList,
    removeBookmark
  };
};
