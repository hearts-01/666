import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProFormDateTimePicker,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, Button, Empty, Select, Skeleton, Space, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createHomework, fetchClasses, fetchHomeworksByClass } from '../../api';
import { useI18n } from '../../i18n';

type HomeworkItem = {
  id: string;
  title: string;
  desc?: string | null;
  dueAt?: string | null;
};

type ClassOption = {
  label: string;
  value: string;
};

export const TeacherHomeworksPage = () => {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useI18n();

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });

  const classOptions = useMemo<ClassOption[]>(
    () =>
      (classesQuery.data || []).map((klass) => ({
        label: klass.name,
        value: klass.id,
      })),
    [classesQuery.data],
  );

  useEffect(() => {
    if (!selectedClassId && classesQuery.data && classesQuery.data.length) {
      setSelectedClassId(classesQuery.data[0].id);
    }
  }, [classesQuery.data, selectedClassId]);

  const homeworksQuery = useQuery({
    queryKey: ['homeworks', selectedClassId],
    queryFn: () => fetchHomeworksByClass(selectedClassId || ''),
    enabled: !!selectedClassId,
  });

  const createMutation = useMutation({
    mutationFn: createHomework,
    onSuccess: async () => {
      if (selectedClassId) {
        await queryClient.invalidateQueries({ queryKey: ['homeworks', selectedClassId] });
      }
      message.success(t('teacher.homeworks.created'));
    },
    onError: () => message.error(t('teacher.homeworks.createFailed')),
  });

  const columns: ProColumns<HomeworkItem>[] = [
    {
      title: t('common.title'),
      dataIndex: 'title',
    },
    {
      title: t('common.description'),
      dataIndex: 'desc',
      renderText: (value) => value || '--',
    },
    {
      title: t('common.due'),
      dataIndex: 'dueAt',
      renderText: (value) => (value ? new Date(value).toLocaleString() : t('status.noDue')),
    },
    {
      title: t('common.action'),
      valueType: 'option',
      render: (_, item) => [
        <Button
          key="view"
          onClick={() =>
            navigate(`/teacher/homeworks/${item.id}`, {
              state: { homework: item, classId: selectedClassId },
            })
          }
        >
          {t('common.view')}
        </Button>,
      ],
    },
  ];

  const noClasses = !classesQuery.isLoading && (classesQuery.data || []).length === 0;

  return (
    <PageContainer
      title={t('nav.homeworks')}
      breadcrumb={{
        items: [
          { title: t('nav.teacher'), path: '/teacher/dashboard' },
          { title: t('nav.homeworks') },
        ],
      }}
    >
      {classesQuery.isError ? (
        <Alert
          type="error"
          message={t('teacher.homeworks.loadClassesError')}
          description={
            classesQuery.error instanceof Error
              ? classesQuery.error.message
              : t('common.tryAgain')
          }
          action={
            <Button size="small" onClick={() => classesQuery.refetch()}>
              {t('common.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {homeworksQuery.isError ? (
        <Alert
          type="error"
          message={t('teacher.homeworks.loadHomeworksError')}
          description={
            homeworksQuery.error instanceof Error
              ? homeworksQuery.error.message
              : t('common.tryAgain')
          }
          action={
            <Button size="small" onClick={() => homeworksQuery.refetch()}>
              {t('common.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {classesQuery.isLoading && !classesQuery.data ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : noClasses ? (
        <Empty description={t('teacher.homeworks.noClasses')}>
          <Button type="primary" onClick={() => navigate('/teacher/classes')}>
            {t('teacher.homeworks.createClass')}
          </Button>
        </Empty>
      ) : (
        <ProCard bordered>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              style={{ minWidth: 220 }}
              placeholder={t('teacher.homeworks.selectClass')}
              options={classOptions}
              loading={classesQuery.isLoading}
              value={selectedClassId || undefined}
              onChange={(value) => setSelectedClassId(value)}
            />
            <ModalForm
              title={t('teacher.homeworks.createHomework')}
              trigger={<Button type="primary">{t('teacher.homeworks.createHomework')}</Button>}
              onFinish={async (values) => {
                if (!selectedClassId) {
                  message.warning(t('teacher.homeworks.selectClassFirst'));
                  return false;
                }
                const dueAtValue = values.dueAt as { toISOString?: () => string } | undefined;
                await createMutation.mutateAsync({
                  classId: selectedClassId,
                  title: values.title as string,
                  desc: values.desc as string | undefined,
                  dueAt: dueAtValue?.toISOString?.(),
                });
                return true;
              }}
              modalProps={{ destroyOnClose: true }}
              submitter={{ submitButtonProps: { loading: createMutation.isPending } }}
            >
              <ProFormText
                name="title"
                label={t('teacher.homeworks.homeworkTitle')}
                placeholder={t('teacher.homeworks.homeworkTitlePlaceholder')}
                rules={[{ required: true, message: t('teacher.homeworks.homeworkTitleRequired') }]}
              />
              <ProFormTextArea
                name="desc"
                label={t('common.description')}
                fieldProps={{ rows: 3 }}
                placeholder={t('teacher.homeworks.descriptionPlaceholder')}
              />
              <ProFormDateTimePicker name="dueAt" label={t('common.dueAt')} />
            </ModalForm>
          </Space>
          {homeworksQuery.isLoading && !homeworksQuery.data ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <ProTable<HomeworkItem>
              rowKey="id"
              columns={columns}
              dataSource={homeworksQuery.data || []}
              loading={homeworksQuery.isLoading}
              search={false}
              pagination={false}
              options={false}
              locale={{ emptyText: <Empty description={t('teacher.homeworks.empty')} /> }}
            />
          )}
        </ProCard>
      )}
    </PageContainer>
  );
};
