import { getRequest, postRequest, putRequest } from "@/lib/fetch";
import { baseApiUrl } from "@/lib/utils";
import toast from "react-hot-toast";

export const useComic = () => {
  const fetchComicBanner = async () => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getComicBanner`,
    });
    return res;
  };

  const getComicAlbum = async () => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getComicAlbum`,
    });
    return res;
  };

  const getComicAlbumContent = async (idList) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getComicInAlbum?idList=${idList}&limit=20&page=1`,
    });
    return res;
  };

  const getComic = async (id) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getComic?comicId=${id}`,
    });
    return res;
  };

  const getChapter = async (id) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getDetailComicById?comicId=${id}`,
    });
    return res;
  };

  const getComicAlbumContentAll = async (idList) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getComicInAlbum?idList=${idList}&limit=10000&page=1`,
    });
    return res;
  };

  const getRankingTable = async () => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getRankingTable`,
    });
    return res;
  };

  const getReadingHistories = async (userId) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getReadingHistories?userId=${userId}&limit=20&page=1`,
    });
    return res;
  };

  const getNewChapterComic = async () => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getNewChapterComic`,
    });
    return res;
  };

  const getComicOfChapter = async (chapterId) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getComicOfChapter?chapterId=${chapterId}`,
    });
    return res;
  };

  const checkUserBanned = async (userId) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/checkUserBanned?userId=${userId}`,
    });
    return res;
  };

  const checkValidCommentContent = async (content) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/checkValidCommentContent?content=${content}`,
    });
    return res;
  };

  const banUser = async (userId) => {
    const res = await putRequest({
      endPoint: `${baseApiUrl}/api/comics/banUser`,
      isFormData: false,
      formData: {
        userId,
      },
    });
    return res;
  };

  const checkUserHasLikeOrSaveChapter = async (chapterId, userId) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/checkUserHasLikeOrSaveChapter?chapterId=${chapterId}&userId=${userId}`,
    });
    return res;
  };

  const updateUserLikeChapter = async (chapterId, userId) => {
    const res = await postRequest({
      endPoint: `${baseApiUrl}/api/comics/updateUserLikeChapter`,
      isFormData: false,
      formData: {
        chapterId,
        userId,
      },
    });
    return res;
  };

  const updateUserSaveChapter = async (chapterId, userId) => {
    const res = await postRequest({
      endPoint: `${baseApiUrl}/api/comics/updateUserSaveChapter`,
      isFormData: false,
      formData: {
        chapterId,
        userId,
      },
    });
    return res;
  };

  const getComicChapterComments = async (chapterId) => {
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/getComicChapterComments?chapterId=${chapterId}`,
    });
    return res;
  };

  const addRootChapterComment = async (chapterId, userId, content) => {
    try {
      const res = await postRequest({
        endPoint: `${baseApiUrl}/api/comics/addRootChapterComments`,
        isFormData: false,
        formData: {
          chapterId,
          userId,
          content,
        },
      });
      return res;
    } catch (error) {
      throw error;
    }
  };

  const addChildChapterComment = async (
    chapterId,
    commentId,
    userId,
    content
  ) => {
    try {
      const res = await postRequest({
        endPoint: `${baseApiUrl}/api/comics/addChildChapterComments`,
        isFormData: false,
        formData: {
          chapterId,
          commentId,
          userId,
          content,
        },
      });
      return res;
    } catch (error) {
      // Re-throw the error to be handled by the calling component
      throw error;
    }
  };

  const updateUserLikeChildComment = async (
    chapterId,
    userId,
    commentId,
    commentChildId
  ) => {
    const res = await postRequest({
      endPoint: `${baseApiUrl}/api/comics/updateUserLikeChildComment`,
      isFormData: false,
      formData: {
        chapterId,
        userId,
        commentId,
        commentChildId,
      },
    });
    return res;
  };

  const updateUserLikeParentComment = async (chapterId, userId, commentId) => {
    const res = await postRequest({
      endPoint: `${baseApiUrl}/api/comics/updateUserLikeParentComment`,
      isFormData: false,
      formData: {
        chapterId,
        userId,
        commentId,
      },
    });
    return res;
  };

  const updateChapterView = async (chapterId) => {
    const res = await postRequest({
      endPoint: `${baseApiUrl}/api/comics/updateChapterView`,
      isFormData: false,
      formData: {
        chapterId,
      },
    });
    return res;
  };

  const updateUserHistoryHadSeenChapter = async (chapterId, userId) => {
    const res = await postRequest({
      endPoint: `${baseApiUrl}/api/comics/updateUserHistoryHadSeenChapter`,
      isFormData: false,
      formData: {
        chapterId,
        userId,
      },
    });
    return res;
  };

  const searchForComics = async (searchWord) => {
    console.log(searchWord);
    const res = await getRequest({
      endPoint: `${baseApiUrl}/api/comics/searchComic?query=${searchWord}`,
    });
    return res;
  };

  return {
    fetchComicBanner,
    getComicAlbum,
    getComicAlbumContent,
    getComicAlbumContentAll,
    getRankingTable,
    checkUserBanned,
    checkValidCommentContent,
    banUser,
    getReadingHistories,
    getNewChapterComic,
    getComicOfChapter,
    getChapter,
    getComic,
    checkUserHasLikeOrSaveChapter,
    updateUserLikeChapter,
    updateUserSaveChapter,
    getComicChapterComments,
    addRootChapterComment,
    addChildChapterComment,
    updateUserLikeChildComment,
    updateUserLikeParentComment,
    updateChapterView,
    updateUserHistoryHadSeenChapter,
    searchForComics,
  };
};
