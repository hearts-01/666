import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { authStore, login } from '../api';
import { useI18n } from '../i18n';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const onFinish = async (values: { account: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values.account, values.password);
      authStore.setToken(result.token);
      authStore.setUser(result.user);
      message.success(t('login.success'));

      if (result.user.role === 'TEACHER') {
        navigate('/teacher/classes');
      } else if (result.user.role === 'ADMIN') {
        navigate('/admin/config');
      } else {
        navigate('/student/homeworks');
      }
    } catch (error) {
      message.error(t('login.failure'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title={t('login.title')} extra={<LanguageSwitcher />}>
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
        <Card style={{ width: 360 }}>
          <Typography.Title level={4} style={{ textAlign: 'center' }}>
            {t('login.title')}
          </Typography.Title>
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="account"
              label={t('login.account')}
              rules={[{ required: true, message: t('login.accountRequired') }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t('login.accountPlaceholder')}
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={t('login.password')}
              rules={[{ required: true, message: t('login.passwordRequired') }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('login.passwordPlaceholder')}
                autoComplete="current-password"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {t('login.signIn')}
            </Button>
          </Form>
        </Card>
      </div>
    </PageContainer>
  );
};
