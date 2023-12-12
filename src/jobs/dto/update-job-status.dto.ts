import { JobStatus } from '../types/job-status';

export class UpdateJobStatusDto {
  readonly jobId: string;
  readonly telegramId: string;
  readonly status: JobStatus;

  constructor(jobId: string, status: JobStatus, telegramId: string) {
    this.jobId = jobId;
    this.status = status;
    this.telegramId = telegramId;
  }
}
