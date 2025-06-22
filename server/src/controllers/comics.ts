import { Request } from "express";
import type { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import ComicsModel from "../models/comics";
import Comics from "../models/comics";
import BannerModel from "../models/banner";
import ComicChapterModel from "../models/comicChapter";
import UserModel from "../models/user";
import * as admin from "firebase-admin";
import ComicAlbumModel from "../models/comicAlbum";
import qs from "qs";
import { StorageProviderFactory } from '../factories/StorageProviderFactory';

interface FileRequest extends Request {
    body: {
        file: string; // base64 string
        filename: string;
        contentType: string;
    }
}

// api get
export const getComicBanner: RequestHandler = async (req, res, next) => {
  try {
    const banners = await BannerModel.aggregate([
      {
        $match: { type: "Comic" },
      },
      {
        $lookup: {
          from: "comics",
          localField: "list",
          foreignField: "_id",
          as: "comicList",
        },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          "comicList._id": 1,
          "comicList.landspaceImage": 1,
        },
      },
    ]);
    res.status(200).json(banners[0]);
  } catch (error) {
    next(error);
  }
};

export const getComicAlbum: RequestHandler = async (req, res, next) => {
  try {
    const albums = await ComicAlbumModel.find().exec();
    res.status(200).json(albums);
  } catch (error) {
    next(error);
  }
};

export const getNewChapterComic: RequestHandler = async (req, res, next) => {
  try {
    const comics = await ComicChapterModel.aggregate([
      {
        $lookup: {
          from: "comics",
          localField: "_id",
          foreignField: "chapterList",
          as: "chapterOwner",
        },
      },
      {
        $project: {
          publicTime: 1,
          "chapterOwner._id": 1,
          "chapterOwner.comicName": 1,
          "chapterOwner.coverImage": 1,
          "chapterOwner.genres": 1,
        },
      },
      {
        $lookup: {
          from: "genres",
          localField: "chapterOwner.genres",
          foreignField: "_id",
          as: "genreName",
        },
      },

      {
        $group: {
          _id: {
            chapterOwnerId: "$chapterOwner._id",
            coverImage: "$chapterOwner.coverImage",
            comicName: "$chapterOwner.comicName",
            genres: "$genreName",
          },
          publicTime: {
            $top: {
              output: ["$publicTime"],
              sortBy: { publicTime: -1 },
            },
          },
        },
      },
      { $sort: { publicTime: -1 } },
      { $limit: 10 },
    ]);
    res.status(200).json(comics);
  } catch (error) {
    next(error);
  }
};
// api get one
export const getComicInAlbum: RequestHandler = async (req, res, next) => {
  try {
    const url = req.url;
    const [, params] = url.split("?");
    const parsedParams = qs.parse(params);
    const page = parseInt(
      typeof parsedParams.page === "string" ? parsedParams.page : "0"
    );
    const limit = parseInt(
      typeof parsedParams.limit === "string" ? parsedParams.limit : "0"
    );
    const response: string =
      typeof parsedParams.idList === "string" ? parsedParams.idList : "";
    const comics: any[] = [];
    var idList = response
      .replace("[", "")
      .replace("]", "")
      .replace(/\s/g, "")
      .split(",");
    if ((page - 1) * limit > idList.length - 1) {
      res.status(200).json(comics);
      return;
    } else idList = idList.splice((page - 1) * limit, limit);
    idList.forEach(async (element) => {
      await ComicsModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(element) },
        },
        {
          $lookup: {
            from: "genres",
            localField: "genres",
            foreignField: "_id",
            as: "genreName",
          },
        },
        {
          $project: {
            _id: 1,
            coverImage: 1,
            comicName: 1,
            genreName: 1,
            description: 1,
          },
        },
      ]).then((item) => {
        comics.push(item);
        if (comics.length === idList.length) {
          res.status(200).json(comics);
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

export const getComic: RequestHandler = async (req, res, next) => {
  const url = req.url;
  const [, params] = url.split("?");
  const parsedParams = qs.parse(params);
  const comicId =
    typeof parsedParams.comicId === "string" ? parsedParams.comicId : "0";

  try {
    if (!mongoose.isValidObjectId(comicId)) {
      throw createHttpError(400, "Invalid comic id");
    }
    const comic = await ComicsModel.findById(comicId).exec();

    if (!comic) {
      throw createHttpError(404, "comic not found");
    }
    res.status(200).json(comic);
  } catch (error) {
    next(error);
  }
};

export const getRankingTable: RequestHandler = async (req, res, next) => {
  try {
    const comics = await ComicChapterModel.aggregate([
      // 21600 stand for meaning reset ranking table each 6 hours
      {
        $addFields: {
          timestamp: { $toLong: "$publicTime" },
          begintimestamp: {
            $toLong: new Date("2024-01-01T17:00:00.000+00:00"),
          },
        },
      },
      {
        $addFields: {
          seconds: { $subtract: ["$timestamp", "$begintimestamp"] },
          sign: { $cond: [{ $gt: ["$views", 0] }, 1, 0] },
          n: {
            $cond: [{ $gte: [{ $abs: "$views" }, 1] }, { $abs: "$views" }, 1],
          },
        },
      },
      {
        $addFields: {
          ratepoint: {
            $sum: [
              { $log: ["$n", 10] },
              { $divide: [{ $multiply: ["$sign", "$seconds"] }, 21600] },
            ],
          },
        },
      },
      {
        $sort: { ratepoint: -1 },
      },
      {
        $lookup: {
          from: "comics",
          localField: "_id",
          foreignField: "chapterList",
          as: "comicOwner",
        },
      },
      {
        $lookup: {
          from: "genres",
          localField: "comicOwner.genres",
          foreignField: "_id",
          as: "genreNames",
        },
      },
      {
        $group: {
          _id: {
            comicOwnerId: "$comicOwner._id",
            coverImage: "$comicOwner.coverImage",
            landspaceImage: "$comicOwner.landspaceImage",
            comicName: "$comicOwner.comicName",
            genres: "$genreNames",
          },
          ratepoint: {
            $top: {
              output: ["$ratepoint"],
              sortBy: { ratepoint: -1 },
            },
          },
        },
      },
      { $sort: { ratepoint: -1 } },
      { $limit: 20 },
    ]);
    res.status(200).json(comics);
  } catch (error) {
    next(error);
  }
};

export const getChapterOfComic: RequestHandler = async (req, res, next) => {
  const url = req.url;
  const [, params] = url.split("?");
  const parsedParams = qs.parse(params);
  const comicId =
    typeof parsedParams.comicId === "string" ? parsedParams.comicId : "0";
  try {
    if (!mongoose.isValidObjectId(comicId)) {
      throw createHttpError(400, "Invalid comic id");
    }
    // Mỗi một comic có một field gọi là chapterList chứa id của các chapter
    const comic = await ComicsModel.aggregate([
      {
        $lookup: {
          // tên table comicChapter
          from: "comicChapters",
          // tên field của chapterList trong table comic
          localField: "chapterList",
          // khóa ngoại ở table comicChapter chính là _id
          foreignField: "_id",
          // alias cho table join mới
          as: "detailChapterList",
        },
      },
    ]);

    if (!comic) {
      throw createHttpError(404, "comic not found");
    }
    res.status(200).json(comic);
  } catch (error) {
    next(error);
  }
};

export const getDetailComicById: RequestHandler = async (req, res, next) => {
  const url = req.url;
  const [, params] = url.split("?");
  const parsedParams = qs.parse(params);
  const comicId: string =
    typeof parsedParams.comicId === "string" ? parsedParams.comicId : "0";
  try {
    if (!mongoose.isValidObjectId(comicId)) {
      throw createHttpError(400, "Invalid comic id");
    }
    // Mỗi một comic có một field gọi là chapterList chứa id của các chapter
    const comic = await ComicsModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(comicId) },
      },
      {
        $lookup: {
          from: "comicchapters",
          localField: "chapterList",
          foreignField: "_id",
          pipeline: [
            {
              $addFields: {
                likeCount: { $size: "$likes" },
              },
            },
          ],
          as: "detailChapterList",
        },
      },
      {
        $lookup: {
          from: "genres",
          localField: "genres",
          foreignField: "_id",
          as: "genreNames",
        },
      },
      {
        $addFields: {
          totalViews: {
            $sum: "$detailChapterList.views",
          },
        },
      },
      {
        $addFields: {
          totalLikes: {
            $sum: "$detailChapterList.likeCount",
          },
        },
      },
    ]);

    if (!comic) {
      throw createHttpError(404, "comic not found");
    }
    res.status(200).json(comic);
  } catch (error) {
    next(error);
  }
};

export const getComicChapter: RequestHandler = async (req, res, next) => {
  const url = req.url;
  const [, params] = url.split("?");
  const parsedParams = qs.parse(params);
  const chapterId: string =
    typeof parsedParams.chapterId === "string" ? parsedParams.chapterId : "0";
  try {
    if (!mongoose.isValidObjectId(chapterId)) {
      throw createHttpError(400, "Invalid comic id");
    }
    // Mỗi một comic có một field gọi là chapterList chứa id của các chapter
    const chapter = await ComicChapterModel.findById(chapterId);
    if (!chapter) {
      throw createHttpError(404, "comic not found");
    }
    res.status(200).json(chapter);
  } catch (error) {
    next(error);
  }
};

export const updateUserSaveChapter: RequestHandler = async (req, res, next) => {
  try {
    const { chapterId, userId } = req.body;
    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }
    var checkSave = user.bookmarkList!["comic"].filter(
      (item) => item.toString() === chapterId
    );
    if (checkSave.length === 0) {
      user.bookmarkList!["comic"].push(new mongoose.Types.ObjectId(chapterId));
    } else {
      user.bookmarkList!["comic"] = user.bookmarkList!["comic"].filter(
        (item) => item.toString() !== chapterId
      );
    }
    await user?.save();
    return res.status(200).json(user).end();
  } catch (error) {
    next(error);
  }
};

// Define the searchComics controller function
export const searchComics: RequestHandler = async (req, res, next) => {
  // Extract the search term from the query string
  const { query } = req.query;

  try {
    // Construct the MongoDB query object to search across multiple fields
    const comics: (typeof Comics)[] = await ComicsModel.find({
      $or: [
        { comicName: { $regex: new RegExp(query as string, "i") } },
        { publisher: { $regex: new RegExp(query as string, "i") } },
        { author: { $regex: new RegExp(query as string, "i") } },
        { artist: { $regex: new RegExp(query as string, "i") } },
      ],
    });

    // Check if any comics were found
    if (!comics.length) {
      throw createHttpError(
        404,
        "No comics found matching the search criteria"
      );
    }

    // Return the search results as a JSON response
    res.status(200).json(comics);
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
};

export const getReadingHistories: RequestHandler = async (req, res, next) => {
  const url = req.url;
  const [, params] = url.split("?");
  const parsedParams = qs.parse(params);
  const page = parseInt(
    typeof parsedParams.page === "string" ? parsedParams.page : "0"
  );
  const limit = parseInt(
    typeof parsedParams.limit === "string" ? parsedParams.limit : "0"
  );
  const userId =
    typeof parsedParams.userId === "string" ? parsedParams.userId : "";
  try {
    if (!mongoose.isValidObjectId(userId)) {
      throw createHttpError(400, "Invalid user id");
    }
    const histories = await UserModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $project: { histories: 1 },
      },
      {
        $lookup: {
          from: "comicchapters",
          localField: "histories.readingComic.chapterId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "comics",
                localField: "_id",
                foreignField: "chapterList",
                pipeline: [
                  {
                    $lookup: {
                      from: "comicchapters",
                      localField: "chapterList",
                      foreignField: "_id",
                      pipeline: [],
                      as: "detailChapterList",
                    },
                  },
                ],
                as: "comicOwner",
              },
            },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          as: "detailHistories",
        },
      },
      {
        $project: {
          histories: 1,
          "detailHistories._id": 1,
          "detailHistories.chapterName": 1,
          "detailHistories.coverImage": 1,
          "detailHistories.comicOwner._id": 1,
          "detailHistories.comicOwner.chapterList": 1,
          "detailHistories.comicOwner.detailChapterList": 1,
        },
      },
    ]);
    res.status(200).json(histories);
  } catch (error) {
    next(error);
  }
};

export const testComment: RequestHandler = async (req, res, next) => {
  try {
    const { chapterId, userId, commentId, content } = req.body;
    var chapter = await ComicChapterModel.findById(chapterId);
    if (!chapter) {
      return res.sendStatus(400);
    }

    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }

    chapter.comments.forEach(async (item, index) => {
      if (item._id.toString() === commentId) {
        item.replies.push({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(userId),
          likes: new mongoose.Types.Array(),
          content: content,
          avatar: user?.avatar,
          userName: user?.username,
        });
        const changed = await ComicChapterModel.findByIdAndUpdate(
          chapterId,
          chapter!
        );
        return res.status(200).json(changed).end();
      }
    });
  } catch (error) {
    next(error);
  }
};

interface NotificationObserver {
  update(message: any): Promise<void>;
}

class NotificationSubject {
  private observers: NotificationObserver[] = [];

  subscribe(observer: NotificationObserver) {
    this.observers.push(observer);
  }

  unsubscribe(observer: NotificationObserver) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  async notify(message: any) {
    for (const observer of this.observers) {
      await observer.update(message);
    }
  }
}

class FirebaseNotificationObserver implements NotificationObserver {
  async update(message: any): Promise<void> {
    try {
      var serviceAccount = require("../../pushnotiflutter-95328-firebase-adminsdk-rdiar-9008d7c00f.json");
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      await admin.messaging().send(message);
    } catch (error) {
      console.error("Firebase notification error:", error);
    }
  }
}

export const sendPushNoti: RequestHandler = async (req, res, next) => {
  try {
    const token =
      "fYxl0HrhQGWk50NtCOKqq6:APA91bHMWUF391_XNFlIlBQcCzPK-1qwofwwZAj0pfE072_3q5ZhbzGOIgmV8i-nk-lOrLHoYPVo6rL7MjFXn0XttdBFwn5-rh3Wad8dfy7xFXfcN5MNRdmaUb0PpOJakDZvqLvdXGAt";

    const message = {
      notification: {
        title: req.body.title,
        body: req.body.body,
      },
      token: token,
    };
    const subject = new NotificationSubject();
    subject.subscribe(new FirebaseNotificationObserver());
    await subject.notify(message);
    res.send("Successfully sent message");
  } catch (error) {
    next(error);
  }
};

export const checkUserHasLikeOrSaveChapter: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const url = req.url;
    const [, params] = url.split("?");
    const parsedParams = qs.parse(params);
    const chapterId =
      typeof parsedParams.chapterId === "string" ? parsedParams.chapterId : "";
    const userId =
      typeof parsedParams.userId === "string" ? parsedParams.userId : "";
    // check like
    var chapter = await ComicChapterModel.findById(chapterId);
    if (!chapter) {
      return res.sendStatus(400);
    }
    var check = chapter.likes.filter((item) => item.toString() === userId);
    // check bookmark
    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }
    var checkSave = user.bookmarkList!["comic"].filter(
      (item) => item.toString() === chapterId
    );
    return res
      .status(200)
      .json({
        like: check.length === 0 ? false : true,
        bookmark: checkSave.length === 0 ? false : true,
      })
      .end();
  } catch (error) {
    next(error);
  }
};
export const updateChapterView: RequestHandler = async (req, res, next) => {
  try {
    const chapterId = req.body.chapterId;
    var chapter = await ComicChapterModel.findById(chapterId);
    if (!chapter) {
      return res.sendStatus(400);
    }
    chapter.views = chapter.views! + 1;
    await chapter?.save();
    return res.status(200).json(chapter).end();
  } catch (error) {
    next(error);
  }
};
export const updateUserLikeChapter: RequestHandler = async (req, res, next) => {
  try {
    const { chapterId, userId } = req.body;
    var chapter = await ComicChapterModel.findById(chapterId);
    if (!chapter) {
      return res.sendStatus(400);
    }
    var check = chapter.likes.filter((item) => item.toString() === userId);
    if (check.length === 0) {
      chapter.likes.push(new mongoose.Types.ObjectId(userId));
    } else {
      chapter.likes = chapter.likes.filter(
        (item) => item.toString() !== userId
      );
    }
    await chapter?.save();
    return res.status(200).json(chapter).end();
  } catch (error) {
    next(error);
  }
};
export const checkUserHistoryHadSeenChapter: RequestHandler = async (
  req,
  res,
  next
) => {
  const url = req.url;
  const [, params] = url.split("?");
  const parsedParams = qs.parse(params);
  const chapterId =
    typeof parsedParams.chapterId === "string" ? parsedParams.chapterId : "";
  const userId =
    typeof parsedParams.userId === "string" ? parsedParams.userId : "";
  try {
    if (!mongoose.isValidObjectId(chapterId)) {
      throw createHttpError(400, "Invalid chapter id");
    }
    const userInfo = await UserModel.findById(userId).select("histories");
    var check = userInfo?.histories?.readingComic.find(
      (item) => item.chapterId.toString() === chapterId
    );
    res.status(200).json(check === undefined ? {} : check);
  } catch (error) {
    next(error);
  }
};
export const updateUserHistoryHadSeenChapter: RequestHandler = async (
  req,
  res,
  next
) => {
  const chapterId = req.body.chapterId;
  const userId = req.body.userId;
  try {
    if (!mongoose.isValidObjectId(userId)) {
      throw createHttpError(400, "Invalid user id");
    }
    const userInfo = await UserModel.findById(userId).select("histories");
    var check = userInfo?.histories?.readingComic.find(
      (item) => item.chapterId.toString() === chapterId
    );
    if (check === undefined) {
      userInfo?.histories?.readingComic.push({
        chapterId: new mongoose.Types.ObjectId(chapterId),
      });
    } else {
      const indexOfItem = userInfo?.histories?.readingComic.indexOf(check);
      if (indexOfItem !== undefined) {
        userInfo?.histories?.readingComic.splice(indexOfItem, 1, {
          chapterId: new mongoose.Types.ObjectId(chapterId),
        });
      }
    }
    await userInfo?.save();
    res.status(200).json(userInfo);
  } catch (error) {
    next(error);
  }
};
export const getComicChapterComments: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const url = req.url;
    const [, params] = url.split("?");
    const parsedParams = qs.parse(params);
    const chapterId =
      typeof parsedParams.chapterId === "string" ? parsedParams.chapterId : "";
    var chapter = await ComicChapterModel.findById(chapterId).select(
      "comments"
    );
    if (!chapter) {
      return res.sendStatus(400);
    }
    return res.status(200).json(chapter.comments).end();
  } catch (error) {
    next(error);
  }
};

export const addRootChapterComments: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { chapterId, userId, content } = req.body;
    
    // Use CommentService for cleaner code
    const { CommentService } = await import('../services/CommentService');
    const commentService = new CommentService();
    
    const result = await commentService.addRootComment(chapterId, userId, content);
    
    if (!result.success) {
      console.log('Chain of Responsibility detected error:', result.error, result.errorCode);
      return res.status(400).json({
        error: result.error,
        errorCode: result.errorCode,
        data: result.data
      });
    }
    
    return res.status(200).json(result.data.chapter);
  } catch (error) {
    console.error('Error in addRootChapterComments:', error);
    next(error);
  }
};

export const addChildChapterComments: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { chapterId, userId, commentId, content } = req.body;
    
    // Use CommentService for cleaner code
    const { CommentService } = await import('../services/CommentService');
    const commentService = new CommentService();
    
    const result = await commentService.addChildComment(chapterId, userId, content, commentId);
    
    if (!result.success) {
      console.log('Chain of Responsibility detected error:', result.error, result.errorCode);
      return res.status(400).json({
        error: result.error,
        errorCode: result.errorCode,
        data: result.data
      });
    }
    
    return res.status(200).json(result.data.chapter);
  } catch (error) {
    console.error('Error in addChildChapterComments:', error);
    next(error);
  }
};
export const checkValidCommentContent: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const url = req.url;
    const [, params] = url.split("?");
    const parsedParams = qs.parse(params);
    const content = typeof parsedParams.content === "string" ? parsedParams.content : "";
    
    // Use CommentService for content validation
    const { CommentService } = await import('../services/CommentService');
    const result = await CommentService.validateContent(content);
    
    // Return true if valid, false if invalid (to maintain API compatibility)
    res.status(200).json(result.success);
  } catch (error) {
    next(error);
  }
};
export const checkUserBanned: RequestHandler = async (req, res, next) => {
  const url = req.url;
  const [, params] = url.split("?");
  const parsedParams = qs.parse(params);
  const userId =
    typeof parsedParams.userId === "string" ? parsedParams.userId : "";
  try {
    var user = await UserModel.findById(userId);
    if (!user) {
      return res.status(400);
    }
    if (
      user.accessCommentDate === null ||
      user.accessCommentDate === undefined
    ) {
      return res.status(200).json("2020");
    }
    const accessDate = user?.accessCommentDate;
    if (
      accessDate !== null &&
      accessDate !== undefined &&
      accessDate <= new Date()
    ) {
      return res.status(200).json("2020");
    }
    res.status(200).json(user?.accessCommentDate).end();
  } catch (error) {
    next(error);
  }
};
export const banUser: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.body;
    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }
    var newAccessDate = new Date();
    newAccessDate.setDate(newAccessDate.getDate() + 3);
    user.accessCommentDate = newAccessDate;
    await user?.save();
    return res.status(200).json(user.accessCommentDate).end();
  } catch (error) {
    next(error);
  }
};
export const updateUserLikeParentComment: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { chapterId, userId, commentId } = req.body;
    var chapter = await ComicChapterModel.findById(chapterId);
    if (!chapter) {
      return res.sendStatus(400);
    }

    chapter.comments.forEach(async (item) => {
      if (item._id.toString() === commentId) {
        const copyList = item.likes.filter(
          (item: mongoose.Types.ObjectId) => item.toString() !== userId
        );
        if (copyList.length === item.likes.length) {
          item.likes.push(new mongoose.Types.ObjectId(userId));
          const changed = await ComicChapterModel.findByIdAndUpdate(
            chapterId,
            chapter!
          );
          return res.status(200).json(changed).end();
        } else {
          item.likes = copyList;
          const changed = await ComicChapterModel.findByIdAndUpdate(
            chapterId,
            chapter!
          );
          return res.status(200).json(changed).end();
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserLikeChildComment: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { chapterId, userId, commentId, commentChildId } = req.body;
    var chapter = await ComicChapterModel.findById(chapterId);
    if (!chapter) {
      return res.sendStatus(400);
    }
    console.log(commentId, commentChildId, userId);
    chapter.comments.forEach((item) => {
      if (item._id.toString() === commentId) {
        item.replies.forEach(async (item: any) => {
          if (item._id.toString() === commentChildId) {
            const copyList = item.likes.filter(
              (item: mongoose.Types.ObjectId) => item.toString() !== userId
            );
            if (copyList.length === item.likes.length) {
              item.likes.push(new mongoose.Types.ObjectId(userId));
              const changed = await ComicChapterModel.findByIdAndUpdate(
                chapterId,
                chapter!
              );
              return res.status(200).json(changed).end();
            } else {
              item.likes = copyList;
              const changed = await ComicChapterModel.findByIdAndUpdate(
                chapterId,
                chapter!
              );
              return res.status(200).json(changed).end();
            }
          }
        });
      }
    });
  } catch (error) {
    next(error);
  }
};
export const updateNotiComment: RequestHandler = async (req, res, next) => {
  try {
    const { userId, chapterId } = req.body;

    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }

    user.notifications.push({
      sourceId: new mongoose.Types.ObjectId(chapterId),
      type: "comment",
      content: "Ai đó đã trả lời bình luận của bạn",
    });

    await user?.save();
    return res.status(200).json(user.accessCommentDate).end();
  } catch (error) {
    next(error);
  }
};

export const searchComicByGenres: RequestHandler = async (req, res, next) => {
  const url = req.url;
  const [, params] = url.split("?");
  const parsedParams = qs.parse(params);
  const genreId =
    typeof parsedParams.genreId === "string" ? parsedParams.genreId : "";
  try {
    if (!mongoose.isValidObjectId(genreId)) {
      throw createHttpError(400, "Invalid user id");
    }
    const animes = await ComicsModel.find({
      genres: new mongoose.Types.ObjectId(genreId),
    });
    res.status(200).json(animes);
  } catch (error) {
    next(error);
  }
};

// Helper function to get storage provider
const getStorageProvider = () => {
    return StorageProviderFactory.getProvider();
};

// Example of using storage in a controller method
export const uploadComicImage: RequestHandler = async (req: FileRequest, res, next) => {
    try {
        const { file, filename, contentType } = req.body;
        if (!file) {
            throw createHttpError(400, "No file uploaded");
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(file.split(',')[1], 'base64');

        const storage = getStorageProvider();
        const result = await storage.uploadFile(buffer, {
            path: 'comics',
            filename: filename || `${Date.now()}-upload.${contentType.split('/')[1]}`,
            contentType
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteComicImage: RequestHandler = async (req, res, next) => {
    try {
        const { path } = req.body;
        if (!path) {
            throw createHttpError(400, "File path is required");
        }

        const storage = getStorageProvider();
        const success = await storage.deleteFile(path);

        if (!success) {
            throw createHttpError(404, "File not found or could not be deleted");
        }

        res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        next(error);
    }
};
