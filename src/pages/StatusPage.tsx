import React, { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import type { ProjectStatus } from '../types';
import { KanbanColumn } from '../components/KanbanColumn';
import { KanbanCard } from '../components/KanbanCard';
import { PauseCircle, PlayCircle, CheckCircle } from 'lucide-react';

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export const StatusPage: React.FC = () => {
    const { state, updateClientStatus } = useGlobalContext();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const clientsByStatus = {
        parado: state.clients.filter(c => c.projectStatus === 'parado'),
        desenvolvimento: state.clients.filter(c => c.projectStatus === 'desenvolvimento'),
        concluido: state.clients.filter(c => c.projectStatus === 'concluido'),
    };

    const activeClient = activeId ? state.clients.find(c => c.id === activeId) : null;

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over) return;

        const activeIdUser = active.id as string;
        const overId = over.id as ProjectStatus | string;

        const client = state.clients.find(c => c.id === activeIdUser);
        if (!client) return;

        // Check if dropping over a column or another item
        let targetStatus = client.projectStatus;

        if (['parado', 'desenvolvimento', 'concluido'].includes(overId as string)) {
            targetStatus = overId as ProjectStatus;
        } else {
            const overClient = state.clients.find(c => c.id === overId);
            if (overClient) {
                targetStatus = overClient.projectStatus;
            }
        }

        if (client.projectStatus !== targetStatus) {
            updateClientStatus(client.id, targetStatus);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] md:h-full">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Status</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Arraste os cards para atualizar o status dos projetos.
                </p>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-10 h-full min-w-[768px]">
                        <KanbanColumn
                            id="parado"
                            title="Parado"
                            clients={clientsByStatus.parado}
                            colorClass="bg-red-500"
                            icon={<PauseCircle className="text-red-500" size={20} />}
                        />
                        <KanbanColumn
                            id="desenvolvimento"
                            title="Em Desenvolvimento"
                            clients={clientsByStatus.desenvolvimento}
                            colorClass="bg-yellow-500"
                            icon={<PlayCircle className="text-yellow-500" size={20} />}
                        />
                        <KanbanColumn
                            id="concluido"
                            title="Concluído"
                            clients={clientsByStatus.concluido}
                            colorClass="bg-green-500"
                            icon={<CheckCircle className="text-green-500" size={20} />}
                        />
                    </div>
                </div>

                <DragOverlay>
                    {activeClient ? <KanbanCard client={activeClient} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
