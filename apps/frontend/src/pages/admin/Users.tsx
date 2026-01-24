import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Alert, Button, Empty, Input, Select, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n';

type UserRow = {
  id: string;
  name: string;
  account: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
};

export const AdminUsersPage = () => {
  const { t } = useI18n();
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const roleMeta = useMemo(
    () => ({
      STUDENT: { label: t('role.student'), color: 'blue' },
      TEACHER: { label: t('role.teacher'), color: 'green' },
      ADMIN: { label: t('role.admin'), color: 'gold' },
    }),
    [t],
  );

  const { data, isLoading, isError, error, refetch } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    // TODO: replace placeholder with admin users API
    queryFn: async () => [],
  });

  const filteredData = useMemo(() => {
    const list = (data || []) as UserRow[];
    return list.filter((item) => {
      if (roleFilter !== 'all' && item.role !== roleFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const needle = keyword.toLowerCase();
      return item.name.toLowerCase().includes(needle) || item.account.toLowerCase().includes(needle);
    });
  }, [data, keyword, roleFilter]);

  const columns: ProColumns<UserRow>[] = [
    {
      title: t('admin.users.name'),
      dataIndex: 'name',
      render: (value) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: t('common.account'),
      dataIndex: 'account',
    },
    {
      title: t('admin.users.role'),
      dataIndex: 'role',
      render: (_, item) => {
        const meta = roleMeta[item.role];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
      width: 160,
    },
  ];

  return (
    <PageContainer
      title={t('nav.users')}
      breadcrumb={{
        items: [
          { title: t('nav.admin'), path: '/admin/dashboard' },
          { title: t('nav.users') },
        ],
      }}
    >
      {isError ? (
        <Alert
          type="error"
          message={t('admin.users.loadError')}
          description={error instanceof Error ? error.message : t('common.tryAgain')}
          action={
            <Button size="small" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <ProCard bordered>
        <ProTable<UserRow>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          search={false}
          pagination={{ pageSize: 8 }}
          options={false}
          locale={{
            emptyText: (
              <Empty description={t('admin.users.empty')}>
                <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
                  {t('admin.users.emptyHint')}
                </Typography.Paragraph>
              </Empty>
            ),
          }}
          toolBarRender={() => [
            <Input.Search
              key="search"
              placeholder={t('admin.users.searchPlaceholder')}
              allowClear
              onSearch={(value) => setKeyword(value.trim())}
              style={{ width: 220 }}
            />,
            <Select
              key="role"
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              style={{ width: 160 }}
              options={[
                { label: t('common.allRoles'), value: 'all' },
                { label: t('role.student'), value: 'STUDENT' },
                { label: t('role.teacher'), value: 'TEACHER' },
                { label: t('role.admin'), value: 'ADMIN' },
              ]}
            />,
          ]}
        />
      </ProCard>
    </PageContainer>
  );
};
