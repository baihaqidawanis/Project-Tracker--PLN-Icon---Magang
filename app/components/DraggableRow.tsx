'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DraggableRowProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export default function DraggableRow({ id, children, className = '' }: DraggableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <tr ref={setNodeRef} style={style} className={className}>
            {/* Grip Handle */}
            <td className="px-1 py-1 text-center cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                <GripVertical size={14} className="text-gray-400 hover:text-blue-600 mx-auto" />
            </td>
            {children}
        </tr>
    );
}
