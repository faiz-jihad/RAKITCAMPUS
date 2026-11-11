import React from 'react';
import AnimatedIcon, { type AnimatedIconType } from './AnimatedIcon';

interface LottiePlayerProps {
    name?: AnimatedIconType;
    src?: string;
    size?: number;
    className?: string;
    autoplay?: boolean;
    loop?: boolean;
}

/**
 * LottiePlayer
 * Universal animation component inspired by LottieFiles (https://lottiefiles.com/free-animation/).
 * Supports zero-dependency animated SVG presets and external Lottie JSON sources.
 */
export default function LottiePlayer({
    name = 'trophy',
    src,
    size = 48,
    className = '',
}: LottiePlayerProps) {
    // If an animated SVG icon name is provided, render the native GPU-accelerated SVG
    if (name) {
        return <AnimatedIcon name={name} size={size} className={className} />;
    }

    // Fallback if src is provided
    if (src) {
        return (
            <div
                className={`inline-flex items-center justify-center ${className}`}
                style={{ width: `${size}px`, height: `${size}px` }}
            >
                <img
                    src={src}
                    alt="Animation"
                    className="w-full h-full object-contain"
                />
            </div>
        );
    }

    return null;
}
