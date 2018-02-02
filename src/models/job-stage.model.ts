import { Job } from "./job.model";
import { JobStatus } from "./job-status.model";

export interface JobStage {
  job: Job
  status: JobStatus
}
