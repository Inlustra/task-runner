import * as through2 from 'through2'

function stringAppender(str: string) {
  return through2(function(chunk, enc, cb) {
    cb(null, str+chunk)
  })
}

export { stringAppender }
