import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, Button, Empty, Statistic, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentHomeworks } from '../../api';
import { useI18n } from '../../i18n';

export const StudentDashboardPage = () => {
  const { t } = useI18n();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student-homeworks'],
    queryFn: fetchStudentHomeworks,
  });

  const homeworkCount = data?.length ?? 0;
  const upcomingDeadlineText = homeworkCount
    ? t('student.dashboard.reviewDeadlines')
    : t('student.dashboard.noUpcomingDeadlines');

  return (
    <PageContainer
      title={t('nav.dashboard')}
      breadcrumb={{
        items: [
          { title: t('nav.student'), path: '/student/dashboard' },
          { title: t('nav.dashboard') },
        ],
      }}
    >
      {isError ? (
        <Alert
          type="error"
          message={t('student.dashboard.loadError')}
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
          <Statistic title={t('student.dashboard.assignmentsAvailable')} value={homeworkCount} />
          <Typography.Text type="secondary">{t('student.dashboard.updatedFromList')}</Typography.Text>
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 8 }} loading={isLoading && !data}>
          <Typography.Text type="secondary">{t('student.dashboard.weeklySubmissions')}</Typography.Text>
          {/* TODO: connect submissions summary API */}
          <Empty description={t('student.dashboard.noSubmissionSummary')} />
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 8 }} loading={isLoading && !data}>
          <Typography.Text type="secondary">{t('student.dashboard.avgScoreTrend')}</Typography.Text>
          {/* TODO: connect scoring trend API */}
          <Empty description={t('student.dashboard.scoreTrendPlaceholder')} />
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 12 }} loading={isLoading && !data}>
          <Typography.Text type="secondary">{t('student.dashboard.topErrorTypes')}</Typography.Text>
          {/* TODO: connect top error analytics */}
          <Empty description={t('student.dashboard.noErrorInsights')} />
        </ProCard>
        <ProCard bordered colSpan={{ xs: 24, md: 12 }} loading={isLoading && !data}>
          <Typography.Text type="secondary">{t('student.dashboard.upcomingDeadlines')}</Typography.Text>
          <Empty description={upcomingDeadlineText} />
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};
