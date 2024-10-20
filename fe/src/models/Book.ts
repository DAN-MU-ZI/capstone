// 각 JSON 파일에서 가져온 데이터 타입을 정의합니다.
interface IProgram {
    uuid: string;
    title: string;
    description: string;
    curriculums: ICurriculum[];
}

interface ICurriculum {
    uuid: string;
    title: string;
    order: number;
    is_mandatory: boolean;
    description: string;
    subjects: ISubject[];
}

interface ISubject {
    uuid: string;
    title: string;
    description: string;
    modules: IModule[];
}

interface IModule {
    uuid: string;
    title: string;
    order: number;
    is_mandatory: boolean;
    description: string;
    lessons: ILesson[];
}

interface ILesson {
    uuid: string;
    title: string;
    order: number;
    is_mandatory: boolean;
    description: string;
    topics: ITopic[];
}

interface ITopic {
    uuid: string;
    title: string;
    content: string;
}

// content 타입 정의 (programs, curriculums, subjects를 지원)
interface IContent {
    programs?: IProgram[];
    curriculums?: ICurriculum[];
    subjects?: ISubject[];
}

// Book 문서의 타입을 정의합니다.
interface Book {
    _id: string;
    title: string;
    description: string;
    content: IContent;  // content는 여러 타입을 포함할 수 있습니다.
}

export default Book;