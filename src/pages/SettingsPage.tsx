import React, { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { useToast } from '../components/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Save, User, FileText, Palette, Camera, X } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const { state, updateSettings } = useGlobalContext();
    const { addToast } = useToast();

    const [formData, setFormData] = useState(state.settings);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSettings(formData);
            addToast('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            addToast('Erro ao salvar as configurações.', 'error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            addToast('A logo é muito grande. Use uma imagem de até 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => {
        setFormData(prev => ({ ...prev, logoUrl: '' }));
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Gerencie seus dados profissionais e as preferências de geração de contratos.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Seus Dados */}
                <div className="glass rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg text-primary-600 dark:text-primary-400">
                            <User size={24} />
                        </div>
                        <h2 className="text-xl font-semibold">Seus Dados (Contratado)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Nome Completo ou Razão Social"
                            name="providerName"
                            value={formData.providerName}
                            onChange={handleChange}
                            placeholder="Ex: João da Silva / Agência XYZ"
                        />
                        <Input
                            label="CPF ou CNPJ"
                            name="providerDocument"
                            value={formData.providerDocument}
                            onChange={handleChange}
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        />
                        <Input
                            label="E-mail Profissional"
                            type="email"
                            name="providerEmail"
                            value={formData.providerEmail}
                            onChange={handleChange}
                            placeholder="seuemail@exemplo.com"
                        />
                        <Input
                            label="Telefone / WhatsApp"
                            name="providerPhone"
                            value={formData.providerPhone}
                            onChange={handleChange}
                            placeholder="(00) 00000-0000"
                        />
                        <div className="col-span-1 md:col-span-2">
                            <Input
                                label="Cidade e Estado"
                                name="providerCityState"
                                value={formData.providerCityState}
                                onChange={handleChange}
                                placeholder="São Paulo - SP"
                            />
                        </div>
                    </div>
                </div>

                {/* Personalização do Contrato */}
                <div className="glass rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg text-primary-600 dark:text-primary-400">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-xl font-semibold">Personalização do Contrato PDF</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            {/* Logo Upload */}
                            <div>
                                <label className="label mb-2 block">Logo da Empresa</label>
                                <div className="relative group w-full">
                                    <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center transition-all group-hover:border-primary-500">
                                        {formData.logoUrl ? (
                                            <>
                                                <img src={formData.logoUrl} alt="Logo Preview" className="h-full object-contain" />
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-gray-400">
                                                <Camera size={24} />
                                                <span className="text-xs font-bold uppercase tracking-tighter">Upload Logo</span>
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

                            <div>
                                <label className="label">Cor de Destaque do Contrato</label>
                                <div className="flex items-center gap-4 h-32 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 border border-gray-200 dark:border-gray-700">
                                    <input
                                        type="color"
                                        name="contractPrimaryColor"
                                        value={formData.contractPrimaryColor}
                                        onChange={handleChange}
                                        className="h-12 w-12 rounded cursor-pointer border-0 p-0"
                                    />
                                    <span className="text-sm font-mono font-bold">{formData.contractPrimaryColor}</span>
                                </div>
                            </div>
                        </div>

                        <Textarea
                            label="Cláusula 5 — Obrigações do Contratado"
                            name="clause5Text"
                            value={formData.clause5Text}
                            onChange={handleChange}
                            rows={3}
                        />

                        <Textarea
                            label="Cláusula 6 — Obrigações do Contratante"
                            name="clause6Text"
                            value={formData.clause6Text}
                            onChange={handleChange}
                            rows={3}
                        />

                        <Textarea
                            label="Cláusula 7 — Da Rescisão"
                            name="clause7Text"
                            value={formData.clause7Text}
                            onChange={handleChange}
                            rows={3}
                        />

                        <div className="flex items-center gap-3 p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
                            <input
                                type="checkbox"
                                id="includeWitnesses"
                                name="includeWitnesses"
                                checked={formData.includeWitnesses}
                                onChange={handleChange}
                                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <label htmlFor="includeWitnesses" className="font-medium cursor-pointer">
                                Incluir campo de testemunhas no final do contrato
                            </label>
                        </div>

                        <Input
                            label="Rodapé Personalizado"
                            name="customFooter"
                            value={formData.customFooter}
                            onChange={handleChange}
                            placeholder="Ex: www.seusite.com.br | CNPJ: 00.000.000/0000-00"
                        />
                    </div>
                </div>

                {/* Preferências Gerais */}
                <div className="glass rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg text-primary-600 dark:text-primary-400">
                            <Palette size={24} />
                        </div>
                        <h2 className="text-xl font-semibold">Preferências do Sistema</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="label">Tema (Light/Dark)</label>
                            <div className="flex items-center gap-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, theme: 'light' }))}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${formData.theme === 'light'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    ☀️ Claro
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, theme: 'dark' }))}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${formData.theme === 'dark'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    🌙 Escuro
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="label">Moeda Padrão</label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="input-field mt-1"
                            >
                                <option value="BRL">Real (R$)</option>
                                <option value="USD">Dólar (US$)</option>
                                <option value="EUR">Euro (€)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stick Save Button */}
                <div className="sticky bottom-20 md:bottom-8 z-30 flex justify-end">
                    <Button type="submit" size="large" icon={<Save size={20} />} className="shadow-xl py-3 px-8 text-lg rounded-xl">
                        Salvar Configurações
                    </Button>
                </div>
            </form>
        </div>
    );
};
