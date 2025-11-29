import type {SelectProps} from '@mantine/core'
import type {MediaPlayerClass} from 'dashjs'
import type {RefObject} from 'react'
import type {Quality} from './use-dash-player'

import {Box, Button, Group, Select, Table, Text, Title} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {MonitorArrowUpIcon} from '@phosphor-icons/react'
import {useRef, useState} from 'react'
import useSWR from 'swr'
import {api} from './api'
import {CreateStreamModal} from './CreateStream.modal'
import {formatBitrate} from './format-bitrate'
import {useDashMetrics} from './use-dash-metrics'
import {ABR_AUTO_ID, useDashPlayer} from './use-dash-player'

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [stream, setStream] = useState<string | null>(null)

  const {playerRef, qualities, currentQuality, changeQuality} = useDashPlayer(videoRef, {stream})

  const qualityOptions = qualities.map(q => ({
    label: `${q.id}: ${q.width}x${q.height} ${formatBitrate(q.bitrate)}`,
    value: q.id
  }))
  const options = [{label: 'Auto', value: ABR_AUTO_ID}, ...qualityOptions]

  const [quality, setQuality] = useState<string>(ABR_AUTO_ID)
  const onChange = (value: string | null) => {
    setQuality(value || ABR_AUTO_ID)
    changeQuality(value || ABR_AUTO_ID)
  }

  const [opened, {open, close}] = useDisclosure(false)

  return (
    <Box p="md" mb={100}>
      <Group align="flex-start">
        <Box maw={300}>
          <Title order={3} mb="xs">
            MPEG-DASH Streaming
          </Title>
          <Text size="sm">
            This project uses MPEG-DASH and Dash.js to explore streaming in the context of network programming.
          </Text>

          <Box my="xl">
            <Button fullWidth leftSection={<MonitorArrowUpIcon size={20} />} mb="xs" onClick={open}>
              Create new stream
            </Button>
            <StreamSelect value={stream} onChange={setStream} withAsterisk mb="xs" />
            <Select data={options} label="Quality" value={quality} onChange={onChange} allowDeselect={false} />
          </Box>

          <Text fw="bold" mb="xs">
            Current Quality
          </Text>
          <QualityInfo quality={currentQuality} />

          <Text fw="bold" mb="xs" mt="md">
            Metrics
          </Text>
          <Metrics playerRef={playerRef} />
        </Box>

        <Box flex={1}>
          <video ref={videoRef} controls style={{width: '100%'}} />
        </Box>
      </Group>

      <Group align="flex-start" justify="space-between"></Group>
      <CreateStreamModal opened={opened} onClose={close} />
    </Box>
  )
}

function StreamSelect(props: SelectProps) {
  const {data, isLoading} = useSWR<{streams: string[]}>('list', api)

  if (!data || isLoading) {
    return <Select label="Stream" placeholder="Loading..." disabled />
  }

  return <Select label="Stream" data={data.streams} placeholder="Select a stream" {...props} />
}

function QualityInfo({quality}: {quality: Quality | null}) {
  if (!quality) {
    return <Text c="dimmed">No data</Text>
  }

  const {id, width, height, bitrate} = quality
  const resolution = `${width}x${height}`

  return (
    <Table variant="vertical" withTableBorder>
      <Table.Tbody>
        <Table.Tr>
          <Table.Th w={150}>ID</Table.Th>
          <Table.Td>{id}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Resolution</Table.Th>
          <Table.Td>{resolution}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Bitrate</Table.Th>
          <Table.Td>{formatBitrate(bitrate)}</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  )
}

function Metrics({playerRef}: {playerRef: RefObject<MediaPlayerClass | null>}) {
  const {throughput, latency, droppedFrames, bufferLevel} = useDashMetrics(playerRef)

  if (!playerRef.current) {
    return <Text c="dimmed">No data</Text>
  }

  return (
    <Table variant="vertical" withTableBorder>
      <Table.Tbody>
        <Table.Tr>
          <Table.Th w={150}>Throughput</Table.Th>
          <Table.Td>{formatBitrate(throughput)}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Latency</Table.Th>
          <Table.Td>{latency}ms</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Dropped frames</Table.Th>
          <Table.Td>{droppedFrames}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Buffer level</Table.Th>
          <Table.Td>{bufferLevel}s</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  )
}
