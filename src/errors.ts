class TaskNotFoundError extends Error {
  constructor(key?: string) {
    key = key && `[${key}] `
    super(`${key}Task not found`)
  }
}

class TaskAlreadyFinishedError extends Error {
  constructor(key?: string) {
    key = key && `[${key}] `
    super(`${key}Task has already completed.`)
  }
}

class TaskNotStartedError extends Error {
  constructor(key?: string) {
    key = key && `[${key}] `
    super(`${key}Task has not yet started.`)
  }
}


export { TaskNotFoundError, TaskAlreadyFinishedError, TaskNotStartedError }
