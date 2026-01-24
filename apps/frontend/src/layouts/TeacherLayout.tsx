import { BookOutlined, ClusterOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import type { ProLayoutProps } from '@ant-design/pro-components';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const routeConfig: ProLayoutProps['route'] = {
  path: '/teacher',
  routes: [
    {
      path: '/teacher/classes',
      name: 'Classes',
      icon: <ClusterOutlined />,
    },
    {
      path: '/teacher/homeworks',
      name: 'Homeworks',
      icon: <BookOutlined />,
    },
  ],
};

export const TeacherLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ProLayout
      title="Homework AI"
      logo={false}
      route={routeConfig}
      location={{ pathname: location.pathname }}
      menuItemRender={(item, dom) => (
        <span onClick={() => item.path && navigate(item.path)} style={{ cursor: 'pointer' }}>
          {dom}
        </span>
      )}
      contentStyle={{ padding: 24 }}
    >
      <Outlet />
    </ProLayout>
  );
};
