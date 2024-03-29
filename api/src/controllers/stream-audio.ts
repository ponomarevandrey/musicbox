import fs from "fs-extra";
import { Request, Response } from "express";

// The basic idea of this code and how it can be improved: https://stackoverflow.com/a/53227823/13156302

export async function streamChunked(req: Request, res: Response, file: string) {
  // TODO: cache `stat` variable to avoid I/O operation on each rewiding the client does in player (write `getFileStat()` function)
  const stat = await fs.stat(file);

  let chunkSize = 1024 * 1024;
  if (stat.size > chunkSize * 2) {
    chunkSize = Math.ceil(stat.size * 0.25);
  }

  const range = req.headers.range
    ? req.headers.range.replace(/bytes=/, "").split("-")
    : [];
  const rrange: number[] = [];
  rrange[0] = range[0] ? parseInt(range[0], 10) : 0;
  rrange[1] = range[1] ? parseInt(range[1], 10) : rrange[0] + chunkSize;

  if (rrange[1] > stat.size - 1) rrange[1] = stat.size - 1;
  const newRange = { start: rrange[0], end: rrange[1] };

  const readStream = fs.createReadStream(file, newRange);
  res.writeHead(206, {
    "cache-control": "no-cache, no-store, must-revalidate",
    pragma: "no-cache",
    expires: 0,
    "content-type": "audio/mpeg",
    "accept-ranges": "bytes",
    "content-range": `bytes ${newRange.start}-${newRange.end}/${stat.size}`,
    "content-length": newRange.end - newRange.start + 1,
  });
  readStream.pipe(res);
}
