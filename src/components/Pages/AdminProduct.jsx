import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

// Đảm bảo dấu gạch chéo chuẩn cho file tĩnh
const jsonBase = import.meta.env.BASE_URL || '/';
const cleanJsonBase = jsonBase.endsWith('/') ? jsonBase : `${jsonBase}/`;

const emptyForm = () => ({
  id: '',
  name: '',
  imageKey: 'sp1',
  author: '',
  publisher: '',
  currentPrice: '',
  originalPrice: '',
  discount: '',
  rating: '',
  sold: '',
  categoryid: '', // Giữ nguyên chữ thường để khớp tuyệt đối với Form HTML và State của bạn
});

function productToForm(p) {
  return {
    id: String(p.id),
    name: p.name ?? '',
    imageKey: p.imageKey ?? '',
    author: p.author ?? '',
    publisher: p.publisher ?? '',
    currentPrice: p.currentPrice !== null && p.currentPrice !== undefined ? String(p.currentPrice) : '',
    originalPrice: p.originalPrice !== null && p.originalPrice !== undefined ? String(p.originalPrice) : '',
    discount: p.discount !== null ? String(p.discount) : '',
    rating: p.rating !== null ? String(p.rating) : '',
    sold: p.sold !== null ? String(p.sold) : '',
    categoryid: p.categoryid !== null && p.categoryid !== undefined 
      ? String(p.categoryid) 
      : String(p.categoryId ?? ''), // Đọc dự phòng từ cả 2 loại key để không bao giờ bị mất danh mục
  };
}

function formToProduct(form, nextId) {
  const id = form.id ? Number(form.id) : nextId;
  return {
    id,
    name: form.name.trim(),
    imageKey: form.imageKey.trim() || 'sp1',
    author: form.author.trim() || 'Chưa rõ',
    publisher: form.publisher.trim() || 'Chưa rõ',
    currentPrice: form.currentPrice.trim() === '' ? 0 : Number(form.currentPrice),
    originalPrice: form.originalPrice.trim() === '' ? 0 : Number(form.originalPrice),
    discount: form.discount.trim(),
    rating: Number(form.rating) || 0,
    sold: Number(form.sold) || 0,
    categoryid: form.categoryid.trim() === '' ? 0 : Number(form.categoryid),
    categoryId: form.categoryid.trim() === '' ? 0 : Number(form.categoryid), // Đồng bộ ra cả 2 key để các page client không bị lỗi
  };
}

function validateProduct(built) {
  if (!built.name) return 'Vui lòng nhập tên sản phẩm';
  if (Number.isNaN(built.currentPrice) || built.currentPrice < 0) return 'Giá hiện tại phải là số hợp lệ';
  if (Number.isNaN(built.originalPrice) || built.originalPrice < 0) return 'Giá gốc phải là số hợp lệ';
  if (Number.isNaN(built.categoryid) || built.categoryid <= 0) return 'Mã danh mục phải là số hợp lệ';
  return null;
}

export default function AdminProduct({ embedded = false }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(embedded);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [form, setForm] = useState(emptyForm());
  const [isNew, setIsNew] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [appliedSearchId, setAppliedSearchId] = useState('');

  const displayedProducts = useMemo(() => {
    const q = appliedSearchId.trim();
    if (!q) return products;
    return products.filter((p) => String(p.id) === q);
  }, [products, appliedSearchId]);

  // Giải pháp lưu dữ liệu không cần API thực (Tránh triệt để lỗi mạng HTML '<')
  const persist = useCallback(async (nextList) => {
    setSaving(true);
    setSaveError('');
    try {
      setProducts(nextList);
      localStorage.setItem('cached_products', JSON.stringify(nextList));
      setView('list');
      setForm(emptyForm());
      setIsNew(false);
    } catch (err) {
      setSaveError('Không lưu được dữ liệu.');
    } finally {
      setSaving(false);
    }
  }, []);

  // Kiểm tra phân quyền đăng nhập
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

  // Tải dữ liệu từ LocalStorage hoặc file json tĩnh hệ thống
  useEffect(() => {
    if (!allowed) return;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const cached = localStorage.getItem('cached_products');
        if (cached) {
          setProducts(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const res = await fetch(`${cleanJsonBase}product.json`);
        const contentType = res.headers.get('content-type');
        if (!res.ok || (contentType && !contentType.includes('application/json'))) {
          throw new Error('Không tải được file dữ liệu product.json (Vui lòng kiểm tra lại thư mục public/)');
        }

        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
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

  const openEdit = (p) => {
    setIsNew(false);
    setForm(productToForm(p));
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
    const nextId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
    const built = formToProduct(form, nextId);
    const invalid = validateProduct(built);
    if (invalid) {
      setSaveError(invalid);
      return;
    }

    let nextList;
    if (isNew) {
      nextList = [...products, built];
    } else {
      const idx = products.findIndex((p) => String(p.id) === String(form.id));
      if (idx === -1) {
        setSaveError('Không tìm thấy sản phẩm để cập nhật');
        return;
      }
      nextList = products.map((p) => (String(p.id) === String(form.id) ? built : p));
    }
    persist(nextList);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    persist(products.filter((p) => String(p.id) !== String(id)));
  };

  const applyIdSearch = () => setAppliedSearchId(searchIdInput.trim());
  const clearIdSearch = () => {
    setSearchIdInput('');
    setAppliedSearchId('');
  };

  if (!allowed) return null;

  return (
    <div className="admin-product-container">
      <div className="admin-row">
        {loadError && <div className="admin-msg admin-msg--error">{loadError}</div>}
        {saveError && <div className="admin-msg admin-msg--error">{saveError}</div>}
        
        {loading ? (
          <p>Đang tải...</p>
        ) : view === 'list' ? (
          <>
            <div className="admin-toolbar admin-toolbar--row">
              <button type="button" className="admin-btn" onClick={openCreate} disabled={saving}>
                + Thêm sản phẩm
              </button>
              <div className="admin-toolbar-search">
                <label htmlFor="admin-product-search-id">Tìm kiếm ID: </label>
                <input
                  id="admin-product-search-id"
                  type="text"
                  inputMode="numeric"
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
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Ảnh (key)</th>
                    <th>Giá gốc</th>
                    <th>Giá hiện tại</th>
                    <th>Danh mục</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="admin-table__empty">
                        {appliedSearchId.trim()
                          ? `Không có sản phẩm với ID "${appliedSearchId.trim()}".`
                          : 'Chưa có sản phẩm.'}
                      </td>
                    </tr>
                  ) : (
                    displayedProducts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.imageKey}</td>
                        <td>{p.originalPrice}</td>
                        <td>{p.currentPrice}</td>
                        <td>{p.categoryid ?? p.categoryId}</td>
                        <td>
                          {/* ĐÃ SỬA: Thay đổi từ gạch đơn sang gạch đôi trùng khớp CSS */}
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
            <h2>{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
            <div className="admin-form-grid">
              {!isNew && (
                <label>
                  ID
                  <input value={form.id} readOnly />
                </label>
              )}
              <label className="admin-form-grid__full">
                Tên sản phẩm
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </label>
              <label>
                Mã ảnh (imageKey)
                <input
                  type="text"
                  value={form.imageKey}
                  onChange={(e) => handleFormChange('imageKey', e.target.value)}
                />
              </label>
              <label>
                Mã danh mục (categoryid)
                <input
                  type="number"
                  value={form.categoryid}
                  onChange={(e) => handleFormChange('categoryid', e.target.value)}
                  required
                />
              </label>
              <label>
                Giá gốc
                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => handleFormChange('originalPrice', e.target.value)}
                  required
                />
              </label>
              <label>
                Giá hiện tại
                <input
                  type="number"
                  value={form.currentPrice}
                  onChange={(e) => handleFormChange('currentPrice', e.target.value)}
                  required
                />
              </label>
              <label>
                Giảm giá (Ví dụ: -20%)
                <input
                  type="text"
                  value={form.discount}
                  onChange={(e) => handleFormChange('discount', e.target.value)}
                />
              </label>
              <label>
                Đánh giá (Rating)
                <input
                  type="number"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => handleFormChange('rating', e.target.value)}
                />
              </label>
              <label>
                Đã bán (Sold)
                <input
                  type="number"
                  value={form.sold}
                  onChange={(e) => handleFormChange('sold', e.target.value)}
                />
              </label>
              <label>
                Tác giả
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => handleFormChange('author', e.target.value)}
                />
              </label>
              <label>
                Nhà xuất bản
                <input
                  type="text"
                  value={form.publisher}
                  onChange={(e) => handleFormChange('publisher', e.target.value)}
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
    </div>
  );
}