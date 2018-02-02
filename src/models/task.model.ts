import { Job } from "./job.model";

export interface Task {
  name: string
  description: string
  jobs: Job[]
}
