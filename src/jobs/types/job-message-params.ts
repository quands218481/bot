export class JobMessageParams {
  messageId: string;
  chatId: string;
  replyId: string;
  replyChatId: string;

  constructor(
    chatId: string,
    messageId: string,
    replyChatId: string,
    replyId: string,
  ) {
    this.messageId = messageId;
    this.chatId = chatId;
    this.replyId = replyId;
    this.replyChatId = replyChatId;
  }

  toJSON(): string {
    return JSON.stringify({
      messageId: this.messageId,
      chatId: this.chatId,
      replyChatId: this.replyChatId,
      replyId: this.replyId,
    });
  }

  static fromJSON(json: string) {
    const { messageId, chatId, replyId, replyChatId } = JSON.parse(json);
    return new JobMessageParams(chatId, messageId, replyChatId, replyId);
  }
}
