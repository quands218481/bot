import { Controller, Get, Post } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';

@Controller('lark')
export class LarkSuiteController {
  constructor(private readonly larkService: LarkSuiteService) {}

  @Get()
  async get() {
    console.log('automation ')
    return this.larkService.create()
    // return this.larkService.getAppInfo();
  }

  @Post()
  async create(){
    console.log('automation flow')
    return this.larkService.create()
  }

//   @Get('/delete')
//   async deleteAll() {
//     return this.usersService.delete();
//   }
}