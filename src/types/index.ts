export type ProjectStatus = 'parado' | 'desenvolvimento' | 'concluido';
export type PaymentStatus = 'pago' | 'pendente' | 'atrasado';
export type PaymentMethod = 'pix' | 'boleto' | 'transferencia' | 'cartao';
export type PlanType = 'mensal' | 'anual';

export interface Client {
    id: string;

    // Personal Data
    name: string;
    email: string;
    phone: string;
    document: string; // CPF/CNPJ
    photoUrl?: string;

    // Service Data
    projectName: string;
    projectDescription: string;
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    paymentMethod: PaymentMethod;
    projectStatus: ProjectStatus;

    // Financial Data
    setupFee: number;
    monthlyFee: number;
    planType: PlanType;
    monthsContracted?: number; // Only for monthly
    dueDay: number; // 1-31
    monthlyInstallment: number; // Still used for internal consistency/legacy (equals monthlyFee)
    installmentsPaid: number;
    nextDueDate: string; // ISO date string
    paymentStatus: PaymentStatus;
    observations?: string;

    // Extras
    contractSigned: boolean;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

export interface Settings {
    // Provider Data
    providerName: string;
    providerDocument: string;
    providerEmail: string;
    providerPhone: string;
    providerAddress: string;
    providerCityState: string;

    // Contract Customization
    logoUrl?: string;
    contractPrimaryColor: string;
    clause5Text: string;
    clause6Text: string;
    clause7Text: string;
    includeWitnesses: boolean;
    customFooter: string;

    // Preferences
    theme: 'light' | 'dark';
    currency: string;
}

export interface GlobalState {
    clients: Client[];
    settings: Settings;
}

export type Action =
    | { type: 'ADD_CLIENT'; payload: Client }
    | { type: 'UPDATE_CLIENT'; payload: Client }
    | { type: 'DELETE_CLIENT'; payload: string }
    | { type: 'UPDATE_CLIENT_STATUS'; payload: { id: string; status: ProjectStatus } }
    | { type: 'UPDATE_PAYMENT_STATUS'; payload: { id: string; status: PaymentStatus, addPaidInstallment?: boolean } }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
    | { type: 'TOGGLE_THEME' }
    | { type: 'LOAD_STATE'; payload: GlobalState };
