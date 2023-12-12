import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { JobAction } from '../types/job-action';
import { JobStatus } from '../types/job-status';

export type UserDocument = HydratedDocument<Job>;

@Schema()
export class Job {
  _id: Types.ObjectId;

  @Prop()
  telegramId: string;

  @Prop()
  action: JobAction;

  @Prop()
  params: string;

  @Prop()
  timestamp: number;

  @Prop()
  status: JobStatus;
}

export const JobSchema = SchemaFactory.createForClass(Job);
