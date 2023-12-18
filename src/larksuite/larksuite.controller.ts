import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';

@Controller('')
export class LarkSuiteController {
  constructor(private readonly larkService: LarkSuiteService) { }

  // @Get()
  // async get() {
  //   console.log('automation -------------------')
  //   return this.larkService.createRecord()
  // return this.larkService.getAppInfo();
  // }

  @Post()
  async create(@Body() body) {
    try {
      if (body && body.record_id) {
        return this.larkService.createNewRecord(body.record_id)
      } else {
        throw ('Can not get record_id!!')
      }
    } catch (error) {
      throw error
    }
  }

  @Put()
  async update(@Body() body) {
    try {
      if (body && body.record_id) {
        return this.larkService.updateRecord(body.record_id)
      } else {
        throw ('Can not get record_id!!')
      }
    } catch (error) {
      throw error
    }
  }
  //   @Get('/delete')
  //   async deleteAll() {
  //     return this.usersService.delete();
  //   }
}