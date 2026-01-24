import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  List,
  Skeleton,
  Space,
  Tag,
  Tabs,
  Timeline,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchSubmission } from '../../api';

type GradingResult = {
  totalScore: number;
  dimensionScores: {
    grammar: number;
    vocabulary: number;
    structure: number;
    content: number;
    coherence: number;
    handwritingClarity?: number;
  };
  errors: Array<{
    type: string;
    message: string;
    original: string;
    suggestion: string;
  }>;
  suggestions: {
    low: string[];
    mid: string[];
    high: string[];
    rewrite?: string;
  };
  summary: string;
  nextSteps: string[];
};

const statusOrder = ['QUEUED', 'PROCESSING', 'DONE'] as const;

export const SubmissionResultPage = () => {
  const { id } = useParams();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => fetchSubmission(id || ''),
    enabled: !!id,
    refetchInterval: (query) => {
      const result = query.state.data as
        | { status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED' }
        | undefined;
      if (!result) {
        return 2000;
      }
      return result.status === 'DONE' || result.status === 'FAILED' ? false : 2000;
    },
  });

  const status = data?.status || 'QUEUED';
  const grading =
    status === 'DONE' && data?.gradingJson && typeof data.gradingJson === 'object'
      ? (data.gradingJson as GradingResult)
      : null;

  const statusIndex = statusOrder.indexOf(status as (typeof statusOrder)[number]);
  const isFailed = status === 'FAILED';

  const timelineItems = [
    {
      color: isFailed ? 'red' : statusIndex >= 0 ? 'blue' : 'gray',
      children: 'Queued',
    },
    {
      color: isFailed ? 'red' : statusIndex >= 1 ? 'blue' : 'gray',
      children: 'Processing',
    },
    {
      color: status === 'DONE' ? 'green' : 'gray',
      children: 'Done',
    },
    {
      color: isFailed ? 'red' : 'gray',
      children: 'Failed',
    },
  ];

  const suggestionsTabs = [
    {
      key: 'low',
      label: 'Low',
      children: grading?.suggestions?.low?.length ? (
        <List
          size="small"
          dataSource={grading.suggestions.low}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      ) : (
        <Empty description="No low-tier suggestions" />
      ),
    },
    {
      key: 'mid',
      label: 'Mid',
      children: grading?.suggestions?.mid?.length ? (
        <List
          size="small"
          dataSource={grading.suggestions.mid}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      ) : (
        <Empty description="No mid-tier suggestions" />
      ),
    },
    {
      key: 'high',
      label: 'High',
      children: grading?.suggestions?.high?.length ? (
        <List
          size="small"
          dataSource={grading.suggestions.high}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      ) : (
        <Empty description="No high-tier suggestions" />
      ),
    },
  ];

  return (
    <PageContainer
      title="Submission Result"
      breadcrumb={{
        items: [
          { title: 'Student', path: '/student/homeworks' },
          { title: 'Submission' },
        ],
      }}
    >
      {isError ? (
        <Alert
          type="error"
          message="Failed to load submission"
          description={error instanceof Error ? error.message : 'Please try again.'}
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {status === 'FAILED' ? (
        <Alert
          type="error"
          message="Processing failed"
          description={data?.errorMsg || 'Please try submitting again later.'}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {isLoading && !data ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !data ? (
        <Empty description="No submission data" />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Timeline items={timelineItems} />
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Status">
                  <Tag color={status === 'DONE' ? 'green' : status === 'FAILED' ? 'red' : 'blue'}>
                    {status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Score">
                  {data?.totalScore ?? grading?.totalScore ?? '--'}
                </Descriptions.Item>
                <Descriptions.Item label="Summary">
                  {grading?.summary ? (
                    <Typography.Paragraph style={{ margin: 0 }}>{grading.summary}</Typography.Paragraph>
                  ) : (
                    <Typography.Text type="secondary">Waiting for processing</Typography.Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>

          {grading ? (
            <Card>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Dimension Scores">
                    <List
                      size="small"
                      dataSource={Object.entries(grading.dimensionScores || {})}
                      renderItem={([key, value]) => (
                        <List.Item>
                          {key}: {value}
                        </List.Item>
                      )}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Next Steps">
                    {grading.nextSteps?.length ? (
                      <List
                        size="small"
                        dataSource={grading.nextSteps}
                        renderItem={(item) => <List.Item>{item}</List.Item>}
                      />
                    ) : (
                      <Typography.Text type="secondary">--</Typography.Text>
                    )}
                  </Descriptions.Item>
                </Descriptions>
                <Tabs items={suggestionsTabs} />
                <Collapse
                  items={[
                    {
                      key: 'errors',
                      label: 'Errors',
                      children: grading.errors?.length ? (
                        <List
                          size="small"
                          dataSource={grading.errors}
                          renderItem={(item) => (
                            <List.Item>
                              {item.type}: {item.message} ({item.original} {"->"} {item.suggestion})
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Typography.Text type="secondary">No errors</Typography.Text>
                      ),
                    },
                  ]}
                />
                {grading.suggestions?.rewrite ? (
                  <Card type="inner" title="Rewrite">
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      {grading.suggestions.rewrite}
                    </Typography.Paragraph>
                  </Card>
                ) : null}
              </Space>
            </Card>
          ) : null}

          {data?.ocrText ? (
            <Collapse
              items={[
                {
                  key: 'ocr',
                  label: 'OCR Text',
                  children: (
                    <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {data.ocrText}
                    </Typography.Paragraph>
                  ),
                },
              ]}
            />
          ) : null}
        </Space>
      )}
    </PageContainer>
  );
};
