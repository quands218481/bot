export class JobPrivateKeyReplaceParams {
  walletIndex: number;
  replyId: string;
  replyChatId: string;
  privateKey: string;

  constructor(
    walletIndex: number,
    privateKey: string,
    replyChatId: string,
    replyId: string,
  ) {
    this.walletIndex = walletIndex;
    this.replyId = replyId;
    this.replyChatId = replyChatId;
    this.privateKey = privateKey;
  }

  toJSON(): string {
    return JSON.stringify({
      walletIndex: this.walletIndex,
      replyChatId: this.replyChatId,
      replyId: this.replyId,
      privateKey: this.privateKey,
    });
  }

  static fromJSON(json: string) {
    const { privateKey, walletIndex, replyId, replyChatId } = JSON.parse(json);
    return new JobPrivateKeyReplaceParams(
      walletIndex,
      privateKey,
      replyChatId,
      replyId,
    );
  }
}
