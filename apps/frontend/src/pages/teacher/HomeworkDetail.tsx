import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Alert, Button, Descriptions, Empty, Space, Tabs, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../../i18n';

type HomeworkItem = {
  id: string;
  title: string;
  desc?: string | null;
  dueAt?: string | null;
};

type SubmissionRow = {
  id: string;
  studentName: string;
  status: string;
  totalScore?: number | null;
  updatedAt?: string;
};

export const TeacherHomeworkDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const state = location.state as { homework?: HomeworkItem; classId?: string | null } | undefined;
  const homework = state?.homework;

  const submissionsQuery = useQuery<SubmissionRow[]>({
    queryKey: ['homework-submissions', id],
    // TODO: replace placeholder with homework submissions API
    queryFn: async () => [],
    enabled: !!id,
  });

  const columns: ProColumns<SubmissionRow>[] = [
    {
      title: t('common.student'),
      dataIndex: 'studentName',
      render: (value) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      renderText: (value) => value || '--',
      width: 140,
    },
    {
      title: t('common.score'),
      dataIndex: 'totalScore',
      renderText: (value) => (typeof value === 'number' ? value : '--'),
      width: 120,
    },
    {
      title: t('common.lastUpdated'),
      dataIndex: 'updatedAt',
      renderText: (value) => value || '--',
      width: 200,
    },
  ];

  return (
    <PageContainer
      title={t('teacher.homeworkDetail.title')}
      breadcrumb={{
        items: [
          { title: t('nav.teacher'), path: '/teacher/dashboard' },
          { title: t('nav.homeworks'), path: '/teacher/homeworks' },
          { title: homework?.title || t('common.detail') },
        ],
      }}
    >
      {!homework ? (
        <Empty description={t('teacher.homeworkDetail.unavailable')}>
          <Button type="primary" onClick={() => navigate('/teacher/homeworks')}>
            {t('common.backToHomeworks')}
          </Button>
        </Empty>
      ) : (
        <Tabs
          items={[
            {
              key: 'overview',
              label: t('common.overview'),
              children: (
                <ProCard bordered>
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label={t('common.title')}>{homework.title}</Descriptions.Item>
                    <Descriptions.Item label={t('common.dueDate')}>
                      {homework.dueAt ? new Date(homework.dueAt).toLocaleString() : t('status.noDue')}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('common.description')}>
                      {homework.desc ? (
                        <Typography.Paragraph style={{ margin: 0 }}>{homework.desc}</Typography.Paragraph>
                      ) : (
                        <Typography.Text type="secondary">{t('common.noDescriptionProvided')}</Typography.Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('teacher.homeworkDetail.classReference')}>
                      {state?.classId ? state.classId : t('teacher.homeworkDetail.notSpecified')}
                    </Descriptions.Item>
                  </Descriptions>
                </ProCard>
              ),
            },
            {
              key: 'submissions',
              label: t('nav.submissions'),
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {submissionsQuery.isError ? (
                    <Alert
                      type="error"
                      message={t('teacher.homeworkDetail.loadSubmissionsError')}
                      description={
                        submissionsQuery.error instanceof Error
                          ? submissionsQuery.error.message
                          : t('common.tryAgain')
                      }
                      action={
                        <Button size="small" onClick={() => submissionsQuery.refetch()}>
                          {t('common.retry')}
                        </Button>
                      }
                    />
                  ) : null}
                  <ProCard bordered>
                    <ProTable<SubmissionRow>
                      rowKey="id"
                      columns={columns}
                      dataSource={(submissionsQuery.data || []) as SubmissionRow[]}
                      loading={submissionsQuery.isLoading}
                      search={false}
                      pagination={{ pageSize: 8 }}
                      options={false}
                      locale={{
                        emptyText: (
                          <Empty description={t('teacher.homeworkDetail.noSubmissions')}>
                            <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
                              {t('teacher.homeworkDetail.noSubmissionsHint')}
                            </Typography.Paragraph>
                          </Empty>
                        ),
                      }}
                    />
                  </ProCard>
                </Space>
              ),
            },
          ]}
        />
      )}
    </PageContainer>
  );
};
