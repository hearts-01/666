import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { TeacherLayout } from '../layouts/TeacherLayout';
import { LoginPage } from '../pages/Login';
import { AdminConfigPage } from '../pages/admin/Config';
import { StudentHomeworksPage } from '../pages/student/Homeworks';
import { StudentReportPage } from '../pages/student/Report';
import { SubmissionResultPage } from '../pages/student/SubmissionResult';
import { SubmitHomeworkPage } from '../pages/student/SubmitHomework';
import { TeacherClassesPage } from '../pages/teacher/Classes';
import { TeacherHomeworksPage } from '../pages/teacher/Homeworks';
import { TeacherReportPage } from '../pages/teacher/Report';
import { TeacherSubmissionDetailPage } from '../pages/teacher/SubmissionDetail';

const NotFound = () => <div style={{ padding: 24 }}>Page not found</div>;

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/teacher',
    element: <TeacherLayout />,
    children: [
      { path: 'classes', element: <TeacherClassesPage /> },
      { path: 'homeworks', element: <TeacherHomeworksPage /> },
      { path: 'submissions/:id', element: <TeacherSubmissionDetailPage /> },
      { path: 'report/:classId', element: <TeacherReportPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/student/homeworks" replace /> },
      { path: 'student/homeworks', element: <StudentHomeworksPage /> },
      { path: 'student/submit/:homeworkId', element: <SubmitHomeworkPage /> },
      { path: 'student/submission/:id', element: <SubmissionResultPage /> },
      { path: 'student/report', element: <StudentReportPage /> },
      { path: 'admin/config', element: <AdminConfigPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
