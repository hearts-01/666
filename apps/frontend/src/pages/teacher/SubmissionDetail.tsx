import { PageContainer } from '@ant-design/pro-components';
import { Card, Descriptions, Empty, Tag, Typography } from 'antd';

export const TeacherSubmissionDetailPage = () => {
  return (
    <PageContainer
      title="Submission Detail"
      breadcrumb={{
        items: [
          { title: 'Teacher', path: '/teacher/classes' },
          { title: 'Submission' },
        ],
      }}
    >
      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Student">Student 01</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="green">DONE</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Score">--</Descriptions.Item>
        </Descriptions>
        <Empty description="Submission details are not wired yet">
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            Detailed breakdowns will appear here once the API is connected.
          </Typography.Paragraph>
        </Empty>
      </Card>
    </PageContainer>
  );
};
