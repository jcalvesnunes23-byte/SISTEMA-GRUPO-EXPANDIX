import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Client, ProjectStatus } from '../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
    id: ProjectStatus;
    title: string;
    clients: Client[];
    colorClass: string;
    icon: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, clients, colorClass, icon }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div className="flex flex-col h-full bg-gray-100/50 dark:bg-gray-800/30 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${colorClass}`} />
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {icon}
                        {title}
                    </h2>
                </div>
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold">
                    {clients.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 transition-colors ${isOver ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                    }`}
            >
                <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {clients.map(client => (
                        <KanbanCard key={client.id} client={client} />
                    ))}
                </SortableContext>

                {clients.length === 0 && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                        <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">Nenhum projeto</span>
                    </div>
                )}
            </div>
        </div>
    );
};
