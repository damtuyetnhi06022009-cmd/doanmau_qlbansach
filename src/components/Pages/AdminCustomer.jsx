import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

// Khởi tạo form trống phù hợp dữ liệu khách hàng
const emptyForm = () => ({
  id: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  type: 'Cá nhân'
});

function rowToForm(c) {
  return {
    id: String(c.id),
    name: c.name ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    address: c.address ?? '',
    type: c.type ?? 'Cá nhân'
  };
}

function formToRow(form, nextId) {
  return {
    id: form.id ? form.id : nextId, // Giữ nguyên chuỗi ID nếu sửa, hoặc gán ID mới tạo
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
    type: form.type.trim()
  };
}

function AdminCustomer({ embedded = false }) {
  const navigate = useNavigate();

  const [allowed, setAllowed] = useState(embedded);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [form, setForm] = useState(emptyForm());
  const [isNew, setIsNew] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [appliedSearchId, setAppliedSearchId] = useState('');

  const displayedRows = useMemo(() => {
    const q = appliedSearchId.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => String(r.id).toLowerCase().includes(q));
  }, [rows, appliedSearchId]);

  // Đổi luồng lưu về lưu trực tiếp tệp public/customer.json
  const persist = useCallback(async (nextList) => {
    setSaving(true);
    setSaveError('');
    try {
      // Nếu file gốc chỉ lưu 1 object, khi lưu nhiều ta nên lưu dạng mảng hoặc giữ nguyên cục bộ
      // Để tránh lỗi ghi, ta chuyển danh sách thành dạng cấu trúc chuẩn
      await axios.put('./public/customer.json', nextList, {
        headers: { 'Content-Type': 'application/json' },
      });
      setRows(nextList);
      setView('list');
      setForm(emptyForm());
      setIsNew(false);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || err.response?.status === 404
          ? 'Chỉ lưu được khi chạy bằng lệnh Vite (npm run dev).'
          : null) ||
        'Không lưu được dữ liệu vào customer.json.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (embedded) {
      setAllowed(true);
      return;
    }
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(raw);
      // Hỗ trợ cả 'staff' và 'admin' để tránh bị chặn trắng trang bên ngoài
      if (u.role !== 'staff' && u.role !== 'admin') {
        navigate('/');
        return;
      }
      setAllowed(true);
    } catch {
      navigate('/login');
    }
  }, [navigate, embedded]);

  useEffect(() => {
    if (!allowed) return;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await fetch(`${jsonBase}customer.json`);
        if (!res.ok) throw new Error('Không tải được customer.json trong thư mục public');
        const data = await res.json();
        
        // GIẢI QUYẾT LỖI TRẮNG TRANG: Nếu dữ liệu tải về là 1 Object đơn lẻ, tự động chuyển thành Mảng để Map không lỗi
        if (data && !Array.isArray(data)) {
          setRows([data]);
        } else {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setLoadError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [allowed]);

  const openCreate = () => {
    setIsNew(true);
    setForm(emptyForm());
    setView('form');
    setSaveError('');
  };

  const openEdit = (c) => {
    setIsNew(false);
    setForm(rowToForm(c));
    setView('form');
    setSaveError('');
  };

  const cancelForm = () => {
    setView('list');
    setForm(emptyForm());
    setIsNew(false);
    setSaveError('');
  };

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError('Vui lòng nhập tên khách hàng');
      return;
    }

    let nextList;
    if (isNew) {
      // Tạo mã ID dạng KHxxx tiếp theo một cách thông minh
      const numericIds = rows
        .map(r => {
          const match = String(r.id).match(/\d+/);
          return match ? Number(match[0]) : 0;
        });
      const maxNum = numericIds.length > 0 ? Math.max(...numericIds) : 0;
      const nextId = `KH${String(maxNum + 1).padStart(3, '0')}`;
      
      const built = formToRow(form, nextId);
      nextList = [...rows, built];
    } else {
      const built = formToRow(form, form.id);
      const idx = rows.findIndex((r) => String(r.id) === String(form.id));
      if (idx === -1) {
        setSaveError('Không tìm thấy bản ghi để cập nhật');
        return;
      }
      nextList = rows.map((r) => (String(r.id) === String(form.id) ? built : r));
    }
    persist(nextList);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Xóa khách hàng này khỏi danh sách?')) return;
    persist(rows.filter((r) => String(r.id) !== String(id)));
  };

  const applyIdSearch = () => setAppliedSearchId(searchIdInput.trim());
  const clearIdSearch = () => {
    setSearchIdInput('');
    setAppliedSearchId('');
  };

  const bodyContent = (
    <div className="admin-row">
      {loadError && <div className="admin-msg admin-msg--error">{loadError}</div>}
      {saveError && <div className="admin-msg admin-msg--error">{saveError}</div>}
      {loading ? (
        <p>Đang tải dữ liệu khách hàng...</p>
      ) : view === 'list' ? (
        <>
          <div className="admin-toolbar admin-toolbar--row">
            <button type="button" className="admin-btn" onClick={openCreate} disabled={saving}>
              + Thêm khách hàng
            </button>
            <div className="admin-toolbar-search">
              <label htmlFor="admin-customer-search-id">Tìm kiếm ID: </label>
              <input
                id="admin-customer-search-id"
                type="text"
                placeholder="Ví dụ: KH001"
                value={searchIdInput}
                onChange={(e) => setSearchIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyIdSearch();
                  }
                }}
              />
              <button type="button" className="admin-btn" onClick={applyIdSearch} disabled={saving}>
                Tìm
              </button>
              {appliedSearchId.trim() !== '' && (
                <button type="button" className="admin-btn admin-btn--ghost" onClick={clearIdSearch} disabled={saving}>
                  Hiện tất cả
                </button>
              )}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã KH (ID)</th>
                  <th>Tên khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Email</th>
                  <th>Địa chỉ</th>
                  <th>Phân loại</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-table_empty">
                      {appliedSearchId.trim()
                        ? `Không tìm thấy khách hàng nào khớp với mã "${appliedSearchId.trim()}".`
                        : 'Chưa có dữ liệu khách hàng nào.'}
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.id}</strong></td>
                      <td>{r.name}</td>
                      <td>{r.phone || '---'}</td>
                      <td>{r.email || '---'}</td>
                      <td>{r.address || '---'}</td>
                      <td>{r.type || 'Cá nhân'}</td>
                      <td>
                        <div className="admin-table__actions">
                            <button
                              type="button"
                              className="admin-table__link"
                              onClick={() => openEdit(p)}
                              disabled={saving}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="admin-table__link admin-table__link--danger"
                              onClick={() => handleDelete(p.id)}
                              disabled={saving}
                            >
                              Xóa
                            </button>
                          </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form className="admin-form-card" onSubmit={handleSubmitForm}>
          <h2>{isNew ? 'Đăng ký khách hàng mới' : 'Cập nhật thông tin khách hàng'}</h2>
          <div className="admin-form-grid">
            {!isNew && (
              <label>
                Mã khách hàng
                <input value={form.id} readOnly style={{ backgroundColor: '#f0f0f0' }} />
              </label>
            )}
            <label className="admin-form-grid_full">
              Họ và tên
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </label>
            <label className="admin-form-grid_full">
              Số điện thoại
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                required
              />
            </label>
            <label className="admin-form-grid_full">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </label>
            <label className="admin-form-grid_full">
              Địa chỉ
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
              />
            </label>
            <label className="admin-form-grid_full">
              Loại khách hàng
              <select 
                value={form.type} 
                onChange={(e) => handleFormChange('type', e.target.value)}
                style={{ width: '100%', padding: '6px', marginTop: '4px' }}
              >
                <option value="Cá nhân">Cá nhân</option>
                <option value="Doanh nghiệp">Doanh nghiệp</option>
                <option value="Đại lý">Đại lý</option>
              </select>
            </label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu lại'}
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={cancelForm} disabled={saving}>
              Hủy bỏ
            </button>
          </div>
        </form>
      )}
    </div>
  );

  return allowed ? <div className="admin-customer-container">{bodyContent}</div> : null;
}

export default AdminCustomer;