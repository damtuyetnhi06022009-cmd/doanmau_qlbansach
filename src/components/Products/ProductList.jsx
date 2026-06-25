import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { imageMap } from '../../utils/productImages';
import './ProductList.css';

const PRODUCTS_PER_PAGE = 6;
const jsonBase = import.meta.env.BASE_URL || '/';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch(`${jsonBase}products.json`), // Đã đổi sang products.json cho đồng bộ
                    fetch(`${jsonBase}category.json`)
                ]);
                
                if (!productsRes.ok) {
                    throw new Error('Không thể tải dữ liệu sản phẩm');
                }
                
                const data = await productsRes.json();
                const mappedProducts = data.map((item) => ({
                    ...item,
                    image: imageMap[item.imageKey] || item.image
                }));
                setProducts(mappedProducts);
                
                if (categoriesRes.ok) {
                    const catData = await categoriesRes.json();
                    setCategories(Array.isArray(catData) ? catData : []);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Đã xóa bỏ khai báo trùng lặp filteredProducts
    const filteredProducts = selectedCategoryId == null
        ? products
        : products.filter((p) => p.categoryId === selectedCategoryId);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

    useEffect(() => {
        setCurrentPage((p) => Math.min(p, totalPages));
    }, [totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategoryId]);

    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PRODUCTS_PER_PAGE;
    const visibleProducts = filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
    
    const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
    const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

    if (isLoading) {
        return <div className="product-list-container">Đang tải sản phẩm...</div>;
    }

    if (error) {
        return <div className="product-list-container">Lỗi: {error}</div>;
    }
    
    return (
        <div className="product-list-container">
            <div className="product-list-layout">
                {categories.length > 0 && (
                    <aside className="product-list-sidebar" aria-label="Lọc theo danh mục">
                        <h2 className="product-list-sidebar__title">Danh mục</h2>
                        <ul className="product-list-sidebar__list">
                            <li>
                                <button
                                    type="button"
                                    className={`product-list-sidebar__btn${selectedCategoryId == null ? ' product-list-sidebar__btn--active' : ''}`}
                                    onClick={() => setSelectedCategoryId(null)}
                                >
                                    Tất cả
                                </button>
                            </li>

                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <button
                                        type="button"
                                        className={`product-list-sidebar__btn${selectedCategoryId === cat.id ? ' product-list-sidebar__btn--active' : ''}`}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                    >
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>
                )}

                <div className="product-list-main">
                    {filteredProducts.length === 0 ? (
                        <p className="product-list-empty">Không có sản phẩm trong danh mục này.</p>
                    ) : (
                        <div className="product-list">
                            {visibleProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}

                    {filteredProducts.length > PRODUCTS_PER_PAGE && filteredProducts.length > 0 && (
                        <div className="product-list-pagination" role="navigation" aria-label="Phân trang sản phẩm">
                            <button 
                                type="button" 
                                className="product-list-pagination__btn"
                                onClick={goPrev} 
                                disabled={safePage <= 1}
                            >
                                ← Trang trước
                            </button>

                            <span className="product-list-pagination__info">
                                Trang {safePage} / {totalPages}
                            </span>

                            <button
                                type="button"
                                className="product-list-pagination__btn"
                                onClick={goNext}
                                disabled={safePage >= totalPages}
                            >
                                Trang sau →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductList;