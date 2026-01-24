import { Layout, Menu, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useI18n } from '../i18n';

const { Header, Content } = Layout;

export const StudentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { t } = useI18n();

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/student/dashboard')) {
      return '/student/dashboard';
    }
    if (path.startsWith('/student/submissions') || path.startsWith('/student/submission')) {
      return '/student/submissions';
    }
    if (path.startsWith('/student/report')) {
      return '/student/report';
    }
    if (path.startsWith('/student/submit')) {
      return '/student/homeworks';
    }
    return '/student/homeworks';
  }, [location.pathname]);

  const items = useMemo<MenuProps['items']>(
    () => [
      { key: '/student/dashboard', label: t('nav.dashboard') },
      { key: '/student/homeworks', label: t('nav.homeworks') },
      { key: '/student/submissions', label: t('nav.submissions') },
      { key: '/student/report', label: t('nav.report') },
    ],
    [t],
  );

  return (
    <Layout className="app-student-layout" style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '0 28px',
          height: 60,
          background: token.colorBgElevated,
          borderBottom: `1px solid ${token.colorSplit}`,
          boxShadow: token.boxShadowSecondary,
        }}
      >
        <Typography.Title level={4} style={{ color: token.colorTextHeading, margin: 0 }}>
          {t('app.title')}
        </Typography.Title>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={(info) => navigate(info.key)}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            borderBottom: 'none',
            fontWeight: 500,
            height: 60,
            lineHeight: '60px',
          }}
        />
        <LanguageSwitcher />
      </Header>
      <Content>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '24px 24px 40px',
            width: '100%',
          }}
        >
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};
