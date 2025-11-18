export const SUBJECTS = [
  "Computer Networks",
  "Data Analytics",
  "DBMS",
  "Cloud Computing",
  "Artificial Intelligence",
  "Compiler Design",
] as const;

export type Subject = (typeof SUBJECTS)[number];
