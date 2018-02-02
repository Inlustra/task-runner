import { shellJob } from '../src/jobs'
import { Task } from '../src/models/task.model'

function sleepEchoTask(echo1: string, sleepTime: string, echo2: string): Task {
  return {
    name: 'Successful Test Task',
    description: 'A task to list a directory',
    jobs: [
      shellJob('echo "' + echo1 + '"'),
      shellJob('sleep ' + sleepTime),
      shellJob('echo "' + echo2 + '"')
    ]
  }
}

function successfulTask(directory: string): Task {
  return {
    name: 'Successful Test Task',
    description: 'A task to list a directory',
    jobs: [shellJob('echo Wooooooop!'), shellJob('ls ' + directory)]
  }
}

function errorTask(directory: string, code: number): Task {
  return {
    name: 'Error Test Task',
    description: 'A task to list a directory',
    jobs: [
      shellJob('echo ' + 'First Job!'),
      shellJob('exit ' + code),
      shellJob('ls ' + directory)
    ]
  }
}

export { sleepEchoTask, successfulTask, errorTask }
