import mongoose from "mongoose";
import { BaseQuestCommand } from "./command";
import UserModel from "../user";
import DailyQuestModel from "../dailyQuest";

// Command để cập nhật thời gian đọc
export class UpdateReadingTimeCommand extends BaseQuestCommand {
  constructor(
    userId: string,
    private readingTime: number
  ) {
    super(userId);
  }

  async execute(): Promise<any> {
    const user = await this.getUser();

    // Khởi tạo questLog nếu chưa có
    if (!user.questLog) {
      user.questLog = {};
    }

    const currentTime = user.questLog.readingTime || 0;

    user.questLog.readingTime = currentTime + this.readingTime;
    user.questLog.finalTime = new Date();

    await user.save();
    return user;
  }

  async undo(): Promise<any> {
    const user = await this.getUser();

    // Khởi tạo questLog nếu chưa có
    if (!user.questLog) {
      user.questLog = {};
    }

    const currentTime = user.questLog.readingTime || 0;

    user.questLog.readingTime = Math.max(0, currentTime - this.readingTime);
    user.questLog.finalTime = new Date();

    await user.save();
    return user;
  }
}

// Command để cập nhật thời gian xem
export class UpdateWatchingTimeCommand extends BaseQuestCommand {
  constructor(
    userId: string,
    private watchingTime: number
  ) {
    super(userId);
  }

  async execute(): Promise<any> {
    const user = await this.getUser();

    // Khởi tạo questLog nếu chưa có
    if (!user.questLog) {
      user.questLog = {};
    }

    const currentTime = user.questLog.watchingTime || 0;

    user.questLog.watchingTime = currentTime + this.watchingTime;
    user.questLog.finalTime = new Date();

    await user.save();
    return user;
  }

  async undo(): Promise<any> {
    const user = await this.getUser();

    // Khởi tạo questLog nếu chưa có
    if (!user.questLog) {
      user.questLog = {};
    }

    const currentTime = user.questLog.watchingTime || 0;

    user.questLog.watchingTime = Math.max(0, currentTime - this.watchingTime);
    user.questLog.finalTime = new Date();

    await user.save();
    return user;
  }
}

// Command để nhận phần thưởng nhiệm vụ
export class ClaimQuestRewardCommand extends BaseQuestCommand {
  private previousState: any = null;

  constructor(
    userId: string,
    private questId: string
  ) {
    super(userId);
  }

  async execute(): Promise<any> {
    const user = await this.getUser();
    const quest = await DailyQuestModel.findById(this.questId);

    if (!quest) {
      throw new Error(`Quest with ID ${this.questId} not found`);
    }

    // Khởi tạo questLog nếu chưa có
    if (!user.questLog) {
      user.questLog = {};
    }

    // Khởi tạo mảng received nếu chưa có
    if (!user.questLog.received) {
      user.questLog.received = [];
    }

    // Lưu trạng thái trước khi thay đổi để hỗ trợ undo
    this.previousState = {
      coinPoint: user.coinPoint || 0,
      receivedQuests: [...(user.questLog.received || [])]
    };

    // Kiểm tra xem nhiệm vụ đã được nhận chưa
    const alreadyClaimed = user.questLog.received.some(
      (id: any) => id.toString() === this.questId
    );

    if (alreadyClaimed) {
      throw new Error("Quest reward already claimed");
    }

    // Thêm quest vào danh sách đã nhận
    user.questLog.received.push(new mongoose.Types.ObjectId(this.questId));

    // Cộng điểm thưởng
    const rewardPoints = quest.prize || 0;
    user.coinPoint = (user.coinPoint || 0) + rewardPoints;

    // Cập nhật thời gian
    user.questLog.finalTime = new Date();

    await user.save();
    return user;
  }

  async undo(): Promise<any> {
    // Chỉ undo nếu đã lưu trạng thái trước đó
    if (!this.previousState) {
      throw new Error("Cannot undo: previous state not saved");
    }

    const user = await this.getUser();

    // Khôi phục điểm
    user.coinPoint = this.previousState.coinPoint;

    // Khôi phục danh sách nhiệm vụ đã nhận
    user.questLog.received = this.previousState.receivedQuests;

    // Cập nhật thời gian
    user.questLog.finalTime = new Date();

    await user.save();
    return user;
  }
}

// Command để nhận quà hàng ngày
export class ClaimDailyGiftCommand extends BaseQuestCommand {
  private previousState: any = null;

  constructor(
    userId: string,
    private giftAmount: number = 10 // Số điểm mặc định
  ) {
    super(userId);
  }

  async execute(): Promise<any> {
    const user = await this.getUser();

    // Khởi tạo questLog nếu chưa có
    if (!user.questLog) {
      user.questLog = {};
    }

    // Lưu trạng thái trước khi thay đổi
    this.previousState = {
      coinPoint: user.coinPoint || 0,
      hasReceivedDailyGift: user.questLog.hasReceivedDailyGift || false
    };

    // Kiểm tra xem đã nhận quà hôm nay chưa
    if (user.questLog.hasReceivedDailyGift) {
      throw new Error("Daily gift already claimed today");
    }

    // Cộng điểm thưởng
    user.coinPoint = (user.coinPoint || 0) + this.giftAmount;

    // Đánh dấu đã nhận quà
    user.questLog.hasReceivedDailyGift = true;

    // Cập nhật thời gian
    user.questLog.finalTime = new Date();

    await user.save();
    return user;
  }

  async undo(): Promise<any> {
    if (!this.previousState) {
      throw new Error("Cannot undo: previous state not saved");
    }

    const user = await this.getUser();

    // Khôi phục điểm
    user.coinPoint = this.previousState.coinPoint;

    // Khôi phục trạng thái nhận quà
    user.questLog.hasReceivedDailyGift = this.previousState.hasReceivedDailyGift;

    // Cập nhật thời gian
    user.questLog.finalTime = new Date();

    await user.save();
    return user;
  }
}

// Command phức hợp - kết hợp nhiều command
export class CompleteQuestAndClaimRewardCommand extends BaseQuestCommand {
  private commands: BaseQuestCommand[] = [];

  constructor(
    userId: string,
    private questId: string,
    private readingTime: number = 0,
    private watchingTime: number = 0
  ) {
    super(userId);

    // Tạo các command con
    if (this.readingTime > 0) {
      this.commands.push(new UpdateReadingTimeCommand(userId, this.readingTime));
    }

    if (this.watchingTime > 0) {
      this.commands.push(new UpdateWatchingTimeCommand(userId, this.watchingTime));
    }

    this.commands.push(new ClaimQuestRewardCommand(userId, this.questId));
  }

  async execute(): Promise<any> {
    let result = null;

    // Thực thi tuần tự các command
    for (const command of this.commands) {
      result = await command.execute();
    }

    return result;
  }

  async undo(): Promise<any> {
    let result = null;

    // Undo theo thứ tự ngược lại
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const command = this.commands[i];
      if (command.undo) {
        result = await command.undo();
      }
    }

    return result;
  }
}