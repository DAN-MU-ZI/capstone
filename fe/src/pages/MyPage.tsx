import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';  // 스타일 파일
import { getData, getDataList } from '../dataService';

// MyPage 컴포넌트
const MyPage: React.FC = () => {
    const navigate = useNavigate();

    const dataList = getDataList();

    const handleProgramClick = (programId: any) => {
        // 프로그램 선택 후 Flow 페이지로 이동하면서 데이터 전달
        navigate(`/flow` + `/${programId}`);
    };

    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold mb-4">마이 페이지</h1>
            <ul>
                {dataList.map((data) => (
                    <li key={data.id} onClick={() => handleProgramClick(data.id)} className="cursor-pointer hover:bg-gray-200 p-2">
                        {data.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MyPage;
