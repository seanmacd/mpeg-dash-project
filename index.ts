import {spawn} from 'child_process'
import express from 'express'
import fs from 'fs'
import path from 'path'
import {ffmpegArgs} from './ffmpeg'

const STREAM_DIR = './streams'

function main() {
  const app = express()

  app.set('view engine', 'pug')

  if (!fs.existsSync(STREAM_DIR)) {
    fs.mkdirSync(STREAM_DIR, {recursive: true})
  }

  app.use('/streams', express.static(STREAM_DIR))

  app.get('/', (_, res) => {
    return res.render('index')
  })

  app.post('/upload', express.raw({type: 'video/*', limit: '5gb'}), async (req, res) => {
    if (!req.body || req.body.length === 0) {
      return res.status(400).send('No file uploaded')
    }

    const fileName = req.headers['x-filename']
    if (!fileName || Array.isArray(fileName)) {
      return res.status(400).send('No filename provided')
    }

    await processFile(fileName, req.body as Buffer)

    return res.send('File processed successfully')
  })

  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
  })
}

main()

function processFile(fileName: string, data: Buffer) {
  const outputDir = path.join(STREAM_DIR, fileName)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {recursive: true})
  }

  const videoPath = path.join(outputDir, fileName)
  fs.writeFileSync(videoPath, data)

  // manifest file lists all the vidoe segements for a DASH
  const manifestPath = path.join(outputDir, 'manifest.mpd')

  return new Promise<void>((resolve, reject) => {
    console.log('Running FFmpeg')
    const proc = spawn('ffmpeg', ffmpegArgs(videoPath, manifestPath))

    const logger = (data: string) => console.log(`[FFmpeg]: ${data}`)
    proc.stdout.on('data', logger)
    proc.stderr.on('data', logger)

    proc.on('close', code => {
      if (code === 0) {
        console.log('[FFmpeg] Process completed successfully')
        resolve()
      } else {
        console.error(`[FFmpeg] Process exited with error code ${code}`)
        reject()
      }
    })
  })
}
