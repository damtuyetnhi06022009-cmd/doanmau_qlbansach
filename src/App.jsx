import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import DetailProduct from './components/Products/DetailProduct';
import ProductList from "./components/Products/ProductList";
import ProductCard from "./components/Products/ProductCard";
import Cart from "./components/Pages/Cart";
import Login from "./components/Pages/Login";
import Profile from "./components/Pages/Profile";
import Signup from "./components/Pages/Signup";
import Banner from "./components/Banner/Banner";
import Admin from "./components/Pages/Admin";
import AdminProduct from './components/Pages/AdminProduct';
import AdminCategory from './components/Pages/AdminCategory';
import AdminCustomer from './components/Pages/AdminCustomer';
import AdminEmployee from './components/Pages/AdminEmployee';
import AdminBill from './components/Pages/AdminBill';
import AdminInvoiceDetails from './components/Pages/AdminInvoiceDetails';


function App() {
  const location = useLocation();
  const hideChrome =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/admin';

  return (
    <>
      {!hideChrome && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Banner />
              <ProductList />
            </>
          }
        />
        <Route path="/product/:id" element={<DetailProduct />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="products" element={<AdminProduct />} />
        <Route path="categories" element={<AdminCategory />} />
        <Route path="customers" element={<AdminCustomer />} />
        <Route path="employees" element={<AdminEmployee />} />
        <Route path="bills" element={<AdminBill />} />
        <Route path="invoices/:id" element={<AdminInvoiceDetails />} />

      </Routes>
      {!hideChrome && <Footer />}
    </>
  );
}

export default App;