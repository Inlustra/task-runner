import * as through2 from 'through2'
import { Transform } from 'stream';

function stringAppender(str: string): Transform {
  return through2(function(chunk, enc, cb) {
    cb(null, str+chunk)
  })
}

export { stringAppender }
