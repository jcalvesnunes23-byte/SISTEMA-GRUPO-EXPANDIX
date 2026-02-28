import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Client } from '../types';
import { Calendar, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { differenceInDays, isBefore, startOfDay, parseISO } from 'date-fns';

interface KanbanCardProps {
    client: Client;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ client }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: client.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
    };

    const today = startOfDay(new Date());
    const endDate = parseISO(client.endDate);
    const daysUntilDue = differenceInDays(endDate, today);
    const isOverdue = isBefore(endDate, today);

    const urgencyBadge = isOverdue
        ? { color: 'bg-red-500', text: 'Vencido', icon: AlertTriangle }
        : daysUntilDue <= 7
            ? { color: 'bg-yellow-500', text: `${daysUntilDue} dias`, icon: Clock }
            : null;

    const paymentColors = {
        pago: 'bg-green-500',
        pendente: 'bg-yellow-500',
        atrasado: 'bg-red-500',
    };

    const statusColors = {
        parado: '#EF4444',
        desenvolvimento: '#EAB308',
        concluido: '#22C55E',
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`relative glass rounded-2xl p-5 cursor-grab active:cursor-grabbing border-l-4 transition-all duration-300 bg-white/90 dark:bg-zinc-950/80 card-neon ${isDragging ? 'shadow-2xl scale-105 ring-2 ring-primary-500 z-50' : ''}`}
            style={{ ...style, borderLeftColor: statusColors[client.projectStatus] }}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3 pr-6">
                    {client.photoUrl ? (
                        <img src={client.photoUrl} alt={client.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary-500/20 flex-shrink-0" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-zinc-700 flex-shrink-0">
                            <span className="text-xs font-bold">{client.name.charAt(0)}</span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-gray-50 text-base tracking-tight line-clamp-1" title={client.name}>
                            {client.name}
                        </h4>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider line-clamp-1" title={client.projectName}>
                            {client.projectName}
                        </p>
                    </div>
                </div>

                {urgencyBadge && client.projectStatus !== 'concluido' && (
                    <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black text-white shadow-lg ${urgencyBadge.color} glow-purple`}>
                        <urgencyBadge.icon size={12} />
                        <span>{urgencyBadge.text.toUpperCase()}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4">
                <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-zinc-400">
                    <Calendar size={15} className="text-primary-500/60" />
                    <span>Entrega: <span className="font-semibold text-gray-900 dark:text-gray-200">{new Date(client.endDate).toLocaleDateString()}</span></span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-zinc-400">
                    <DollarSign size={15} className="text-primary-500/60" />
                    <span className="font-medium">Valor: <span className="font-bold text-gray-900 dark:text-gray-100">R$ {client.monthlyInstallment.toFixed(2)}/mês</span></span>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-primary-500/10">
                <div className={`w-2.5 h-2.5 rounded-full ${paymentColors[client.paymentStatus]} shadow-[0_0_8px_currentColor]`} />
                <span className="text-[10px] font-black text-gray-500 dark:text-zinc-500 uppercase tracking-widest">
                    PAGAMENTO {client.paymentStatus}
                </span>
            </div>
        </div>
    );
};
