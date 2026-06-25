import React, { useState, useEffect } from 'react';
import './Banner.css';
import { imageMap } from '../../utils/productImages'; 

const bannerKeys = Object.keys(imageMap).filter(key => key.startsWith('bn'));

bannerKeys.sort((a, b) => {
    const numA = parseInt(a.replace('bn', ''), 10);
    const numB = parseInt(b.replace('bn', ''), 10);
    return numA - numB;
});

const banners = bannerKeys.map(key => imageMap[key]);


const Banner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!banners || banners.length === 0) {
        return null; 
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, 10000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="banner-carousel">
            <div className="banner-wrapper">
                {banners.map((banner, index) => (
                    <div
                        key={index}
                        className={`banner-slide ${index === currentIndex ? 'active' : ''}`}
                    >
                        <img
                            src={banner}
                            alt={`Banner ${index + 1}`}
                            className="banner-image"
                        />
                    </div>
                ))}
            </div>

            <div className="banner-dots">
                {banners.map((_, index) => (
                    <span
                        key={index}
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    ></span>
                ))}
            </div>
        </div>
    );
};

export default Banner;