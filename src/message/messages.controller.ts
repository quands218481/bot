import { Controller, Get } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('message')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getAll() {
    return this.messagesService.getAll();
  }

  @Get('/delete')
  async deleteAll() {
    return this.messagesService.delete();
  }
}
