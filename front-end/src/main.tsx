import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {App} from './App.tsx'

import {MantineProvider} from '@mantine/core'
import {Notifications} from '@mantine/notifications'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={{defaultRadius: 'md'}} defaultColorScheme="light">
      <Notifications />
      <App />
    </MantineProvider>
  </StrictMode>
)
