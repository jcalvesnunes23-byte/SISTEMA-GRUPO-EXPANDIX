import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Client } from '../types';
import { useGlobalContext } from '../context/GlobalContext';
import { useToast } from '../components/Toast';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { addMonths, setDate, isAfter, startOfDay } from 'date-fns';
import { Camera, X } from 'lucide-react';

interface ClientFormProps {
    initialData?: Client;
    onClose: () => void;
}

const defaultClient: Partial<Client> = {
    name: '',
    email: '',
    phone: '',
    document: '',
    projectName: '',
    projectDescription: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'pix',
    projectStatus: 'parado',
    setupFee: 0,
    monthlyFee: 0,
    planType: 'mensal',
    monthsContracted: 1,
    dueDay: new Date().getDate(),
    installmentsPaid: 0,
    observations: '',
    photoUrl: '',
};

export const ClientForm: React.FC<ClientFormProps> = ({ initialData, onClose }) => {
    const { addClient, updateClient } = useGlobalContext();
    const { addToast } = useToast();

    // Format dates for input type="date"
    const formatDateForInput = (isoString?: string) => {
        if (!isoString) return '';
        try {
            return new Date(isoString).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const [formData, setFormData] = useState<Partial<Client>>({
        ...defaultClient,
        ...initialData,
        startDate: formatDateForInput(initialData?.startDate || defaultClient.startDate),
        endDate: formatDateForInput(initialData?.endDate || defaultClient.endDate),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (limit to 2MB for base64 storage)
        if (file.size > 2 * 1024 * 1024) {
            addToast('A imagem é muito grande. Use uma foto de até 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setFormData(prev => ({ ...prev, photoUrl: '' }));
    };

    // derived values
    const setupFee = Number(formData.setupFee) || 0;
    const monthlyFee = Number(formData.monthlyFee) || 0;

    const calculateNextDueDate = (dueDay: number) => {
        const today = startOfDay(new Date());
        let nextDate = setDate(today, dueDay);

        if (isAfter(today, nextDate)) {
            nextDate = addMonths(nextDate, 1);
        }

        return nextDate.toISOString();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.email || !formData.projectName) {
            addToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const now = new Date().toISOString();

        // We calculate next due date based on the chosen day
        const nextDueDate = calculateNextDueDate(Number(formData.dueDay) || 1);

        const clientData: Client = {
            ...(formData as any),
            id: initialData?.id || uuidv4(),
            monthlyInstallment: monthlyFee,
            nextDueDate: initialData?.nextDueDate || nextDueDate,
            paymentStatus: initialData?.paymentStatus || 'pendente',
            contractSigned: initialData?.contractSigned || false,
            createdAt: initialData?.createdAt || now,
            updatedAt: now,
            // Convert dates back to full ISO format if they were edited
            startDate: new Date(formData.startDate as string).toISOString(),
            endDate: new Date(formData.endDate as string).toISOString(),
        };

        try {
            if (initialData) {
                await updateClient(clientData);
                addToast('Ficha de cliente atualizada com sucesso!', 'success');
            } else {
                await addClient(clientData);
                addToast('Novo cliente cadastrado com sucesso!', 'success');
            }
            onClose();
        } catch (error) {
            addToast('Erro ao salvar os dados do cliente.', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados Pessoais</h3>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Photo Upload */}
                    <div className="flex-shrink-0">
                        <label className="block text-sm font-medium mb-2">Foto do Cliente</label>
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center transition-all group-hover:border-primary-500">
                                {formData.photoUrl ? (
                                    <>
                                        <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={removePhoto}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-gray-400">
                                        <Camera size={24} />
                                        <span className="text-[10px] uppercase font-bold tracking-tighter">Adicionar</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <Input label="Nome Completo *" name="name" value={formData.name} onChange={handleChange} required />
                        <Input label="E-mail *" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        <Input label="Telefone / WhatsApp" name="phone" value={formData.phone} onChange={handleChange} />
                        <Input label="CPF ou CNPJ" name="document" value={formData.document} onChange={handleChange} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Serviço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nome do Projeto/Serviço *" name="projectName" value={formData.projectName} onChange={handleChange} required />
                    <Select
                        label="Forma de Pagamento"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        options={[
                            { value: 'pix', label: 'PIX' },
                            { value: 'boleto', label: 'Boleto' },
                            { value: 'transferencia', label: 'Transferência' },
                            { value: 'cartao', label: 'Cartão de Crédito' },
                        ]}
                    />
                    <div className="col-span-1 md:col-span-2">
                        <Textarea label="Descrição do Escopo do Trabalho" name="projectDescription" value={formData.projectDescription} onChange={handleChange} rows={2} />
                    </div>
                    <Input label="Data de Início" type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
                    <Input label="Data de Entrega Prevista" type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
                </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">Dados Financeiros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Valor do Setup (R$)" type="number" step="0.01" name="setupFee" value={formData.setupFee} onChange={handleChange} />
                    <Input label="Valor Mensal (Manutenção) *" type="number" step="0.01" name="monthlyFee" value={formData.monthlyFee} onChange={handleChange} required />
                    <Input label="Dia de Vencimento (1-31)" type="number" min="1" max="31" name="dueDay" value={formData.dueDay} onChange={handleChange} />
                    <Input label="Parcelas Pagas" type="number" min="0" name="installmentsPaid" value={formData.installmentsPaid} onChange={handleChange} />
                </div>

                <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex gap-8">
                        <div>
                            <span className="block text-sm opacity-80 uppercase font-bold tracking-tighter">Setup (Criação)</span>
                            <span className="text-xl font-bold">R$ {setupFee.toFixed(2)}</span>
                        </div>
                        <div className="border-l border-primary-200 dark:border-primary-700 pl-8">
                            <span className="block text-sm opacity-80 uppercase font-bold tracking-tighter">Mensalidade</span>
                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">R$ {monthlyFee.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <span className="block text-sm opacity-80">Próximo Vencimento</span>
                        <span className="font-semibold">
                            {initialData ? new Date(initialData.nextDueDate).toLocaleDateString() : new Date(calculateNextDueDate(Number(formData.dueDay) || 1)).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Textarea label="Observações Livres" name="observations" value={formData.observations} onChange={handleChange} rows={2} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{initialData ? 'Atualizar Cliente' : 'Cadastrar Cliente'}</Button>
            </div>
        </form>
    );
};
