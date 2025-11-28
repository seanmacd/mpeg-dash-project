import {
  Box,
  Button,
  FileInput,
  Group,
  Modal,
  Progress,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  type ModalProps,
  type SelectProps
} from '@mantine/core'
import {isNotEmpty, useForm} from '@mantine/form'
import {useDisclosure, useFetch} from '@mantine/hooks'
import {MonitorArrowUpIcon} from '@phosphor-icons/react'
import {useEffect, useRef, useState} from 'react'
import {formatBitrate} from './format-bitrate'
import {ABR_AUTO_ID, useDashPlayer, type Quality} from './use-dash-player'

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [stream, setStream] = useState<string | null>(null)

  const {qualities, currentQuality, changeQuality} = useDashPlayer(videoRef, {stream})

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

const streamEvents = new EventTarget()

function StreamSelect(props: SelectProps) {
  const {data, loading, refetch} = useFetch<{streams: string[]}>(`${window.env.API_URL}/list`)

  useEffect(() => {
    streamEvents.addEventListener('streamAdded', refetch)
    return () => streamEvents.removeEventListener('streamAdded', refetch)
  }, [])

  if (!data || loading) {
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
          <Table.Th w={120}>ID</Table.Th>
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

type CreateStreamForm = {
  name: string
  file: File | null
}

function CreateStreamModal(props: ModalProps) {
  const form = useForm<CreateStreamForm>({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      file: null
    },
    validate: {
      name: isNotEmpty('Enter a name for this stream'),
      file: isNotEmpty('Upload a video file for this stream')
    }
  })

  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const onSubmit = async (values: typeof form.values) => {
    const {name, file} = values

    if (!file) {
      return
    }

    setLoading(true)
    try {
      await fetch(`${window.env.API_URL}/upload`, {
        method: 'POST',
        headers: {'content-type': file.type, 'x-filename': name},
        body: file
      })
      form.reset()
      props.onClose()
      streamEvents.dispatchEvent(new Event('streamAdded'))
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Create new stream" closeOnClickOutside={false} closeOnEscape={false} {...props}>
      {!loading ? (
        <form onSubmit={form.onSubmit(onSubmit)}>
          <TextInput
            label="Stream name"
            placeholder="My cool stream"
            key={form.key('name')}
            {...form.getInputProps('name')}
            withAsterisk
            mb="xs"
          />
          <FileInput
            label="Video file"
            placeholder="Upload a video file"
            accept="video/*"
            key={form.key('file')}
            {...form.getInputProps('file')}
            withAsterisk
          />
          {failed && (
            <Text mt="lg" c="red">
              An error occurred while processing your stream. Please try again.
            </Text>
          )}
          <Group justify="flex-end" mt="lg">
            <Button type="submit">Create stream</Button>
          </Group>
        </form>
      ) : (
        <div>
          <Text mb="md">Your stream is being processed...</Text>
          <Progress h="md" value={100} animated mb="md" />
        </div>
      )}
    </Modal>
  )
}
