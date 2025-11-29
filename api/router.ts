import {Router} from 'express'
import fs from 'fs'

import {randomUUID} from 'crypto'
import type {UploadedFile} from 'express-fileupload'
import path from 'path'
import z from 'zod'
import {STREAM_DIR} from './constants'
import {encodeFile, encoderEvents} from './encoder'

export const router = Router()

router.get('/', (_, res) => res.json({status: 'ok'}))

router.get('/list', async (_req, res) => {
  const streams = fs
    .readdirSync(STREAM_DIR, {withFileTypes: true})
    .filter(f => !f.isFile()) // directories only
    .map(f => f.name)
  return res.json({streams})
})

const JobStatus = {
  Pending: 'Pending',
  Complete: 'Complete',
  Failed: 'Failed'
} as const

const jobs = new Map<string, keyof typeof JobStatus>()

const msHour = 60 * 60 * 1000

encoderEvents.on('complete', jobId => {
  jobs.set(jobId, JobStatus.Complete)
  setTimeout(() => jobs.delete(jobId), msHour)
})
encoderEvents.on('failed', jobId => {
  jobs.set(jobId, JobStatus.Failed)
  setTimeout(() => jobs.delete(jobId), msHour)
})

router.post('/encode', async (req, res) => {
  const schema = z.looseObject({
    body: z.object({
      name: z.string()
    }),
    files: z.object({
      file: z.any()
    })
  })

  const {data} = schema.safeParse(req)
  if (!data) {
    return res.status(400).send('Invalid request')
  }

  const name = data.body.name
  const file = data.files.file as UploadedFile

  const outputDir = path.join(STREAM_DIR, name)
  fs.mkdirSync(outputDir, {recursive: true})

  const uuid = randomUUID()
  const videoPath = path.join(outputDir, `${uuid}${path.extname(file.name)}`)
  await file.mv(videoPath)

  jobs.set(uuid, JobStatus.Pending)

  const manifestPath = path.join(outputDir, 'manifest.mpd')
  encodeFile(uuid, manifestPath, videoPath).catch(() => {
    fs.rmSync(outputDir, {recursive: true, force: true})
  })

  return res.json({jobId: uuid, status: JobStatus.Pending})
})

router.get('/status/:jobId', (req, res) => {
  const {jobId} = req.params

  if (!jobId) {
    return res.status(400).send('No job ID provided')
  }

  const status = jobs.get(jobId)
  if (!status) {
    return res.status(400).send('Job not found')
  }

  return res.json({jobId, status})
})
