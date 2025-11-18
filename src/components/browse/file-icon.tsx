import { File, FileText, FileImage, FileArchive, FileAudio, FileVideo, FileCode } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type FileIconProps = LucideProps & {
    fileType?: string;
}

export function FileIcon({ fileType, ...props }: FileIconProps) {
    if (!fileType) return <File {...props} />;

    if (fileType.startsWith('image/')) {
        return <FileImage {...props} />;
    }
    if (fileType.startsWith('audio/')) {
        return <FileAudio {...props} />;
    }
    if (fileType.startsWith('video/')) {
        return <FileVideo {...props} />;
    }

    switch(fileType) {
        case 'application/pdf':
            return <FileText {...props} />;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return <FileText {...props} />;
        case 'application/zip':
        case 'application/x-rar-compressed':
            return <FileArchive {...props} />;
        case 'text/plain':
            return <FileText {...props} />;
        case 'text/html':
        case 'application/javascript':
        case 'text/css':
            return <FileCode {...props} />
        default:
            return <File {...props} />;
    }
}
