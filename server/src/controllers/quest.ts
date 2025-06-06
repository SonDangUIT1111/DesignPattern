import { RequestHandler } from "express";
import UserModel from "../models/user";
import DailyQuestModel from "../models/dailyQuest";
import { QuestCommandInvoker } from "../models/quest/command";
import {
  UpdateReadingTimeCommand,
  UpdateWatchingTimeCommand,
  ClaimDailyGiftCommand,
  CompleteQuestAndClaimRewardCommand
} from "../models/quest/questCommands";

// Invoker toàn cục để theo dõi lịch sử command
const questInvoker = new QuestCommandInvoker();

// Cập nhật thời gian đọc/xem và nhận nhiệm vụ
export const updateQuestProgress: RequestHandler = async (req, res, next) => {
  try {
    const { userId, readingTime, watchingTime, received } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Tạo command phù hợp dựa trên dữ liệu đầu vào
    let command;

    if (received) {
      // Nếu có ID nhiệm vụ, sử dụng command phức hợp
      command = new CompleteQuestAndClaimRewardCommand(
        userId,
        received,
        readingTime || 0,
        watchingTime || 0
      );
    } else if (readingTime && watchingTime) {
      // Nếu có cả thời gian đọc và xem, sử dụng command phức hợp tự tạo
      const commands = [];
      if (readingTime > 0) {
        commands.push(new UpdateReadingTimeCommand(userId, readingTime));
      }
      if (watchingTime > 0) {
        commands.push(new UpdateWatchingTimeCommand(userId, watchingTime));
      }

      // Thực thi tuần tự các command
      let result;
      for (const cmd of commands) {
        result = await questInvoker.executeCommand(cmd);
      }
      return res.status(200).json(result);
    } else if (readingTime) {
      // Chỉ cập nhật thời gian đọc
      command = new UpdateReadingTimeCommand(userId, readingTime);
    } else if (watchingTime) {
      // Chỉ cập nhật thời gian xem
      command = new UpdateWatchingTimeCommand(userId, watchingTime);
    } else {
      return res.status(400).json({ message: "No valid quest data provided" });
    }

    // Thực thi command
    const result = await questInvoker.executeCommand(command);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Nhận quà hàng ngày
export const claimDailyGift: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const command = new ClaimDailyGiftCommand(userId);

    try {
      const result = await questInvoker.executeCommand(command);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "Daily gift already claimed today") {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Hoàn tác hành động cuối cùng (chỉ dành cho admin hoặc debug)
export const undoLastQuestAction: RequestHandler = async (_req, res, next) => {
  try {
    // Kiểm tra quyền admin (tùy chọn)
    // if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized" });

    try {
      const result = await questInvoker.undoLastCommand();
      res.status(200).json({
        message: "Last action undone successfully",
        result
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách nhiệm vụ hàng ngày
export const getDailyQuests: RequestHandler = async (_req, res, next) => {
  try {
    const quests = await DailyQuestModel.find();
    res.status(200).json(quests);
  } catch (error) {
    next(error);
  }
};

// Cập nhật quest log (alias cho updateQuestProgress)
export const updateQuestLog: RequestHandler = async (req, res, next) => {
  return updateQuestProgress(req, res, next);
};

// Cập nhật login log
export const updateLoginLog: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Tìm user và cập nhật thông tin đăng nhập
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Khởi tạo questLog nếu chưa có
    if (!user.questLog) {
      user.questLog = {};
    }

    // Cập nhật thời gian đăng nhập cuối cùng
    user.questLog.lastLoginTime = new Date();

    // Reset daily gift status nếu là ngày mới
    const today = new Date();
    const lastLogin = user.questLog.lastLoginTime ? new Date(user.questLog.lastLoginTime) : null;

    if (!lastLogin ||
        today.getDate() !== lastLogin.getDate() ||
        today.getMonth() !== lastLogin.getMonth() ||
        today.getFullYear() !== lastLogin.getFullYear()) {
      user.questLog.hasReceivedDailyGift = false;
    }

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
