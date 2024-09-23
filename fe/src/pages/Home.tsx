import React, { useState } from 'react';
import { FaExpand, FaCheckCircle } from 'react-icons/fa';

const stylesData = [
    {
        id: 1,
        title: '스타일 셋 1: 개념 설명 + 실습 예제',
        description: '의존성 주입은 객체 간의 결합도를 낮추고 외부에서 객체를 주입받는 설계 패턴입니다...',
        example: {
            language: 'java',
            code: `@Component
public class MyService {
    private final MyRepository myRepository;
    @Autowired
    public MyService(MyRepository myRepository) {
        this.myRepository = myRepository;
    }
    public void performService() {
        myRepository.save();
    }
}`
        }
    },
    {
        id: 2,
        title: '스타일 셋 2: 비교 분석 + 실습 예제',
        description: '의존성 주입은 외부에서 의존성을 주입받아 결합도를 낮추는 반면, 팩토리 패턴은 객체 생성을 책임집니다...',
        example: {
            language: 'java',
            code: `public class Car {
    private Engine engine;
    public Car(Engine engine) {
        this.engine = engine;
    }
    public void drive() {
        engine.start();
    }
}`
        }
    },
    {
        id: 3,
        title: '스타일 셋 3: 비유 + 개념 설명 + 질문과 답변',
        description: '의존성 주입은 요리사가 재료를 직접 재배하지 않고 공급업체로부터 받는 것과 같습니다...',
        qa: [
            {
                question: '의존성 주입을 왜 사용하는가?',
                answer: '의존성 주입은 객체 간의 결합도를 낮추어 코드의 유연성과 테스트 용이성을 높입니다.'
            }
        ]
    }
];

const Home: React.FC = () => {
    const [selectedStyles, setSelectedStyles] = useState<number[]>([]);

    const handleStyleToggle = (id: number) => {
        setSelectedStyles(prevSelectedStyles =>
            prevSelectedStyles.includes(id)
                ? prevSelectedStyles.filter(styleId => styleId !== id)
                : [...prevSelectedStyles, id]
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {stylesData.map(style => (
                    <div
                        key={style.id}
                        style={{
                            flex: '1 0 30%',
                            margin: '10px',
                            border: '1px solid #ccc',
                            padding: '10px',
                            backgroundColor: selectedStyles.includes(style.id) ? '#e0f7fa' : '#fff'
                        }}
                        onClick={() => handleStyleToggle(style.id)}
                    >
                        <h2>{style.title}</h2>
                        <p>{style.description}</p>
                        {style.example && (
                            <div>
                                <h3>Example ({style.example.language}):</h3>
                                <pre>{style.example.code}</pre>
                            </div>
                        )}
                        {style.qa && (
                            <div>
                                <h3>Q&A:</h3>
                                {style.qa.map((item, index) => (
                                    <div key={index}>
                                        <p><strong>Q:</strong> {item.question}</p>
                                        <p><strong>A:</strong> {item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '20px' }}>
                <button
                    style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
                    onClick={() => {
                        if (window.confirm(`선택한 스타일: ${selectedStyles.join(', ')} \n` + '제출하시겠습니까?')) {
                            window.location.href = '/library';
                        }
                    }}
                >
                    제출하기
                </button>
            </div>
        </div>
    );
};

export default Home;
