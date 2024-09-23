// Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="footer p-10 bg-base-200 text-base-content">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                {/* © 2024 My Website. All rights reserved. */}
                <p className="text-center md:text-left mb-4 md:mb-0">© 2024 My Website. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
