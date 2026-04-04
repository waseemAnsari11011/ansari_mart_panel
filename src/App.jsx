import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Products } from './pages/Products/Products'
import { Categories } from './pages/Categories/Categories'
import { UsersManagement } from './pages/Users/Users'
import { UserDetail } from './pages/Users/UserDetail'
import { AddCategory } from './pages/Categories/AddCategory'
import { AddProduct } from './pages/Products/AddProduct'
import { ProductDetail } from './pages/Products/ProductDetail'
import { Orders } from './pages/Orders/Orders'
import { OrderDetail } from './pages/Orders/OrderDetail'
import { Settings } from './pages/Settings/Settings'
import Login from './pages/Auth/Login'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<UsersManagement type="Retail" />} />
        <Route path="customers/:id" element={<UserDetail />} />
        <Route path="business" element={<UsersManagement type="Business" />} />
        <Route path="business/:id" element={<UserDetail />} />
        <Route path="categories" element={<Categories />} />
        <Route path="categories/add" element={<AddCategory />} />
        <Route path="categories/edit/:id" element={<AddCategory />} />
        <Route path="products" element={<Products />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="products/edit/:id" element={<AddProduct />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
