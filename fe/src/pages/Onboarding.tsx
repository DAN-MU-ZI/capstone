// Onboarding.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
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

// API 호출 함수 수정: POST 요청으로 변경
const fetchExampleData = async (input: string): Promise<Example> => {
    const response = await fetch('http://localhost:8000/api/example', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json', // 요청 본문의 타입을 명시
        },
        method: 'POST', // GET에서 POST로 변경
        body: JSON.stringify({ input }), // 사용자 입력을 요청 본문에 포함
    });

    if (!response.ok) {
        throw new Error('Failed to fetch example data');
    }

    const data = await response.json();
    return data.data;
};

// API 호출 함수 수정: POST 요청으로 변경
const fetchCurriculumData = async (selectedStyles: string[]): Promise<CurriculumItem[]> => {
    const response = await fetch('http://localhost:8000/api/curriculum', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json', // 요청 본문의 타입을 명시
        },
        method: 'POST', // GET에서 POST로 변경
        body: JSON.stringify({ styles: selectedStyles }), // 선택한 스타일을 요청 본문에 포함
    });

    if (!response.ok) {
        throw new Error('Failed to fetch curriculum data');
    }

    const data = await response.json();
    return data.data;
};

// 로딩 인디케이터 컴포넌트
const Spinner: React.FC = () => (
    <div className="loader ease-linear rounded-full border-8 border-t-8 border-base-200 h-16 w-16"></div>
);

// 아코디언 컴포넌트
const Accordion: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const swiper = useSwiper();

    const toggleOpen = useCallback(() => {
        setIsOpen((prev) => !prev);
        setTimeout(() => {
            swiper.updateAutoHeight();
        }, 0);
    }, [swiper]);

    return (
        <div className="mb-2 border border-base-300 rounded">
            <div className="p-2 bg-base-200 cursor-pointer font-bold" onClick={toggleOpen}>
                {title}
            </div>
            {isOpen && <div className="p-2 bg-base-100">{children}</div>}
        </div>
    );
};

// 커리큘럼 항목 렌더링 함수
const renderCurriculumItems = (items: CurriculumItem[]) => (
    <ul className="list-disc pl-5">
        {items.map((item, index) => (
            <li key={index}>
                {item.title}
                {item.subItems && renderCurriculumItems(item.subItems)}
            </li>
        ))}
    </ul>
);

// Swiper 버튼 컴포넌트
const SwiperButtonPrev: React.FC<{ children: string }> = ({ children }) => {
    const swiper = useSwiper();
    return (
        <button
            className="px-4 py-2 mr-2 bg-base-300 text-base-content rounded focus:outline-none hover:bg-base-400"
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
            className="px-4 py-2 bg-primary text-primary-content rounded focus:outline-none hover:bg-primary-focus"
            onClick={() => {
                if (onClick) onClick();
                swiper.slideNext();
            }}
        >
            {children}
        </button>
    );
};

// Alert 타입 정의
type AlertType = 'error' | 'success' | 'info';

// Alert 컴포넌트
const Alert: React.FC<{
    type: AlertType;
    message: string;
    onClose: () => void;
    onToggle?: () => void; // Swiper 높이 업데이트를 위한 콜백
}> = ({ type, message, onClose, onToggle }) => {
    const typeClass = {
        error: 'alert-error',
        success: 'alert-success',
        info: 'alert-info',
    }[type];

    const handleClose = () => {
        onClose();
        if (onToggle) {
            onToggle();
        }
    };

    return (
        <div className={`alert ${typeClass} shadow-lg mb-4`}>
            <div className="flex-1">
                <span>{message}</span>
            </div>
            <div className="flex-none">
                <button onClick={handleClose} className="btn btn-sm btn-ghost">
                    ✕
                </button>
            </div>
        </div>
    );
};

// 슬라이드 컴포넌트: InputSlide
const InputSlide: React.FC<{
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    selectExample: (text: string) => Promise<void>;
    updateSwiperHeight: () => void; // Swiper 높이 업데이트 함수
}> = ({ input, setInput, selectExample, updateSwiperHeight }) => {
    const swiper = useSwiper();
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<AlertType>('error');

    const handleNext = async () => {
        // 유효성 검증
        if (!input.trim()) {
            setAlertMessage('입력값을 입력해주세요.');
            setAlertType('error');
            return;
        }
        try {
            await selectExample(input);
            swiper.slideNext();
        } catch (error) {
            console.error('Error selecting example:', error);
            setAlertMessage('예제 데이터를 가져오는 데 실패했습니다.');
            setAlertType('error');
        }
    };

    // Alert 상태 변경 시 Swiper 높이 업데이트
    useEffect(() => {
        updateSwiperHeight();
    }, [alertMessage, updateSwiperHeight]);

    return (
        <div className="mb-4">
            {alertMessage && (
                <Alert
                    type={alertType}
                    message={alertMessage}
                    onClose={() => setAlertMessage(null)}
                    onToggle={updateSwiperHeight}
                />
            )}
            <h2 className="text-2xl font-bold mb-2">학습하고 싶은 내용을 입력하세요</h2>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예: React, Tailwind CSS"
                className="w-full px-4 py-2 border border-base-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end mt-4">
                <button
                    className="px-4 py-2 bg-primary text-primary-content rounded focus:outline-none hover:bg-primary-focus"
                    onClick={handleNext}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

// 슬라이드 컴포넌트: ExampleSlide
const ExampleSlide: React.FC<{
    example: Example | null;
    isLoadingExample: boolean;
    selectedStyles: string[];
    handleCheckboxChange: (style: string) => void;
    fetchCurriculumData: () => Promise<void>;
    updateSwiperHeight: () => void; // Swiper 높이 업데이트 함수
}> = ({
    example,
    isLoadingExample,
    selectedStyles,
    handleCheckboxChange,
    fetchCurriculumData,
    updateSwiperHeight,
}) => {
        const [alertMessage, setAlertMessage] = useState<string | null>(null);
        const [alertType, setAlertType] = useState<AlertType>('error');

        const handleNextClick = async () => {
            try {
                await fetchCurriculumData();
            } catch (error) {
                console.error('Error fetching curriculum:', error);
                setAlertMessage('커리큘럼 데이터를 가져오는 데 실패했습니다.');
                setAlertType('error');
            }
        };

        // Alert 상태 변경 시 Swiper 높이 업데이트
        useEffect(() => {
            updateSwiperHeight();
        }, [alertMessage, updateSwiperHeight]);

        return (
            <>
                {alertMessage && (
                    <Alert
                        type={alertType}
                        message={alertMessage}
                        onClose={() => setAlertMessage(null)}
                        onToggle={updateSwiperHeight}
                    />
                )}
                {isLoadingExample ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner />
                    </div>
                ) : example ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4">{example.title}에 대한 설명 스타일을 선택하세요</h2>
                        <div className="flex flex-wrap gap-4">
                            {example.examples.map((explanation) => (
                                <label
                                    key={explanation.style}
                                    className="border border-base-300 rounded p-4 w-60 cursor-pointer bg-base-100 hover:bg-base-200"
                                >
                                    <input
                                        type="checkbox"
                                        className="mb-2"
                                        checked={selectedStyles.includes(explanation.style)}
                                        onChange={() => handleCheckboxChange(explanation.style)}
                                    />
                                    <h3 className="text-lg font-semibold mb-2">{explanation.style}</h3>
                                    <p className="text-base-content">{explanation.content}</p>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4">
                            <SwiperButtonPrev>이전</SwiperButtonPrev>
                            <SwiperButtonNext onClick={handleNextClick}>다음</SwiperButtonNext>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-base-content">예제를 선택하세요.</p>
                    </div>
                )}
            </>
        );
    };

// 슬라이드 컴포넌트: CurriculumSlide
const CurriculumSlide: React.FC<{
    curriculum: CurriculumItem[];
    isLoading: boolean;
    handleComplete: () => void;
    updateSwiperHeight: () => void; // Swiper 높이 업데이트 함수
}> = ({ curriculum, isLoading, handleComplete, updateSwiperHeight }) => (
    <>
        <h2 className="text-2xl font-bold mb-4">커리큘럼 목차</h2>
        <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner />
                </div>
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
                className="px-4 py-2 bg-success text-success-content rounded-lg focus:outline-none hover:bg-success-focus"
                onClick={handleComplete}
            >
                완료
            </button>
        </div>
    </>
);

// 메인 컴포넌트: Onboarding
const Onboarding: React.FC = () => {
    const [input, setInput] = useState('');
    const [example, setExample] = useState<Example | null>(null);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false); // 초기값을 false로 변경
    const [isLoadingExample, setIsLoadingExample] = useState<boolean>(false);
    const [isExampleLoaded, setIsExampleLoaded] = useState<boolean>(false);
    const navigate = useNavigate();
    const swiperRef = useRef<SwiperCore | null>(null);

    // Alert 상태 관리 (전역 Alert 제거, 각 슬라이드에서 관리)
    // const [alertMessage, setAlertMessage] = useState<string | null>(null);
    // const [alertType, setAlertType] = useState<AlertType>('error');

    // Swiper 높이 업데이트 함수
    const updateSwiperHeight = useCallback(() => {
        if (swiperRef.current) {
            swiperRef.current.updateAutoHeight();
        }
    }, []);

    // 예제 선택 및 데이터 가져오기
    const selectExample = useCallback(async (text: string) => {
        setIsLoadingExample(true);
        try {
            const data = await fetchExampleData(text);
            setExample(data);
            setIsExampleLoaded(true);
        } catch (error) {
            console.error('Error fetching example:', error);
            // Global alert 제거, 개별 슬라이드에서 관리
            // setAlertMessage('예제 데이터를 가져오는 데 실패했습니다.');
            // setAlertType('error');
            throw error; // 에러를 상위 컴포넌트로 전달
        } finally {
            setIsLoadingExample(false);
        }
    }, []);

    // 체크박스 선택 핸들러
    const handleCheckboxChange = useCallback((style: string) => {
        setSelectedStyles((prevStyles) =>
            prevStyles.includes(style) ? prevStyles.filter((s) => s !== style) : [...prevStyles, style]
        );
    }, []);

    // 커리큘럼 데이터 가져오기 (POST 요청으로 스타일 전달)
    const fetchCurriculum = useCallback(async () => {
        if (selectedStyles.length === 0) {
            // Global alert 제거, 개별 슬라이드에서 관리
            // setAlertMessage('적어도 하나의 스타일을 선택해주세요.');
            // setAlertType('error');
            throw new Error('적어도 하나의 스타일을 선택해주세요.');
        }
        setIsLoading(true);
        try {
            const data = await fetchCurriculumData(selectedStyles); // 선택한 스타일 전달
            setCurriculum(data);
        } catch (error) {
            console.error('Error fetching curriculum:', error);
            // Global alert 제거, 개별 슬라이드에서 관리
            // setAlertMessage('커리큘럼 데이터를 가져오는 데 실패했습니다.');
            throw error; // 에러를 상위 컴포넌트로 전달
        } finally {
            setIsLoading(false);
        }
    }, [selectedStyles]);

    // 완료 버튼 핸들러
    const handleComplete = useCallback(() => {
        navigate('/library');
    }, [navigate]);

    // Swiper 높이 업데이트
    useEffect(() => {
        if (isExampleLoaded && swiperRef.current) {
            swiperRef.current.updateAutoHeight();
        }
    }, [isExampleLoaded]);

    return (
        <div className="bg-base-200 min-h-screen flex justify-center items-center">
            <div className="w-full max-w-xl p-6 bg-base-100 rounded-lg shadow-lg">
                <Swiper
                    spaceBetween={50}
                    slidesPerView={1}
                    allowTouchMove={false}
                    autoHeight={true}
                    className="transition-all duration-300"
                    onSwiper={(swiper: SwiperCore) => {
                        swiperRef.current = swiper;
                    }}
                >
                    <SwiperSlide key="input-slide">
                        <InputSlide
                            input={input}
                            setInput={setInput}
                            selectExample={selectExample}
                            updateSwiperHeight={updateSwiperHeight}
                        />
                    </SwiperSlide>
                    <SwiperSlide key="example-slide">
                        <ExampleSlide
                            example={example}
                            isLoadingExample={isLoadingExample}
                            selectedStyles={selectedStyles}
                            handleCheckboxChange={handleCheckboxChange}
                            fetchCurriculumData={fetchCurriculum}
                            updateSwiperHeight={updateSwiperHeight}
                        />
                    </SwiperSlide>
                    <SwiperSlide key="curriculum-slide">
                        <CurriculumSlide
                            curriculum={curriculum}
                            isLoading={isLoading}
                            handleComplete={handleComplete}
                            updateSwiperHeight={updateSwiperHeight}
                        />
                    </SwiperSlide>
                </Swiper>
            </div>
        </div>
    );
};

export default Onboarding;
