import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Descriptions, Empty, Tag, Typography } from 'antd';
import { useI18n } from '../../i18n';

export const AdminSystemRetentionPage = () => {
  const { t } = useI18n();

  return (
    <PageContainer
      title={t('admin.retention.title')}
      breadcrumb={{
        items: [
          { title: t('nav.admin'), path: '/admin/dashboard' },
          { title: t('nav.system') },
          { title: t('nav.retention') },
        ],
      }}
    >
      <ProCard bordered>
        <Descriptions column={1} bordered>
          <Descriptions.Item label={t('admin.retention.window')}>
            <Tag>{t('admin.retention.windowValue')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('admin.retention.nextRun')}>
            <Typography.Text type="secondary">{t('admin.retention.nextRunValue')}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('admin.retention.dryRun')}>
            <Typography.Text type="secondary">{t('common.disabled')}</Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </ProCard>
      <ProCard bordered title={t('admin.retention.logsTitle')} style={{ marginTop: 16 }}>
        {/* TODO: connect retention logs API */}
        <Empty description={t('admin.retention.logsEmpty')} />
      </ProCard>
    </PageContainer>
  );
};
