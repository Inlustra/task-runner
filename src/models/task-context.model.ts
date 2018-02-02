import { Job } from './job.model'
import { JobStatus } from './job-status.model'
import { JobStage } from './job-stage.model'

export interface TaskContext {
  step: number
  stages: JobStage[]
}
