import * as through2 from 'through2'
import * as dateformat from 'dateformat'
import chalk from 'chalk'
import { Transform } from 'stream';

function generateTimestamp() {
  return dateformat(new Date(), 'isoTime')
}

const timestamper: () => Transform = () =>
  through2(function(chunk, enc, cb) {
    this.push(chalk.dim('[' + generateTimestamp() + '] ') + chunk)
    cb()
  })

export { timestamper }
