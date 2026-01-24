import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Descriptions, Empty, Tag, Typography } from 'antd';
import { useI18n } from '../../i18n';

export const AdminSystemBudgetPage = () => {
  const { t } = useI18n();

  return (
    <PageContainer
      title={t('admin.systemBudget.title')}
      breadcrumb={{
        items: [
          { title: t('nav.admin'), path: '/admin/dashboard' },
          { title: t('nav.system') },
          { title: t('nav.budget') },
        ],
      }}
    >
      <ProCard bordered>
        <Descriptions column={1} bordered>
          <Descriptions.Item label={t('admin.systemBudget.budgetMode')}>
            <Tag>{t('common.notConfigured')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('admin.systemBudget.dailyCallLimit')}>
            <Typography.Text type="secondary">--</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('admin.systemBudget.tokenLimit')}>
            <Typography.Text type="secondary">--</Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </ProCard>
      <ProCard bordered title={t('admin.systemBudget.usageTrends')} style={{ marginTop: 16 }}>
        {/* TODO: connect budget analytics API */}
        <Empty description={t('admin.systemBudget.empty')} />
      </ProCard>
    </PageContainer>
  );
};
