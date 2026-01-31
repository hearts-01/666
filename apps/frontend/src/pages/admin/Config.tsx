import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Space,
  Select,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { fetchAdminConfig, testAdminLlmHealth, testAdminOcrHealth, updateAdminConfig } from '../../api';
import { useI18n } from '../../i18n';

type HealthState = {
  ok: boolean;
  checkedAt: string;
  reason?: string;
  status?: number;
  latencyMs?: number;
  model?: string;
};

export const AdminConfigPage = () => {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [llmHealth, setLlmHealth] = useState<HealthState | null>(null);
  const [ocrHealth, setOcrHealth] = useState<HealthState | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['admin-config'],
    queryFn: fetchAdminConfig,
  });

  const mutation = useMutation({
    mutationFn: updateAdminConfig,
    onSuccess: () => {
      message.success(t('admin.config.saved'));
      queryClient.invalidateQueries({ queryKey: ['admin-config'] });
    },
  });

  const llmHealthMutation = useMutation({
    mutationFn: testAdminLlmHealth,
    onSuccess: (data) => {
      setLlmHealth({
        ok: data.ok,
        checkedAt: new Date().toISOString(),
        reason: data.reason,
        status: data.status,
        latencyMs: data.latencyMs,
        model: data.model,
      });
      if (data.ok) {
        message.success(t('admin.config.llmHealthOk'));
      } else {
        message.error(`${t('admin.config.llmHealthFail')}: ${data.reason || data.status || ''}`);
      }
    },
    onError: () => {
      setLlmHealth({ ok: false, checkedAt: new Date().toISOString(), reason: t('common.tryAgain') });
      message.error(t('admin.config.llmHealthFail'));
    },
  });

  const ocrHealthMutation = useMutation({
    mutationFn: testAdminOcrHealth,
    onSuccess: (data) => {
      setOcrHealth({
        ok: data.ok,
        checkedAt: new Date().toISOString(),
        reason: data.reason,
        status: data.status,
        latencyMs: data.latencyMs,
      });
      if (data.ok) {
        message.success(t('admin.config.ocrHealthOk'));
      } else {
        message.error(`${t('admin.config.ocrHealthFail')}: ${data.reason || data.status || ''}`);
      }
    },
    onError: () => {
      setOcrHealth({ ok: false, checkedAt: new Date().toISOString(), reason: t('common.tryAgain') });
      message.error(t('admin.config.ocrHealthFail'));
    },
  });

  useEffect(() => {
    if (!config) {
      return;
    }
    form.setFieldsValue({
      llm: {
        providerName: config.llm.providerName,
        baseUrl: config.llm.baseUrl,
        model: config.llm.model,
        cheaperModel: config.llm.cheaperModel,
        qualityModel: config.llm.qualityModel,
        maxTokens: config.llm.maxTokens,
        temperature: config.llm.temperature,
        timeoutMs: config.llm.timeoutMs,
        apiKey: '',
        clearApiKey: false,
      },
      ocr: {
        baseUrl: config.ocr.baseUrl,
        timeoutMs: config.ocr.timeoutMs,
      },
      budget: {
        enabled: config.budget.enabled,
        dailyCallLimit: config.budget.dailyCallLimit,
        mode: config.budget.mode,
      },
    });
    setLlmHealth(config.health?.llm ?? null);
    setOcrHealth(config.health?.ocr ?? null);
  }, [config, form]);

  const handleFinish = (values: {
    llm?: {
      providerName?: string;
      baseUrl?: string;
      apiKey?: string;
      clearApiKey?: boolean;
      model?: string;
      cheaperModel?: string;
      qualityModel?: string;
      maxTokens?: number;
      temperature?: number;
      timeoutMs?: number;
    };
    ocr?: { baseUrl?: string; timeoutMs?: number };
    budget?: { enabled?: boolean; dailyCallLimit?: number; mode?: 'soft' | 'hard' };
  }) => {
    const payload = { ...values };
    if (payload.llm) {
      const apiKey = payload.llm.apiKey?.trim() || '';
      if (payload.llm.clearApiKey) {
        payload.llm.apiKey = '';
      } else if (!apiKey) {
        delete payload.llm.apiKey;
      } else {
        payload.llm.apiKey = apiKey;
      }
      delete payload.llm.clearApiKey;
    }
    mutation.mutate(payload);
  };

  return (
    <PageContainer
      title={t('admin.config.title')}
      breadcrumb={{
        items: [
          { title: t('nav.admin'), path: '/admin/dashboard' },
          { title: t('nav.system') },
          { title: t('nav.config') },
        ],
      }}
    >
      <Card loading={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <ProCard bordered title={t('admin.config.section.llm')} colSpan={24}>
            <Form.Item label={t('admin.config.providerName')} name={['llm', 'providerName']}>
              <Input placeholder={t('admin.config.providerNamePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('admin.config.baseUrl')} name={['llm', 'baseUrl']}>
              <Input placeholder={t('admin.config.baseUrlPlaceholder')} />
            </Form.Item>
            <Form.Item
              label={t('admin.config.apiKey')}
              name={['llm', 'apiKey']}
              extra={
                config?.llm.apiKeySet
                  ? t('admin.config.apiKeyHintSet')
                  : t('admin.config.apiKeyHintEmpty')
              }
            >
              <Input.Password placeholder={t('admin.config.apiKeyPlaceholder')} autoComplete="new-password" />
            </Form.Item>
            <Form.Item label={t('admin.config.clearApiKey')} name={['llm', 'clearApiKey']} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Divider />
            <Form.Item label={t('admin.config.model')} name={['llm', 'model']}>
              <Input placeholder={t('admin.config.modelPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('admin.config.cheaperModel')} name={['llm', 'cheaperModel']}>
              <Input placeholder={t('admin.config.cheaperModelPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('admin.config.qualityModel')} name={['llm', 'qualityModel']}>
              <Input placeholder={t('admin.config.qualityModelPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('admin.config.maxTokens')} name={['llm', 'maxTokens']}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('admin.config.temperature')} name={['llm', 'temperature']}>
              <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('admin.config.timeoutMs')} name={['llm', 'timeoutMs']}>
              <InputNumber min={1000} step={500} style={{ width: '100%' }} />
            </Form.Item>
            <Button
              onClick={() => llmHealthMutation.mutate()}
              loading={llmHealthMutation.isPending}
            >
              {t('admin.config.testLlm')}
            </Button>
            {llmHealth ? (
              <Space size={8} style={{ marginTop: 8 }} wrap>
                <Tag color={llmHealth.ok ? 'green' : 'red'}>
                  {llmHealth.ok ? t('admin.config.llmHealthOk') : t('admin.config.llmHealthFail')}
                </Tag>
                <Typography.Text type="secondary">
                  {t('admin.config.lastChecked')} {new Date(llmHealth.checkedAt).toLocaleString()}
                </Typography.Text>
                {llmHealth.model ? (
                  <Typography.Text type="secondary">{llmHealth.model}</Typography.Text>
                ) : null}
                {typeof llmHealth.latencyMs === 'number' ? (
                  <Typography.Text type="secondary">{llmHealth.latencyMs}ms</Typography.Text>
                ) : null}
                {!llmHealth.ok && llmHealth.reason ? (
                  <Typography.Text type="secondary">{llmHealth.reason}</Typography.Text>
                ) : null}
              </Space>
            ) : null}
          </ProCard>

          <Divider />

          <ProCard bordered title={t('admin.config.section.ocr')} colSpan={24}>
            <Form.Item label={t('admin.config.ocrBaseUrl')} name={['ocr', 'baseUrl']}>
              <Input placeholder={t('admin.config.ocrBaseUrlPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('admin.config.ocrTimeout')} name={['ocr', 'timeoutMs']}>
              <InputNumber min={1000} step={500} style={{ width: '100%' }} />
            </Form.Item>
            <Button
              onClick={() => ocrHealthMutation.mutate()}
              loading={ocrHealthMutation.isPending}
            >
              {t('admin.config.testOcr')}
            </Button>
            {ocrHealth ? (
              <Space size={8} style={{ marginTop: 8 }} wrap>
                <Tag color={ocrHealth.ok ? 'green' : 'red'}>
                  {ocrHealth.ok ? t('admin.config.ocrHealthOk') : t('admin.config.ocrHealthFail')}
                </Tag>
                <Typography.Text type="secondary">
                  {t('admin.config.lastChecked')} {new Date(ocrHealth.checkedAt).toLocaleString()}
                </Typography.Text>
                {typeof ocrHealth.latencyMs === 'number' ? (
                  <Typography.Text type="secondary">{ocrHealth.latencyMs}ms</Typography.Text>
                ) : null}
                {!ocrHealth.ok && ocrHealth.reason ? (
                  <Typography.Text type="secondary">{ocrHealth.reason}</Typography.Text>
                ) : null}
              </Space>
            ) : null}
          </ProCard>

          <Divider />

          <ProCard bordered title={t('admin.config.section.budget')} colSpan={24}>
            <Form.Item label={t('admin.config.budgetEnabled')} name={['budget', 'enabled']} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label={t('admin.config.dailyBudgetLimit')} name={['budget', 'dailyCallLimit']}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('admin.config.budgetMode')} name={['budget', 'mode']}>
              <Select
                options={[
                  { value: 'soft', label: t('admin.systemBudget.mode.soft') },
                  { value: 'hard', label: t('admin.systemBudget.mode.hard') },
                ]}
              />
            </Form.Item>
            <Typography.Text type="secondary">{t('admin.config.budgetHint')}</Typography.Text>
          </ProCard>

          <Divider />

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              {t('admin.config.save')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};
