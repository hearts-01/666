import { PageContainer } from '@ant-design/pro-components';
import { Card, Descriptions, Empty, Tag, Typography } from 'antd';
import { useI18n } from '../../i18n';

export const TeacherSubmissionDetailPage = () => {
  const { t } = useI18n();

  return (
    <PageContainer
      title={t('teacher.submissionDetail.title')}
      breadcrumb={{
        items: [
          { title: t('nav.teacher'), path: '/teacher/classes' },
          { title: t('teacher.submissionDetail.breadcrumb') },
        ],
      }}
    >
      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label={t('common.student')}>{`${t('common.student')} 01`}</Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Tag color="green">{t('status.done')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('common.score')}>--</Descriptions.Item>
        </Descriptions>
        <Empty description={t('teacher.submissionDetail.empty')}>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            {t('teacher.submissionDetail.emptyHint')}
          </Typography.Paragraph>
        </Empty>
      </Card>
    </PageContainer>
  );
};
