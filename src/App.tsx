import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { WeightPage } from './pages/WeightPage';
import { FoodPage } from './pages/FoodPage';
import { ActivityPage } from './pages/ActivityPage';
import { OverviewPage } from './pages/OverviewPage';
import { GoalPage } from './pages/GoalPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/weight" replace />} />
        <Route path="/weight" element={<WeightPage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/goal" element={<GoalPage />} />
        <Route path="/gym" element={<Navigate to="/activity" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
      </Route>
    </Routes>
  );
}
