import React, { useState, useEffect } from 'react';
import { getUsers } from '../dataService';
import { useNavigate } from 'react-router-dom'; // React Router 사용 시

interface User {
    id: string;
    name: string;
}

const LoginPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loginMessage, setLoginMessage] = useState<string | null>(null);

    // React Router의 useNavigate 훅 사용
    const navigate = useNavigate();

    // API 요청을 통해 사용자 목록 가져오기
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data);
                console.log('Fetched users:', data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        fetchUsers();
    }, []);

    // 사용자를 클릭해서 로그인 처리
    const handleUserClick = async (user: User) => {
        setSelectedUser(user);
        try {
            setLoginMessage(`Welcome, ${user.name}!`);
            localStorage.setItem('userId', user.id);
            navigate(`/my`);
        } catch (error) {
            console.error('Error logging in:', error);
            setLoginMessage('Login failed. Please try again.');
        }
    };

    // 회원가입 버튼 클릭 시 회원가입 페이지로 이동
    const handleSignUpClick = () => {
        navigate('/signup'); // React Router 사용 시 페이지 이동
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="w-full max-w-md mt-8">
                <h2 className="text-xl font-bold text-center mb-4">User List</h2>
                <ul className="list-disc list-inside bg-white p-6 rounded-lg shadow-lg">
                    {users.map((user) => (
                        <li
                            key={user.id}
                            className="py-2 cursor-pointer hover:bg-gray-200 rounded"
                            onClick={() => handleUserClick(user)}
                        >
                            {user.name}
                        </li>
                    ))}
                </ul>

                {selectedUser && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-center mb-4">Logging in as: {selectedUser.name}</h3>
                    </div>
                )}

                {loginMessage && (
                    <div className="mt-4">
                        <p className="text-center text-green-600">{loginMessage}</p>
                    </div>
                )}

                {/* 회원가입 버튼 */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleSignUpClick}
                        className="btn btn-secondary"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
