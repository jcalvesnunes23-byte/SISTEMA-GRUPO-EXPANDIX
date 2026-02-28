import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../Toast';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'large';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    icon,
    className,
    disabled,
    ...props
}) => {
    return (
        <button
            disabled={disabled || isLoading}
            className={cn(
                "btn",
                variant === 'primary' && "btn-primary glow-purple",
                variant === 'secondary' && "btn-secondary",
                variant === 'danger' && "btn-danger",
                variant === 'ghost' && "bg-transparent text-gray-700 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-primary-500/10",
                size === 'sm' && "px-3 py-1.5 text-xs",
                size === 'md' && "px-4 py-2",
                size === 'large' && "px-8 py-3 text-lg font-bold tracking-tight",
                className
            )}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : icon ? (
                <span className="mr-2">{icon}</span>
            ) : null}
            {children}
        </button>
    );
};
