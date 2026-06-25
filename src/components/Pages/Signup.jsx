import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedUser = username.trim();
        const trimmedPass = password.trim();
        const trimmedConfirm = confirm.trim();

        if (!trimmedUser || !trimmedPass) {
            setError('Vui long nhập đủ tên đăng nhập và mật khẩu');
            return;
        }
        if (trimmedPass !== trimmedConfirm) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (trimmedPass.length < 3) {
            setError('Mật khẩu tối thiểu 3 ký tự');
            return;
        }
        try {
            await axios.post('/api/register', {
                user: trimmedUser,
                pass: trimmedPass,
            });
            navigate('/login');
        } catch (err) {
            const msg =
                err.response?.data?.error ||
                (err.response?.status == 404
                    ? 'Chỉ hoạt động khi chạy npm run dev hoặc npm run preview (API ghi file trên server).' : null) ||
                'Đã xảy ra lỗi, vui lòng thử lại sau';
            setError(msg);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h2 className="login-title">Đăng ký</h2>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Tên đăng nhập"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Xác nhận mật khẩu"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-button">
                        Đăng ký
                    </button>
                </form>

                <div className="login-footer login-footer--spaced">
                    <span>Đã có tài khoản?</span>
                    <Link to="/login" className="signup-link">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;