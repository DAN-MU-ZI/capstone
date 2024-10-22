// Onboarding.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import SwiperCore from 'swiper';
import { createBook } from '../dataService';
import Book from '../models/Book';

interface Style {
    title: string;
    description: string;
    example: string;
}

interface Example {
    subject: string;
    description: string;
}

interface Info {
    title: string;
    description: string;
}

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const swiperRef = useRef<SwiperCore>();
    const userId = localStorage.getItem('userId');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [input, setInput] = useState<string>('');
    const [info, setInfo] = useState<Info>();
    const [example, setExample] = useState<Example | null>(null);
    const [styles, setStyles] = useState<Style[]>([]);
    const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (swiperRef.current) {
            swiperRef.current.updateAutoHeight();
        }
    }, [swiperRef, example, styles, result]);

    const startWebSocket = () => {
        if (!input) return;

        const websocket = new WebSocket('ws://localhost:8000/api/ws');
        setWs(websocket);

        websocket.onopen = () => {
            console.log('WebSocket connection established');
            websocket.send(input);
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message:', data);

            if (data.example) {
                setExample(data.example);
            }

            if (data.styles) {
                setStyles(data.styles);
            }

            if (data.result) {
                setResult(data.result);
            }

            if (data.info) {
                setInfo(data.info);
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    };

    const submitSelectedStyles = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(selectedStyles));
        }
    };

    const handleStyleSelection = (index: number) => {
        setSelectedStyles((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const goToMyPage = useCallback(() => {
        navigate('/my');
    }, []);

    console.log(info);
    return (
        <div className="bg-base-200 min-h-screen flex justify-center items-center">
            <div className="container">
                <Swiper
                    // spaceBetween={100}
                    slidesPerView={1}
                    allowTouchMove={false}
                    autoHeight={true}
                    observer={true}
                    observeParents={true}
                    className="transition-all duration-300"
                    onSwiper={(swiper: SwiperCore) => {
                        swiperRef.current = swiper;
                    }}
                >
                    <SwiperSlide>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-4">Welcome to LangGraph!</h2>
                            <p className="text-lg text-base-content mb-4">LangGraph is a language learning platform that helps you learn languages through interactive graphs.</p>
                            <button className="btn btn-primary" onClick={() => swiperRef.current?.slideNext()}>Next</button>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-4">Get started!</h2>
                            <p className="text-lg text-base-content mb-4">Enter a sentence in your native language to get started.</p>
                            <input
                                type="text"
                                className="input input-primary w-full mb-4"
                                placeholder="Enter a sentence"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={() => { swiperRef.current?.slidePrev(); }}>Prev</button>
                            <button className="btn btn-primary" onClick={() => { startWebSocket(); swiperRef.current?.slideNext(); }}>Next</button>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-4">Example sentence</h2>
                            <p className="text-lg text-base-content mb-4">{example?.subject}</p>
                            <p className="text-lg text-base-content mb-4">{example?.description}</p>
                            <button className="btn btn-primary" onClick={() => swiperRef.current?.slidePrev()}>Prev</button>
                            <button className="btn btn-primary" onClick={() => swiperRef.current?.slideNext()}>Next</button>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-4">Select styles</h2>
                            <p className="text-lg text-base-content mb-4">Select the styles you want to apply to the sentence.</p>
                            <div className="text-center">
                                <ul className="list-none">
                                    {styles.map((style, index) => (
                                        <li key={index} style={{ marginBottom: '10px' }}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    value={index}
                                                    onChange={() => handleStyleSelection(index)}
                                                    checked={selectedStyles.includes(index)}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <strong>{style.title}</strong>: {style.example}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button className="btn btn-primary" onClick={() => swiperRef.current?.slidePrev()}>Prev</button>
                            <button className="btn btn-primary" onClick={() => { submitSelectedStyles(); swiperRef.current?.slideNext(); }}>Next</button>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-4">Result</h2>
                            {/* <p className="text-lg text-base-content mb-4">{typeof result === 'object' ? JSON.stringify(result) : result}</p> */}
                            <p className="text-lg text-base-content mb-4">학습 자료가 생성되고있습니다.</p>
                            <button className="btn btn-primary" onClick={() => swiperRef.current?.slidePrev()}>Prev</button>
                            <button className="btn btn-primary" onClick={() => {
                                if (info && userId) {
                                    console.log(result);
                                    createBook({ title: info.title, description: info.description, content: result } as Book, userId);
                                    goToMyPage();
                                };
                                // goToMyPage();
                            }}>완료</button>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>
        </div>
    );
};

export default Onboarding;
