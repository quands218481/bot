export class JobChangePasswordParams {
  newPassword: string;
  replyId: string;
  replyChatId: string;

  constructor(newPassword: string, replyChatId: string, replyId: string) {
    this.newPassword = newPassword;
    this.replyId = replyId;
    this.replyChatId = replyChatId;
  }

  toJSON(): string {
    return JSON.stringify({
      newPassword: this.newPassword,
      replyChatId: this.replyChatId,
      replyId: this.replyId,
    });
  }

  static fromJSON(json: string) {
    const { newPassword, replyId, replyChatId } = JSON.parse(json);
    return new JobChangePasswordParams(newPassword, replyChatId, replyId);
  }
}
