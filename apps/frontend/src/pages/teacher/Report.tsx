import { PageContainer } from '@ant-design/pro-components';
import { Card, Empty, Typography } from 'antd';

export const TeacherReportPage = () => {
  return (
    <PageContainer
      title="Class Report"
      breadcrumb={{
        items: [
          { title: 'Teacher', path: '/teacher/classes' },
          { title: 'Report' },
        ],
      }}
    >
      <Card>
        <Empty description="No analytics yet">
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            Class-level analytics will appear here once data is available.
          </Typography.Paragraph>
        </Empty>
      </Card>
    </PageContainer>
  );
};
