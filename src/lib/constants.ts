export const SUBJECTS = [
  "Computer Networks",
  "Data Analytics",
  "DBMS",
  "Cloud Computing",
  "Artificial Intelligence",
  "Compiler Design",
] as const;

export const ASSIGNMENT_SUBJECTS = [
  "Computer Networks",
  "Data Analytics",
  "DBMS",
  "Cloud Computing",
  "Artificial Intelligence",
] as const;

export type Subject = (typeof SUBJECTS)[number];
export type AssignmentSubject = (typeof ASSIGNMENT_SUBJECTS)[number];
