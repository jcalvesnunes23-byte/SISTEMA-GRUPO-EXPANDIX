import React, { useState, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import type { Client } from '../types';
import { ClientCard } from '../components/ClientCard';
import { ClientForm } from '../components/ClientForm';
import { Modal } from '../components/Modal';
import { ContractPdfModal } from '../components/ContractPdfModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus } from 'lucide-react';

export const ServicesPage: React.FC = () => {
    const { state } = useGlobalContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenModal = (client?: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(undefined);
    };

    const handleGeneratePdf = (client: Client) => {
        setEditingClient(client);
        setIsPdfModalOpen(true);
    };

    const handleClosePdfModal = () => {
        setIsPdfModalOpen(false);
        setEditingClient(undefined);
    };

    const filteredClients = useMemo(() => {
        return state.clients.filter(client =>
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.projectName.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [state.clients, searchQuery]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Serviços</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Gerencie seus clientes, projetos e contratos.
                    </p>
                </div>

                <Button onClick={() => handleOpenModal()} icon={<Plus size={20} />} className="w-full sm:w-auto shadow-md">
                    Novo Cliente
                </Button>
            </div>

            <div className="mb-6 relative max-w-md">
                <Input
                    placeholder="Buscar por cliente ou serviço..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={20} />}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                />
            </div>

            <div className="flex-1 overflow-auto pb-8">
                {filteredClients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredClients.map(client => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                onEdit={handleOpenModal}
                                onGeneratePdf={handleGeneratePdf}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center glass rounded-2xl">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum cliente encontrado</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                            {searchQuery
                                ? 'Sua busca não retornou nenhum resultado. Tente outros termos.'
                                : 'Você ainda não possui clientes cadastrados. Clique em "Novo Cliente" para começar.'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => handleOpenModal()} icon={<Plus size={18} />} variant="secondary" className="mt-6">
                                Cadastrar Primeiro Cliente
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingClient ? "Editar Cliente" : "Novo Cliente"}
            >
                <ClientForm
                    initialData={editingClient}
                    onClose={handleCloseModal}
                />
            </Modal>

            {editingClient && (
                <ContractPdfModal
                    client={editingClient}
                    isOpen={isPdfModalOpen}
                    onClose={handleClosePdfModal}
                />
            )}
        </div>
    );
};
