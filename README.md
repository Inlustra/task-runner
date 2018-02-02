# Inlustra's Task Runner

A sub-task manager/pipeline to handle child processes.

## TL:DR

Takes jobs (Child Processes) and handles piping up to a single stream across processes.
A Task is made up of multiple jobs with a previous job condition (eg. the previous job must be a success)

* Jobs are run consecutively
* All stage updates (Complete, Error, Cancelled, Skipped) are bubbled up through events.
* Handles errors without blowing up (If not handled explicitly!)


### The simplest way to get tasks running one after the other

Create a task, made up of multiple jobs, this is the equivalent of a pipeline

```javascript
const task = {
  name: 'A Simple Task',
  description: 'A task to list some files',
  jobs: [
    new ShellJob('ls ./'), // List the files
    new ShellJob('sleep 5'), // Sleep for 5 seconds
    new ShellJob('exit 1'), // Then error
    new ShellJob('echo "This won\'t appear!"') // The task runner won't run this job
  ]
}

const taskHandler = new TaskHandler(task)
taskHandler.on(TaskHandler.Events.STAGE_UPDATE, (stages) => {
  console.log('The next stage in the task has run!')
  console.log(stages)
})
```

## Using the task runner to add tasks


```javascript
const task = {
  name: 'A Simple Task',
  description: 'A task to list some files',
  jobs: [
    new ShellJob('ls ./'), // List the files
    new ShellJob('sleep 5'), // Sleep for 5 seconds
    new ShellJob('exit 1'), // Then error
    new ShellJob('echo "This won\'t appear!"') // The task runner won't run this job
  ]
}
```

Register the task, add your pipes and start it!

```javascript
const taskRunner = new TaskRunner()
taskRunner.addGlobalPipe(process.stdout) // Will print all outputs from any tasks to the console
const taskKey = taskRunner.register(task)
taskRunner.addTaskPipe(taskKey, fs.createWriteStream('./'))
```

# TODO

- Document the options available (Jobs can run on error)
- Document the Event types in TaskHandler and TaskRunner
