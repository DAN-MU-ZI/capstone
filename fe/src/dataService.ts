// dataService.ts

import axios from 'axios';  // API 요청 시 사용하는 라이브러리
const BASE_URL = 'http://localhost:8000/api';  // API의 기본 URL

// API 요청 함수의 구조처럼, MongoDB와의 상호작용을 독립적으로 처리

// Book 생성
export const createBook = async (bookData: any) => {
    try {
        const response = await axios.post(`${BASE_URL}/books`, bookData);  // API 요청처럼 처리
        return response.data;  // 응답 데이터를 반환
    } catch (error) {
        console.error('Error creating book:', error);
        throw error;  // 에러를 상위로 전파
    }
};

// 모든 Book 조회
export const getBooks = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/books`);  // API 요청처럼 처리
        return response.data;  // 응답 데이터를 반환
    } catch (error) {
        console.error('Error fetching books:', error);
        throw error;  // 에러를 상위로 전파
    }
};

// 특정 Book 조회
export const getBookById = async (bookId: string) => {
    try {
        const response = await axios.get(`${BASE_URL}/books/${bookId}`);  // API 요청처럼 처리
        return response.data;  // 응답 데이터를 반환
    } catch (error) {
        console.error(`Error fetching book with id ${bookId}:`, error);
        throw error;  // 에러를 상위로 전파
    }
};

// 특정 Book 삭제
export const deleteBookById = async (bookId: string) => {
    try {
        const response = await axios.delete(`${BASE_URL}/books/${bookId}`);  // API 요청처럼 처리
        return response.data;  // 삭제된 결과 반환
    } catch (error) {
        console.error(`Error deleting book with id ${bookId}:`, error);
        throw error;  // 에러를 상위로 전파
    }
};
