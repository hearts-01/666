import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Empty,
  InputNumber,
  List,
  Select,
  Space,
  Statistic,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { fetchClasses, fetchTeacherClassReportOverview } from '../../api';
import { useI18n } from '../../i18n';

type ReportSummary = {
  avg: number;
  min: number;
  max: number;
  count: number;
};

type DistributionBucket = {
  bucket: string;
  count: number;
};

type TrendPoint = {
  date: string;
  avg: number;
  count: number;
};

type ErrorTypeStat = {
  type: string;
  count: number;
  ratio: number;
};

type TopRankItem = {
  studentId: string;
  name: string;
  avgScore: number;
  count: number;
};

type ClassReport = {
  classId: string;
  className: string;
  rangeDays: number;
  summary: ReportSummary;
  distribution: DistributionBucket[];
  topRank: TopRankItem[];
  trend: TrendPoint[];
  errorTypes: ErrorTypeStat[];
};

export const TeacherReportPage = () => {
  const { t } = useI18n();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [rangeDays, setRangeDays] = useState<number>(7);

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });

  useEffect(() => {
    if (!selectedClassId && classesQuery.data && classesQuery.data.length) {
      setSelectedClassId(classesQuery.data[0].id);
    }
  }, [classesQuery.data, selectedClassId]);

  const reportQuery = useQuery({
    queryKey: ['teacher-report', selectedClassId, rangeDays],
    queryFn: () => fetchTeacherClassReportOverview(selectedClassId, rangeDays),
    enabled: !!selectedClassId,
  });

  const classOptions = useMemo(
    () =>
      (classesQuery.data || []).map((klass) => ({
        label: klass.name,
        value: klass.id,
      })),
    [classesQuery.data],
  );

  const report = reportQuery.data as ClassReport | undefined;
  const hasSummary = report?.summary?.count && report.summary.count > 0;

  return (
    <PageContainer
      title={t('teacher.reports.title')}
      breadcrumb={{
        items: [
          { title: t('nav.teacher'), path: '/teacher/dashboard' },
          { title: t('nav.reports') },
        ],
      }}
    >
      {reportQuery.isError ? (
        <Alert
          type="error"
          message={t('teacher.reports.loadError')}
          description={reportQuery.error instanceof Error ? reportQuery.error.message : t('common.tryAgain')}
          action={
            <Button size="small" onClick={() => reportQuery.refetch()}>
              {t('common.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <ProCard bordered style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder={t('teacher.reports.selectClass')}
            style={{ minWidth: 220 }}
            options={classOptions}
            loading={classesQuery.isLoading}
            value={selectedClassId || undefined}
            onChange={(value) => setSelectedClassId(value)}
          />
          <Space>
            <Typography.Text>{t('teacher.reports.rangeDays')}</Typography.Text>
            <InputNumber min={1} max={30} value={rangeDays} onChange={(value) => setRangeDays(value || 7)} />
          </Space>
        </Space>
      </ProCard>

      {!selectedClassId ? (
        <Empty description={t('teacher.reports.selectClassHint')} />
      ) : reportQuery.isLoading && !report ? (
        <ProCard bordered loading />
      ) : !report ? (
        <Empty description={t('teacher.reports.noData')} />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <ProCard bordered title={t('teacher.reports.summary')}>
            {hasSummary ? (
              <ProCard gutter={16} wrap>
                <ProCard bordered colSpan={{ xs: 24, sm: 12, md: 6 }}>
                  <Statistic title={t('teacher.reports.avgScore')} value={report.summary.avg} />
                </ProCard>
                <ProCard bordered colSpan={{ xs: 24, sm: 12, md: 6 }}>
                  <Statistic title={t('teacher.reports.highestScore')} value={report.summary.max} />
                </ProCard>
                <ProCard bordered colSpan={{ xs: 24, sm: 12, md: 6 }}>
                  <Statistic title={t('teacher.reports.lowestScore')} value={report.summary.min} />
                </ProCard>
                <ProCard bordered colSpan={{ xs: 24, sm: 12, md: 6 }}>
                  <Statistic title={t('teacher.reports.submissions')} value={report.summary.count} />
                </ProCard>
              </ProCard>
            ) : (
              <Empty description={t('teacher.reports.noCompleted')} />
            )}
          </ProCard>

          <ProCard gutter={16} wrap>
            <ProCard bordered colSpan={{ xs: 24, lg: 12 }} title={t('teacher.reports.scoreDistribution')}>
              {/* TODO: connect chart visualization */}
              {report.distribution?.length ? (
                <List
                  dataSource={report.distribution}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Typography.Text>{item.bucket}</Typography.Text>
                        <Typography.Text>{item.count}</Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description={t('teacher.reports.noDistribution')} />
              )}
            </ProCard>
            <ProCard bordered colSpan={{ xs: 24, lg: 12 }} title={t('teacher.reports.trend')}>
              {/* TODO: connect chart visualization */}
              {report.trend?.length ? (
                <List
                  dataSource={report.trend}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Typography.Text>{item.date}</Typography.Text>
                        <Typography.Text>
                          {t('common.avgShort')} {item.avg}
                        </Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description={t('teacher.reports.noTrend')} />
              )}
            </ProCard>
          </ProCard>

          <ProCard gutter={16} wrap>
            <ProCard bordered colSpan={{ xs: 24, lg: 12 }} title={t('teacher.reports.topStudents')}>
              {report.topRank?.length ? (
                <List
                  dataSource={report.topRank}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Typography.Text>{item.name}</Typography.Text>
                        <Typography.Text>
                          {t('common.avgShort')} {item.avgScore}
                        </Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description={t('teacher.reports.noRanking')} />
              )}
            </ProCard>
            <ProCard bordered colSpan={{ xs: 24, lg: 12 }} title={t('teacher.reports.topErrorTypes')}>
              {report.errorTypes?.length ? (
                <List
                  dataSource={report.errorTypes}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Typography.Text>{item.type}</Typography.Text>
                        <Typography.Text>{item.count}</Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description={t('teacher.reports.noErrorStats')} />
              )}
            </ProCard>
          </ProCard>
        </Space>
      )}
    </PageContainer>
  );
};
