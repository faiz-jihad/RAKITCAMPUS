import { HTMLAttributes } from 'react';

export default function AppLogoIcon({ className = '', ...props }: HTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/rakit-mark.png"
            alt="RAKIT"
            className={`object-contain select-none pointer-events-none ${className}`}
            {...props}
        />
    );
}
