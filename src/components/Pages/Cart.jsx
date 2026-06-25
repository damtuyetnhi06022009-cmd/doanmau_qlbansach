import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {imageMap} from '../../utils/productImages';
import './Cart.css';

const Cart = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    const updateCart = (newCart) => {
        setCartItems(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const increaseQuantity = (productId) => {
        const updatedCart = cartItems.map(item =>
            item.id === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item
        );
        updateCart(updatedCart);
    };

    const decreaseQuantity = (productId) => {
        const updatedCart = cartItems.map(item => {
            if (item.id === productId) {
                if (item.quantity > 1) {
                    return { ...item, quantity: item.quantity - 1 };
                } else {
                    return null; 
                }
            }
            return item;
        }).filter(Boolean);
        updateCart(updatedCart);
    };

    const removeItem = (productId) => {
        const updatedCart = cartItems.filter(item => item.id !== productId);
        updateCart(updatedCart);
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => {
            const price = parseFloat(item.currentPrice.replace(/[^\d]/g, '')) || 0;
            return total + (price * item.quantity);
        }, 0);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + '₫';
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-container">
                <div className="cart-empty">
                    <h2>Giỏ hàng của bạn đang trống</h2>
                    <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm!</p>
                    <button className="continue-shopping-btn" onClick={() => navigate('/')}>
                        Tiếp tục mua sắm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h1 className="cart-title">Giỏ hàng của bạn</h1>
            <div className="cart-content">
                <div className="cart-items">
                    {cartItems.map((item) => {
                        const price = parseFloat(item.currentPrice.replace(/[^\d]/g, '')) || 0;
                        const itemTotal = price * item.quantity;

                        return (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-image">
<img
                                        src={item.image || imageMap[item.imageKey] || 'https://via.placeholder.com/150'}
                                        alt={item.name}
                                    />
                                </div>
                                <div className="cart-item-info">
                                    <h3 className="cart-item-name">{item.name}</h3>
                                    <p className="cart-item-price">{item.currentPrice}</p>
                                </div>
                                <div className="cart-item-quantity">
                                    <button
                                        className="quantity-btn minus"
                                        onClick={() => decreaseQuantity(item.id)}
                                    >
                                        -
                                    </button>
                                    <span className="quantity-value">{item.quantity}</span>
                                    <button
                                        className="quantity-btn plus"
                                        onClick={() => increaseQuantity(item.id)}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="cart-item-total">
                                    <p className="item-total-price">{formatPrice(itemTotal)}</p>
                                </div>
                                <button
                                    className="remove-item-btn"
                                    onClick={() => removeItem(item.id)}
                                    title="Xóa sản phẩm"
                                >
                                    x
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="cart-summary">
                    <h2 className="summary-title">Tổng kết đơn hàng</h2>
                    <div className="summary-row">
                        <span>Tổng tiền:</span>
                        <span className="total-price">{formatPrice(calculateTotal())}</span>
                    </div>
                    <button className="checkout-btn">
                        Thanh toán
                    </button>
                    <button className="continue-shopping-btn" onClick={() => navigate('/')}>
                        Tiếp tục mua sắm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;