import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';  // 스타일 파일
import { getBooks } from '../dataService';  // 책 데이터를 가져오는 함수
import Book from '../models/Book';


// MyPage 컴포넌트
const MyPage: React.FC = () => {
    const navigate = useNavigate();
    const [dataList, setDataList] = useState<Book[]>([]);  // Book 데이터를 저장할 상태
    const [loading, setLoading] = useState<boolean>(true);  // 로딩 상태
    const [error, setError] = useState<string | null>(null);  // 에러 상태

    // 데이터 가져오는 비동기 함수
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getBooks();  // MongoDB에서 Book 데이터를 가져옴
                setDataList(data);  // 가져온 데이터를 상태에 저장
                console.log('Data fetched:', data);
            } catch (error) {
                console.error('데이터 가져오기 실패:', error);
                setError('Failed to fetch data');  // 에러 발생 시 에러 상태 업데이트
            } finally {
                setLoading(false);  // 데이터를 가져오든 실패하든 로딩 종료
            }
        };

        fetchData();  // 컴포넌트가 마운트되었을 때 데이터 가져오기
    }, []);  // 빈 배열을 전달하여 컴포넌트가 처음 렌더링될 때만 실행

    // 프로그램 클릭 시 Flow 페이지로 이동하는 함수
    const handleProgramClick = useCallback((programId: string) => {
        navigate(`/flow/${programId}`);
    }, [navigate]);

    // 로딩 상태일 때 로딩 메시지 표시
    if (loading) {
        return <div>Loading...</div>;
    }

    // 에러 상태일 때 에러 메시지 표시
    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold mb-4">마이 페이지</h1>
            <ul>
                {dataList.map((data) => (
                    <li key={data._id} className="cursor-pointer hover:bg-gray-200 p-2">
                        <div onClick={() => handleProgramClick(data._id)}>
                            {data.title} - {data.description}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MyPage;
