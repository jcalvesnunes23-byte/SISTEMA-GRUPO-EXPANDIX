import React, { useRef, useState } from 'react';
import type { Client } from '../types';
import { useGlobalContext } from '../context/GlobalContext';
import { Modal } from './Modal';
import { Button } from './ui/Button';
import { useToast } from './Toast';
import { Download, Mail, CheckCircle, FileSignature } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ContractPdfModalProps {
    client: Client;
    isOpen: boolean;
    onClose: () => void;
}

export const ContractPdfModal: React.FC<ContractPdfModalProps> = ({ client, isOpen, onClose }) => {
    const { state, updateClient } = useGlobalContext();
    const { addToast } = useToast();
    const contractRef = useRef<HTMLDivElement>(null);

    const [isDraft, setIsDraft] = useState(false);
    const [includeWitnesses, setIncludeWitnesses] = useState(state.settings.includeWitnesses);
    const [isGenerating, setIsGenerating] = useState(false);

    const { settings } = state;

    const currentYear = new Date().getFullYear();
    const formattedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const paymentMethodsDisplay = {
        pix: 'PIX',
        boleto: 'Boleto Bancário',
        transferencia: 'Transferência Bancária',
        cartao: 'Cartão de Crédito'
    };

    const handleDownloadPdf = async () => {
        if (!contractRef.current) return;
        try {
            setIsGenerating(true);

            const element = contractRef.current;

            // Render the full contract to canvas with oklch color fix
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (_doc, el) => {
                    const style = document.createElement('style');
                    style.textContent = `
                        *, *::before, *::after {
                          --color-white:#ffffff!important;--color-black:#000000!important;
                          --color-slate-50:#f8fafc!important;--color-slate-100:#f1f5f9!important;--color-slate-200:#e2e8f0!important;--color-slate-300:#cbd5e1!important;--color-slate-400:#94a3b8!important;--color-slate-500:#64748b!important;--color-slate-600:#475569!important;--color-slate-700:#334155!important;--color-slate-800:#1e293b!important;--color-slate-900:#0f172a!important;
                          --color-gray-50:#f9fafb!important;--color-gray-100:#f3f4f6!important;--color-gray-200:#e5e7eb!important;--color-gray-300:#d1d5db!important;--color-gray-400:#9ca3af!important;--color-gray-500:#6b7280!important;--color-gray-600:#4b5563!important;--color-gray-700:#374151!important;--color-gray-800:#1f2937!important;--color-gray-900:#111827!important;
                          --color-zinc-50:#fafafa!important;--color-zinc-100:#f4f4f5!important;--color-zinc-200:#e4e4e7!important;--color-zinc-300:#d4d4d8!important;--color-zinc-400:#a1a1aa!important;--color-zinc-500:#71717a!important;--color-zinc-600:#52525b!important;--color-zinc-700:#3f3f46!important;--color-zinc-800:#27272a!important;--color-zinc-900:#18181b!important;
                          --color-neutral-50:#fafafa!important;--color-neutral-500:#737373!important;--color-neutral-900:#171717!important;
                          --color-stone-500:#78716c!important;--color-stone-900:#1c1917!important;
                          --color-red-500:#ef4444!important;--color-red-600:#dc2626!important;
                          --color-green-500:#22c55e!important;--color-green-600:#16a34a!important;
                          --color-blue-500:#3b82f6!important;--color-indigo-500:#6366f1!important;
                          --color-violet-500:#8b5cf6!important;--color-purple-500:#a855f7!important;--color-purple-600:#9333ea!important;
                        }
                    `;
                    el.prepend(style);
                }
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidthMm = pdf.internal.pageSize.getWidth();   // 210mm
            const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297mm
            const canvasPxPerMm = canvas.width / pageWidthMm;

            // Maximum pixels we want to show per page (95% of A4 height, leaving 5% margin buffer).
            const maxPageHeightPx = Math.floor(pageHeightMm * canvasPxPerMm * 0.95);
            // How far up from the nominal cut point we are willing to scan for a white row.
            const searchRangePx = Math.floor(pageHeightMm * canvasPxPerMm * 0.15);

            const pixelData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;

            /** Returns true when every pixel on the given canvas row is white (or nearly white). */
            const isRowWhite = (y: number): boolean => {
                const rowStart = y * canvas.width * 4;
                for (let x = 0; x < canvas.width; x++) {
                    const idx = rowStart + x * 4;
                    // Allow a small tolerance for anti-aliasing artefacts
                    if (pixelData[idx] < 250 || pixelData[idx + 1] < 250 || pixelData[idx + 2] < 250) {
                        return false;
                    }
                }
                return true;
            };

            /**
             * Find the best cut point at or before `nominalY`.
             * Scans upward from nominalY looking for the first fully-white row.
             * Falls back to nominalY if none is found within the search range.
             */
            const findCutPoint = (nominalY: number): number => {
                const minY = nominalY - searchRangePx;
                for (let y = nominalY; y >= minY; y--) {
                    if (isRowWhite(y)) return y;
                }
                return nominalY; // fallback: use the nominal point
            };

            let yOffset = 0;
            let isFirstPage = true;

            while (yOffset < canvas.height) {
                if (!isFirstPage) pdf.addPage();

                const remaining = canvas.height - yOffset;

                let slicePx: number;
                if (remaining <= maxPageHeightPx) {
                    // Last (or only) page — take whatever is left
                    slicePx = remaining;
                } else {
                    // Find a clean white-row cut point near the nominal page boundary
                    const nominalCut = yOffset + maxPageHeightPx;
                    const cutAt = findCutPoint(nominalCut);
                    slicePx = cutAt - yOffset;
                    // Safety: never produce an empty or negative slice
                    if (slicePx <= 0) slicePx = maxPageHeightPx;
                }

                // Draw this slice onto a temporary canvas
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = slicePx;
                const ctx = pageCanvas.getContext('2d')!;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                ctx.drawImage(canvas, 0, yOffset, canvas.width, slicePx, 0, 0, canvas.width, slicePx);

                const imgData = pageCanvas.toDataURL('image/png');
                const sliceHeightMm = slicePx / canvasPxPerMm;
                pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, sliceHeightMm);

                yOffset += slicePx;
                isFirstPage = false;
            }

            pdf.save(`Contrato_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
            addToast('Download do contrato concluído com sucesso!', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            addToast('Erro ao gerar o PDF.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMarkAsSigned = async () => {
        try {
            await updateClient({ ...client, contractSigned: true });
            addToast('Contrato marcado como assinado.', 'success');
            onClose();
        } catch (error) {
            addToast('Erro ao marcar contrato como assinado.', 'error');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gerar Contrato PDF" maxWidth="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Controls Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-4 order-last md:order-first">
                    <div className="glass p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <FileSignature size={18} /> Ações
                        </h3>

                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDraft}
                                    onChange={(e) => setIsDraft(e.target.checked)}
                                    className="rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                                />
                                Marca D'água "RASCUNHO"
                            </label>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeWitnesses}
                                    onChange={(e) => setIncludeWitnesses(e.target.checked)}
                                    className="rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                                />
                                Incluir Testemunhas
                            </label>
                        </div>

                        <hr className="border-gray-200 dark:border-gray-700" />

                        <Button onClick={handleDownloadPdf} isLoading={isGenerating} icon={<Download size={16} />} className="w-full">
                            Baixar PDF
                        </Button>

                        <a
                            href={`mailto:${client.email}?subject=Contrato de Prestação de Serviços: ${client.projectName}&body=Olá ${client.name},%0D%0A%0D%0ASegue em anexo o contrato para o serviço de ${client.projectName}.%0D%0A%0D%0AQualquer dúvida, estou à disposição.`}
                            className="flex w-full"
                        >
                            <Button variant="secondary" icon={<Mail size={16} />} className="w-full">
                                Enviar por E-mail
                            </Button>
                        </a>

                        {!client.contractSigned && (
                            <Button variant="ghost" onClick={handleMarkAsSigned} icon={<CheckCircle size={16} />} className="w-full text-green-600 hover:text-green-700 mt-2 bg-green-50 dark:bg-green-900/20">
                                Marcar Assinado ✅
                            </Button>
                        )}
                    </div>
                </div>

                {/* Contract Preview Wrapper */}
                <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 p-4 sm:p-8 rounded-xl flex justify-center">
                    {/* A4 Paper Container for PDF Capture */}
                    <div
                        ref={contractRef}
                        className="relative mx-auto"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            padding: '20mm',
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: '9.5pt',
                            lineHeight: '1.5',
                            backgroundColor: '#ffffff',
                            color: '#000000'
                        }}
                    >
                        {isDraft && (
                            <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                                style={{ opacity: 0.1, transform: 'rotate(-45deg)' }}
                            >
                                <span className="text-[120px] font-bold tracking-widest" style={{ color: '#6b7280' }}>RASCUNHO</span>
                            </div>
                        )}

                        <div className="relative z-10">
                            {/* Header */}
                            {settings.logoUrl && (
                                <div className="flex justify-center mb-6">
                                    <img src={settings.logoUrl} alt="Logo" className="max-h-24 object-contain" crossOrigin="anonymous" />
                                </div>
                            )}

                            <div className="text-center mb-8 pb-4" style={{
                                borderBottom: `2px solid ${settings.contractPrimaryColor || '#000000'}`
                            }}>
                                <h1 className="text-xl font-bold uppercase tracking-wide">Contrato de Prestação de Serviços</h1>
                                <p className="text-sm mt-1">Número: #{currentYear}-{client.id.substring(0, 4).toUpperCase()} | Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                            </div>

                            {/* Clauses */}
                            <div className="text-justify" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h2 className="font-bold mb-2 uppercase" style={{ fontSize: '14px', color: settings.contractPrimaryColor || '#000000' }}>Cláusula 1 — Das Partes</h2>
                                    <p><strong>CONTRATANTE:</strong> {client.name}, portador(a) do CPF/CNPJ nº {client.document || '[Não informado]'}, e-mail {client.email}, telefone {client.phone || '[Não informado]'}.</p>
                                    <p style={{ marginTop: '8px' }}><strong>CONTRATADO(A):</strong> {settings.providerName || '[Seu Nome]'}, portador(a) do CPF/CNPJ nº {settings.providerDocument || '[Não informado]'}, {settings.providerCityState}, e-mail {settings.providerEmail}.</p>
                                </div>

                                <div>
                                    <h2 className="font-bold mb-2 uppercase" style={{ fontSize: '14px', color: settings.contractPrimaryColor || '#000000' }}>Cláusula 2 — Do Objeto</h2>
                                    <p>O presente contrato tem por objeto a prestação do serviço de <strong>{client.projectName}</strong>, conforme descrito a seguir: {client.projectDescription || 'A ser alinhado entre as partes.'}</p>
                                </div>

                                <div>
                                    <h2 className="font-bold mb-2 uppercase" style={{ fontSize: '14px', color: settings.contractPrimaryColor || '#000000' }}>Cláusula 3 — Do Prazo</h2>
                                    <p>O serviço terá início em {new Date(client.startDate).toLocaleDateString('pt-BR')} e deverá ser entregue até {new Date(client.endDate).toLocaleDateString('pt-BR')}.</p>
                                </div>

                                <div>
                                    <h2 className="font-bold mb-2 uppercase" style={{ fontSize: '14px', color: settings.contractPrimaryColor || '#000000' }}>Cláusula 4 — Do Valor e Forma de Pagamento</h2>
                                    <p>O presente contrato estabelece duas modalidades de pagamento distintas:</p>
                                    <ul style={{ marginTop: '8px', paddingLeft: '20px', listStyleType: 'disc' }}>
                                        <li style={{ marginBottom: '8px' }}><strong>Valor de Setup (Criação):</strong> Pela execução e entrega do sistema objeto deste contrato, o(a) CONTRATANTE pagará o valor fixo de <strong>R$ {client.setupFee?.toFixed(2) || '0.00'}</strong>, mediante {paymentMethodsDisplay[client.paymentMethod]}.</li>
                                        <li><strong>Valor de Manutenção Mensal:</strong> Após a conclusão ou durante o período de uso do sistema, o(a) CONTRATANTE pagará o valor fixo mensal de <strong>R$ {client.monthlyFee?.toFixed(2) || '0.00'}</strong> para garantir a disponibilidade, suporte e manutenção do serviço contratado.</li>
                                    </ul>
                                    <p style={{ marginTop: '16px' }}>O pagamento da taxa de manutenção mensal terá vencimento todo <strong>dia {client.dueDay}</strong> de cada mês subsequente ao início da prestação recorrente.</p>
                                </div>

                                <div>
                                    <h2 className="font-bold mb-2 uppercase" style={{ fontSize: '14px', color: settings.contractPrimaryColor || '#000000' }}>Cláusula 5 — Das Obrigações do Contratado</h2>
                                    <p>{settings.clause5Text}</p>
                                </div>

                                <div>
                                    <h2 className="font-bold mb-2 uppercase" style={{ fontSize: '14px', color: settings.contractPrimaryColor || '#000000' }}>Cláusula 6 — Das Obrigações do Contratante</h2>
                                    <p>{settings.clause6Text}</p>
                                </div>

                                <div>
                                    <h2 className="font-bold mb-2 uppercase" style={{ fontSize: '14px', color: settings.contractPrimaryColor || '#000000' }}>Cláusula 7 — Da Rescisão</h2>
                                    <p>{settings.clause7Text}</p>
                                </div>

                                <div>
                                    <h2 className="font-bold mb-2 uppercase" style={{ fontSize: '14px', color: settings.contractPrimaryColor || '#000000' }}>Cláusula 8 — Do Foro</h2>
                                    <p>Fica eleito o foro da comarca de {settings.providerCityState || '[Sua Cidade]'}, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer questões oriundas do presente contrato.</p>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="text-center" style={{ marginTop: '64px', breakInside: 'avoid', pageBreakInside: 'avoid', display: 'inline-block', width: '100%' }}>
                                <p style={{ marginBottom: '48px' }}>{settings.providerCityState ? settings.providerCityState.split('-')[0].trim() : '[Sua Cidade]'}, {formattedDate}.</p>

                                <div className="flex justify-between gap-8 mb-16">
                                    <div className="flex-1 pt-2" style={{ borderTop: '1px solid #000000' }}>
                                        <p className="font-bold">CONTRATANTE</p>
                                        <p>{client.name}</p>
                                        <p style={{ fontSize: '12px' }}>CPF/CNPJ: {client.document || '________________'}</p>
                                    </div>
                                    <div className="flex-1 pt-2" style={{ borderTop: '1px solid #000000' }}>
                                        <p className="font-bold">CONTRATADO(A)</p>
                                        <p>{settings.providerName || '[Seu Nome]'}</p>
                                        <p style={{ fontSize: '12px' }}>CPF/CNPJ: {settings.providerDocument || '________________'}</p>
                                    </div>
                                </div>

                                {includeWitnesses && (
                                    <div className="flex justify-between gap-8">
                                        <div className="flex-1 pt-2" style={{ borderTop: '1px solid #000000' }}>
                                            <p className="font-bold">TESTEMUNHA 1</p>
                                            <p>Nome: _________________</p>
                                            <p style={{ fontSize: '12px' }}>CPF: _________________</p>
                                        </div>
                                        <div className="flex-1 pt-2" style={{ borderTop: '1px solid #000000' }}>
                                            <p className="font-bold">TESTEMUNHA 2</p>
                                            <p>Nome: _________________</p>
                                            <p style={{ fontSize: '12px' }}>CPF: _________________</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="text-center flex justify-between" style={{
                                marginTop: '80px',
                                paddingTop: '16px',
                                borderTop: '1px solid #d1d5db',
                                fontSize: '12px',
                                color: '#6b7280'
                            }}>
                                <span>{settings.customFooter}</span>
                                <span>Contrato #{currentYear}-{client.id.substring(0, 4).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
