import * as through2 from 'through2'
import * as dateformat from 'dateformat'
import chalk from 'chalk'

function generateTimestamp() {
  return dateformat(new Date(), 'isoTime')
}

const timestamper = () =>
  through2(function(chunk, enc, cb) {
    this.push(chalk.dim('[' + generateTimestamp() + '] ') + chunk)
    cb()
  })

export { timestamper }
