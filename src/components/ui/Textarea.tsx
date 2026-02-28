import React from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../Toast';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    className,
    id,
    ...props
}) => {
    const textareaId = id || Math.random().toString(36).substr(2, 9);

    return (
        <div className="w-full flex flex-col gap-1">
            {label && (
                <label htmlFor={textareaId} className="label">
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                className={cn(
                    "input-field min-h-[100px] resize-y",
                    error && "border-red-500 focus:ring-red-500",
                    className
                )}
                {...props}
            />
            {error && (
                <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
        </div>
    );
};
