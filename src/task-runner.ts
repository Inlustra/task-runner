import { Task } from './models/task.model'
import { Stream, Writable } from 'stream'
import * as fs from 'fs'
import { timestamper } from './stream-utils/timestamper'
import { TaskHandler, TaskHandlerOptions } from './task-handler'
import { stringAppender } from './stream-utils/string-appender'
import { EventEmitter } from 'events'
import { TaskNotFoundError } from './errors'

enum TaskRunnerEvents {
  REGISTER_TASK = 'register_task',
  REMOVE_TASK = 'remove_task',
  START_TASK = 'start_task',
  TASK_STAGE_UPDATE = 'task_stage_update'
}

export interface TaskRunnerOptions {}

export type TaskOptions = TaskRunnerOptions & TaskHandlerOptions

export class TaskRunner extends EventEmitter {
  static readonly Events = TaskRunnerEvents
  private tasks: { [key: string]: TaskHandler } = {}
  private globalPipes: Set<Writable> = new Set([])
  private options: TaskOptions
  private defaultOptions: TaskOptions = {}
  constructor(opts: TaskOptions = {}) {
    super()
    this.options = {
      ...this.defaultOptions,
      ...opts
    }
  }

  private getTask(taskKey: string) {
    const task = this.tasks[taskKey]
    if (!task) throw new TaskNotFoundError(taskKey)
    return task
  }

  registerTask(task: Task) {
    const taskKey = task.name + '-' + Math.floor(Math.random() * Date.now())
    const handler = new TaskHandler(task, this.options)
    this.tasks[taskKey] = handler
    this.globalPipes.forEach(pipe => this.addTaskPipe(taskKey, pipe))
    handler.on(TaskHandler.Events.STAGE_UPDATE, stages =>
      this.emit(TaskRunner.Events.TASK_STAGE_UPDATE, { taskKey, stages })
    )
    handler.on('close', () => this.removeTask(taskKey))
    this.emit(TaskRunner.Events.REGISTER_TASK, taskKey)
    return taskKey
  }

  startTask(taskKey: string) {
    this.getTask(taskKey).step()
    this.emit(TaskRunner.Events.START_TASK, taskKey)
  }

  removeTask(taskKey: string) {
    this.emit(TaskRunner.Events.REMOVE_TASK, taskKey)
    const taskHandler = this.getTask(taskKey)
    taskHandler.removeAllListeners()
    delete this.tasks[taskKey]
  }

  getTaskContext(taskKey: string) {
    return this.getTask(taskKey).context
  }

  cancelTask(taskKey: string) {
    this.getTask(taskKey).cancel()
  }

  addGlobalPipe(writable: Writable) {
    Object.keys(this.tasks).forEach(key => this.addTaskPipe(key, writable))
    this.globalPipes.add(writable)
  }

  removeGlobalPipe(writable: Writable) {
    Object.keys(this.tasks).forEach(key => this.removeTaskPipe(key, writable))
    this.globalPipes.delete(writable)
  }

  addTaskPipe(taskKey: string, writable: Writable) {
    this.getTask(taskKey).pipe(writable)
    const end = () => this.removeTaskPipe(taskKey, writable)
    writable.on('error', end)
    writable.on('close', end)
  }

  removeTaskPipe(taskKey: string, writable: Writable) {
    this.getTask(taskKey).unpipe(writable)
  }
}
