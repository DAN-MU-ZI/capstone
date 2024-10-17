// dataService.ts

// 데이터를 JSON 파일로부터 가져옴 (파일 시스템이나 임의의 데이터 반환)
const data = require('./data2.json');  // 실제 데이터가 저장된 파일 경로

// 데이터를 가져오는 함수
export const getData = () => {
    return data;  // 데이터를 반환
};

// 개별 프로그램을 가져오는 함수 (필요시)
export const getProgramById = (programId: string) => {
    const programs = data.programs || [];
    return programs.find((program: any) => program.uuid === programId);
};

// 필요시 더 세부적으로 데이터를 반환하는 함수 추가 가능
