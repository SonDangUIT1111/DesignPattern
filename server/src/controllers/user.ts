import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import * as admin from "firebase-admin";
import AvatarModel from "../models/avatars";
import UserModel from "../models/user";
import qs from "qs";
import ComicChapterModel from "../models/comicChapter";
import PaymentHistoryModel from "../models/paymentHistories";
import ComicsModel from "../models/comics";
import AnimeModel from "../models/anime";

// api get
export const getAvatarList: RequestHandler = async (req, res, next) => {
  try {
    const list = await AvatarModel.find().exec();
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

export const updateAvatar: RequestHandler = async (req, res, next) => {
  try {
    const { userId, avatarUrl } = req.body;
    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }
    user.avatar = avatarUrl;
    await user?.save();
    return res.status(200).json(user).end();
  } catch (error) {
    next(error);
  }
};
export const updateUsername: RequestHandler = async (req, res, next) => {
  try {
    const { userId, username } = req.body;
    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }
    user.username = username;
    await user?.save();
    return res.status(200).json(user).end();
  } catch (error) {
    next(error);
  }
};

export const getNotification: RequestHandler = async (req, res, next) => {
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

    res.status(200).json(user?.notifications).end();
  } catch (error) {
    next(error);
  }
};

export const storeDeviceToken: RequestHandler = async (req, res, next) => {
  try {
    const { userId, token } = req.body;
    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }
    user.deviceToken = token;
    await user?.save();
    return res.status(200).json(user).end();
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

class UserNotificationObserver implements NotificationObserver {
  async update(message: any): Promise<void> {
    const { userId, sourceId, type, content } = message;
    var user = await UserModel.findById(userId);
    if (!user) return;
    user.notifications.push({
      sourceId: sourceId,
      type: type,
      content: content,
      status: "sent",
      sentTime: new Date(),
    });
    await user.save();
  }
}

export const addCommentNotification: RequestHandler = async (req, res, next) => {
  try {
    const { userId, sourceId, type, content } = req.body;
    const subject = new NotificationSubject();
    subject.subscribe(new UserNotificationObserver());
    await subject.notify({ userId, sourceId, type, content });
    var user = await UserModel.findById(userId);
    return res.status(200).json(user).end();
  } catch (error) {
    next(error);
  }
};

export const sendPushNoti: RequestHandler = async (req, res, next) => {
  try {
    var user = await UserModel.findById(req.body.userId);
    if (!user) {
      return res.sendStatus(400);
    }
    const message = {
      notification: {
        title: req.body.title,
        body: req.body.body,
      },
      token: user.deviceToken!,
    };
    const subject = new NotificationSubject();
    subject.subscribe(new FirebaseNotificationObserver());
    await subject.notify(message);
    res.send("Successfully sent message");
  } catch (error) {
    next(error);
  }
};

export const readNotification: RequestHandler = async (req, res, next) => {
  try {
    const { userId, index } = req.body;
    var user = await UserModel.findById(userId);
    console.log(user);
    if (!user) {
      return res.sendStatus(400);
    }

    user.notifications[index].status = "seen";
    const changed = await UserModel.findByIdAndUpdate(userId, user);
    console.log(user.notifications);
    return res.status(200).json(changed).end();
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistories: RequestHandler = async (req, res, next) => {
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

    res.status(200).json(user?.paymentHistories).end();
  } catch (error) {
    next(error);
  }
};

export const paySkycoin: RequestHandler = async (req, res, next) => {
  try {
    const { userId, coin, chapterId } = req.body;
    if (!mongoose.isValidObjectId(chapterId)) {
      throw createHttpError(400, "Invalid chapter id");
    }
    if (!mongoose.isValidObjectId(userId)) {
      throw createHttpError(400, "Invalid user id");
    }
    var user = await UserModel.findById(userId);
    const chapter = await ComicChapterModel.findById(chapterId);
    if (!chapter) {
      throw createHttpError(404, "chapter not found");
    }
    if (!user) {
      throw createHttpError(404, "user not found");
    }
    if ((user.coinPoint || 0) < (chapter.unlockPrice || 1)) {
      throw createHttpError(404, "Skycoin not enough for payment");
    }
    if (user.coinPoint != undefined) {
      user.coinPoint -= chapter.unlockPrice || 0;
    }
    user.paymentHistories.push(new mongoose.Types.ObjectId(chapterId));
    await user?.save();

    const newPaymentHistory = await PaymentHistoryModel.create({
      userId: userId,
      orderDate: new Date(),
      paymentMethod: "BuyComicChapter",
      status: "completed",
      price: coin,
      packageId: chapterId,
    });
    console.log(newPaymentHistory);
    return res.status(200).json(user.coinPoint).end();
  } catch (error) {
    next(error);
  }
};

export const uploadUsername: RequestHandler = async (req, res, next) => {
  try {
    const { userId, username } = req.body;
    var user = await UserModel.findById(userId);
    if (!user) {
      return res.sendStatus(400);
    }
    user.username = username;
    await user?.save();
    return res.status(200).json(user).end();
  } catch (error) {
    next(error);
  }
};

export const getBookmarkList: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.query;

    // Find the user by userId
    // const user = await UserModel.findById(userId);
    // if (!user) {
    //   return res.sendStatus(400);
    // }

    // // Check if bookmarkList exists in user document
    // if (!user.bookmarkList) {
    //   return res.status(200).json({ comics: [], animes: [] });
    // }

    // // Get bookmarked comics
    // const comicsIds = user.bookmarkList.comic || [];
    // const comics = await ComicsModel.find({ _id: { $in: comicsIds } });

    // // Get bookmarked animes
    // const animesIds = user.bookmarkList.movies || [];
    // const animes = await AnimeModel.find({ _id: { $in: animesIds } });

    // return res.status(200).json({ comics, animes });

    const user = await UserModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId?.toString()) },
      },
      {
        $lookup: {
          from: "comicchapters",
          localField: "bookmarkList.comic",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "comics",
                let: { chapterId: "$_id" },
                localField: "_id",
                foreignField: "chapterList",
                pipeline: [
                  {
                    $addFields: {
                      index: {
                        $indexOfArray: [
                          "$chapterList",
                          { $toObjectId: "$$chapterId" },
                        ],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: "genres",
                      localField: "genres",
                      foreignField: "_id",
                      pipeline: [],
                      as: "genreNames",
                    },
                  },
                  {
                    $lookup: {
                      from: "comicchapters",
                      localField: "chapterList",
                      foreignField: "_id",
                      as: "chapterListDetail",
                    },
                  },
                ],
                as: "owner",
              },
            },
          ],
          as: "comics",
        },
      },
      {
        $lookup: {
          from: "animeepisodes",
          localField: "bookmarkList.movies",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "animes",
                localField: "_id",
                foreignField: "episodes",
                pipeline: [
                  {
                    $lookup: {
                      from: "genres",
                      localField: "genres",
                      foreignField: "_id",
                      pipeline: [],
                      as: "genreNames",
                    },
                  },
                ],
                as: "owner",
              },
            },
          ],
          as: "animes",
        },
      },
      {
        $project: {
          comics: 1,
          animes: 1,
        },
      },
    ]);
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const removeBookmark: RequestHandler = async (req, res, next) => {
  try {
    const { userId, bookmarksToRemove } = req.body;

    // Check if userId and bookmarksToRemove are provided
    if (!userId || !bookmarksToRemove || !Array.isArray(bookmarksToRemove)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // Find the user by userId
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Assert that bookmarkList exists
    const bookmarkList = user.bookmarkList!;

    // Remove each bookmark from the user's bookmark list
    bookmarksToRemove.forEach((bookmarkId: string) => {
      const comicIndex = bookmarkList.comic.indexOf(bookmarkId);
      if (comicIndex !== -1) {
        bookmarkList.comic.splice(comicIndex, 1);
      }
      const movieIndex = bookmarkList.movies.indexOf(bookmarkId);
      if (movieIndex !== -1) {
        bookmarkList.movies.splice(movieIndex, 1);
      }
    });

    // Save the updated user
    await user.save();

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
