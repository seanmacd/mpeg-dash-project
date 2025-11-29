import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import fileUpload from 'express-fileupload'
import fs from 'fs'
import morgan from 'morgan'

import {CLIENT_DIR, STREAM_DIR} from './constants'
import {router} from './router'

function main() {
  const app = express()

  app.use(morgan('tiny'))
  app.use(fileUpload())
  app.use(express.json())

  if (process.env.ORIGIN) {
    app.use(cors({origin: process.env.ORIGIN}))
  }

  app.use(express.static(CLIENT_DIR))

  fs.mkdirSync(STREAM_DIR, {recursive: true})
  app.use('/streams', express.static(STREAM_DIR))

  app.use('/api', router)

  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`Server running on port ${port}`))
}

main()
