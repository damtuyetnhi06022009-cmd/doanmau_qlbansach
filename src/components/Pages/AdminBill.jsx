import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

// Đồng bộ danh sách trạng thái theo tiếng Việt từ file bill.json thực tế
const STATUS_OPTIONS = [
  { value: 'Đã thanh toán', label: 'Đã thanh toán' },
  { value: 'Chưa thanh toán', label: 'Chưa thanh toán' },
  { value: 'Đã hủy', label: 'Đã hủy' },
];

const emptyForm = () => ({
  id: '',
  date: '',
  employeeId: '',
  customerId: '',
  total: '',
  status: 'Đã thanh toán',
  paymentMethod: 'Tiền mặt',
  discount: '0',
  note: '',
});

function rowToForm(b) {
  return {
    id: String(b.id || ''),
    date: String(b.date || '').slice(0, 10),
    employeeId: String(b.employeeId || ''),
    customerId: String(b.customerId || ''),
    total: b.total !== null && b.total !== undefined ? String(b.total) : '',
    status: b.status || 'Đã thanh toán',
    paymentMethod: b.paymentMethod || 'Tiền mặt',
    discount: b.discount !== null && b.discount !== undefined ? String(b.discount) : '0',
    note: b.note || '',
  };
}

function formToRow(form) {
  return {
    id: form.id.trim(), // Giữ nguyên định dạng chuỗi mã (Vd: HD0001)
    date: form.date.trim(),
    employeeId: form.employeeId.trim(),
    customerId: form.customerId.trim(),
    total: Number(form.total) || 0,
    status: form.status,
    paymentMethod: form.paymentMethod,
    discount: Number(form.discount) || 0,
    note: form.note.trim(),
  };
}

function validateRow(built, isNew, existingRows) {
  if (!built.id) return 'Vui lòng nhập Mã hóa đơn';
  if (isNew && existingRows.some((r) => String(r.id).toLowerCase() === built.id.toLowerCase())) {
    return 'Mã hóa đơn này đã tồn tại';
  }
  if (!built.customerId) return 'Vui lòng nhập Mã khách hàng';
  if (!built.employeeId) return 'Vui lòng nhập Mã nhân viên';
  if (!built.date) return 'Vui lòng chọn ngày';
  if (isNaN(built.total) || built.total < 0) return 'Tổng tiền phải là số lớn hơn hoặc bằng 0';
  return null;
}

function AdminBill({ embedded = false }) {
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

  const persist = useCallback(async (nextList) => {
    setSaving(true);
    setSaveError('');
    try {
      await axios.put('./public/bill.json', nextList, {
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
          ? 'Chỉ lưu được khi chạy npm run dev hoặc npm run preview (API Vite).'
          : null) ||
        'Không lưu được dữ liệu.';
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
        const res = await fetch(`${jsonBase}bill.json`);
        if (!res.ok) throw new Error('Không tải được bill.json');
        const data = await res.json();
        setRows(Array.isArray(data) ? data : [data]); // Hỗ trợ nếu file chỉ có 1 Object duy nhất
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

  const openEdit = (b) => {
    setIsNew(false);
    setForm(rowToForm(b));
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
    const built = formToRow(form);
    const invalid = validateRow(built, isNew, rows);
    if (invalid) {
      setSaveError(invalid);
      return;
    }

    let nextList;
    if (isNew) {
      nextList = [...rows, built];
    } else {
      const idx = rows.findIndex((r) => String(r.id).toLowerCase() === String(form.id).toLowerCase());
      if (idx === -1) {
        setSaveError('Không tìm thấy bản ghi để cập nhật');
        return;
      }
      nextList = rows.map((r) => (String(r.id).toLowerCase() === String(form.id).toLowerCase() ? built : r));
    }
    persist(nextList);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Xóa hóa đơn này?')) return;
    persist(rows.filter((r) => String(r.id) !== String(id)));
  };

  const applyIdSearch = () => setAppliedSearchId(searchIdInput.trim());
  const clearIdSearch = () => {
    setSearchIdInput('');
    setAppliedSearchId('');
  };

  const statusLabel = (v) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;

  const bodyContent = (
    <div className="admin-row">
      {loadError && <div className="admin-msg admin-msg--error">{loadError}</div>}
      {saveError && <div className="admin-msg admin-msg--error">{saveError}</div>}
      {loading ? (
        <p>Đang tải...</p>
      ) : view === 'list' ? (
        <>
          <div className="admin-toolbar admin-toolbar--row">
            <button type="button" className="admin-btn" onClick={openCreate} disabled={saving}>
              + Thêm hóa đơn
            </button>
            <div className="admin-toolbar-search">
              <label htmlFor="admin-bill-search-id">Tìm kiếm mã HD: </label>
              <input
                id="admin-bill-search-id"
                type="text"
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
                  <th>Mã HD</th>
                  <th>Mã KH</th>
                  <th>Mã NV</th>
                  <th>Ngày lập</th>
                  <th>Tổng tiền</th>
                  <th>Khấu trừ</th>
                  <th>Hình thức</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="admin-table_empty">
                      {appliedSearchId.trim()
                        ? `Không có hóa đơn với ID "${appliedSearchId.trim()}".`
                        : 'Chưa có hóa đơn.'}
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.customerId}</td>
                      <td>{r.employeeId}</td>
                      <td>{r.date}</td>
                      <td>{Number(r.total || 0).toLocaleString('vi-VN')} đ</td>
                      <td>{Number(r.discount || 0).toLocaleString('vi-VN')} đ</td>
                      <td>{r.paymentMethod}</td>
                      <td>{statusLabel(r.status)}</td>
                      <td>
                        {/* ĐÃ SỬA: Thay thế biến lỗi 'p' thành biến 'r' tương thích với vòng lặp map */}
                        <div className="admin-table__actions">
                          <button
                            type="button"
                            className="admin-table__link"
                            onClick={() => openEdit(r)}
                            disabled={saving}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-table__link admin-table__link--danger"
                            onClick={() => handleDelete(r.id)}
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
          <h2>{isNew ? 'Thêm hóa đơn mới' : 'Cập nhật hóa đơn'}</h2>
          <div className="admin-form-grid">
            <label>
              Mã hóa đơn
              <input 
                type="text" 
                value={form.id} 
                onChange={(e) => handleFormChange('id', e.target.value)} 
                readOnly={!isNew} 
                placeholder="Ví dụ: HD0001" 
                required 
              />
            </label>
            <label>
              Mã khách hàng
              <input
                type="text"
                value={form.customerId}
                onChange={(e) => handleFormChange('customerId', e.target.value)}
                placeholder="Ví dụ: KH001"
                required
              />
            </label>
            <label>
              Mã nhân viên
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => handleFormChange('employeeId', e.target.value)}
                placeholder="Ví dụ: NV001"
                required
              />
            </label>
            <label>
              Ngày lập
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                required
              />
            </label>
            <label>
              Tổng tiền (đ)
              <input
                type="number"
                value={form.total}
                onChange={(e) => handleFormChange('total', e.target.value)}
                required
              />
            </label>
            <label>
              Giảm giá (đ)
              <input
                type="number"
                value={form.discount}
                onChange={(e) => handleFormChange('discount', e.target.value)}
              />
            </label>
            <label>
              Phương thức thanh toán
              <select
                value={form.paymentMethod}
                onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
              >
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="Chuyển khoản">Chuyển khoản</option>
                <option value="Ví điện tử">Ví điện tử</option>
              </select>
            </label>
            <label>
              Trạng thái
              <select
                value={form.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Ghi chú
              <textarea
                value={form.note}
                onChange={(e) => handleFormChange('note', e.target.value)}
                rows={2}
              />
            </label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={cancelForm} disabled={saving}>
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );

  return allowed ? <div className="admin-bill-container">{bodyContent}</div> : null;
}

export default AdminBill;