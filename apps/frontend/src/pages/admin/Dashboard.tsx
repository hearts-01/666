import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Empty, Statistic, Typography } from 'antd';
import { useI18n } from '../../i18n';

export const AdminDashboardPage = () => {
  const { t } = useI18n();

  return (
    <PageContainer
      title={t('admin.dashboard.title')}
      breadcrumb={{
        items: [
          { title: t('nav.admin'), path: '/admin/dashboard' },
          { title: t('nav.dashboard') },
        ],
      }}
    >
      <ProCard gutter={16} wrap>
        <ProCard bordered colSpan={{ xs: 24, md: 8 }}>
          <Statistic title={t('admin.dashboard.activeUsers')} value={0} />
          <Typography.Text type="secondary">{t('admin.dashboard.awaitingMetrics')}</Typography.Text>
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 8 }}>
          <Statistic title={t('admin.dashboard.llmCallsToday')} value={0} />
          <Typography.Text type="secondary">{t('admin.dashboard.realtimeUsage')}</Typography.Text>
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 8 }}>
          <Statistic title={t('admin.dashboard.retentionRuns')} value={0} />
          <Typography.Text type="secondary">{t('admin.dashboard.retentionPending')}</Typography.Text>
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 24 }} title={t('admin.dashboard.systemOverview')}>
          {/* TODO: connect admin monitoring API */}
          <Empty description={t('admin.dashboard.monitoringEmpty')} />
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};
