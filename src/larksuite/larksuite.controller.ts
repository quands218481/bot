import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';

@Controller('')
export class LarkSuiteController {
  constructor(private readonly larkService: LarkSuiteService) {}

  @Get()
  async get() {
    console.log('automation -------------------')
    return this.larkService.create()
    // return this.larkService.getAppInfo();
  }

  @Post()
  async create(@Body() body, @Param()param){
    console.log(body)
    console.log('automation flow')
    console.log(param)
    return this.larkService.create()
  }

//   @Get('/delete')
//   async deleteAll() {
//     return this.usersService.delete();
//   }
}