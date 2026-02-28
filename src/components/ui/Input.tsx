import React from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../Toast';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className,
    id,
    ...props
}) => {
    const inputId = id || Math.random().toString(36).substr(2, 9);

    return (
        <div className="w-full flex flex-col gap-1">
            {label && (
                <label htmlFor={inputId} className="label">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={cn(
                        "input-field",
                        icon ? "pl-10" : "",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
        </div>
    );
};
