import React, { useState, MouseEvent } from 'react';
import ReactFlow, { Node, Edge, useNodesState, useEdgesState } from 'react-flow-renderer';
import { useNavigate, useParams } from 'react-router-dom';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './styles.css';
import { getData } from '../dataService';


// 각 레벨에 대한 TypeScript 타입 정의
interface Topic {
    uuid: string;
    name: string;
    content: string;
}

interface Lesson {
    uuid: string;
    title: string;
    order: number;
    is_mandatory: boolean;
    description: string;
    topics: Topic[];
}

interface Module {
    uuid: string;
    title: string;
    order: number;
    is_mandatory: boolean;
    description: string;
    lessons: Lesson[];
}

interface Subject {
    uuid: string;
    title: string;
    order: number;
    is_mandatory: boolean;
    description: string;
    modules: Module[];
}

const createNodesAndEdges = (data: any) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 0;

    const traverse = (parentId: string | null, nodeData: any, level: number, type: string) => {
        let nodeId = '';
        let label = '';
        let childrenKey = '';

        // 데이터의 구조를 기반으로 어떤 단계인지 확인
        if (type === 'programs') {
            nodeId = nodeData.uuid;
            label = nodeData.title;
            childrenKey = 'curriculums';  // program 단계의 하위는 curriculums
        } else if (type === 'curriculums') {
            nodeId = nodeData.uuid;
            label = nodeData.title;
            childrenKey = 'subjects';  // curriculum 단계의 하위는 subjects
        } else if (type === 'subjects') {
            nodeId = nodeData.uuid;
            label = nodeData.title;
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

        // 엣지 추가
        if (parentId) {
            edges.push({
                id: `edge-${parentId}-${nodeId}`,
                source: parentId,
                target: nodeId,
                type: 'smoothstep',
            });
        }

        yOffset += 150;

        // 자식 항목이 있으면 재귀적으로 탐색 (subject까지만)
        if (childrenKey && nodeData[childrenKey]) {
            nodeData[childrenKey].forEach((child: any) => {
                traverse(nodeId, child, level + 1, childrenKey);
            });
        }
    };

    // 최상위 항목을 유연하게 처리
    const topLevelKey = Object.keys(data)[0];
    const topLevelData = data[topLevelKey];

    topLevelData.forEach((item: any) => {
        traverse(null, item, 0, topLevelKey);  // 최상위 항목에 대해 재귀 탐색 시작
    });

    return { nodes, edges };
};


const Flow: React.FC = () => {
    const { programId } = useParams<{ programId: string }>();
    const data = getData(Number(programId));

    // 노드 및 엣지 생성
    const { nodes, edges } = createNodesAndEdges(data);

    const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes);
    const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const navigate = useNavigate();

    // 노드 클릭 핸들러
    const onNodeClick = (event: MouseEvent, node: Node) => {
        if (node.data.nodeData) {
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
                        <h3 className="text-lg font-bold mb-4">{selectedSubject.title} - Modules, Lessons</h3>
                        {selectedSubject.modules.map((module) => (
                            <Accordion key={module.uuid} className="mb-4">
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    className="bg-gray-200 text-md font-semibold"
                                >
                                    {module.title}
                                </AccordionSummary>
                                <AccordionDetails className="bg-gray-100">
                                    {module.lessons.map((lesson) => (
                                        <div key={lesson.uuid} className="ml-4 mb-2">
                                            <button
                                                className="text-blue-600 hover:underline"
                                                onClick={() => handleLessonClick(lesson)}
                                            >
                                                {lesson.title}
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