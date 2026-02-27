import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc, updateDoc } from '@firebase/firestore';
import { Send, User, MessageSquare, Trash2, Edit2, Check, X, Sparkles, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface Message {
    id: string;
    text: string;
    sender: string;
    senderPhoto?: string;
    senderId: string;
    createdAt: any;
    editedAt?: any;
}

const USER_COLORS = [
    'from-blue-600 to-indigo-600',
    'from-purple-600 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-400 to-blue-500',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-600'
];

const getUserColor = (id: string): string => {
    if (!id) return USER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % USER_COLORS.length;
    return USER_COLORS[colorIndex];
};

export const CommunityChat: React.FC = () => {
    const { user, isGuest, guestName, loginWithGoogle } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [connError, setConnError] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [botMode, setBotMode] = useState<'chat' | 'ask'>('chat'); // 'chat' = humain seulement, 'ask' = bot actif

    const addLog = (msg: string) => {
        setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    const currentName = user?.displayName || guestName;
    const currentId = user?.uid || `guest_${guestName}`;

    // Écoute en temps réel des messages Firestore
    useEffect(() => {
        const q = query(
            collection(db, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot: any) => {
                const msgs = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                    // Si createdAt est null (pendant le serverTimestamp), on met Date.now() pour ne pas perdre l'ordre
                    createdAt: doc.data().createdAt || { seconds: Date.now() / 1000 }
                })) as Message[];
                setMessages(msgs);
                setConnError(false);
                addLog(`Flux reçu: ${msgs.length} messages.`);

                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            },
            (error: any) => {
                console.error("❌ Erreur de flux Chat:", error);
                setConnError(true);
                addLog(`Erreur Flux: ${error.message}`);
            }
        );

        return () => unsubscribe();
    }, []);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentName) return;

        const msgContent = newMessage;
        setNewMessage('');

        try {
            addLog(`Envoi message: "${msgContent.substring(0, 10)}..."`);
            // Enregistrement dans Firestore
            await addDoc(collection(db, 'messages'), {
                text: msgContent,
                sender: currentName,
                senderPhoto: user?.photoURL || null,
                senderId: currentId,
                createdAt: serverTimestamp()
            });
            addLog("Message envoyé avec succès !");

            // LOGIQUE DU BOT MASTER PRO : Réponse seulement si mode 'ask'
            if (botMode === 'ask' && !msgContent.includes('[BOT]')) {
                setTimeout(async () => {
                    const quotes = [
                        "MDR ce mème ! On l'affiche sur la Tour Eiffel ? 🗼",
                        "Le génie créatif n'a pas de limite chez vous. ✨",
                        "Je suis le BOT MASTER. Ton avatar est stylé. 🤖",
                        "Ton mème a déjà été publié ? On attend que ça ! 🎨",
                        "Besoin d'aide pour un décor ? Demande-moi ! 🔍"
                    ];
                    const quote = quotes[Math.floor(Math.random() * quotes.length)];
                    await addDoc(collection(db, 'messages'), {
                        text: `[BOT MASTER] : ${quote}`,
                        sender: 'BOT MASTER',
                        senderId: 'bot_master',
                        createdAt: serverTimestamp()
                    });
                }, 1500);
            }
        } catch (error) {
            console.error("Erreur d'envoi du message:", error);
            setConnError(true);
        }
    };

    const deleteMessage = async (msgId: string) => {
        if (!window.confirm("Supprimer ce message Master ?")) return;
        try {
            await deleteDoc(doc(db, 'messages', msgId));
        } catch (error) {
            console.error("Erreur de suppression:", error);
        }
    };

    const startEdit = (msg: Message) => {
        setEditingId(msg.id);
        setEditText(msg.text);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const saveEdit = async (msgId: string) => {
        if (!editText.trim()) return;
        try {
            await updateDoc(doc(db, 'messages', msgId), {
                text: editText,
                editedAt: serverTimestamp()
            });
            setEditingId(null);
            setEditText('');
        } catch (error) {
            console.error("Erreur de modification:", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black border-l border-gray-950 w-full max-w-md">
            {/* Header du Chat */}
            <div className="p-4 border-b border-gray-950 flex items-center justify-between bg-black z-10 shadow-xl shadow-black/50">
                <div className="flex items-center gap-3">
                    <div className="bg-electric-blue/10 p-2 rounded-lg">
                        <MessageSquare className="text-electric-blue" size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-sm tracking-tight uppercase">Communauté <span className="text-electric-blue">Elite</span></h3>
                        <p className="text-[9px] text-green-500 flex items-center gap-1 font-bold uppercase tracking-widest">
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_5px_#22c55e] ${connError ? 'bg-red-500' : 'bg-green-500'}`} />
                            {connError ? 'Erreur Sync' : 'Réseau en Direct'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setBotMode(botMode === 'chat' ? 'ask' : 'chat')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 border ${botMode === 'ask' ? 'bg-electric-blue text-white border-electric-blue shadow-lg shadow-electric-blue/20' : 'bg-gray-950 text-gray-500 border-gray-900'}`}
                    >
                        <Sparkles size={12} className={botMode === 'ask' ? 'animate-pulse' : ''} />
                        {botMode === 'ask' ? 'Bot Actif' : 'Salon Privé'}
                    </button>
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className="text-[8px] font-black uppercase bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg hover:border-electric-blue/50 transition-all text-gray-500 hover:text-white"
                    >
                        {showLogs ? 'Masquer Diag' : 'Diag Master'}
                    </button>
                    <span className="text-[10px] text-gray-700 font-bold uppercase tracking-tighter">
                        {user ? 'Auth Google' : 'Mode Invité'}
                    </span>
                </div>
            </div>

            {/* Diagnostic Logs Panel */}
            <AnimatePresence>
                {showLogs && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-950 border-b border-gray-900 overflow-hidden"
                    >
                        <div className="p-4 font-mono text-[9px] text-electric-blue/70 space-y-1 bg-black/50">
                            {debugLogs.length === 0 ? (
                                <p className="italic opacity-50">Aucun log Master détecté...</p>
                            ) : (
                                debugLogs.map((log, i) => <p key={i} className="truncate select-text">{log}</p>)
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {connError && (
                <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-[10px] text-red-500 text-center animate-pulse font-bold uppercase tracking-widest">
                    ⚠️ Réseau Instable // Long-Polling Actif
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-black/90">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className={`flex gap-3 group ${msg.senderId === currentId ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            {msg.senderId !== 'bot_master' && (
                                <div className="flex-shrink-0 mt-1">
                                    {msg.senderPhoto ? (
                                        <img src={msg.senderPhoto} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/10" />
                                    ) : (
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getUserColor(msg.senderId)} flex items-center justify-center text-[10px] font-black text-white uppercase shadow-lg`}>
                                            {msg.sender[0]}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`flex flex-col space-y-1 max-w-[75%] ${msg.senderId === currentId ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 px-1">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${msg.senderId === 'bot_master' ? 'text-electric-blue italic' :
                                        msg.senderId === currentId ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        {msg.senderId === currentId ? 'Moi' : msg.sender}
                                    </span>
                                    <span className="text-[7px] text-gray-800 font-mono">
                                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                    </span>
                                </div>

                                <div className={`px-4 py-3.5 rounded-2xl text-sm leading-[1.6] relative break-words shadow-2xl ${msg.senderId === currentId
                                    ? `bg-gradient-to-br ${getUserColor(msg.senderId)} text-white rounded-tr-none shadow-blue/20`
                                    : msg.senderId === 'bot_master'
                                        ? 'bg-white/5 border border-white/10 text-white rounded-tl-none font-medium italic'
                                        : `bg-gray-950 text-gray-300 border border-gray-900 shadow-xl border-l-4 border-electric-blue/50`
                                    }`}>
                                    {editingId === msg.id ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea
                                                className="bg-black/20 border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-electric-blue custom-scrollbar min-h-[60px]"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={cancelEdit} className="p-1 hover:text-red-500 transition-colors"><X size={14} /></button>
                                                <button onClick={() => saveEdit(msg.id)} className="p-1 hover:text-green-500 transition-colors"><Check size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {msg.text}
                                            {msg.editedAt && (
                                                <span className="block text-[7px] text-gray-500 mt-1 italic font-bold uppercase tracking-widest">(Modifié)</span>
                                            )}
                                        </>
                                    )}

                                    {msg.senderId === currentId && !editingId && (
                                        <div className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <button onClick={() => startEdit(msg)} className="p-1 text-gray-700 hover:text-electric-blue transition-all" title="Modifier ce message" aria-label="Modifier ce message"><Edit2 size={12} /></button>
                                            <button onClick={() => deleteMessage(msg.id)} className="p-1 text-gray-700 hover:text-red-500 transition-all" title="Supprimer ce message" aria-label="Supprimer ce message"><Trash2 size={12} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={scrollRef} />
            </div>

            {/* Input de message : Ouvert à tous (Google ou Guest) */}
            <div className="p-4 pb-24 lg:pb-4 border-t border-gray-950 bg-black/40 backdrop-blur-md">
                {(user || isGuest) ? (
                    <form onSubmit={sendMessage} className="relative flex gap-2">
                        <input
                            type="text"
                            placeholder={isGuest ? "Discussion Master (Invité) 🔓" : "Quoi de neuf Master ? 🚀"}
                            className="flex-1 bg-gray-950 border border-gray-900 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-electric-blue transition-all focus:ring-1 focus:ring-electric-blue shadow-inner"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-electric-blue p-4 rounded-2xl text-white hover:bg-electric-blue/80 disabled:opacity-30 transition-all shadow-lg shadow-electric-blue/20 transform active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={loginWithGoogle}
                        className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all text-xs uppercase"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                        Chargement Master...
                    </button>
                )}
            </div>
        </div>
    );
};
