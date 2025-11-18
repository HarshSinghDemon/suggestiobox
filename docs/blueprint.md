# **App Name**: StudyShare Central

## Core Features:

- User Authentication: Secure user login and registration using Firebase Authentication (Google and Email/Password).
- Suggestion Upload: Logged-in users can upload suggestions with a title, description, subject, and an optional file, with an AI tool to check that there are no offensive words.
- Assignment Upload: Logged-in users can upload assignments/lab files for specific subjects with file uploads and descriptions.
- Suggestion and Assignment Browsing: All users can browse and download uploaded suggestions and assignments, sorted by subject.
- Subject Filtering: Enable filtering of suggestions and assignments by subject (Computer Networks, Data Analytics, DBMS, Cloud Computing, Artificial Intelligence, Compiler Design).
- Firebase Storage Integration: Store all uploaded files in Firebase Storage.
- Firestore Metadata: Store all file metadata in Firestore for easy retrieval and management.

## Style Guidelines:

- Primary color: A saturated, dark violet (#7950F2), calling back to the original image and promoting a spirit of intellectual generosity.
- Background color: Light violet (#F1EFFF) derived from the primary, for a consistent feel that does not distract from content.
- Accent color: Soft blue (#51D5FF), which is analogous to the primary, for CTAs and highlights.
- Body and headline font: 'Inter' for a clean, modern, accessible feel. Its grotesque style ensures clarity for code examples, or larger quantities of texts like documentation.
- Use consistent icons for file types and subjects.
- Responsive layout for optimal viewing on different devices, with clean, readable cards for content display.
- Subtle transitions and animations to enhance user experience (e.g., on hover or file loading).