import React, { useState, MouseEvent } from 'react';
import ReactFlow, { Node, Edge, useNodesState, useEdgesState } from 'react-flow-renderer';
import { useNavigate, Outlet } from 'react-router-dom';  // 중첩된 라우팅을 위한 Outlet 사용
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './styles.css';  // 스타일 파일

const data = require('./data.json');

// 각 레벨에 대한 TypeScript 타입 정의
interface Topic {
    uuid: string;
    name: string;
    content: string;
}

interface Lesson {
    uuid: string;
    lesson_name: string;
    lesson_order: number;
    is_mandatory: boolean;
    description: string;
    topics: Topic[];
}

interface Module {
    uuid: string;
    module_name: string;
    module_order: number;
    is_mandatory: boolean;
    description: string;
    lessons: Lesson[];
}

interface Subject {
    uuid: string;
    subject_name: string;
    subject_order: number;
    is_mandatory: boolean;
    description: string;
    modules: Module[];
}

const createNodesAndEdges = (data: any) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 0; // 각 노드의 y좌표

    // 재귀적으로 데이터를 탐색하며 노드와 엣지를 생성하는 함수
    const traverse = (parentId: string | null, nodeData: any, level: number) => {
        let nodeId = '';
        let label = '';
        let childrenKey = '';

        // nodeData가 subject인지, curriculum인지, program인지를 체크
        if (nodeData.subject_name) {
            nodeId = nodeData.uuid;
            label = nodeData.subject_name;
            childrenKey = '';  // subject 단계에서 더 이상 하위 항목이 없음
        } else if (nodeData.curriculum_name) {
            nodeId = nodeData.uuid;
            label = nodeData.curriculum_name;
            childrenKey = 'subjects';  // curriculum의 하위 항목은 subjects
        } else if (nodeData.title) {
            nodeId = nodeData.uuid;
            label = nodeData.title;
            childrenKey = 'curriculums';  // 프로그램의 하위 항목은 curriculums
        } else {
            console.error("Unknown data structure", nodeData);
            return;
        }

        // 노드 생성
        nodes.push({
            id: nodeId,
            type: 'default',
            data: { label: label, nodeData: nodeData },
            position: { x: level * 300, y: yOffset },
        });

        // 부모가 있으면 엣지를 추가 (부모-자식 관계)
        if (parentId) {
            edges.push({
                id: `edge-${parentId}-${nodeId}`,
                source: parentId,
                target: nodeId,
                type: 'smoothstep',
            });
        }

        // yOffset 증가
        yOffset += 150;

        // 자식 항목이 있으면 재귀적으로 탐색 (module과 lesson은 제외)
        if (childrenKey && nodeData[childrenKey]) {
            nodeData[childrenKey].forEach((child: any) => {
                traverse(nodeId, child, level + 1);  // 재귀적으로 하위 항목 탐색
            });
        }
    };

    // 최상위 항목이 복수형 배열일 경우 탐색 시작
    const topLevelKey = Object.keys(data)[0];  // 복수형 키를 가져옴 (예: 'programs')
    const topLevelData = data[topLevelKey];    // 복수형 배열 데이터를 가져옴

    // 최상위 항목을 순회하며 재귀적으로 노드와 엣지를 생성
    topLevelData.forEach((item: any) => {
        traverse(null, item, 0);  // 최상위 항목은 parentId가 없음
    });

    return { nodes, edges };
};




const Flow: React.FC = () => {
    const { nodes, edges } = createNodesAndEdges(data);
    const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes);
    const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const navigate = useNavigate();

    // 노드 클릭 이벤트 핸들러
    const onNodeClick = (event: MouseEvent, node: Node) => {
        if (node.type === 'default' && node.data.nodeData.subject_name) {
            setSelectedSubject(node.data.nodeData as Subject);
        } else {
            setSelectedSubject(null);
        }
    };

    const handleLessonClick = (lesson: Lesson) => {
        if (selectedSubject) {
            navigate(`/lesson/${lesson.uuid}`, { state: { lesson, subject: selectedSubject } });
        }
    };

    return (
        <div className="flex h-screen w-full">
            {/* 좌측 React Flow */}
            <div className="flex-grow">
                <ReactFlow
                    nodes={nodesState}
                    edges={edgesState}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    fitView
                />
            </div>

            {/* 우측 아코디언 패널 */}
            <div className="w-96 p-5 overflow-y-auto bg-base-200">
                {selectedSubject ? (
                    <div className="accordion-panel">
                        <h3 className="text-lg font-bold mb-4">{selectedSubject.subject_name} - Modules, Lessons, Topics</h3>
                        {selectedSubject.modules.map((module) => (
                            <Accordion key={module.uuid} className="mb-4">
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    className="bg-gray-200 text-md font-semibold"
                                >
                                    {module.module_name}
                                </AccordionSummary>
                                <AccordionDetails className="bg-gray-100">
                                    {module.lessons.map((lesson) => (
                                        <div key={lesson.uuid} className="ml-4 mb-2">
                                            <button
                                                className="text-blue-600 hover:underline"
                                                onClick={() => handleLessonClick(lesson)}
                                            >
                                                {lesson.lesson_name}
                                            </button>
                                        </div>
                                    ))}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </div>
                ) : (
                    <div>
                        <h3>Select a subject to view details</h3>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Flow;
