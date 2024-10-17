import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import './styles.css';  // 스타일 파일
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// 데이터 타입 정의
interface Topic {
    uuid: string;
    title: string;
    content: string;
    isImportant?: boolean;  // 중요 여부 표시 (선택적)
}

interface Lesson {
    uuid: string;
    title: string;
    description: string;
    topics: Topic[];
}

interface Module {
    uuid: string;
    title: string;
    lessons: Lesson[];
}

interface Subject {
    uuid: string;
    title: string;
    modules: Module[];
}

const LessonPage: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    // FlowComponent에서 받은 lesson 및 subject 데이터를 사용
    const lesson = location.state?.lesson;
    const subject = location.state?.subject;

    // 아코디언 네비게이션 상태 (보이거나 숨김 처리)
    const [showAccordion, setShowAccordion] = useState<boolean>(true);

    // 좌측 아코디언에서의 펼침 상태와 하이라이팅 상태 관리
    const [expanded, setExpanded] = useState<string | false>(false);
    const [highlightedModule, setHighlightedModule] = useState<string | null>(null);  // 하이라이팅할 모듈

    // 현재 선택된 레슨의 모듈을 하이라이팅
    useEffect(() => {
        if (lesson && subject && subject.modules) {
            const currentModule = subject.modules.find((module: { lessons: any[]; }) =>
                module.lessons?.some((l) => l.uuid === lesson.uuid)
            );
            if (currentModule) {
                setHighlightedModule(currentModule.uuid);
                setExpanded(currentModule.uuid);  // 해당 모듈을 펼쳐줌
            }
        }
    }, [lesson, subject]);

    // 아코디언 상태 변경 핸들러
    const handleAccordionChange = (panel: string) => (
        event: React.SyntheticEvent,
        isExpanded: boolean
    ) => {
        setExpanded(isExpanded ? panel : false);
    };

    // Lesson 클릭 시 페이지 이동
    const handleLessonClick = (lesson: Lesson) => {
        navigate(`/lesson/${lesson.uuid}`, { state: { lesson, subject } });
    };

    // 이전/다음 Lesson 또는 다음 Module로 이동하는 함수
    const handleNavigateLesson = (direction: 'next' | 'previous') => {
        if (!highlightedModule || !subject || !subject.modules) return;

        const currentModuleIndex = subject.modules.findIndex((module: { uuid: string; }) => module.uuid === highlightedModule);
        const currentModule = subject.modules[currentModuleIndex];

        if (!currentModule || !currentModule.lessons) return;  // 모듈이나 레슨이 없을 경우 종료

        const currentLessonIndex = currentModule.lessons.findIndex((l: { uuid: string | undefined; }) => l.uuid === lessonId);

        if (direction === 'next') {
            // 현재 Module의 마지막 Lesson이면 다음 Module의 첫 Lesson으로 이동
            if (currentLessonIndex < currentModule.lessons.length - 1) {
                const nextLesson = currentModule.lessons[currentLessonIndex + 1];
                navigate(`/lesson/${nextLesson.uuid}`, { state: { lesson: nextLesson, subject } });
            } else if (currentModuleIndex < subject.modules.length - 1) {
                const nextModule = subject.modules[currentModuleIndex + 1];
                if (nextModule.lessons && nextModule.lessons.length > 0) {
                    const nextLesson = nextModule.lessons[0];  // 다음 모듈의 첫 레슨으로 이동
                    navigate(`/lesson/${nextLesson.uuid}`, { state: { lesson: nextLesson, subject } });
                }
            }
        } else if (direction === 'previous') {
            // 현재 Module의 첫 Lesson이면 이전 Module의 마지막 Lesson으로 이동
            if (currentLessonIndex > 0) {
                const previousLesson = currentModule.lessons[currentLessonIndex - 1];
                navigate(`/lesson/${previousLesson.uuid}`, { state: { lesson: previousLesson, subject } });
            } else if (currentModuleIndex > 0) {
                const previousModule = subject.modules[currentModuleIndex - 1];
                if (previousModule.lessons && previousModule.lessons.length > 0) {
                    const previousLesson = previousModule.lessons[previousModule.lessons.length - 1];  // 이전 모듈의 마지막 레슨으로 이동
                    navigate(`/lesson/${previousLesson.uuid}`, { state: { lesson: previousLesson, subject } });
                }
            }
        }
    };

    if (!lesson || !subject || !subject.modules) {
        return <div className="text-center mt-10">Lesson not found</div>;
    }

    return (
        <div className="flex h-screen bg-base-100 relative">
            {/* 좌측 아코디언 레이아웃 토글 버튼 */}
            <button
                className="top-4 left-4 p-2 bg-gray-800 text-white rounded-md"
                onClick={() => setShowAccordion(!showAccordion)}
            >
                {showAccordion ? 'Hide Menu' : 'Show Menu'}
            </button>

            {/* 좌측 아코디언 네비게이션 - 상태에 따라 보이거나 숨김 */}
            {showAccordion && subject.modules && (
                <aside className="w-1/4 p-4 bg-gray-100 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">{subject.title}</h2>
                    {/* Subject -> Modules -> Lessons -> Topics 아코디언 */}
                    {subject.modules.map((module: Module) => (
                        <Accordion
                            key={module.uuid}
                            expanded={expanded === module.uuid}
                            onChange={handleAccordionChange(module.uuid)}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                className={`${highlightedModule === module.uuid ? 'bg-blue-300 text-blue-900' : 'bg-blue-200'
                                    } text-md font-semibold`}
                            >
                                {module.title}
                            </AccordionSummary>
                            <AccordionDetails className="bg-white">
                                {module.lessons && module.lessons.map((lesson: Lesson) => (
                                    <div key={lesson.uuid} className="ml-4 mb-2">
                                        <button
                                            className={`text-blue-600 hover:underline ${lesson.uuid === lessonId ? 'font-bold' : ''
                                                }`}
                                            onClick={() => handleLessonClick(lesson)}
                                        >
                                            {lesson.title}
                                        </button>
                                    </div>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </aside>
            )}

            {/* 선택된 Lesson 정보 영역을 감싸는 컨텐츠 영역 */}
            <div className={`flex items-center ${showAccordion ? 'w-3/4' : 'w-full'} p-6 relative`}>
                {/* 이전 버튼 */}
                <button
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full"
                    onClick={() => handleNavigateLesson('previous')}
                    disabled={
                        !highlightedModule ||
                        (subject.modules.findIndex((module: { uuid: string; }) => module.uuid === highlightedModule) === 0 &&
                            subject.modules[0].lessons.findIndex((lesson: { uuid: string | undefined; }) => lesson.uuid === lessonId) === 0) // 첫 Module의 첫 Lesson이면 비활성화
                    }
                >
                    &#8592;
                </button>

                {/* 선택된 Lesson 정보 */}
                <div className="flex-grow">
                    {/* 헤더 섹션 */}
                    <header className="bg-gray-800 text-white py-6 shadow-md">
                        <div className="container mx-auto px-4">
                            <h1 className="text-3xl font-bold">{lesson.title}</h1>
                            <p className="text-lg text-gray-300">{lesson.description}</p>
                        </div>
                    </header>

                    {/* 메인 컨텐츠 */}
                    <main className="container mx-auto mt-8 px-4">
                        <h2 className="text-xl font-bold mb-4">Topics</h2>
                        <ul className="list-disc ml-6">
                            {lesson.topics.map((topic: Topic) => (
                                <li key={topic.uuid} className="mb-2">
                                    <strong>{topic.title}:</strong> {topic.content}
                                </li>
                            ))}
                        </ul>
                    </main>
                </div>

                {/* 다음 버튼 */}
                <button
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full"
                    onClick={() => handleNavigateLesson('next')}
                    disabled={
                        !highlightedModule ||
                        (subject.modules.findIndex((module: { uuid: string; }) => module.uuid === highlightedModule) === subject.modules.length - 1 &&
                            subject.modules[subject.modules.length - 1].lessons.findIndex((lesson: { uuid: string | undefined; }) => lesson.uuid === lessonId) === subject.modules[subject.modules.length - 1].lessons.length - 1) // 마지막 Module의 마지막 Lesson이면 비활성화
                    }
                >
                    &#8594;
                </button>
            </div>
        </div>
    );
};

export default LessonPage;
