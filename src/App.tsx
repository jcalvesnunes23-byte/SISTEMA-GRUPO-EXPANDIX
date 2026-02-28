import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ToastProvider } from './components/Toast';
import { SettingsPage } from './pages/SettingsPage';
import { ServicesPage } from './pages/ServicesPage';
import { StatusPage } from './pages/StatusPage';
import { FinancePage } from './pages/FinancePage';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<ServicesPage />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="financeiro" element={<FinancePage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
