import React, { useMemo, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/Toast';
import {
    Users, TrendingUp, Calendar, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export const FinancePage: React.FC = () => {
    const { state, updatePaymentStatus } = useGlobalContext();
    const { addToast } = useToast();
    const [filterStatus, setFilterStatus] = useState('all');

    // Summary Metrics Calculation
    const metrics = useMemo(() => {
        const activeClients = state.clients.filter(c => c.projectStatus !== 'parado');
        const totalClients = state.clients.length;

        const monthlyRevenue = activeClients.reduce((acc, client) => acc + (client.monthlyFee || 0), 0);
        const projectedAnnual = monthlyRevenue * 12;

        // Total recebido = (parcelas pagas * valor da parcela) + setup fee
        const totalReceived = state.clients.reduce((acc, client) => {
            const monthlyPaid = (client.installmentsPaid * (client.monthlyFee || 0));
            // Assuming setup is paid if project status is not 'parado'?
            // Or maybe we treat setup separately? For now let's sum them
            return acc + monthlyPaid + (client.setupFee || 0);
        }, 0);

        // Total em aberto = soma das parcelas de clientes com status pendente ou atrasado
        const totalOpen = state.clients
            .filter(c => c.paymentStatus !== 'pago')
            .reduce((acc, client) => acc + (client.monthlyFee || 0), 0);

        return { totalClients, activeClients: activeClients.length, monthlyRevenue, projectedAnnual, totalReceived, totalOpen };
    }, [state.clients]);

    // Handle Mark as Paid
    const handleMarkAsPaid = async (clientId: string) => {
        try {
            await updatePaymentStatus(clientId, 'pago', true);
            addToast('Pagamento registrado com sucesso!', 'success');
        } catch (error) {
            addToast('Erro ao registrar o pagamento.', 'error');
        }
    };

    // Filtered Table Data
    const tableData = useMemo(() => {
        return state.clients.filter(client => {
            if (filterStatus !== 'all' && client.paymentStatus !== filterStatus) return false;

            return true;
        }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    }, [state.clients, filterStatus]);

    // Chart Data: Revenue by Client (Top 5)
    const pieData = useMemo(() => {
        const sorted = [...state.clients]
            .filter(c => c.projectStatus !== 'parado')
            .sort((a, b) => b.monthlyInstallment - a.monthlyInstallment);

        const top5 = sorted.slice(0, 5).map(c => ({ name: c.name, value: c.monthlyInstallment }));
        const others = sorted.slice(5).reduce((acc, c) => acc + c.monthlyInstallment, 0);

        if (others > 0) {
            top5.push({ name: 'Outros', value: others });
        }
        return top5;
    }, [state.clients]);

    const COLORS = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#F5F3FF'];

    const paymentColors = {
        pago: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        atrasado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const paymentLabels = {
        pago: 'Pago',
        pendente: 'Pendente',
        atrasado: 'Atrasado',
    };

    return (
        <div className="flex flex-col h-full space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão Financeira</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Visão geral de receitas, métricas e pagamentos pendentes.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass p-5 rounded-2xl border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
                        <Users size={20} />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Clientes Ativos</h3>
                    </div>
                    <p className="text-2xl font-bold">{metrics.activeClients} <span className="text-sm font-normal text-gray-500">/ {metrics.totalClients}</span></p>
                </div>

                <div className="glass p-5 rounded-2xl border-l-4 border-l-primary-500">
                    <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400 mb-2">
                        <TrendingUp size={20} />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Receita Mensal</h3>
                    </div>
                    <p className="text-2xl font-bold">R$ {metrics.monthlyRevenue.toFixed(2)}</p>
                </div>

                <div className="glass p-5 rounded-2xl border-l-4 border-l-indigo-500">
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
                        <Calendar size={20} />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Projeção Anual</h3>
                    </div>
                    <p className="text-2xl font-bold">R$ {metrics.projectedAnnual.toFixed(2)}</p>
                </div>

                <div className="glass p-5 rounded-2xl border-l-4 border-l-green-500">
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-2">
                        <CheckCircle size={20} />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Total Recebido</h3>
                    </div>
                    <p className="text-2xl font-bold">R$ {metrics.totalReceived.toFixed(2)}</p>
                </div>

                <div className="glass p-5 rounded-2xl border-l-4 border-l-red-500">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                        <AlertCircle size={20} />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Em Aberto</h3>
                    </div>
                    <p className="text-2xl font-bold">R$ {metrics.totalOpen.toFixed(2)}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl lg:col-span-2 min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-6">Receita Mensal Consolidada (Simulação)</h3>
                    <div className="flex-1 w-full h-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Atual', Receita: metrics.monthlyRevenue }]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                <Tooltip cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="Receita" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-2">Distribuição de Receita</h3>
                    {pieData.length > 0 ? (
                        <div className="flex-1 w-full h-full min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Nenhum dado financeiro</div>
                    )}
                </div>
            </div>

            {/* Table Section */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock size={20} className="text-primary-500" />
                        Controle de Pagamentos
                    </h3>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            options={[
                                { value: 'all', label: 'Todos os Status' },
                                { value: 'pendente', label: 'Pendentes' },
                                { value: 'atrasado', label: 'Atrasados' },
                                { value: 'pago', label: 'Pagos' },
                            ]}
                            className="py-1.5 h-auto text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                <th className="p-4 font-medium">Cliente & Serviço</th>
                                <th className="p-4 font-medium">Plano</th>
                                <th className="p-4 font-medium">Parcela</th>
                                <th className="p-4 font-medium">Vencimento</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {tableData.length > 0 ? tableData.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{client.name}</p>
                                        <p className="text-xs text-gray-500">{client.projectName}</p>
                                    </td>
                                    <td className="p-4 text-sm capitalize">{client.planType}</td>
                                    <td className="p-4 text-sm font-medium">R$ {client.monthlyInstallment.toFixed(2)}</td>
                                    <td className="p-4 text-sm whitespace-nowrap">
                                        Dia {client.dueDay} <br />
                                        <span className="text-xs text-gray-500">{new Date(client.nextDueDate).toLocaleDateString()}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${paymentColors[client.paymentStatus]}`}>
                                            {paymentLabels[client.paymentStatus]}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            disabled={client.paymentStatus === 'pago'}
                                            onClick={() => handleMarkAsPaid(client.id)}
                                            size="sm"
                                            className="py-1.5 px-3 text-xs"
                                            icon={<CheckCircle size={14} />}
                                        >
                                            {client.paymentStatus === 'pago' ? 'Recebido' : 'Marcar Pago'}
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Nenhum cliente encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
