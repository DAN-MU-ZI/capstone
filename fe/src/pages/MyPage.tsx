import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './styles.css'; // 스타일 파일
import { getBooks } from '../dataService'; // 책 데이터를 가져오는 함수
import Book from '../models/Book';

const MyPage: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const [dataList, setDataList] = useState<Book[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!userId) {
                    throw new Error('User ID not found');
                }
                const data = await getBooks(userId);
                setDataList(data);
            } catch (error) {
                console.error('데이터 가져오기 실패:', error);
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleProgramClick = useCallback((programId: number) => {
        navigate(`/flow/${programId}`);
    }, [navigate]);

    const handleCreateClick = () => {
        // 생성하기 버튼 클릭 시 호출될 함수. 이 부분은 직접 기능을 구현하세요.
        console.log('생성하기 버튼 클릭됨');
        navigate('/create');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="alert alert-error shadow-lg w-96">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728m12.728 0L5.636 5.636"></path>
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 bg-base-200 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primary">마이 페이지</h1>
                <button
                    className="btn btn-primary"
                    onClick={handleCreateClick}
                >
                    생성하기
                </button>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataList.map((data, idx) => (
                    <li
                        key={data._id}
                        className="card shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                        onClick={() => handleProgramClick(idx)}
                    >
                        <div className="card-body">
                            <h2 className="card-title text-lg">{data.title}</h2>
                            <p>{data.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MyPage;
