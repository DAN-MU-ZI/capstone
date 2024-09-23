import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import 'swiper/css';
import { useNavigate } from 'react-router-dom';
import SwiperCore from 'swiper';

// 타입 정의
type Explanation = {
    style: string;
    content: string;
};

type Example = {
    title: string;
    examples: Explanation[];
};

type CurriculumItem = {
    title: string;
    subItems?: CurriculumItem[];
};

type Book = {
    title: string;
    style: string[];
    curriculum: CurriculumItem[];
};

// Accordion 컴포넌트 (Swiper 높이를 업데이트하도록 수정)
const Accordion: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const swiper = useSwiper(); // Swiper 인스턴스 가져오기

    const toggleOpen = useCallback(() => {
        setIsOpen((prev) => !prev);

        // 아코디언 상태가 변경될 때 swiper의 높이를 업데이트
        setTimeout(() => {
            swiper.updateAutoHeight();
        }, 0); // 상태 변경 후 Swiper가 변화를 감지할 수 있도록 setTimeout 사용
    }, [swiper]);

    return (
        <div className="mb-2 border border-gray-300 rounded">
            <div className="p-2 bg-gray-100 cursor-pointer font-bold" onClick={toggleOpen}>
                {title}
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

// Swiper 버튼 컴포넌트
const SwiperButtonPrev: React.FC<{ children: string }> = ({ children }) => {
    const swiper = useSwiper();
    return (
        <button
            className="px-4 py-2 mr-2 bg-gray-300 text-gray-600 rounded focus:outline-none"
            onClick={() => swiper.slidePrev()}
        >
            {children}
        </button>
    );
};

const SwiperButtonNext: React.FC<{ children: string; onClick?: () => void }> = ({ children, onClick }) => {
    const swiper = useSwiper();
    return (
        <button
            className="px-4 py-2 bg-blue-500 text-white rounded focus:outline-none"
            onClick={() => {
                if (onClick) onClick();
                swiper.slideNext();
            }}
        >
            {children}
        </button>
    );
};

// 메인 컴포넌트
const Onboarding: React.FC = () => {
    const [input, setInput] = useState(''); // 입력값 상태
    const [example, setExample] = useState<Example | null>(null); // 선택된 예제 상태
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]); // 선택한 스타일 목록
    const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]); // 커리큘럼 상태 관리
    const [isLoading, setIsLoading] = useState<boolean>(true); // 커리큘럼 로딩 상태 관리
    const [isLoadingExample, setIsLoadingExample] = useState<boolean>(false); // 예제 데이터 로딩 상태 관리
    const [isExampleLoaded, setIsExampleLoaded] = useState<boolean>(false); // 예제 데이터 로딩 완료 여부
    const navigate = useNavigate(); // 페이지 이동을 위한 useNavigate 훅 사용
    const swiperRef = useRef<SwiperCore | null>(null); // Swiper 인스턴스 참조

    async function getExampleData(): Promise<Example> {
        const response = await fetch('http://localhost:8000/api/example', {
            headers: {
                Accept: 'application/json',
            },
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error('Failed to get data');
        }

        const jsonResponse = await response.json();
        return jsonResponse.data;
    }

    // 예제 선택 및 가져오기
    const selectExample = useCallback(async (text: string) => {
        setIsLoadingExample(true);  // 로딩 시작
        try {
            const data = await getExampleData();
            setExample(data);
            setIsExampleLoaded(true);  // 데이터 로드 완료 상태 설정
        } catch (error) {
            console.error('Error fetching example:', error);
        } finally {
            setIsLoadingExample(false);  // 로딩 종료
        }
    }, []);

    // 체크박스 선택 핸들러
    const handleCheckboxChange = useCallback((style: string) => {
        setSelectedStyles((prevStyles) =>
            prevStyles.includes(style) ? prevStyles.filter((s) => s !== style) : [...prevStyles, style]
        );
    }, []);

    async function getCurriculumData(): Promise<CurriculumItem[]> {
        const response = await fetch('http://localhost:8000/api/curriculum', {
            headers: {
                Accept: 'application/json',
            },
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error('Failed to get data');
        }

        const jsonResponse = await response.json();
        const data: CurriculumItem[] = jsonResponse.data;
        return data;
    }

    const fetchCurriculumData = async () => {
        setIsLoading(true);  // 커리큘럼 로딩 시작
        try {
            const data = await getCurriculumData();
            setCurriculum(data);
        } catch (error) {
            console.error('Error fetching curriculum:', error);
        } finally {
            setIsLoading(false);  // 커리큘럼 로딩 종료
        }
    };

    const handleComplete = useCallback(() => {
        navigate('/library');
    }, [navigate]);

    // Swiper 높이 업데이트: example 데이터가 로드된 후 Swiper의 높이를 자동으로 업데이트
    useEffect(() => {
        if (isExampleLoaded && swiperRef.current) {
            swiperRef.current.updateAutoHeight();
        }
    }, [isExampleLoaded]);



    // API로 데이터를 보내는 함수
    const sendSelectedData = async () => {
        try {
            // 나중에 사용할 코드
            // const book: Book = {
            //     title: input,
            //     style: selectedStyles,
            //     curriculum: curriculum,
            // };
            // const response = await fetch('/api/submit', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //         book: book,
            //     }),
            // });

            // if (!response.ok) {
            //     throw new Error('Failed to submit data');
            // }

            // const result = await response.json();
            // console.log('서버 응답:', result);

            // 데이터 전송이 성공하면 완료 페이지로 이동
            navigate('/library');
        } catch (error) {
            console.error('데이터 전송 중 오류 발생:', error);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex justify-center items-center">
            <div className="w-full max-w-xl p-6 bg-white rounded-lg shadow-lg">
                <Swiper
                    spaceBetween={50}
                    slidesPerView={1}
                    allowTouchMove={false}
                    autoHeight={true}
                    className="transition-all duration-300"
                    onSwiper={(swiper: SwiperCore) => {
                        swiperRef.current = swiper; // Swiper 인스턴스 저장
                    }}
                >
                    <SwiperSlide>
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold mb-2">학습하고 싶은 내용을 입력하세요</h2>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="예: React, Tailwind CSS"
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-end">
                            <SwiperButtonNext onClick={() => selectExample(input)}>다음</SwiperButtonNext>
                        </div>
                    </SwiperSlide>

                    <SwiperSlide>
                        {isLoadingExample ? (  // 로딩 상태일 때 로딩 표시
                            <div>Loading...</div>
                        ) : isExampleLoaded && example ? (  // 로딩 완료 후 데이터를 렌더링
                            <>
                                <h2 className="text-2xl font-bold mb-4">{example.title}에 대한 설명 스타일을 선택하세요</h2>
                                <div className="flex flex-wrap gap-4">
                                    {example.examples.map((explanation) => (
                                        <label key={explanation.style} className="border border-gray-300 rounded p-4 w-60 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mb-2"
                                                checked={selectedStyles.includes(explanation.style)}
                                                onChange={() => handleCheckboxChange(explanation.style)}
                                            />
                                            <h3 className="text-lg font-semibold mb-2">{explanation.style}</h3>
                                            <p className="text-gray-600">{explanation.content}</p>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4">
                                    <SwiperButtonPrev>이전</SwiperButtonPrev>
                                    <SwiperButtonNext onClick={() => fetchCurriculumData()}>다음</SwiperButtonNext>
                                </div>
                            </>
                        ) : (
                            <div>예제를 선택하세요.</div> // 예제를 선택하기 전 상태
                        )}
                    </SwiperSlide>

                    <SwiperSlide>
                        <h2 className="text-2xl font-bold mb-4">커리큘럼 목차</h2>
                        <div className="max-h-96 overflow-y-auto">
                            {isLoading ? (
                                <div>Loading...</div>
                            ) : (
                                curriculum.map((item, index) => (
                                    <Accordion key={index} title={item.title}>
                                        {item.subItems && renderCurriculumItems(item.subItems)}
                                    </Accordion>
                                ))
                            )}
                        </div>
                        <div className="flex justify-between mt-4">
                            <SwiperButtonPrev>이전</SwiperButtonPrev>
                            <button
                                className="px-4 py-2 bg-green-500 text-white rounded-lg focus:outline-none"
                                onClick={handleComplete}
                            >
                                완료
                            </button>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>
        </div>
    );
};

export default Onboarding;