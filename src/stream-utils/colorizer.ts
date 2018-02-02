import * as through2 from 'through2'
import chalk from 'chalk'
import { Transform } from 'stream';

function coloriseStream(colour: string) {
  return through2(function(chunk, enc, cb) {
    cb(null, chalk[colour](chunk))
  })
}

const red: () => Transform = () => coloriseStream('red')

export { red }
