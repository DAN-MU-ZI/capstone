import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';  // 스타일 파일
import { getData } from '../dataService';

const data = getData();  // 데이터 가져오기

const MyPage: React.FC = () => {
    const navigate = useNavigate();

    const handleProgramClick = (programId: string) => {
        if (programId) {
            navigate(`/flow/${programId}`);  // programId를 전달하면서 Flow 페이지로 이동
        } else {
            console.error("Program ID is undefined");
        }
    };

    // 최상위 키가 무엇이든 간에 프로그램 목록을 가져오도록 설정
    const topLevelKey = Object.keys(data)[0];  // 최상위 키 동적으로 가져오기
    const programs = data[topLevelKey];  // 최상위 키로부터 데이터를 가져옴

    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold mb-4">마이 페이지</h1>
            <div className="grid grid-cols-1 gap-4">
                {programs && programs.length > 0 ? (
                    programs.map((program: any) => (
                        <div
                            key={program.uuid}
                            className="p-4 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                            onClick={() => handleProgramClick(program.uuid)}
                        >
                            <h2 className="text-xl font-semibold">{program.title}</h2>
                            <p>{program.content}</p>
                        </div>
                    ))
                ) : (
                    <p>No programs available.</p>  // 프로그램이 없는 경우 처리
                )}
            </div>
        </div>
    );
};

export default MyPage;
