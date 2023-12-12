import { MessageType } from '../types/message-type';

export class GetLastMessageDto {
  readonly type: MessageType;
  readonly telegramId: string;

  constructor(telegramId: string, type: MessageType) {
    this.telegramId = telegramId;
    this.type = type;
  }
}
