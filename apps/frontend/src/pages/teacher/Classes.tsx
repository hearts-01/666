import type { ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormText, ProTable } from '@ant-design/pro-components';
import { Alert, Button, Empty, Skeleton, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClass, fetchClasses } from '../../api';

type ClassItem = {
  id: string;
  name: string;
  grade?: string | null;
};

export const TeacherClassesPage = () => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });

  const createMutation = useMutation({
    mutationFn: createClass,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      message.success('Class created');
    },
    onError: () => message.error('Failed to create class'),
  });

  const columns: ProColumns<ClassItem>[] = [
    {
      title: 'Class',
      dataIndex: 'name',
      width: '50%',
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      renderText: (value) => value || '-',
    },
  ];

  return (
    <PageContainer
      title="Classes"
      breadcrumb={{
        items: [
          { title: 'Teacher', path: '/teacher/classes' },
          { title: 'Classes' },
        ],
      }}
    >
      {isError ? (
        <Alert
          type="error"
          message="Failed to load classes"
          description={error instanceof Error ? error.message : 'Please try again.'}
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {isLoading && !data ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <ProTable<ClassItem>
          rowKey="id"
          columns={columns}
          dataSource={data || []}
          loading={isLoading}
          search={false}
          pagination={false}
          options={false}
          locale={{ emptyText: <Empty description="No classes yet" /> }}
          toolBarRender={() => [
            <ModalForm
              key="create"
              title="Create Class"
              trigger={<Button type="primary">Create Class</Button>}
              onFinish={async (values) => {
                await createMutation.mutateAsync(values as { name: string; grade?: string });
                return true;
              }}
              modalProps={{ destroyOnClose: true }}
              submitter={{
                submitButtonProps: { loading: createMutation.isPending },
              }}
            >
              <ProFormText
                name="name"
                label="Class Name"
                placeholder="Class 1A"
                rules={[{ required: true, message: 'Please input class name' }]}
              />
              <ProFormText name="grade" label="Grade" placeholder="Grade 7" />
            </ModalForm>,
          ]}
        />
      )}
    </PageContainer>
  );
};
