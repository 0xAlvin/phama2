import React from "react";
import "./button.css";

export default function Button({
    children,
    onClick,
    type = 'button',
    className = '',
    disabled = false
}: Readonly<{
    children: React.ReactNode,
    onClick?: () => void, // onClick is optional
    type?: 'button' | 'submit' | 'reset',
    className?: string,
    disabled?: boolean
}>) {
    return (
        <button
            type={type}
            className={`button ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}






