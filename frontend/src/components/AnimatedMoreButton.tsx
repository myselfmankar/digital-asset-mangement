import React, { forwardRef } from 'react';
import './AnimatedMoreButton.css';
import { cn } from '@/lib/utils';

interface AnimatedMoreButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
}

export const AnimatedMoreButton = forwardRef<HTMLButtonElement, AnimatedMoreButtonProps>(
    ({ className, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn("animated-more-button", className)}
                type="button"
                {...props}
            >
                <svg className="plusIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                    <g mask="url(#mask0_21_345)">
                        <path d="M13.75 23.75V16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75Z" />
                    </g>
                </svg>
            </button>
        );
    }
);

AnimatedMoreButton.displayName = 'AnimatedMoreButton';
