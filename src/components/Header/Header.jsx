import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import './Header.css';

import logoImg from "../../img/logo.png";
import { imageMap } from '../../utils/productImages';
import { normalizeSearchText, rankProductsBySearch } from '../../utils/productSearch';

const jsonBase = import.meta.env.BASE_URL || '/';

const Header = () => {
    const navigate = useNavigate();

    const [hoveredMenu, setHoveredMenu] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    const userMenuRef = useRef(null);
    const searchBoxRef = useRef(null);

    // Tính toán mảng sản phẩm khớp từ khóa tìm kiếm
    const searchMatches = useMemo(() => {
        return rankProductsBySearch(products, searchQuery, 10);
    }, [products, searchQuery]);

    useEffect(() => {
        const updateCartCount = () => {
            const savedCart = localStorage.getItem('cart');

            if (!savedCart) {
                setCartCount(0);
                return;
            }

            try {
                const cart = JSON.parse(savedCart);
                const totalItems = cart.reduce(
                    (sum, item) => sum + (item.quantity || 0),
                    0
                );
                setCartCount(totalItems);
            } catch (error) {
                console.error('Lỗi đọc giỏ hàng:', error);
                setCartCount(0);
            }
        };

        const updateCurrentUser = () => {
            const savedUser = localStorage.getItem('currentUser');

            if (!savedUser) {
                setCurrentUser(null);
                return;
            }

            try {
                const user = JSON.parse(savedUser);
                setCurrentUser(user);
            } catch (error) {
                console.error('Lỗi đọc thông tin người dùng:', error);
                setCurrentUser(null);
            }
        };

        // Chạy lần đầu khi component mount
        updateCartCount();
        updateCurrentUser();

        const onStorageSync = () => {
            updateCartCount();
            updateCurrentUser();
        };

        // Lắng nghe sự kiện toàn cục để cập nhật Header ngay lập tức không cần F5
        window.addEventListener('cartUpdated', updateCartCount);
        window.addEventListener('userUpdated', updateCurrentUser);
        window.addEventListener('storage', onStorageSync);

        return () => {
            window.removeEventListener('cartUpdated', updateCartCount);
            window.removeEventListener('userUpdated', updateCurrentUser);
            window.removeEventListener('storage', onStorageSync);
        };
    }, []);

    // Tải dữ liệu sản phẩm phục vụ tính năng tìm kiếm nhanh (gợi ý tự động điền)
    useEffect(() => {
        let cancelled = false;

        const loadProducts = async () => {
            try {
                const res = await fetch(`${jsonBase}product.json`);
                if (!res.ok) return;

                const data = await res.json();
                if (cancelled) return;

                const mapped = data.map((item) => ({
                    ...item,
                    image: imageMap[item.imageKey],
                }));

                setProducts(mapped);
            } catch (err) {
                fetch('/api/products')
                    .then(res => res.json())
                    .catch(err => console.log('Lỗi tải sản phẩm...', err));
            }
        };

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    // Đóng ô tìm kiếm khi click ra ngoài vùng hiển thị
    useEffect(() => {
        if (!searchFocused) return;

        const onPointerDown = (e) => {
            if (
                searchBoxRef.current &&
                !searchBoxRef.current.contains(e.target)
            ) {
                setSearchFocused(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [searchFocused]);

    // Đóng dropdown menu của User khi click ra ngoài
    useEffect(() => {
        if (!userMenuOpen) return;

        const onPointerDown = (e) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target)
            ) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [userMenuOpen]);

    useEffect(() => {
        if (!currentUser) {
            setUserMenuOpen(false);
        }
    }, [currentUser]);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setUserMenuOpen(false);
        
        // Phát tín hiệu đồng bộ để Header xóa trạng thái đăng nhập
        window.dispatchEvent(new Event('userUpdated'));
        navigate('/');
    };

    const goToProduct = (product) => {
        setSearchQuery('');
        setSearchFocused(false);

        navigate(`/product/${product.id}`, {
            state: { product },
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = normalizeSearchText(searchQuery);
        if (!q) return;

        navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchFocused(false);
    };

    // Chuẩn hóa tên hiển thị trên Header (Ưu tiên tên, tài khoản, rồi đến email)
    const userLabel = currentUser
        ? currentUser.name || currentUser.username || currentUser.user || currentUser.email
        : 'Đăng nhập';

    const coffeeMenuItems = [
        {
            text: 'Hành trình tách cà phê đậm',
            href: '/coffee/hanh-trinh-tach-ca-phe',
        },
        {
            text: 'Hạt cà phê Phúc Long',
            href: '/coffee/hat-ca-phe-phuc-long',
        },
        {
            text: 'Nghệ thuật pha chế',
            href: '/coffee/nghe-thuat-pha-che',
        },
    ];

    return (
        <header className="phuclong-header">
            <div className="header-top-bar">
                <div className="header-top-content">
                    <div className="header-delivery-info">
                        <span className="delivery-text">Free Delivery</span>
                        <i className="fas fa-phone delivery-icon"></i>
                        <span className="delivery-phone">1800 6779</span>
                        <div className="delivery-scooter">
                            <i className="fas fa-motorcycle"></i>
                        </div>
                    </div>

                    <div className="header-logo-container">
                        <div className="phuclong-logo">
                            <button
                                type="button"
                                className="header-logo-btn"
                                onClick={() => navigate('/')}
                                aria-label="Về trang chủ"
                            >
                                <img 
                                    src={logoImg} 
                                    alt="Logo" 
                                    className="header-logo-image" 
                                    style={{ cursor: 'pointer' }} 
                                />
                            </button>
                        </div>
                    </div>

                    <div className="header-user-actions">
                        {currentUser ? (
                            <div className="header-user-menu" ref={userMenuRef}>
                                <button
                                    type="button"
                                    className="login-link header-user-menu-trigger"
                                    aria-expanded={userMenuOpen}
                                    aria-haspopup="true"
                                    onClick={() => setUserMenuOpen((o) => !o)}
                                >
                                    {userLabel}
                                    <i
                                        className={`fas fa-chevron-down header-user-menu-caret ${
                                            userMenuOpen ? 'is-open' : ''
                                        }`}
                                        aria-hidden="true"
                                    />
                                </button>

                                {userMenuOpen && (
                                    <div className="header-user-dropdown" role="menu">
                                        <button
                                            type="button"
                                            className="header-user-dropdown-item"
                                            role="menuitem"
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                navigate('/profile');
                                            }}
                                        >
                                            HỒ SƠ
                                        </button>

                                        {currentUser.role === 'staff' && (
                                            <button
                                                type="button"
                                                className="header-user-dropdown-item"
                                                role="menuitem"
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    navigate('/admin');
                                                }}
                                            >
                                                Quản trị
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="header-user-dropdown-item header-user-dropdown-item--logout"
                                            role="menuitem"
                                            onClick={handleLogout}
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="login-link"
                                onClick={() => navigate('/login')}
                            >
                                Đăng nhập
                            </button>
                        )}

                        <span className="action-separator">|</span>

                        <div className="language-selector">
                            <span className="lang-active">VN</span>
                            <span className="lang-separator">|</span>
                            <span className="lang-option">EN</span>
                        </div>

                        <button
                            type="button"
                            className="cart-button"
                            onClick={() => navigate('/cart')}
                        >
                            <i className="fas fa-shopping-cart"></i>
                            <span>Giỏ hàng</span>
                            <span className="cart-badge">{cartCount}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Ô tìm kiếm sản phẩm */}
            <div className="header-search-strip" aria-label="Tìm kiếm">
                <div className="header-search-strip__inner" ref={searchBoxRef}>
                    <form className="header-search-form" onSubmit={handleSearchSubmit} role="search">
                        <i className="fas fa-search header-search-icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="header-search-input"
                            placeholder="Bạn muốn mua gì..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            aria-label="Tìm kiếm sản phẩm"
                            aria-autocomplete="list"
                            aria-controls="header-search-suggestions"
                            autoComplete="off"
                        />
                        <button type="submit" className="header-search-submit">
                            Tìm
                        </button>
                    </form>

                    {searchFocused && searchQuery.trim().length > 0 && (
                        <ul id="header-search-suggestions" className="header-search-dropdown" role="listbox" aria-label="Gợi ý sản phẩm">
                            {searchMatches.length === 0 ? (
                                <li className="header-search-empty" role="status">
                                    Không tìm thấy sản phẩm gần giống. Thử từ khóa khác.
                                </li>
                            ) : (
                                searchMatches.map((p) => (
                                    <li key={p.id} role="presentation">
                                        <button
                                            type="button"
                                            className="header-search-option"
                                            role="option"
                                            onClick={() => goToProduct(p)}
                                        >
                                            <span className="header-search-thumb-wrap">
                                                <img
                                                    src={p.image || 'https://via.placeholder.com/88'}
                                                    alt={p.name}
                                                    className="header-search-thumb"
                                                    loading="lazy"
                                                />
                                            </span>
                                            <span className="header-search-meta">
                                                <span className="header-search-name">{p.name}</span>
                                                {p.currentPrice && (
                                                    <span className="header-search-price">{p.currentPrice}</span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* THANH ĐIỀU HƯỚNG CHÍNH (SỬA THÀNH LINK/NAVLINK) */}
            <nav className="header-navigation" aria-label="Điều hướng chính">
                <div className="nav-content">
                    <Link to="/" className="nav-link">
                        TRANG CHỦ
                    </Link>

                    {/* SÁCH MỚI (Dropdown) */}
                    <div
                        className="nav-item-with-dropdown"
                        onMouseEnter={() => setHoveredMenu('coffee')}
                        onMouseLeave={() => setHoveredMenu(null)}
                    >
                        <NavLink 
                            to="/coffee" 
                            className={({ isActive }) => `nav-link ${isActive || hoveredMenu === 'coffee' ? 'active' : ''}`}
                        >
                            SÁCH MỚI
                        </NavLink>

                        {hoveredMenu === 'coffee' && (
                            <div className="dropdown-menu">
                                {coffeeMenuItems.map((item, index) => (
                                    <Link key={index} to={item.href} className="dropdown-item">
                                        {item.text}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <NavLink to="/tea" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        LIÊN HỆ
                    </NavLink>

                    <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        SẢN PHẨM
                    </NavLink>

                    <NavLink to="/promotions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        KHUYẾN MÃI
                    </NavLink>

                    <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        VỀ CHÚNG TÔI
                    </NavLink>
                </div>
            </nav>
        </header>
    );
};

export default Header;