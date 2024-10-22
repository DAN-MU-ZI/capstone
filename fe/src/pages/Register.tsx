// pages/create-user.tsx

import { useState } from 'react';
import { createUser } from '../dataService';
import { useNavigate } from 'react-router-dom';

interface User {
    name: string;
}

const CreateUserPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<User>({
        name: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.includes('profile.')) {
            setFormData((prev) => ({
                ...prev,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // 폼 데이터 서버로 전송
        console.log('Form submitted:', formData);

        // 실제 백엔드 API에 POST 요청
        try {
            const response = await createUser(formData.name);
            console.log('User created:', response);
            navigate('/login');
        } catch (error) {
            console.error('Failed to create user:', error);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center mb-6">Create User</h2>

                <div className="mb-4">
                    <label className="label">
                        <span className="label-text">name</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="input input-bordered w-full"
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                    Create User
                </button>
            </form>
        </div>
    );
};

export default CreateUserPage;
