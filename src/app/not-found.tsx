'use client';

import React from 'react';
import Link from 'next/link';
import '@/styles/notfound/NotFound.css';

export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-card">
                <div className="pill-bottle">
                    <div className="bottle-top">
                        <div className="bottle-cap"></div>
                    </div>
                    <div className="bottle-body">
                        <div className="bottle-neck"></div>
                        <div className="bottle-label">
                            <div className="label-line"></div>
                            <div className="label-line"></div>
                            <div className="label-line"></div>
                        </div>
                    </div>
                    <div className="pills-container">
                        <div className="pill pill-1">404</div>
                        <div className="pill pill-2">404</div>
                        <div className="pill pill-3">404</div>
                        <div className="pill pill-4">404</div>
                    </div>
                </div>

                <div className="not-found-content">
                    <h1>Page Not Found</h1>
                    <p>We couldn't find the prescription you're looking for.</p>
                    <p className="not-found-subtitle">The page you requested might have been moved, removed, or is temporarily unavailable.</p>

                    <div className="suggestions">
                        <h2>Try these remedies:</h2>
                        <ul>
                            <li>Check the URL for any mistakes</li>
                            <li>Return to our homepage</li>
                            <li>Use the search function to find what you need</li>
                            <li>Contact our support if you believe this is an error</li>
                        </ul>
                    </div>

                    <div className="not-found-actions">
                        <Link href="/" className="primary-button">
                            Return to Homepage
                        </Link>
                        <Link href="/contact" className="secondary-button">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
