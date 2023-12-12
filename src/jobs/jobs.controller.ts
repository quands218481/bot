import { Controller, Get } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('job')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async getAll() {
    return this.jobsService.getAll();
  }

  @Get('/delete')
  async deleteAll() {
    return this.jobsService.delete();
  }
}
