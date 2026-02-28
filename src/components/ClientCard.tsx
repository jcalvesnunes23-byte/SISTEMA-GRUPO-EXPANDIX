import React from 'react';
import type { Client } from '../types';
import { useGlobalContext } from '../context/GlobalContext';
import { useToast } from '../components/Toast';
import { Edit2, Trash2, FileText, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface ClientCardProps {
    client: Client;
    onEdit: (client: Client) => void;
    onGeneratePdf: (client: Client) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onGeneratePdf }) => {
    const { deleteClient } = useGlobalContext();
    const { addToast } = useToast();

    const handleDelete = async () => {
        if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) {
            try {
                await deleteClient(client.id);
                addToast('Cliente excluído com sucesso.', 'info');
            } catch (error) {
                addToast('Erro ao excluir cliente.', 'error');
            }
        }
    };

    const statusColors = {
        parado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        desenvolvimento: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        concluido: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    };

    const paymentColors = {
        pago: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        atrasado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const statusLabels = {
        parado: 'Parado',
        desenvolvimento: 'Em Desenvolvimento',
        concluido: 'Concluído',
    };

    const paymentLabels = {
        pago: 'Pago',
        pendente: 'Pendente',
        atrasado: 'Atrasado',
    };

    return (
        <div className="relative glass rounded-xl p-5 flex flex-col gap-4 border-l-4 transition-all hover:shadow-md" style={{
            borderLeftColor:
                client.projectStatus === 'parado' ? '#EF4444' :
                    client.projectStatus === 'desenvolvimento' ? '#EAB308' : '#22C55E'
        }}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 items-start flex-1 min-w-0">
                    {client.photoUrl ? (
                        <img src={client.photoUrl} alt={client.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary-500/30 flex-shrink-0" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <CheckCircle size={24} className="opacity-20" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate" title={client.name}>{client.name}</h3>
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate" title={client.projectName}>{client.projectName}</p>
                    </div>
                </div>

                {/* Status Badge - Now part of flex to avoid overlap */}
                <div className="flex-shrink-0 pt-1">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[client.projectStatus]}`}>
                        {statusLabels[client.projectStatus]}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={16} className="text-gray-400" />
                    <span>Entrega: {new Date(client.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign size={16} className="text-gray-400" />
                    <span className="font-medium text-primary-500">Setup: R$ {client.setupFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                    <DollarSign size={16} className="text-gray-400" />
                    <span className="font-bold">Manutenção: R$ {client.monthlyFee?.toFixed(2) || '0.00'}/mês</span>
                </div>
            </div>

            <div className="flex items-center justify-between mt-1">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${paymentColors[client.paymentStatus]}`}>
                    {paymentLabels[client.paymentStatus]}
                </span>

                {client.contractSigned && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle size={14} /> Assinado
                    </span>
                )}
            </div>

            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" className="flex-1 py-1 px-0 text-sm h-8" onClick={() => onEdit(client)}>
                    <Edit2 size={16} className="mr-1" /> Editar
                </Button>
                <Button variant="ghost" className="flex-1 py-1 px-0 text-sm h-8 text-primary-600 hover:text-primary-700" onClick={() => onGeneratePdf(client)}>
                    <FileText size={16} className="mr-1" /> PDF
                </Button>
                <Button variant="ghost" className="flex-none py-1 px-2 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDelete}>
                    <Trash2 size={16} />
                </Button>
            </div>
        </div>
    );
};
