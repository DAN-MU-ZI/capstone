// BookCurriculumPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'daisyui/dist/full.css'; // DaisyUI 스타일 임포트

// 타입 정의
type CurriculumItem = {
    title: string;
    subItems?: CurriculumItem[];
};

type Book = {
    id: string;
    title: string;
    curriculum: CurriculumItem[]; // 책 안에 커리큘럼을 포함
};

// API 응답 타입 정의
type FetchBooksResponse = {
    data?: Book[];
    books?: Book[];
    success?: boolean;
    // 필요한 경우 다른 필드를 추가
};

// 로딩 인디케이터 컴포넌트 (DaisyUI 사용)
const Spinner: React.FC = () => (
    <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
    </div>
);

// Alert 컴포넌트 (DaisyUI 사용)
const Alert: React.FC<{ message: string }> = ({ message }) => (
    <div className="alert alert-error shadow-lg mb-4">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message}</span>
        </div>
    </div>
);

// 아코디언 컴포넌트 (React 상태로 관리)
const Accordion: React.FC<{
    title: string;
    children: React.ReactNode;
    onLearn: () => void;
}> = ({ title, children, onLearn }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="border border-base-300 bg-base-100 rounded-box mb-4 shadow-md transition-all duration-300">
            <div
                className="flex justify-between items-center p-4 cursor-pointer bg-base-200 hover:bg-base-300 transition-colors duration-300"
                onClick={toggleAccordion}
            >
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-medium">{title}</span>
                    <svg
                        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // 아코디언 토글 이벤트 방지
                        onLearn();
                    }}
                    className="btn btn-primary btn-sm"
                >
                    학습하기
                </button>
            </div>
            {isOpen && (
                <div className="p-4 bg-base-100 transition-max-height duration-300 ease-in-out">
                    {children}
                </div>
            )}
        </div>
    );
};

// 재귀적으로 커리큘럼 항목 렌더링
const renderCurriculumItems = (items: CurriculumItem[]) => {
    return (
        <ul className="list-disc pl-5">
            {items.map((item, index) => (
                <li key={index} className="text-base-content mb-1">
                    {item.title}
                    {item.subItems && renderCurriculumItems(item.subItems)}
                </li>
            ))}
        </ul>
    );
};

// 메인 컴포넌트
const BookCurriculumPage: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]); // 책 목록 상태
    const [isLoading, setIsLoading] = useState<boolean>(false); // 로딩 상태
    const [error, setError] = useState<string | null>(null); // 에러 상태
    const navigate = useNavigate(); // 페이지 이동을 위한 네비게이트 함수

    // 책 목록을 가져오는 함수
    const fetchBooks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/books', {
                headers: {
                    'Accept': 'application/json',
                },
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch books: ${response.status} ${response.statusText}`);
            }

            const data: FetchBooksResponse = await response.json();
            console.log('Fetched data:', data); // API 응답 확인용 로그

            // API 응답 구조에 따라 데이터 설정
            let booksData: Book[] = [];

            if (Array.isArray(data.data)) {
                booksData = data.data;
            } else if (Array.isArray(data.books)) {
                booksData = data.books;
            } else if (Array.isArray(data)) {
                booksData = data;
            } else {
                throw new Error('Unexpected API response structure');
            }

            setBooks(booksData);
        } catch (err) {
            console.error(err);
            setError('책 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 컴포넌트가 마운트될 때 책 목록을 가져옴
    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    // 학습하기 버튼을 눌렀을 때, 해당 책의 학습 페이지로 이동
    const handleLearn = (bookId: string) => {
        console.log(`학습하기 버튼 클릭: ${bookId}`); // 디버깅 로그
        navigate(`/learn/${bookId}`); // 해당 책의 학습 페이지로 이동
    };

    return (
        <div className="container mx-auto p-6 bg-base-200 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-base-content">책 목록</h1>
            {isLoading ? (
                <Spinner />
            ) : error ? (
                <Alert message={error} />
            ) : books.length === 0 ? (
                <div className="alert alert-info shadow-lg">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>현재 등록된 책이 없습니다.</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {books.map((book) => (
                        <Accordion
                            key={book.id}
                            title={book.title}
                            onLearn={() => handleLearn(book.id)} // 학습하기 버튼 클릭 시 페이지 이동
                        >
                            {renderCurriculumItems(book.curriculum)} {/* 책의 커리큘럼을 아코디언 안에 렌더링 */}
                        </Accordion>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookCurriculumPage;
