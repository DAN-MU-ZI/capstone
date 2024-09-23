import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header className="p-4 bg-blue-500 text-white">
            <nav>
                <ul className="flex space-x-4">
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Header;
