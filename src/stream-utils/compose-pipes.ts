import { Readable, Transform } from "stream";

function composePipes(out: Readable, ...pipes: Transform[]) {
  return pipes
    .filter(x => !!x)
    .reduce((acc, curr) => acc.pipe(curr, { end: false }), out)
}

export { composePipes }
