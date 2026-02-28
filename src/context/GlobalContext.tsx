import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import type { Client, Settings, GlobalState, Action, PaymentStatus, ProjectStatus } from '../types';
import { addMonths, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';

const defaultSettings: Settings = {
    providerName: '',
    providerDocument: '',
    providerEmail: '',
    providerPhone: '',
    providerAddress: '',
    providerCityState: '',
    theme: 'dark',
    currency: 'BRL',
    contractPrimaryColor: '#7C3AED',
    clause5Text: 'O(A) CONTRATADO(A) compromete-se a executar os serviços descritos neste contrato com qualidade, dentro do prazo acordado e em conformidade com as boas práticas da área, mantendo o CONTRATANTE informado sobre o andamento do trabalho.',
    clause6Text: 'O CONTRATANTE compromete-se a efetuar os pagamentos nas datas acordadas, fornecer ao CONTRATADO(A) todos os materiais, acessos e informações necessários para a execução do serviço, e respeitar os prazos de entrega definidos neste instrumento.',
    clause7Text: 'O presente contrato poderá ser rescindido por qualquer das partes mediante notificação prévia de 15 (quinze) dias, ficando a parte rescindente responsável pelo pagamento dos valores proporcionais aos serviços já prestados até a data da rescisão.',
    includeWitnesses: false,
    customFooter: 'Documento gerado eletronicamente',
};

const initialState: GlobalState = {
    clients: [],
    settings: defaultSettings,
};

// Map DB snake_case to App camelCase
const mapClientFromDb = (dbClient: any): Client => ({
    id: dbClient.id,
    name: dbClient.name,
    email: dbClient.email,
    phone: dbClient.phone,
    document: dbClient.document,
    photoUrl: dbClient.photo_url,
    projectName: dbClient.project_name,
    projectDescription: dbClient.project_description,
    startDate: dbClient.start_date,
    endDate: dbClient.end_date,
    paymentMethod: dbClient.payment_method,
    projectStatus: dbClient.project_status,
    setupFee: Number(dbClient.setup_fee),
    monthlyFee: Number(dbClient.monthly_fee),
    planType: dbClient.plan_type,
    monthsContracted: dbClient.months_contracted,
    dueDay: dbClient.due_day,
    monthlyInstallment: Number(dbClient.monthly_installment),
    installmentsPaid: dbClient.installments_paid,
    nextDueDate: dbClient.next_due_date,
    paymentStatus: dbClient.payment_status,
    observations: dbClient.observations,
    contractSigned: dbClient.contract_signed,
    createdAt: dbClient.created_at,
    updatedAt: dbClient.updated_at,
});

// Map App camelCase to DB snake_case
const mapClientToDb = (client: Partial<Client>): any => {
    const dbData: any = {};
    if (client.id !== undefined) dbData.id = client.id;
    if (client.name !== undefined) dbData.name = client.name;
    if (client.email !== undefined) dbData.email = client.email;
    if (client.phone !== undefined) dbData.phone = client.phone;
    if (client.document !== undefined) dbData.document = client.document;
    if (client.photoUrl !== undefined) dbData.photo_url = client.photoUrl;
    if (client.projectName !== undefined) dbData.project_name = client.projectName;
    if (client.projectDescription !== undefined) dbData.project_description = client.projectDescription;
    if (client.startDate !== undefined) dbData.start_date = client.startDate;
    if (client.endDate !== undefined) dbData.end_date = client.endDate;
    if (client.paymentMethod !== undefined) dbData.payment_method = client.paymentMethod;
    if (client.projectStatus !== undefined) dbData.project_status = client.projectStatus;
    if (client.setupFee !== undefined) dbData.setup_fee = client.setupFee;
    if (client.monthlyFee !== undefined) dbData.monthly_fee = client.monthlyFee;
    if (client.planType !== undefined) dbData.plan_type = client.planType;
    if (client.monthsContracted !== undefined) dbData.months_contracted = client.monthsContracted;
    if (client.dueDay !== undefined) dbData.due_day = client.dueDay;
    if (client.monthlyInstallment !== undefined) dbData.monthly_installment = client.monthlyInstallment;
    if (client.installmentsPaid !== undefined) dbData.installments_paid = client.installmentsPaid;
    if (client.nextDueDate !== undefined) dbData.next_due_date = client.nextDueDate;
    if (client.paymentStatus !== undefined) dbData.payment_status = client.paymentStatus;
    if (client.observations !== undefined) dbData.observations = client.observations;
    if (client.contractSigned !== undefined) dbData.contract_signed = client.contractSigned;
    if (client.createdAt !== undefined) dbData.created_at = client.createdAt;

    // Always attach updated_at
    dbData.updated_at = new Date().toISOString();

    return dbData;
};

// Map DB Settings to App Settings
const mapSettingsFromDb = (dbSettings: any): Settings => ({
    providerName: dbSettings.provider_name || '',
    providerDocument: dbSettings.provider_document || '',
    providerEmail: dbSettings.provider_email || '',
    providerPhone: dbSettings.provider_phone || '',
    providerAddress: dbSettings.provider_address || '',
    providerCityState: dbSettings.provider_city_state || '',
    logoUrl: dbSettings.logo_url,
    contractPrimaryColor: dbSettings.contract_primary_color || '#7C3AED',
    clause5Text: dbSettings.clause5_text || defaultSettings.clause5Text,
    clause6Text: dbSettings.clause6_text || defaultSettings.clause6Text,
    clause7Text: dbSettings.clause7_text || defaultSettings.clause7Text,
    includeWitnesses: dbSettings.include_witnesses || false,
    customFooter: dbSettings.custom_footer || defaultSettings.customFooter,
    theme: dbSettings.theme || 'dark',
    currency: dbSettings.currency || 'BRL',
});

const mapSettingsToDb = (settings: Partial<Settings>): any => {
    const dbData: any = {};
    if (settings.providerName !== undefined) dbData.provider_name = settings.providerName;
    if (settings.providerDocument !== undefined) dbData.provider_document = settings.providerDocument;
    if (settings.providerEmail !== undefined) dbData.provider_email = settings.providerEmail;
    if (settings.providerPhone !== undefined) dbData.provider_phone = settings.providerPhone;
    if (settings.providerAddress !== undefined) dbData.provider_address = settings.providerAddress;
    if (settings.providerCityState !== undefined) dbData.provider_city_state = settings.providerCityState;
    if (settings.logoUrl !== undefined) dbData.logo_url = settings.logoUrl;
    if (settings.contractPrimaryColor !== undefined) dbData.contract_primary_color = settings.contractPrimaryColor;
    if (settings.clause5Text !== undefined) dbData.clause5_text = settings.clause5Text;
    if (settings.clause6Text !== undefined) dbData.clause6_text = settings.clause6Text;
    if (settings.clause7Text !== undefined) dbData.clause7_text = settings.clause7Text;
    if (settings.includeWitnesses !== undefined) dbData.include_witnesses = settings.includeWitnesses;
    if (settings.customFooter !== undefined) dbData.custom_footer = settings.customFooter;
    if (settings.theme !== undefined) dbData.theme = settings.theme;
    if (settings.currency !== undefined) dbData.currency = settings.currency;
    return dbData;
};

// Helper to calculate next due date based on payment logic
const calculateNextDueDate = (currentDueDateIso: string, _dueDay: number): string => {
    const currentDueDate = parseISO(currentDueDateIso);
    const nextDate = addMonths(currentDueDate, 1);
    return nextDate.toISOString();
};

const globalReducer = (state: GlobalState, action: Action): GlobalState => {
    switch (action.type) {
        case 'LOAD_STATE':
            return action.payload;

        case 'ADD_CLIENT':
            return {
                ...state,
                clients: [...state.clients, action.payload],
            };

        case 'UPDATE_CLIENT':
            return {
                ...state,
                clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c),
            };

        case 'DELETE_CLIENT':
            return {
                ...state,
                clients: state.clients.filter(c => c.id !== action.payload),
            };

        case 'UPDATE_CLIENT_STATUS':
            return {
                ...state,
                clients: state.clients.map(c =>
                    c.id === action.payload.id ? { ...c, projectStatus: action.payload.status, updatedAt: new Date().toISOString() } : c
                ),
            };

        case 'UPDATE_PAYMENT_STATUS':
            return {
                ...state,
                clients: state.clients.map(c => {
                    if (c.id === action.payload.id) {
                        let updates: Partial<Client> = {
                            paymentStatus: action.payload.status,
                            updatedAt: new Date().toISOString()
                        };

                        // If marking as paid and requested to increment installments
                        if (action.payload.status === 'pago' && action.payload.addPaidInstallment) {
                            updates.installmentsPaid = c.installmentsPaid + 1;

                            // Auto advance next due date for monthly plans
                            if (c.planType === 'mensal') {
                                updates.nextDueDate = calculateNextDueDate(c.nextDueDate, c.dueDay);
                            }
                        }

                        return { ...c, ...updates };
                    }
                    return c;
                }),
            };

        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload },
            };

        case 'TOGGLE_THEME':
            return {
                ...state,
                settings: { ...state.settings, theme: state.settings.theme === 'light' ? 'dark' : 'light' },
            };

        default:
            return state;
    }
};

const GlobalContext = createContext<{
    state: GlobalState;
    dispatch: React.Dispatch<Action>;
    isLoading: boolean;
    error: string | null;
    addClient: (client: Client) => Promise<void>;
    updateClient: (client: Client) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    updateClientStatus: (id: string, status: ProjectStatus) => Promise<void>;
    updatePaymentStatus: (id: string, status: PaymentStatus, addPaidInstallment?: boolean) => Promise<void>;
    updateSettings: (settings: Partial<Settings>) => Promise<void>;
    toggleTheme: () => Promise<void>;
} | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(globalReducer, initialState);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [settingsId, setSettingsId] = useState<string | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                const [clientsResponse, settingsResponse] = await Promise.all([
                    supabase.from('clients').select('*').order('created_at', { ascending: false }),
                    supabase.from('settings').select('*').order('created_at', { ascending: false }).limit(1)
                ]);

                if (clientsResponse.error) throw clientsResponse.error;
                if (settingsResponse.error) throw settingsResponse.error;

                const dbClients = clientsResponse.data || [];
                const dbSettingsArray = settingsResponse.data || [];

                let loadedSettings = defaultSettings;
                if (dbSettingsArray.length > 0) {
                    loadedSettings = mapSettingsFromDb(dbSettingsArray[0]);
                    setSettingsId(dbSettingsArray[0].id);
                } else {
                    // Create default settings row if none exists
                    const { data, error: insertError } = await supabase
                        .from('settings')
                        .insert(mapSettingsToDb(defaultSettings))
                        .select()
                        .single();

                    if (!insertError && data) {
                        setSettingsId(data.id);
                    }
                }

                dispatch({
                    type: 'LOAD_STATE',
                    payload: {
                        clients: dbClients.map(mapClientFromDb),
                        settings: loadedSettings
                    }
                });

            } catch (err: any) {
                console.error("Error fetching data from Supabase:", err);
                setError(err.message || 'Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Apply theme to body
    useEffect(() => {
        if (state.settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [state.settings.theme]);

    // Async Actions wrapping dispatch and Supabase calls

    const addClient = async (client: Client) => {
        const { error } = await supabase
            .from('clients')
            .insert(mapClientToDb(client));

        if (error) {
            console.error('Error adding client:', error);
            throw error;
        }

        dispatch({ type: 'ADD_CLIENT', payload: client });
    };

    const updateClient = async (client: Client) => {
        const { error } = await supabase
            .from('clients')
            .update(mapClientToDb(client))
            .eq('id', client.id);

        if (error) {
            console.error('Error updating client:', error);
            throw error;
        }

        dispatch({ type: 'UPDATE_CLIENT', payload: client });
    };

    const deleteClient = async (id: string) => {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting client:', error);
            throw error;
        }

        dispatch({ type: 'DELETE_CLIENT', payload: id });
    };

    const updateClientStatus = async (id: string, status: ProjectStatus) => {
        const { error } = await supabase
            .from('clients')
            .update({ project_status: status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error updating client status:', error);
            throw error;
        }

        dispatch({ type: 'UPDATE_CLIENT_STATUS', payload: { id, status } });
    };

    const updatePaymentStatus = async (id: string, status: PaymentStatus, addPaidInstallment?: boolean) => {
        // find client to calculate next due date if needed
        const client = state.clients.find(c => c.id === id);
        if (!client) return;

        const updates: any = {
            payment_status: status,
            updated_at: new Date().toISOString()
        };

        if (status === 'pago' && addPaidInstallment) {
            updates.installments_paid = client.installmentsPaid + 1;
            if (client.planType === 'mensal') {
                updates.next_due_date = calculateNextDueDate(client.nextDueDate, client.dueDay);
            }
        }

        const { error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }

        dispatch({ type: 'UPDATE_PAYMENT_STATUS', payload: { id, status, addPaidInstallment } });
    };

    const updateSettings = async (settings: Partial<Settings>) => {
        if (settingsId) {
            const { error } = await supabase
                .from('settings')
                .update(mapSettingsToDb(settings))
                .eq('id', settingsId);

            if (error) {
                console.error('Error updating settings:', error);
                throw error;
            }
        }
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    };

    const toggleTheme = async () => {
        const newTheme = state.settings.theme === 'light' ? 'dark' : 'light';
        if (settingsId) {
            const { error } = await supabase
                .from('settings')
                .update({ theme: newTheme })
                .eq('id', settingsId);

            if (error) {
                console.error('Error toggling theme:', error);
                // Optionally handle error visually
            }
        }
        dispatch({ type: 'TOGGLE_THEME' });
    };


    return (
        <GlobalContext.Provider value={{
            state,
            dispatch,
            isLoading,
            error,
            addClient,
            updateClient,
            deleteClient,
            updateClientStatus,
            updatePaymentStatus,
            updateSettings,
            toggleTheme
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobalContext must be used within a GlobalProvider');
    }
    return context;
};
