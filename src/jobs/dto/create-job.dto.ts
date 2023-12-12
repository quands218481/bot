import { JobAction } from '../types/job-action';
import { JobStatus } from '../types/job-status';

export class CreateJobDto {
  readonly telegramId: string;
  readonly action: JobAction;
  readonly status: JobStatus;
  readonly params: string;

  constructor(
    telegramId: string,
    action: JobAction,
    status: JobStatus,
    params: string,
  ) {
    this.telegramId = telegramId;
    this.action = action;
    this.params = params;
    this.status = status;
  }
}
