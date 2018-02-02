import { Job } from '../src/models/job.model'
import { spawn, SpawnOptions } from 'child_process'

function shellJob(command: string, spawnOptions: SpawnOptions = {}): Job {
  return {
    name: `Run ${command}`,
    description: `Run the following command: ${command}`,
    start: () =>
      spawn(command, [], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: true,
        ...spawnOptions
      })
  }
}

function sleepJob(sleep: string) {
  return shellJob(`sleep ${sleep}`)
}

function echoJob(str: string) {
  return shellJob(`echo "${str}"`)
}

export { shellJob, sleepJob, echoJob }
