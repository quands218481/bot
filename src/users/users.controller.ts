import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAll() {
    return this.usersService.getAll();
  }

  @Get('/delete')
  async deleteAll() {
    return this.usersService.delete();
  }
}
