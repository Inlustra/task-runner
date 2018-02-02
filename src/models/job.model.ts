import { ChildProcess } from 'child_process'
import { JobStatus } from './job-status.model';
import { TaskContext } from './task-context.model';

export interface Job {
  name: string
  description: string
  runOnStatus?: JobStatus[]
  start: (context: TaskContext) => ChildProcess
}
