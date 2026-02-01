import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Descriptions, Tag, Typography } from 'antd';
import { SoftEmpty } from '../../components/SoftEmpty';
import { useI18n } from '../../i18n';

export const TeacherSettingsGradingPage = () => {
  const { t } = useI18n();
  const defaultMode = import.meta.env.VITE_GRADING_MODE || t('common.notConfigured');
  const budgetMode = import.meta.env.VITE_BUDGET_MODE || t('common.notConfigured');

  return (
    <PageContainer
      title={t('teacher.settings.gradingTitle')}
      breadcrumb={{
        items: [
          { title: t('nav.teacher'), path: '/teacher/dashboard' },
          { title: t('nav.settings') },
          { title: t('nav.grading') },
        ],
      }}
    >
      <ProCard bordered>
        <Descriptions column={1} bordered>
          <Descriptions.Item label={t('teacher.settings.defaultGradingMode')}>
            <Tag>{defaultMode}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('teacher.settings.budgetMode')}>
            <Tag>{budgetMode}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('teacher.settings.provider')}>
            <Typography.Text type="secondary">{t('teacher.settings.configuredByAdmin')}</Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </ProCard>
      <ProCard bordered title={t('teacher.settings.advancedTitle')} style={{ marginTop: 16 }}>
        {/* TODO: connect grading configuration API */}
        <SoftEmpty description={t('teacher.settings.advancedEmpty')} />
      </ProCard>
    </PageContainer>
  );
};
