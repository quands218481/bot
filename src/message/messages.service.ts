import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { GetMessageDto } from './dto/get-message.dto';
import { GetLastMessageDto } from './dto/get-last-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
  ) {}

  async create(createMessage: CreateMessageDto): Promise<Message> {
    const existingMessage = await this.messageModel.findOne({
      messageId: createMessage.messageId,
      chatId: createMessage.chatId,
    });
    if (existingMessage) throw 'Message existed';
    const timestamp = new Date().getTime();
    const newMessage = await this.messageModel.create({
      chatId: createMessage.chatId,
      messageId: createMessage.messageId,
      telegramId: createMessage.telegramId,
      params: createMessage.params,
      type: createMessage.type,
      timestamp,
    });
    return newMessage;
  }

  async update(updateMessage: UpdateMessageDto): Promise<boolean> {
    const existingMessage = await this.messageModel.findOne({
      messageId: updateMessage.messageId,
      chatId: updateMessage.chatId,
    });
    if (!existingMessage) throw 'Message not found';
    const timestamp = new Date().getTime();
    const updatedMessage = await this.messageModel
      .updateOne(
        {
          messageId: updateMessage.messageId,
          chatId: updateMessage.chatId,
        },
        {
          params: updateMessage.params,
          type: updateMessage.type,
          timestamp,
        },
      )
      .exec();
    return updatedMessage.modifiedCount > 0;
  }

  async get(getMessage: GetMessageDto): Promise<Message> {
    const existingMessage = await this.messageModel.findOne({
      messageId: getMessage.messageId,
      chatId: getMessage.chatId,
    });
    if (!existingMessage) throw 'Message not found';
    return existingMessage;
  }

  async getLast(getMessage: GetLastMessageDto): Promise<Message> {
    const existingMessage = await this.messageModel.findOne(
      {
        telegramId: getMessage.telegramId,
        type: getMessage.type,
      },
      {},
      { sort: { timestamp: -1 } },
    );
    if (!existingMessage) throw 'Message not found';
    return existingMessage;
  }

  async delete() {
    return this.messageModel.deleteMany({});
  }

  async getAll() {
    return this.messageModel.find({});
  }
}
