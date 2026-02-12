import React, { useState } from 'react';
import './ImageCarousel.css';

function ImageCarousel({ children, autoPlay = true, className = '' }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const items = React.Children.toArray(children);

    if (items.length === 0) return null;

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className={`image-carousel ${className}`}>
            <div className="image-carousel-viewport">
                <div
                    className="image-carousel-track"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {items.map((child, index) => (
                        <div className="image-carousel-slide" key={index}>
                            {child}
                        </div>
                    ))}
                </div>
            </div>

            {items.length > 1 && (
                <>
                    <button
                        className="image-carousel-btn image-carousel-btn-prev"
                        onClick={goToPrev}
                        aria-label="Previous image"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button
                        className="image-carousel-btn image-carousel-btn-next"
                        onClick={goToNext}
                        aria-label="Next image"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <div className="image-carousel-dots">
                        {items.map((_, index) => (
                            <button
                                key={index}
                                className={`image-carousel-dot ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(index)}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default ImageCarousel;
