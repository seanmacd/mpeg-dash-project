import type {UseColorSchemeValue} from '@mantine/hooks'

import {ActionIcon, useComputedColorScheme, useMantineColorScheme} from '@mantine/core'
import {MoonStarsIcon, SunIcon} from '@phosphor-icons/react'

export function ColorSchemeToggle() {
  const {setColorScheme} = useMantineColorScheme()
  const scheme = useComputedColorScheme('light', {getInitialValueInEffect: true})

  const icons: Record<UseColorSchemeValue, React.ReactNode> = {
    light: <MoonStarsIcon size={16} />,
    dark: <SunIcon size={16} />
  }

  return (
    <ActionIcon onClick={() => setColorScheme(scheme === 'light' ? 'dark' : 'light')} variant="default">
      {icons[scheme]}
    </ActionIcon>
  )
}
