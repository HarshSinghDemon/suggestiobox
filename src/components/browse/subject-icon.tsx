import type { LucideProps } from 'lucide-react';
import { Book, BrainCircuit, Cloud, Database, Network, Cog, Code } from 'lucide-react';
import type { Subject } from '@/lib/constants';

type SubjectIconProps = LucideProps & {
    subject: Subject;
}

export function SubjectIcon({ subject, ...props }: SubjectIconProps) {
    switch (subject) {
        case 'Computer Networks':
            return <Network {...props} />;
        case 'Data Analytics':
            return <Database {...props} />;
        case 'DBMS (3rd Sem)':
            return <Database {...props} />;
        case 'DBMS (5th Sem)':
            return <Database {...props} />;
        case 'Cloud Computing':
            return <Cloud {...props} />;
        case 'Artificial Intelligence':
            return <BrainCircuit {...props} />;
        case 'Compiler Design':
            return <Cog {...props} />;
        default:
            return <Book {...props} />;
    }
}
