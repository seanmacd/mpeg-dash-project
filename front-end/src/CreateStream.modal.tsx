import type {ModalProps} from '@mantine/core'

import {Button, FileInput, Group, Modal, Text, TextInput} from '@mantine/core'
import {isNotEmpty, useForm} from '@mantine/form'
import {notifications} from '@mantine/notifications'
import {FileVideoIcon} from '@phosphor-icons/react'
import {serialize} from 'object-to-formdata'
import {useState} from 'react'
import {mutate} from 'swr'
import {api} from './api'

type CreateStreamForm = {
  name: string
  file: File | null
}

type JobStatus = 'Pending' | 'Complete' | 'Failed'

export function CreateStreamModal(props: ModalProps) {
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
      const body = serialize(values)
      const {jobId} = await api<{jobId: string}>('encode', {method: 'POST', body})

      const notifyId = notifications.show({
        loading: true,
        withBorder: true,
        title: `Your stream "${name}" is being encoded`,
        message: 'This may take a few minutes. Larger files take longer.',
        autoClose: false,
        withCloseButton: false
      })

      // Poll until job is complete
      const interval = setInterval(async () => {
        const {status} = await api<{status: JobStatus}>(`status/${jobId}`)

        if (status !== 'Pending') {
          clearInterval(interval)
          mutate('list') // refresh the stream list

          if (status === 'Complete') {
            notifications.update({
              id: notifyId,
              loading: false,
              color: 'green',
              title: `Your stream "${name}" is ready!`,
              message: 'Encoding complete.',
              withCloseButton: true,
              autoClose: 5000
            })
          } else {
            notifications.update({
              id: notifyId,
              loading: false,
              color: 'red',
              title: `Encoding failed for stream "${name}"`,
              message: 'Please try again.',
              withCloseButton: true,
              autoClose: 5000
            })
          }
        }
      }, 2500)

      form.reset()
      props.onClose()
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const onClose = () => {
    props.onClose()
    form.reset()
  }

  return (
    <Modal title="Create new stream" closeOnClickOutside={false} closeOnEscape={false} {...props} onClose={onClose}>
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
          rightSection={<FileVideoIcon size={20} />}
        />
        {failed && (
          <Text mt="lg" c="red">
            Something went wrong! Please try again.
          </Text>
        )}
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create stream
          </Button>
        </Group>
      </form>
    </Modal>
  )
}
