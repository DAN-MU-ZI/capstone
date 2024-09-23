// types.ts

export type Explanation = {
    style: string;
    content: string;
};

export type Example = {
    title: string;
    examples: Explanation[];
};

export type CurriculumItem = {
    title: string;
    subItems?: CurriculumItem[];
};
