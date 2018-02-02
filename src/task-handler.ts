import { Task } from './models/task.model'
import { Job } from './models/job.model'
import { Transform, Readable, PassThrough, Writable } from 'stream'
import * as split2 from 'split2'
import { red } from './stream-utils/colorizer'
import { TaskContext } from './models/task-context.model'
import { ChildProcess } from 'child_process'
import { JobStatus } from './models/job-status.model'
import { JobStage } from './models/job-stage.model'
import { TaskAlreadyFinishedError, TaskNotStartedError } from './errors'
import * as through2 from 'through2'
import { composePipes } from './stream-utils/compose-pipes';
export enum TaskHandlerEvents {
  STAGE_UPDATE = 'stage_update'
}

export interface TaskHandlerOptions {
  appendJobName?: boolean
  colorErrors?: boolean
}

class TaskHandler extends Transform {
  static readonly Events = TaskHandlerEvents

  private readonly options: TaskHandlerOptions
  private stepIndex: number = -1
  private stages: JobStage[]
  private child: ChildProcess

  private defaultOptions: TaskHandlerOptions = {
    appendJobName: true,
    colorErrors: true
  }

  get context(): TaskContext {
    return {
      step: this.stepIndex,
      stages: this.stages
    }
  }

  get currentJob(): Job {
    return this.task.jobs[this.stepIndex]
  }

  get previousStages(): JobStage[] {
    return this.stages.slice(0, this.stepIndex)
  }

  get currentStage(): JobStage {
    return this.stages[this.stepIndex]
  }

  constructor(public task: Task, options: TaskHandlerOptions = {}) {
    super()
    this.options = {
      ...this.defaultOptions,
      ...options
    }
    this.stages = this.task.jobs.map(job => ({
      job,
      status: JobStatus.PENDING
    }))
  }

  step() {
    if (this.stepIndex >= this.task.jobs.length) {
      throw new TaskAlreadyFinishedError()
    }
    while (++this.stepIndex < this.task.jobs.length) {
      if (this.canRunJob(this.currentJob)) {
        return this.startJob(this.currentJob)
      }
      this.updateJobStatus(JobStatus.SKIPPED)
    }
    this.destroy()
  }

  private canRunJob({ runOnStatus }: Job) {
    return (
      !this.previousStages.length ||
      (!runOnStatus && this.isPreviousStatus(JobStatus.SUCCESS)) ||
      (runOnStatus && this.isPreviousStatus(...runOnStatus))
    )
  }

  isPreviousStatus(...statuses: JobStatus[]): boolean {
    return this.previousStages
      .map(stage => stage.status)
      .every(status => statuses.indexOf(status) >= 0)
  }

  cancel() {
    if (this.stepIndex < 0) {
      throw new TaskNotStartedError()
    }
    if (this.stepIndex >= this.task.jobs.length) {
      throw new TaskAlreadyFinishedError()
    }
    this.child.kill('SIGINT')
  }

  private startJob(job: Job) {
    this.child = this.currentJob.start(this.context)
    this.setupChildProcess(this.child)
    this.updateJobStatus(JobStatus.RUNNING)
  }

  private setupChildProcess(child: ChildProcess) {
    composePipes(
      child.stdout,
      split2(),
      this.options.appendJobName && this.jobAppender(),
      this
    )
    composePipes(
      child.stderr,
      split2(),
      this.options.colorErrors && red(),
      this.options.appendJobName && this.jobAppender(),
      this
    )
    child.on('error', error => this.emit('error', error))
    child.on('close', code => this.onChildClose(code))
  }

  private onChildClose(code: number) {
    let status = JobStatus.ERROR
    if (code === null) {
      status = JobStatus.CANCELLED
    } else if (code === 0) {
      status = JobStatus.SUCCESS
    }
    this.child.removeAllListeners()
    this.updateJobStatus(status)
    this.step()
  }

  private updateJobStatus(jobStatus: JobStatus) {
    this.currentStage.status = jobStatus
    this.emit(TaskHandler.Events.STAGE_UPDATE, this.stages)
  }

  private jobAppender() {
    return through2((line, enc, cb) => {
      cb(null, `[${this.currentJob.name}] ${line}`)
    })
  }

  _transform(chunk, encoding, cb) {
    cb(null, chunk + '\n')
  }
}

export { TaskHandler }
