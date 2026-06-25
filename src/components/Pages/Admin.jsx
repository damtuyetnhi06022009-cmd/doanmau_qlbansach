import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import AdminProduct from './AdminProduct';
import AdminCategory from './AdminCategory';
import AdminCustomer from './AdminCustomer';
import AdminEmployee from './AdminEmployee';
import AdminBill from './AdminBill';
import AdminInvoiceDetails from './AdminInvoiceDetails';

import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

const SECTION_LABEL = {
  dashboard: 'Dashboard',
  products: 'Sản phẩm',
  category: 'Danh mục',
  customer: 'Khách hàng',
  employee: 'Nhân viên',
  bill: 'Hóa đơn',
  invoiceDetails: 'Chi tiết hóa đơn',
};

function fmtNumber(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtCurrency(n) {
  return `${fmtNumber(Number(n) || 0)} đ`;
}

/* =========================
   BILL STATUS
========================= */
const BILL_STATUS_MAP = {
  delivered: { label: 'Đã giao hàng', cls: 'done' },
  shipping: { label: 'Vận chuyển', cls: 'shipping' },
  pending: { label: 'Chưa giải quyết', cls: 'pending' },
  processing: { label: 'Xử lý', cls: 'processing' },
};

function billStatusFromJson(statusRaw) {
  const key = String(statusRaw || '').trim().toLowerCase();
  if (BILL_STATUS_MAP[key]) {
    return { key, ...BILL_STATUS_MAP[key] };
  }
  return {
    key: 'unknown',
    label: key ? String(statusRaw).trim() : 'Chưa xác định',
    cls: 'unknown',
  };
}

/* =========================
   COMPONENT
========================= */
const Admin = () => {
  const navigate = useNavigate();

  const [allowed, setAllowed] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [adminSection, setAdminSection] = useState('dashboard');

  const userMenuRef = useRef(null);

  /* =========================
     AUTH CHECK
  ========================= */
  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(raw);
      if (u.role !== 'staff') {
        navigate('/');
        return;
      }
      setAllowed(true);
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    if (!allowed) return;

    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [pRes, cRes, bRes, cuRes, eRes, iRes] = await Promise.all([
          fetch(`${jsonBase}product.json`),
          fetch(`${jsonBase}category.json`),
          fetch(`${jsonBase}bill.json`),
          fetch(`${jsonBase}customer.json`),
          fetch(`${jsonBase}employee.json`),
          fetch(`${jsonBase}invoicedetails.json`),
        ]);

        if (!pRes.ok) throw new Error('Không tải được product.json');
        const pdata = await pRes.json();
        setProducts(Array.isArray(pdata) ? pdata : []);

        if (cRes.ok) {
          const cdata = await cRes.json();
          setCategories(Array.isArray(cdata) ? cdata : []);
        }
        if (bRes.ok) {
          const bdata = await bRes.json();
          setBills(Array.isArray(bdata) ? bdata : []);
        }
        if (cuRes.ok) {
          const cudata = await cuRes.json();
          setCustomers(Array.isArray(cudata) ? cudata : []);
        }
        if (eRes.ok) {
          const edata = await eRes.json();
          setEmployees(Array.isArray(edata) ? edata : []);
        }
        if (iRes.ok) {
          const idata = await iRes.json();
          setInvoiceDetails(Array.isArray(idata) ? idata : []);
        }
      } catch (e) {
        setLoadError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [allowed]);

  /* =========================
     USER MENU CLOSING
  ========================= */
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  /* =========================
     USER INFO MEMOS
  ========================= */
  const staffInitials = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return 'AD';
      const u = JSON.parse(raw);
      const name = String(u.user || u.name || 'Staff').trim();
      const parts = name.split(/\s+/).filter(Boolean);
      if (!parts.length) return 'AD';
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } catch {
      return 'AD';
    }
  }, []);

  const staffDisplayName = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return 'Administrator';
      const u = JSON.parse(raw);
      return String(u.user || u.name || 'Staff').trim() || 'Administrator';
    } catch {
      return 'Administrator';
    }
  }, []);

  /* =========================
     STATS CALCULATION
  ========================= */
  const stats = useMemo(() => {
    const total = products.length;
    const soldSum = invoiceDetails.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const catCount = categories.length;
    const uncategorized = products.filter((p) => p.categoryid == null || p.categoryid === '').length;
    const revenue = bills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
    const avgBill = bills.length ? revenue / bills.length : 0;

    return { total, soldSum, catCount, uncategorized, revenue, avgBill };
  }, [products, categories, invoiceDetails, bills]);

  const goHome = () => navigate('/');
  const logout = () => {
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/login');
    setLogoutModalOpen(false);
  };
  const closeMobileNav = () => setMobileSidebarOpen(false);

  if (!allowed) return <div className="ruang-boot" aria-hidden />;

  return (
    <div className="ruang-layout">
      {/* OVERLAY */}
      <div
        className={`ruang-overlay ${mobileSidebarOpen ? 'is-visible' : ''}`}
        onClick={closeMobileNav}
        aria-hidden={!mobileSidebarOpen}
      />

      {/* SIDEBAR */}
      <aside className={`ruang-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
        <div className="ruang-sidebar__brand">
          <span className="ruang-sidebar__brand-icon">
            <i className="fa-solid fa-layer-group" />
          </span>
          <span>Novela</span>
        </div>
        <hr className="ruang-sidebar__divider" />
        <div className="ruang-sidebar__heading">Tiện ích</div>
        <nav>
          <ul className="ruang-sidebar__nav" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {Object.entries(SECTION_LABEL).map(([key, label]) => (
              <li key={key}>
                <button
                  type="button"
                  className={`ruang-sidebar__link ${adminSection === key ? 'is-active' : ''}`}
                  onClick={() => {
                    setAdminSection(key);
                    closeMobileNav();
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* SHELL */}
      <div className="ruang-shell">
        {/* TOPBAR */}
        <header className="ruang-topbar">
          <button
            type="button"
            className="ruang-topbar__toggle"
            onClick={() => setMobileSidebarOpen((v) => !v)}
          >
            <i className="fa-solid fa-bars" />
          </button>

          <div className="ruang-topbar__right">
            <div className="ruang-user" ref={userMenuRef}>
              <button
                type="button"
                className="ruang-user__toggle"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <span className="ruang-user__avatar">{staffInitials}</span>
                <span className="ruang-user__name">{staffDisplayName}</span>
              </button>

              {userMenuOpen && (
                <div className="ruang-user__menu">
                  <button type="button" onClick={goHome}>Trang chủ</button>
                  <button type="button" onClick={() => setLogoutModalOpen(true)}>Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="ruang-main">
          {loadError && <div className="admin-msg admin-msg--error">{loadError}</div>}

          {loading ? (
            <div className="ruang-loading">Đang tải...</div>
          ) : (
            <>
              {adminSection === 'products' && <AdminProduct embedded />}
              {adminSection === 'category' && <AdminCategory embedded />}
              {adminSection === 'customer' && <AdminCustomer embedded />}
              {adminSection === 'employee' && <AdminEmployee embedded />}
              {adminSection === 'bill' && <AdminBill embedded />}
              {adminSection === 'invoiceDetails' && <AdminInvoiceDetails embedded />}

              {adminSection === 'dashboard' && (
                <div>
                  <h1 className="ruang-heading">Dashboard</h1>
                  
                  {/* Thay stats-grid thành ruang-cards để kích hoạt thuộc tính grid CSS mới */}
                  <div className="ruang-cards">
                    
                    {/* Thẻ Doanh Thu */}
                    <div className="ruang-stat-card">
                      <div className="ruang-stat-card__body">
                        <div className="ruang-stat-card__label">Doanh thu</div>
                        <div className="ruang-stat-card__value">{fmtCurrency(stats.revenue)}</div>
                      </div>
                      <div className="ruang-stat-card__icon">
                        <i className="fa-solid fa-money-bill-wave" />
                      </div>
                    </div>

                    {/* Thẻ Sản Phẩm */}
                    <div className="ruang-stat-card ruang-stat-card--green">
                      <div className="ruang-stat-card__body">
                        <div className="ruang-stat-card__label">Sản phẩm</div>
                        <div className="ruang-stat-card__value">{fmtNumber(stats.total)}</div>
                      </div>
                      <div className="ruang-stat-card__icon">
                        <i className="fa-solid fa-box" />
                      </div>
                    </div>

                    {/* Thẻ Khách Hàng */}
                    <div className="ruang-stat-card ruang-stat-card--cyan">
                      <div className="ruang-stat-card__body">
                        <div className="ruang-stat-card__label">Khách hàng</div>
                        <div className="ruang-stat-card__value">{fmtNumber(customers.length)}</div>
                      </div>
                      <div className="ruang-stat-card__icon">
                        <i className="fa-solid fa-users" />
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* FOOTER */}
        <footer className="ruang-footer">Copyright © Novela</footer>
      </div>

      {/* LOGOUT MODAL */}
      {logoutModalOpen && (
        <div className="ruang-modal-backdrop">
          <div className="ruang-modal">
            <div className="ruang-modal__header">
              <h5>Đăng xuất</h5>
              <button
                type="button"
                className="ruang-modal__close"
                onClick={() => setLogoutModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="ruang-modal__body">Bạn có chắc muốn đăng xuất?</div>
            <div className="ruang-modal__footer">
              <button
                type="button"
                className="ruang-modal__btn"
                onClick={() => setLogoutModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="ruang-modal__btn ruang-modal__btn--danger"
                onClick={logout}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;