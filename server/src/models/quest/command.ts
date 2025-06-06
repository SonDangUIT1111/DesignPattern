import UserModel from "../user";

// Interface cơ bản cho Command
export interface QuestCommand {
  execute(): Promise<any>;
  undo?(): Promise<any>;
}

// Lớp cơ sở cho các Quest Command
export abstract class BaseQuestCommand implements QuestCommand {
  constructor(protected userId: string) {}

  abstract execute(): Promise<any>;
  undo?(): Promise<any> {
    throw new Error("Undo operation not implemented for this command");
  }

  // Phương thức tiện ích để lấy thông tin người dùng
  protected async getUser() {
    const user = await UserModel.findById(this.userId);
    if (!user) {
      throw new Error(`User with ID ${this.userId} not found`);
    }
    return user;
  }
}

// Invoker - Người gọi lệnh
export class QuestCommandInvoker {
  private commandHistory: QuestCommand[] = [];

  async executeCommand(command: QuestCommand): Promise<any> {
    this.commandHistory.push(command);
    return await command.execute();
  }

  async undoLastCommand(): Promise<any> {
    const command = this.commandHistory.pop();
    if (command && command.undo) {
      return await command.undo();
    }
    throw new Error("No command to undo or command does not support undo");
  }

  getCommandHistory(): QuestCommand[] {
    return [...this.commandHistory];
  }
}