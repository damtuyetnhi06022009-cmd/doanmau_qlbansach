import React from 'react';
import './Footer.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import logoImg from "../../img/logo.png"; 

const Footer = () => {
  return (
    <footer className="highlands-footer">
      <div className="footer-green-strip"></div>
      <div className="footer-content">
        <div className="footer-left">
          <div className="footer-logo">
            {/* Sửa src từ logo thành logoImg */}
            <img src={logoImg} alt="SaleMini Logo" className="footer-logo-img" />
          </div>
          <p className="footer-copyright">
            ©2026 SaleMini. All rights reserved
          </p>
        </div>

        <div className="footer-middle">
          <div className="footer-column">
            <h3 className="footer-column-title">VỀ SaleMini</h3>
            <ul className="footer-links">
              <li><a href="/origin">Nguồn gốc</a></li>
              <li><a href="/services">Dịch vụ</a></li>
              <li><a href="/careers">Nghề Nghiệp</a></li>
              <li><a href="/contact">Liên hệ</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-column-title">HỆ THỐNG CỬA HÀNG</h3>
            <ul className="footer-links">
              <li><a href="/find-store">Tìm cửa hàng gần nhất</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-column-title">TIN TỨC</h3>
            <ul className="footer-links">
               <li><a href="/news">Tin tức mới nhất</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-right">
          <h3 className="footer-column-title">THEO DÕI CHÚNG TÔI</h3>
          <div className="footer-social-icons">
            <a href="https://facebook.com" className="social-icon" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://instagram.com" className="social-icon" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://youtube.com" className="social-icon" aria-label="YouTube">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="https://tiktok.com" className="social-icon" aria-label="TikTok">
              <i className="fab fa-tiktok"></i>
            </a>
          </div>

          <div className="footer-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4243774416565!2d106.6914361!3d10.7753308!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3069c991f9%3A0xe104719f9f8e4040!2zRHluaCDEkOG7mWMgTOG6rXA!5e0!3m2!1svi!2svn!4v1713532845000"
              title="Bản đồ địa điểm SaleMini"
              className="footer-map_iframe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            ></iframe>
            <a
              className="footer-map_link"
              href="https://goo.gl/maps/example"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở trong Google Maps
            </a>
          </div>
        </div>
      </div>

      <div className="footer-chat-icon" title="Chat với chúng tôi">
        <i className="fas fa-comment-dots"></i>
      </div>
    </footer>
  );
};

export default Footer;