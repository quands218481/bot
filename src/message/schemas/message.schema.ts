import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessageType } from '../types/message-type';

export type MessageDocument = HydratedDocument<Message>;

@Schema()
export class Message {
  _id: Types.ObjectId;

  @Prop()
  chatId: string;

  @Prop()
  messageId: string;

  @Prop()
  telegramId: string;

  @Prop()
  params: string;

  @Prop()
  type: MessageType;

  @Prop()
  timestamp: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
