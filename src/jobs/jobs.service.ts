import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from './schemas/job.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name)
    private readonly jobModel: Model<Job>,
  ) {}

  async create(createJob: CreateJobDto): Promise<Job> {
    if (!createJob.telegramId) throw 'Telegram is invalid.';
    // const existingJob = await this.getLastJob(createJob.telegramId);
    // if (
    //   existingJob &&
    //   existingJob.action == createJob.action &&
    //   existingJob.status == createJob.status &&
    //   existingJob.params == existingJob.params
    // ) {
    //   return existingJob;
    // }
    const timestamp = new Date().getTime();
    const job = await this.jobModel.create({
      telegramId: createJob.telegramId,
      action: createJob.action,
      status: createJob.status,
      params: createJob.params,
      timestamp,
    });
    return job;
  }

  async updateStatus(updateStatus: UpdateJobStatusDto): Promise<boolean> {
    const existingJob = await this.jobModel.findOne({
      telegramId: updateStatus.telegramId,
      _id: updateStatus.jobId,
    });
    if (!existingJob) throw 'Job not found.';
    const job = await this.jobModel
      .updateOne(
        {
          telegramId: updateStatus.telegramId,
          _id: updateStatus.jobId,
        },
        {
          status: updateStatus.status,
        },
      )
      .exec();

    return job.modifiedCount > 0;
  }

  async getLastJob(telegramId: string): Promise<Job> {
    return this.jobModel.findOne({ telegramId }).sort({ timestamp: -1 }).exec();
  }

  async delete() {
    return this.jobModel.deleteMany({});
  }

  async getAll() {
    return this.jobModel.find({});
  }
}
