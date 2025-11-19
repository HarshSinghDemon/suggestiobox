
export const SUBJECTS = [
  "Computer Networks",
  "Data Analytics",
  "DBMS",
  "Cloud Computing",
  "Artificial Intelligence",
  "Compiler Design",
  "Semiconductor Physics",
  "Basic Electrical and Electronic Engineering",
  "English",
  "Foundation for AI",
  "Understanding Harmony and Ethical Human Conducts",
  "Calculus",
  "Python",
  "DSA",
  "Computer Organization and Architecture",
] as const;

export const ASSIGNMENT_SUBJECTS = [
  "Computer Networks",
  "Data Analytics",
  "DBMS",
  "Cloud Computing",
  "Artificial Intelligence",
  "Semiconductor Physics",
  "Basic Electrical and Electronic Engineering",
  "English",
  "Foundation for AI",
  "Understanding Harmony and Ethical Human Conducts",
  "Calculus",
  "Python",
  "DSA",
  "Computer Organization and Architecture",
] as const;

export type Subject = (typeof SUBJECTS)[number];
export type AssignmentSubject = (typeof ASSIGNMENT_SUBJECTS)[number];

export const SEMESTERS = ["1st", "3rd", "5th"] as const;
export type Semester = (typeof SEMESTERS)[number];

export const SEMESTER_SUBJECTS: Record<Semester, Subject[]> = {
    "1st": [
        "Semiconductor Physics",
        "Basic Electrical and Electronic Engineering",
        "English",
        "Foundation for AI",
        "Understanding Harmony and Ethical Human Conducts",
        "Calculus",
    ],
    "3rd": [
        "Python",
        "DSA",
        "Computer Organization and Architecture",
    ],
    "5th": [
        "Computer Networks",
        "Data Analytics",
        "DBMS",
        "Cloud Computing",
        "Artificial Intelligence",
        "Compiler Design",
    ]
};

export const SEMESTER_ASSIGNMENT_SUBJECTS: Record<Semester, AssignmentSubject[]> = {
    "1st": [
        "Semiconductor Physics",
        "Basic Electrical and Electronic Engineering",
        "English",
        "Foundation for AI",
        "Understanding Harmony and Ethical Human Conducts",
        "Calculus",
    ],
    "3rd": [
        "Python",
        "DSA",
        "Computer Organization and Architecture",
    ],
    "5th": [
        "Computer Networks",
        "Data Analytics",
        "DBMS",
        "Cloud Computing",
        "Artificial Intelligence",
    ]
};
