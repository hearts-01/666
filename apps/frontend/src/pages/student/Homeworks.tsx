import { PageContainer, ProList } from '@ant-design/pro-components';
import { Alert, Button, Empty, Skeleton, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentHomeworks } from '../../api';
import { useNavigate } from 'react-router-dom';

type HomeworkItem = {
  id: string;
  title: string;
  desc?: string | null;
  dueAt?: string | null;
  class: { id: string; name: string };
};

export const StudentHomeworksPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student-homeworks'],
    queryFn: fetchStudentHomeworks,
  });

  return (
    <PageContainer
      title="My Homeworks"
      breadcrumb={{
        items: [
          { title: 'Student', path: '/student/homeworks' },
          { title: 'Homeworks' },
        ],
      }}
    >
      {isError ? (
        <Alert
          type="error"
          message="Failed to load homeworks"
          description={error instanceof Error ? error.message : 'Please try again.'}
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {isLoading && !data ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : data && data.length ? (
        <ProList<HomeworkItem>
          rowKey="id"
          dataSource={data}
          loading={isLoading}
          pagination={{ pageSize: 6 }}
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
          metas={{
            title: {
              dataIndex: 'title',
            },
            description: {
              render: (_, item) => (
                <Typography.Text type="secondary">
                  Class: {item.class.name}
                  {item.dueAt ? ` | Due: ${new Date(item.dueAt).toLocaleDateString()}` : ''}
                </Typography.Text>
              ),
            },
            content: {
              render: (_, item) =>
                item.desc ? (
                  <Typography.Paragraph ellipsis={{ rows: 2 }}>
                    {item.desc}
                  </Typography.Paragraph>
                ) : (
                  <Typography.Text type="secondary">No description</Typography.Text>
                ),
            },
            actions: {
              render: (_, item) => [
                <Button key="submit" type="primary" onClick={() => navigate(`/student/submit/${item.id}`)}>
                  Submit
                </Button>,
              ],
            },
          }}
        />
      ) : (
        <Empty description="No homework yet">
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            Assignments will appear here once your teacher publishes them.
          </Typography.Paragraph>
        </Empty>
      )}
    </PageContainer>
  );
};
