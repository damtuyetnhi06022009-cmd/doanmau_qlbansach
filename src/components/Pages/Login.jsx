import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [forgotMode, setForgotMode] = useState(false);
    const [fpUser, setFpUser] = useState('');
    const [fpNew, setFpNew] = useState('');
    const [fpConfirm, setFpConfirm] = useState('');
    const [fpError, setFpError] = useState('');
    const [fpSuccess, setFpSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const trimmedUser = username.trim();
        const trimmedPass = password.trim();

        if (!trimmedUser && !trimmedPass) {
            setError('Không được để trống tên đăng nhập và mật khẩu');
            return;
        }
        if (!trimmedUser) {
            setError('Không được để trống tên đăng nhập');
            return;
        }
        if (!trimmedPass) {
            setError('Không được để trống mật khẩu');
            return;
        }

        try {
            const normalizedUsername = trimmedUser.toLowerCase();
            const normalizedPassword = trimmedPass;

            const response = await fetch('/account.json');
            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu tài khoản');
            }

            const accounts = await response.json();
            const matchedAccount = accounts.find((acc) => {
                const accUser = String(acc.user || '').trim().toLowerCase();
                const accPass = String(acc.pass || '').trim();
                return accUser === normalizedUsername && accPass === normalizedPassword;
            });

            if (!matchedAccount) {
                setError('Sai tài khoản hoặc mật khẩu');
                return;
            }

            const publicInfo = { ...matchedAccount };
            delete publicInfo.pass;
            localStorage.setItem('currentUser', JSON.stringify(publicInfo));
            window.dispatchEvent(new Event('userUpdated'));

            // Đã sửa cấu trúc rẽ nhánh phân quyền chuẩn
            if (matchedAccount.role === 'staff') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError('Đã xảy ra lỗi, vui lòng thử lại sau');
        }
    };

    const openForgot = () => {
        setForgotMode(true);
        setFpError('');
        setFpSuccess('');
        setFpUser(username.trim());
        setFpNew('');
        setFpConfirm('');
    };

    const closeForgot = () => {
        setForgotMode(false);
        setFpError('');
        setFpSuccess('');
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setFpError('');
        setFpSuccess('');

        const u = fpUser.trim();
        const p1 = fpNew.trim();
        const p2 = fpConfirm.trim();

        if (!u || !p1) {
            setFpError('Vui lòng nhập tên đăng nhập và mật khẩu mới');
            return;
        }
        if (p1 !== p2) {
            setFpError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (p1.length < 3) {
            setFpError('Mật khẩu mới tối thiểu 3 ký tự');
            return;
        }

        try {
            const { data } = await axios.post('/api/reset-password', {
                user: u,
                newPass: p1,
            });
            setFpSuccess(data.message || 'Đã đổi mật khẩu. Bạn có thể đăng nhập.');
            setFpNew('');
            setFpConfirm('');
        } catch (err) {
            const msg = err.response?.data?.error ||
                ((err.code === 'ERR_NETWORK' || err.response?.status === 404)
                    ? 'Chỉ hoạt động khi chạy npm run dev hoặc npm run preview (API ghi file trên server).'
                    : 'Đã xảy ra lỗi, vui lòng thử lại sau');
            setFpError(msg);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {forgotMode ? (
                    <>
                        <h2 className="login-title">Quên mật khẩu</h2>
                        <form className="login-form" onSubmit={handleForgotSubmit}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Tên đăng nhập"
                                    value={fpUser}
                                    onChange={(e) => setFpUser(e.target.value)}
                                    autoComplete="username"
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Mật khẩu mới"
                                    value={fpNew}
                                    autoComplete="new-password"
                                    onChange={(e) => setFpNew(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Xác nhận mật khẩu mới"
                                    value={fpConfirm}
                                    autoComplete="new-password"
                                    onChange={(e) => setFpConfirm(e.target.value)}
                                />
                            </div>
                            {fpError && <div className="login-error">{fpError}</div>}
                            {fpSuccess && <div className="login-success">{fpSuccess}</div>}
                            <button type="submit" className="login-button">Đổi mật khẩu</button>
                        </form>
                        <div className="login-footer login-footer--spaced">
                            <button type="button" className="link-button" onClick={closeForgot}>
                                ← Quay lại đăng nhập
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Đã giữ lại 1 tiêu đề duy nhất */}
                        <h2 className="login-title">Đăng nhập</h2>
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Email or Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="forgot-row">
                                <button type="button" className="forgot-link" onClick={openForgot}>
                                    Forgot password?
                                </button>
                            </div>
                            {error && <div className="login-error">{error}</div>}
                            <button type="submit" className="login-button">LOGIN</button>
                        </form>
                        <div className="login-divider">Or login with</div>
                        <div className="social-login">
                            <button type="button" className="social-btn facebook">
                                <i className="fab fa-facebook-f"></i> <span>Facebook</span>
                            </button>
                            <button type="button" className="social-btn google">
                                <i className="fab fa-google"></i> <span>Google</span>
                            </button>
                        </div>
                        <div className="login-footer">
                            <span>Not a member?</span>
                            <Link to="/signup" className="signup-link">Signup now</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;