export class JobPrivateKeyImportParams {
  replyId: string;
  replyChatId: string;
  privateKey: string;

  constructor(privateKey: string, replyChatId: string, replyId: string) {
    this.replyId = replyId;
    this.replyChatId = replyChatId;
    this.privateKey = privateKey;
  }

  toJSON(): string {
    return JSON.stringify({
      replyChatId: this.replyChatId,
      replyId: this.replyId,
      privateKey: this.privateKey,
    });
  }

  static fromJSON(json: string) {
    const { privateKey, replyId, replyChatId } = JSON.parse(json);
    return new JobPrivateKeyImportParams(privateKey, replyChatId, replyId);
  }
}
