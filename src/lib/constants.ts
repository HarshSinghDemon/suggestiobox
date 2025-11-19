
export const SUBJECTS = [
  "Computer Networks",
  "Data Analytics",
  "DBMS (3rd Sem)",
  "DBMS (5th Sem)",
  "Cloud Computing",
  "Artificial Intelligence",
  "Compiler Design",
  "Communicative English",
  "Engineering Maths-I",
  "Engineering Physics",
  "Programming for Problem Solving",
  "Basic Civil & Mechanical Engineering",
  "Data Structures & Algorithms",
  "Object Oriented Programming",
  "Digital Electronics",
  "Formal Language & Automata Theory",
  "Engineering Maths-III",
] as const;

export const ASSIGNMENT_SUBJECTS = [
    "Computer Networks",
    "Data Analytics",
    "DBMS (3rd Sem)",
    "DBMS (5th Sem)",
    "Cloud Computing",
    "Artificial Intelligence",
    "Compiler Design",
    "Communicative English",
    "Engineering Maths-I",
    "Engineering Physics",
    "Programming for Problem Solving",
    "Basic Civil & Mechanical Engineering",
    "Data Structures & Algorithms",
    "Object Oriented Programming",
    "Digital Electronics",
    "Formal Language & Automata Theory",
    "Engineering Maths-III",
] as const;

export type Subject = (typeof SUBJECTS)[number];
export type AssignmentSubject = (typeof ASSIGNMENT_SUBJECTS)[number];

export const SEMESTERS = ["1st", "3rd", "5th"] as const;
export type Semester = (typeof SEMESTERS)[number];

export const SEMESTER_SUBJECTS: Record<Semester, Subject[]> = {
    "1st": [
        "Communicative English",
        "Engineering Maths-I",
        "Engineering Physics",
        "Programming for Problem Solving",
        "Basic Civil & Mechanical Engineering",
    ],
    "3rd": [
        "Data Structures & Algorithms",
        "Object Oriented Programming",
        "Digital Electronics",
        "DBMS (3rd Sem)",
        "Formal Language & Automata Theory",
        "Engineering Maths-III",
    ],
    "5th": [
        "Computer Networks",
        "Data Analytics",
        "Cloud Computing",
        "Artificial Intelligence",
        "Compiler Design",
        "DBMS (5th Sem)",
    ]
};

export const SEMESTER_ASSIGNMENT_SUBJECTS: Record<Semester, AssignmentSubject[]> = {
    "1st": [
        "Communicative English",
        "Engineering Maths-I",
        "Engineering Physics",
        "Programming for Problem Solving",
        "Basic Civil & Mechanical Engineering",
    ],
    "3rd": [
        "Data Structures & Algorithms",
        "Object Oriented Programming",
        "Digital Electronics",
        "DBMS (3rd Sem)",
        "Formal Language & Automata Theory",
        "Engineering Maths-III",
    ],
    "5th": [
        "Computer Networks",
        "Data Analytics",
        "Cloud Computing",
        "Artificial Intelligence",
        "Compiler Design",
        "DBMS (5th Sem)",
    ]
};
