import { TaskRunner } from './task-runner'
import * as tasks from '../test-utils/test.task'
import { PassThrough, Writable } from 'stream'
import chalk from 'chalk'
import { TaskNotFoundError } from './errors'
import { JobStatus } from './models/job-status.model'

describe('TaskRunner', () => {
  let taskRunner: TaskRunner

  beforeEach(async () => {
    taskRunner = new TaskRunner({
      appendJobName: false,
      colorErrors: false
    })
  })

  describe('startTask()', () => {
    it('should throw if the task is not found', () => {
      expect(() => taskRunner.startTask('notDefined')).toThrowError(
        TaskNotFoundError
      )
    })
  })

  it('successfully run all tasks', cb => {
    taskRunner.startTask(taskRunner.registerTask(tasks.successfulTask('./')))
    taskRunner.on(TaskRunner.Events.REMOVE_TASK, cb)
  })

  it('Not error if the write stream closes early', cb => {
    taskRunner.on(TaskRunner.Events.REMOVE_TASK, cb)
    const task = taskRunner.registerTask(
      tasks.sleepEchoTask('Hi', '0.1', "I shouldn't be appearing!")
    )
    const bufferPipe = new Writable({
      write: (d, enc, cb) => {
        process.stdout.write(chalk.bgBlue(d.toString()))
        cb(null, d)
      }
    })
    taskRunner.addTaskPipe(task, bufferPipe)
    const buffer2Pipe = new Writable({
      write: (d, enc, cb) => {
        process.stdout.write(chalk.bgCyan(d.toString()))
        cb(null, d)
      }
    })
    setTimeout(() => bufferPipe.destroy(), 100)
    setTimeout(() => taskRunner.addTaskPipe(task, buffer2Pipe), 120)
    taskRunner.startTask(task)
  })

  it('successfully cancel the task before execution', cb => {
    const taskKey = taskRunner.registerTask(
      tasks.sleepEchoTask('Hi', '0.2', "I shouldn't be appearing!")
    )
    setTimeout(() => taskRunner.cancelTask(taskKey), 100)
    taskRunner.on(TaskRunner.Events.REMOVE_TASK, taskKey => {
      const statuses = taskRunner
        .getTaskContext(taskKey)
        .stages.map(stage => stage.status)
      expect(statuses).toEqual([
        JobStatus.SUCCESS,
        JobStatus.CANCELLED,
        JobStatus.SKIPPED
      ])
      cb()
    })
    taskRunner.startTask(taskKey)
  })

  it('should skip the next task if the previous task has an incorrect previousCondition', cb => {
    const taskKey = taskRunner.registerTask(tasks.errorTask('./', 10))
    taskRunner.startTask(taskKey)
    taskRunner.on(TaskRunner.Events.REMOVE_TASK, taskKey => {
      const statuses = taskRunner
        .getTaskContext(taskKey)
        .stages.map(stage => stage.status)
      expect(statuses).toEqual([
        JobStatus.SUCCESS,
        JobStatus.ERROR,
        JobStatus.SKIPPED
      ])
      cb()
    })
  })
})
