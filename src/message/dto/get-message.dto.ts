export class GetMessageDto {
  readonly chatId: string;
  readonly messageId: string;

  constructor(chatId: string, messageId: string) {
    this.chatId = chatId;
    this.messageId = messageId;
  }
}
