import { MessageType } from '../types/message-type';

export class CreateMessageDto {
  readonly chatId: string;
  readonly messageId: string;
  readonly telegramId: string;
  readonly params: string;
  readonly type: MessageType;

  constructor(
    chatId: string,
    messageId: string,
    telegramId: string,
    params: string,
    type: MessageType,
  ) {
    this.chatId = chatId;
    this.messageId = messageId;
    this.telegramId = telegramId;
    this.params = params;
    this.type = type;
  }
}
