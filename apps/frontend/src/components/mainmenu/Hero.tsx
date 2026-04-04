import { useState, useEffect } from "react";

const modules = import.meta.glob<{ default : string}>(
    "../../../public/carousel/*.png",
    { eager: true }
);
const images = Object.values(modules).map((mod) => mod.default);

export function Hero() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length === 0)
            return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return(
        <main>
            <div className="image-stack">
                {images.map((src, i) => (
                    <img
                        key={src}
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className={`slide ${i === currentIndex ? 'active' : ''}`}
                    />
                ))}
                <div className="overlay"/>
            </div>

            <div className="content">
                <h1>Welcome to the Hanover Insurance Group!</h1>
                <p>We are committed to providing our customers with the best insurance products and services.</p>
            </div>
        </main>
    );
}   
