import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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

// Accordion 컴포넌트
const Accordion: React.FC<{
    title: string;
    children: React.ReactNode;
    onToggle: () => void;
    isOpen: boolean;
    onLearn: () => void;
}> = ({ title, children, onToggle, isOpen, onLearn }) => {
    return (
        <div className="mb-2 border border-gray-300 rounded">
            <div className="p-2 bg-gray-100 font-bold flex justify-between items-center">
                <span>{title}</span>
                <div>
                    {/* 학습하기 버튼 */}
                    <button
                        onClick={onLearn}
                        className="px-4 py-2 mr-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        학습하기
                    </button>
                    {/* 토글 버튼 */}
                    <button
                        onClick={onToggle}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                        {isOpen ? '접기' : '자세히 보기'}
                    </button>
                </div>
            </div>
            {isOpen && <div className="p-2 bg-white">{children}</div>}
        </div>
    );
};

// 재귀적으로 커리큘럼 항목 렌더링
const renderCurriculumItems = (items: CurriculumItem[]) => {
    return (
        <ul className="list-disc pl-5">
            {items.map((item, index) => (
                <li key={index}>
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
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null); // 선택된 책 ID 상태
    const navigate = useNavigate(); // 페이지 이동을 위한 네비게이트 함수

    // 책 목록을 가져오는 함수
    const fetchBooks = useCallback(async () => {
        // 실제 API 호출로 대체 (책에 커리큘럼 포함)
        const data: Book[] = [
            {
                id: '1',
                title: 'React 기초',
                curriculum: [
                    {
                        title: '1. 기본 개념',
                        subItems: [
                            { title: '1.1 개요' },
                            { title: '1.2 구조' },
                            { title: '1.3 동작 원리' },
                        ],
                    },
                    {
                        title: '2. 설치 및 설정',
                        subItems: [
                            { title: '2.1 설치 방법' },
                            { title: '2.2 환경 설정' },
                        ],
                    },
                ],
            },
            {
                id: '2',
                title: 'JavaScript 심화',
                curriculum: [
                    {
                        title: '1. 고급 개념',
                        subItems: [
                            { title: '1.1 클로저' },
                            { title: '1.2 프로미스' },
                        ],
                    },
                    {
                        title: '2. 비동기 프로그래밍',
                        subItems: [
                            { title: '2.1 async/await' },
                            { title: '2.2 이벤트 루프' },
                        ],
                    },
                ],
            },
            {
                id: '3',
                title: 'TypeScript 마스터',
                curriculum: [
                    {
                        title: '1. 타입 시스템',
                        subItems: [
                            { title: '1.1 타입 추론' },
                            { title: '1.2 제네릭' },
                        ],
                    },
                    {
                        title: '2. 고급 타입',
                        subItems: [
                            { title: '2.1 조건부 타입' },
                            { title: '2.2 유틸리티 타입' },
                        ],
                    },
                ],
            },
        ];

        setBooks(data); // 상태에 책 목록 저장
    }, []);

    // 컴포넌트가 마운트될 때 책 목록을 가져옴
    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    // 아코디언 토글 핸들러
    const handleAccordionToggle = (bookId: string) => {
        setSelectedBookId((prevSelectedBookId) => (prevSelectedBookId === bookId ? null : bookId));
    };

    // 학습하기 버튼을 눌렀을 때, 해당 책의 학습 페이지로 이동
    const handleLearn = (bookId: string) => {
        navigate(`/learn/${bookId}`); // 해당 책의 학습 페이지로 이동
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">책 목록</h1>
            <div>
                {books.map((book) => (
                    <Accordion
                        key={book.id}
                        title={book.title}
                        isOpen={selectedBookId === book.id}
                        onToggle={() => handleAccordionToggle(book.id)}
                        onLearn={() => handleLearn(book.id)} // 학습하기 버튼 클릭 시 페이지 이동
                    >
                        {renderCurriculumItems(book.curriculum)} {/* 책의 커리큘럼을 아코디언 안에 렌더링 */}
                    </Accordion>
                ))}
            </div>
        </div>
    );
};

export default BookCurriculumPage;
