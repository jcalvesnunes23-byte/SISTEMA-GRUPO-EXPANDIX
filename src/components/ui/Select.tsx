import React from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../Toast';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    options,
    className,
    id,
    ...props
}) => {
    const selectId = id || Math.random().toString(36).substr(2, 9);

    return (
        <div className="w-full flex flex-col gap-1">
            {label && (
                <label htmlFor={selectId} className="label">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    id={selectId}
                    className={cn(
                        "input-field appearance-none pr-10",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronDown size={18} />
                </div>
            </div>
            {error && (
                <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
        </div>
    );
};
