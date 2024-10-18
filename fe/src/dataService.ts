// dataService.ts

// 여러 개의 데이터 파일을 배열로 관리
const data1 = require('./data.json');
const data2 = require('./data2.json');
const dataStore = [data1, data2];

// 인덱스를 통해 데이터를 반환하는 함수
export const getData = (index: number) => {
    if (index >= 0 && index < dataStore.length) {
        return dataStore[index];  // 올바른 인덱스일 경우 해당 데이터를 반환
    } else {
        throw new Error('Invalid index provided');
    }
};

// 데이터 목록의 정보를 반환하는 함수
export const getDataList = () => {
    return dataStore.map((data, index) => {
        const { title, description } = data;
        return {
            id: index,
            name: `Data ${index + 1}`,
            title: title || `Title ${index + 1}`,
            description: description || `Description ${index + 1}`
        };
    });
};
