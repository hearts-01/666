import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, Button, Empty, Statistic, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchClasses } from '../../api';
import { useI18n } from '../../i18n';

export const TeacherDashboardPage = () => {
  const { t } = useI18n();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });

  const classCount = data?.length ?? 0;

  return (
    <PageContainer
      title={t('nav.dashboard')}
      breadcrumb={{
        items: [
          { title: t('nav.teacher'), path: '/teacher/dashboard' },
          { title: t('nav.dashboard') },
        ],
      }}
    >
      {isError ? (
        <Alert
          type="error"
          message={t('teacher.dashboard.loadError')}
          description={error instanceof Error ? error.message : t('common.tryAgain')}
          action={
            <Button size="small" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <ProCard gutter={16} wrap>
        <ProCard bordered colSpan={{ xs: 24, md: 8 }} loading={isLoading && !data}>
          <Statistic title={t('teacher.dashboard.classes')} value={classCount} />
          <Typography.Text type="secondary">{t('teacher.dashboard.trackClasses')}</Typography.Text>
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 8 }} loading={isLoading && !data}>
          <Typography.Text type="secondary">{t('teacher.dashboard.submissionActivity')}</Typography.Text>
          {/* TODO: connect submission analytics */}
          <Empty description={t('teacher.dashboard.noActivity')} />
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 8 }} loading={isLoading && !data}>
          <Typography.Text type="secondary">{t('teacher.dashboard.avgScoreTrend')}</Typography.Text>
          {/* TODO: connect score trend analytics */}
          <Empty description={t('teacher.dashboard.scoreTrendPlaceholder')} />
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 12 }} loading={isLoading && !data}>
          <Typography.Text type="secondary">{t('teacher.dashboard.topMistakes')}</Typography.Text>
          {/* TODO: connect error analytics */}
          <Empty description={t('teacher.dashboard.noInsights')} />
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 12 }} loading={isLoading && !data}>
          <Typography.Text type="secondary">{t('teacher.dashboard.upcomingDeadlines')}</Typography.Text>
          <Empty description={t('teacher.dashboard.reviewSchedules')} />
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};
