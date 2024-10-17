// Header.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // 컴포넌트가 마운트될 때 로컬스토리지에서 테마를 확인
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (storedTheme) {
            setTheme(storedTheme);
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else {
            // 로컬스토리지에 테마가 없으면 시스템 선호도를 따름
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = prefersDark ? 'dark' : 'light';
            setTheme(initialTheme);
            document.documentElement.setAttribute('data-theme', initialTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <header className="p-4 bg-base-100 text-base-content shadow-md">
            <nav className="flex justify-between items-center">
                <ul className="flex space-x-4">
                    <li>
                        <Link to="/" className="hover:text-blue-500">
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link to="/flow" className="hover:text-blue-500">
                            Flow
                        </Link>
                    </li>
                    {/* 필요에 따라 다른 네비게이션 링크 추가 가능 */}
                </ul>
                <div className="flex items-center">
                    {/* 테마 토글 버튼 */}
                    <label className="swap swap-rotate">
                        {/* 숨겨진 체크박스 */}
                        <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />

                        {/* 다크 모드 아이콘 (달) */}
                        <svg
                            className="swap-on fill-current w-6 h-6"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                        >
                            <path d="M21.64,13a1,1,0,0,0-.46-.92A9,9,0,1,1,11,2a1,1,0,0,0,0,2,7,7,0,1,0,7,7A1,1,0,0,0,21.64,13Z" />
                        </svg>

                        {/* 라이트 모드 아이콘 (해) */}
                        <svg
                            className="swap-off fill-current w-6 h-6"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                        >
                            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17Zm12.02,0a1,1,0,0,0-1.41,0l-.71.71a1,1,0,1,0,1.41,1.41l.71-.71A1,1,0,0,0,17.66,17ZM12,4.5A1,1,0,0,0,13,5V2a1,1,0,0,0-2,0V5A1,1,0,0,0,12,4.5Zm0,19a1,1,0,0,0,1-1V21a1,1,0,1,0-2,0v.5A1,1,0,0,0,12,23.5ZM5.64,7.05a1,1,0,0,0-1.41,1.41L6.34,9.46a1,1,0,0,0,1.41-1.41ZM17.66,9.46a1,1,0,1,0,1.41-1.41L18.07,7.05A1,1,0,1,0,17.66,9.46ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z" />
                        </svg>
                    </label>
                </div>
            </nav>
        </header>
    );
}

export default Header;
