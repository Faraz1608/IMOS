import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/loginPage.jsx';
import DashboardPage from './pages/dashboardPage.jsx';
import ProtectedRoute from './components/protectedRoutes.jsx';
import AppLayout from './components/appLayout.jsx';
import LayoutsPage from './pages/layoutPage.jsx';
import LocationsPage from './pages/locationPage.jsx'; // Import the new page
import SkuPage from './pages/skuPage.jsx';
import InventoryPage from './pages/invenetoryPage.jsx';
import InventoryViewPage from './pages/inventoryViewPage.jsx';
import OptimizationsPage from './pages/optimizationPage.jsx';
import LayoutDetailPage from './pages/layoutDeatilPage.jsx';
import SearchPage from './pages/searchPage.jsx';
import RegisterPage from './pages/registerPage.jsx';
function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="layouts" element={<LayoutsPage />} />
          <Route path="layouts/:id" element={<LayoutDetailPage />} />
          <Route path="layouts/:layoutId/locations" element={<LocationsPage />} />
          <Route path="skus" element={<SkuPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/view" element={<InventoryViewPage />} />
          <Route path="optimizations" element={<OptimizationsPage />} />
          <Route path="optimizations" element={<OptimizationsPage />} />
          <Route path="search" element={<SearchPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;