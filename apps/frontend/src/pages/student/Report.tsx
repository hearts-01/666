import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Empty, Typography } from 'antd';
import { useI18n } from '../../i18n';

export const StudentReportPage = () => {
  const { t } = useI18n();

  return (
    <PageContainer
      title={t('student.report.title')}
      breadcrumb={{
        items: [
          { title: t('nav.student'), path: '/student/dashboard' },
          { title: t('nav.report') },
        ],
      }}
    >
      <ProCard bordered>
        <Empty description={t('student.report.empty')}>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            {t('student.report.emptyHint')}
          </Typography.Paragraph>
        </Empty>
      </ProCard>
    </PageContainer>
  );
};
