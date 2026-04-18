import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Check, Loader2, ArrowRight } from 'lucide-react';
import { submitInquiry } from '../lib/inquiryService';

const STEP = {
    QUESTION: 'question',
    CONTACT: 'contact',
    SUCCESS: 'success',
};

const LINE_ADD_URL = 'https://lin.ee/NlEipWt';
const INACTIVITY_HINT_MS = 12000;

// Tailwind 不支援動態 class 字串，必須靜態列出讓 JIT 能掃到
const BRAND_THEME = {
    store: {
        name: '販創所',
        button: 'bg-store-500 hover:bg-store-700',
        accent: 'text-store-500',
        bubble: 'bg-store-50 text-store-900',
        chip: 'bg-store-50 text-store-700 hover:bg-store-100',
        focusRing: 'focus:border-store-500 focus:ring-store-500',
    },
    forge: {
        name: '鍛造工坊',
        button: 'bg-forge-500 hover:bg-forge-700',
        accent: 'text-forge-500',
        bubble: 'bg-forge-50 text-forge-900',
        chip: 'bg-forge-50 text-forge-700 hover:bg-forge-100',
        focusRing: 'focus:border-forge-500 focus:ring-forge-500',
    },
    maker: {
        name: '創客世界',
        button: 'bg-maker-500 hover:bg-maker-700',
        accent: 'text-maker-500',
        bubble: 'bg-maker-50 text-maker-900',
        chip: 'bg-maker-50 text-maker-700 hover:bg-maker-100',
        focusRing: 'focus:border-maker-500 focus:ring-maker-500',
    },
    bcs: {
        name: '比創空間',
        button: 'bg-bcs-black hover:bg-neutral-700',
        accent: 'text-bcs-black',
        bubble: 'bg-bcs-gray text-bcs-black',
        chip: 'bg-bcs-gray text-bcs-black hover:bg-bcs-border',
        focusRing: 'focus:border-bcs-black focus:ring-bcs-black',
    },
};

function detectBrandKey(pathname) {
    if (pathname.startsWith('/store')) return 'store';
    if (pathname.startsWith('/forge')) return 'forge';
    if (pathname.startsWith('/makerworld')) return 'maker';
    return 'bcs';
}

function getProductContext(pathname, products) {
    const match = pathname.match(/^\/store\/product\/([^/]+)/);
    if (!match) return null;
    const product = products?.find(p => p.id === match[1]);
    return product ? { id: product.id, name: product.name } : null;
}

export default function InquiryWidget({ products = [] }) {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(STEP.QUESTION);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [contact, setContact] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [hasShownAckBubble, setHasShownAckBubble] = useState(false);
    const [showInactivityHint, setShowInactivityHint] = useState(false);

    const textareaRef = useRef(null);
    const contactInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inactivityTimerRef = useRef(null);
    const ackTimerRef = useRef(null);

    const brandKey = detectBrandKey(location.pathname);
    const theme = BRAND_THEME[brandKey];
    const productCtx = getProductContext(location.pathname, products);

    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(() => {
            if (step === STEP.QUESTION) textareaRef.current?.focus();
            if (step === STEP.CONTACT) contactInputRef.current?.focus();
        }, 120);
        return () => clearTimeout(t);
    }, [isOpen, step]);

    // 自動捲到底部，讓最新訊息可見
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, hasShownAckBubble, showInactivityHint, step]);

    // ESC 關閉
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // 卸載時清理計時器
    useEffect(() => {
        return () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (ackTimerRef.current) clearTimeout(ackTimerRef.current);
        };
    }, []);

    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        setShowInactivityHint(false);
        inactivityTimerRef.current = setTimeout(() => {
            setShowInactivityHint(true);
        }, INACTIVITY_HINT_MS);
    };

    const handleTextareaInput = (e) => {
        setDraft(e.target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 140) + 'px';
        }
    };

    const handleSendMessage = (e) => {
        e?.preventDefault();
        const text = draft.trim();
        if (!text) return;

        setMessages(prev => [...prev, text]);
        setDraft('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
        }

        // 第一次送訊息後，延遲 500ms 讓 bot 回應「收到」
        if (!hasShownAckBubble) {
            ackTimerRef.current = setTimeout(() => setHasShownAckBubble(true), 500);
        }

        resetInactivityTimer();
    };

    const handleAdvanceToContact = () => {
        if (messages.length === 0) return;
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        setStep(STEP.CONTACT);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!contact.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                type: 'inquiry',
                question: messages.join('\n'),
                messages,
                contact: contact.trim(),
                brand: theme.name,
                page_url: window.location.href,
                page_path: location.pathname,
                product_id: productCtx?.id || null,
                product_name: productCtx?.name || null,
                user_agent: navigator.userAgent,
                referrer: document.referrer || null,
                submitted_at: new Date().toISOString(),
            };
            await submitInquiry(payload);
            setStep(STEP.SUCCESS);
        } catch (err) {
            console.error('[InquiryWidget] submit failed:', err);
            setError('送出失敗，請稍後再試或直接加 LINE');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        if (step === STEP.SUCCESS) {
            // 成功後關閉 → 重置整個狀態，下次打開是全新對話
            setTimeout(() => {
                setStep(STEP.QUESTION);
                setMessages([]);
                setDraft('');
                setContact('');
                setError(null);
                setHasShownAckBubble(false);
                setShowInactivityHint(false);
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
            }, 250);
        }
    };

    const handleBackToQuestion = () => {
        setStep(STEP.QUESTION);
        resetInactivityTimer();
    };

    const greeting = productCtx
        ? `Hi！看到你在看「${productCtx.name}」，有什麼想了解的？`
        : `Hi！我是${theme.name}，有什麼可以幫你的嗎？`;

    return (
        <>
            {/* 浮動按鈕 */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="有問題？私訊我們"
                    className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 ${theme.button} text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group`}
                >
                    <MessageCircle size={22} />
                    <span className="hidden sm:inline text-sm font-semibold">有問題？私訊我們</span>
                </button>
            )}

            {/* 聊天視窗 */}
            {isOpen && (
                <>
                    {/* 手機背景遮罩 */}
                    <div
                        className="fixed inset-0 bg-black/30 z-40 sm:hidden"
                        onClick={handleClose}
                        aria-hidden="true"
                    />

                    <div
                        className="fixed z-50 bg-white shadow-2xl border border-bcs-border flex flex-col
                            inset-x-3 bottom-3 rounded-2xl max-h-[85vh]
                            sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[360px] sm:rounded-2xl"
                        role="dialog"
                        aria-label="客服詢問視窗"
                    >
                        {/* 標頭 */}
                        <div className={`${theme.button} text-white px-4 py-3 rounded-t-2xl flex items-center justify-between`}>
                            <div className="min-w-0">
                                <div className="font-semibold text-sm truncate">{theme.name} 客服</div>
                                <div className="text-[11px] opacity-90">通常 2 小時內回覆</div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                                aria-label="關閉"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* 對話內容 */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white min-h-[180px]">
                            {/* 系統第一句招呼 */}
                            <div className={`${theme.bubble} px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%]`}>
                                {greeting}
                            </div>

                            {/* 客戶歷次訊息（多則） */}
                            {messages.map((msg, i) => (
                                <div key={i} className="flex justify-end">
                                    <div className="bg-bcs-black text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[85%] whitespace-pre-wrap break-words">
                                        {msg}
                                    </div>
                                </div>
                            ))}

                            {/* 第一則送出後的機器人回覆（只出現一次） */}
                            {step === STEP.QUESTION && hasShownAckBubble && (
                                <div className={`${theme.bubble} px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%]`}>
                                    收到～還有想補充的嗎？問完按下方「下一步 →」就可以留聯絡方式 ✏️
                                </div>
                            )}

                            {/* 閒置提示（只出現一次） */}
                            {step === STEP.QUESTION && showInactivityHint && (
                                <div className={`${theme.bubble} px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%]`}>
                                    看你打字差不多了，按下方「下一步 →」留個聯絡方式吧 👇
                                </div>
                            )}

                            {/* Step 2 系統回應 */}
                            {step === STEP.CONTACT && (
                                <div className={`${theme.bubble} px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%]`}>
                                    收到！留個聯絡方式我才能回覆你 ✏️
                                </div>
                            )}

                            {/* Step 3 成功訊息 */}
                            {step === STEP.SUCCESS && (
                                <>
                                    <div className="flex justify-end">
                                        <div className="bg-bcs-black text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[85%] break-words">
                                            {contact}
                                        </div>
                                    </div>
                                    <div className={`${theme.bubble} px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%]`}>
                                        <div className="flex items-start gap-2">
                                            <Check size={16} className="mt-0.5 shrink-0" />
                                            <span>已收到！我會主動聯絡你 🙌</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* 輸入區 / CTA 區 */}
                        <div className="border-t border-bcs-border bg-white px-3 py-3 rounded-b-2xl">
                            {step === STEP.QUESTION && (
                                <div className="space-y-2">
                                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                        <textarea
                                            ref={textareaRef}
                                            value={draft}
                                            onChange={handleTextareaInput}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            rows={1}
                                            placeholder={messages.length === 0 ? '直接打你想問的...' : '繼續補充...'}
                                            className={`flex-1 resize-none px-3 py-2 text-sm border border-bcs-border rounded-xl outline-none focus:ring-2 ${theme.focusRing} max-h-[140px]`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!draft.trim()}
                                            className={`shrink-0 ${theme.button} text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
                                            aria-label="送出訊息"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>

                                    {/* 至少送過一則訊息後，顯示下一步按鈕 */}
                                    {messages.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleAdvanceToContact}
                                            className={`w-full ${theme.chip} px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1`}
                                        >
                                            問完了，下一步 <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {step === STEP.CONTACT && (
                                <form onSubmit={handleSubmit} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={contactInputRef}
                                            type="text"
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            placeholder="LINE ID、Email 或手機都可以"
                                            className={`flex-1 px-3 py-2 text-sm border border-bcs-border rounded-xl outline-none focus:ring-2 ${theme.focusRing}`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!contact.trim() || isSubmitting}
                                            className={`shrink-0 ${theme.button} text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
                                            aria-label="送出"
                                        >
                                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-bcs-muted px-1">
                                        <button
                                            type="button"
                                            onClick={handleBackToQuestion}
                                            className="hover:text-bcs-black transition-colors"
                                        >
                                            ← 還想補充
                                        </button>
                                        {error && <span className="text-red-500">{error}</span>}
                                    </div>
                                </form>
                            )}

                            {step === STEP.SUCCESS && (
                                <div className="flex flex-col gap-2">
                                    <a
                                        href={LINE_ADD_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                        style={{ backgroundColor: '#06C755' }}
                                    >
                                        <MessageCircle size={16} />
                                        順便加官方 LINE，下次更快
                                    </a>
                                    <button
                                        onClick={handleClose}
                                        className="text-xs text-bcs-muted hover:text-bcs-black transition-colors py-1"
                                    >
                                        關閉
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
