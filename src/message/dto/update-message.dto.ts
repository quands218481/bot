import { MessageType } from '../types/message-type';

export class UpdateMessageDto {
  readonly chatId: string;
  readonly messageId: string;
  readonly params: string;
  readonly type: MessageType;

  constructor(
    chatId: string,
    messageId: string,
    params: string,
    type: MessageType,
  ) {
    this.chatId = chatId;
    this.messageId = messageId;
    this.params = params;
    this.type = type;
  }
}
