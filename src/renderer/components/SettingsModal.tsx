import { useEffect } from 'react'
import { Modal, Form, Input, Select, InputNumber, message } from 'antd'
import type { LLMProviderConfig, LLMProviderType } from '@shared/types'

const defaultUrls: Record<LLMProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  custom: ''
}

interface Props { open: boolean; onClose: () => void }

export default function SettingsModal({ open, onClose }: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      window.electronAPI.getLLMConfig().then(config => {
        if (config) form.setFieldsValue(config)
      })
    }
  }, [open, form])

  const handleProviderChange = (value: LLMProviderType) => {
    form.setFieldValue('baseUrl', defaultUrls[value])
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    await window.electronAPI.saveLLMConfig(values as LLMProviderConfig)
    message.success('LLM configuration saved')
    onClose()
  }

  return (
    <Modal title="LLM Settings" open={open} onOk={handleSave} onCancel={onClose} okText="Save">
      <Form form={form} layout="vertical" initialValues={{ name: 'openai', baseUrl: defaultUrls.openai, maxTokens: 4096 }}>
        <Form.Item name="name" label="Provider" rules={[{ required: true }]}>
          <Select onChange={handleProviderChange} options={[
            { label: 'OpenAI', value: 'openai' },
            { label: 'Anthropic', value: 'anthropic' },
            { label: 'Custom (OpenAI Compatible)', value: 'custom' }
          ]} />
        </Form.Item>
        <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true }]}>
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>
        <Form.Item name="apiKey" label="API Key" rules={[{ required: true }]}>
          <Input.Password placeholder="sk-..." />
        </Form.Item>
        <Form.Item name="model" label="Model" rules={[{ required: true }]}>
          <Input placeholder="gpt-4o / claude-sonnet-4-20250514 / ..." />
        </Form.Item>
        <Form.Item name="maxTokens" label="Max Tokens">
          <InputNumber min={256} max={128000} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
