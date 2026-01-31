import { LockOutlined, UserOutlined } from '@ant-design/icons';
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
    <div className="login-dashboard dashboard-clean">
      <header className="login-dashboard__header">
        <div className="login-dashboard__brand">
          <span className="login-dashboard__brand-title">{t('app.title')}</span>
          <span className="login-dashboard__brand-subtitle">{t('login.title')}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="login-dashboard__main">
        <section className="login-dashboard__panel">
          <div>
            <Typography.Title level={2} className="login-dashboard__headline">
              {t('login.welcomeTitle')}
            </Typography.Title>
            <Typography.Text className="login-dashboard__subhead">
              {t('login.welcomeSubtitle')}
            </Typography.Text>
          </div>
          <div className="login-dashboard__tiles">
            <div className="login-dashboard__tile">
              <span className="login-dashboard__tile-label">{t('nav.homeworks')}</span>
              <span className="login-dashboard__tile-value">128</span>
            </div>
            <div className="login-dashboard__tile">
              <span className="login-dashboard__tile-label">{t('nav.submissions')}</span>
              <span className="login-dashboard__tile-value">36</span>
            </div>
            <div className="login-dashboard__tile">
              <span className="login-dashboard__tile-label">{t('nav.report')}</span>
              <span className="login-dashboard__tile-value">94%</span>
            </div>
          </div>
          <div className="login-dashboard__sparkline" />
        </section>

        <Card className="login-dashboard__card">
          <Typography.Title level={4} className="login-dashboard__title">
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
      </main>
    </div>
  );
};
