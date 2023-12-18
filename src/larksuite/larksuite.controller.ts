import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';

@Controller('')
export class LarkSuiteController {
  constructor(private readonly larkService: LarkSuiteService) {}

  // @Get()
  // async get() {
  //   console.log('automation -------------------')
  //   return this.larkService.createRecord()
    // return this.larkService.getAppInfo();
  // }

  @Post()
  async create(@Body() body, @Param()param){
    console.log(body)
    return this.larkService.createRecord(body['record_id'])
  }

//   @Get('/delete')
//   async deleteAll() {
//     return this.usersService.delete();
//   }
}