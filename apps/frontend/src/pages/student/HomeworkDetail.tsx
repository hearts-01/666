import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, Button, Descriptions, Empty, Skeleton, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStudentHomeworks } from '../../api';
import { useI18n } from '../../i18n';

export const StudentHomeworkDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useI18n();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student-homeworks'],
    queryFn: fetchStudentHomeworks,
  });

  const homework = useMemo(
    () => (data || []).find((item) => item.id === id),
    [data, id],
  );

  const dueAtLabel = homework?.dueAt
    ? new Date(homework.dueAt).toLocaleString()
    : t('student.homeworkDetail.flexible');
  const dueTag = homework?.dueAt
    ? new Date(homework.dueAt).getTime() < Date.now()
      ? t('status.overdue')
      : t('status.open')
    : t('status.noDue');

  return (
    <PageContainer
      title={t('student.homeworkDetail.title')}
      breadcrumb={{
        items: [
          { title: t('nav.student'), path: '/student/dashboard' },
          { title: t('nav.homeworks'), path: '/student/homeworks' },
          { title: t('common.detail') },
        ],
      }}
    >
      {isError ? (
        <Alert
          type="error"
          message={t('student.homeworkDetail.loadError')}
          description={error instanceof Error ? error.message : t('common.tryAgain')}
          action={
            <Button size="small" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {isLoading && !data ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !homework ? (
        <Empty description={t('student.homeworkDetail.notFound')}>
          <Button type="primary" onClick={() => navigate('/student/homeworks')}>
            {t('common.backToHomeworks')}
          </Button>
        </Empty>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <ProCard
            bordered
            title={homework.title}
            extra={
              <Button type="primary" onClick={() => navigate(`/student/submit/${homework.id}`)}>
                {t('student.homeworkDetail.submitHomework')}
              </Button>
            }
          >
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t('common.class')}>{homework.class.name}</Descriptions.Item>
              <Descriptions.Item label={t('common.dueDate')}>{dueAtLabel}</Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                <Tag>{dueTag}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('common.description')}>
                {homework.desc ? (
                  <Typography.Paragraph style={{ margin: 0 }}>{homework.desc}</Typography.Paragraph>
                ) : (
                  <Typography.Text type="secondary">{t('common.noDescriptionProvided')}</Typography.Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </ProCard>
          <ProCard
            bordered
            title={t('student.homeworkDetail.submissionHistory')}
            extra={
              <Button onClick={() => navigate('/student/submissions')}>
                {t('common.viewAllSubmissions')}
              </Button>
            }
          >
            {/* TODO: connect submission history API for homework */}
            <Empty description={t('student.homeworkDetail.noSubmissionHistory')} />
          </ProCard>
        </Space>
      )}
    </PageContainer>
  );
};
