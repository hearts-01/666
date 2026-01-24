import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, InputNumber, Switch } from 'antd';
import { useI18n } from '../../i18n';

export const AdminConfigPage = () => {
  const { t } = useI18n();

  return (
    <PageContainer
      title={t('admin.config.title')}
      breadcrumb={{
        items: [
          { title: t('nav.admin'), path: '/admin/config' },
          { title: t('admin.config.config') },
        ],
      }}
    >
      <Card>
        <Form layout="vertical" initialValues={{ enableBudgetLimit: true, budgetLimit: 100 }}>
          <Form.Item
            label={t('admin.config.enableBudgetLimit')}
            name="enableBudgetLimit"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item label={t('admin.config.dailyBudgetLimit')} name="budgetLimit">
            <InputNumber min={0} addonAfter="USD" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};
