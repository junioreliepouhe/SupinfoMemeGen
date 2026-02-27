import React, { useState } from 'react';
import { LogOut, Map, PlusSquare, LayoutGrid, Sparkles, MessageSquare, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemeCreator } from './components/Creator/MemeCreator';
import { MemeGallery } from './components/Gallery/MemeGallery';
import { CommunityChat } from './components/Chat/CommunityChat';
import { AuthProvider, useAuth } from './context/AuthContext';

// Composant Interne pour la navigation
const NavIcon = ({ icon, label, active, onClick, danger = false }: any) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-2 py-4 transition-all w-full relative group
            ${active ? 'text-electric-blue' : 'text-gray-600 hover:text-gray-400 opacity-60'}`}
    >
        <div className={`p-2 rounded-xl transition-all ${active ? 'bg-electric-blue/10' : 'group-hover:bg-white/5'}`}>
            {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {active && <motion.div layoutId="activeNav" className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-electric-blue rounded-l-full" />}
    </button>
);

function MainApp() {
    const { user, isGuest, guestName, loading, loginWithGoogle, loginAsGuest, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'creator' | 'gallery' | 'chat'>('creator');
    const [showChat, setShowChat] = useState(true);
    const [editingMeme, setEditingMeme] = useState<any>(null);
    const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

    const handleEditMeme = (meme: any) => {
        setEditingMeme(meme);
        setActiveTab('creator');
    };

    const handleSelectBackground = (url: string) => {
        setSelectedBackground(url);
        setActiveTab('creator');
    };

    const handleQuit = () => {
        const choice = window.confirm(
            "Voulez-vous fermer l'application ?\n\n" +
            "OK = Fermer l'onglet (si le navigateur le permet)\n" +
            "Annuler = Changer d'utilisateur / Se déconnecter"
        );

        if (choice) {
            // Tenter de fermer la fenêtre
            // Note: Les navigateurs modernes bloquent souvent window.close() si le script n'a pas ouvert la fenêtre
            window.close();
            
            // Plan de secours : Si la fenêtre ne se ferme pas, on remplace le contenu par un écran noir
            document.body.innerHTML = '<div style="height: 100vh; width: 100vw; background-color: black; color: white; display: flex; align-items: center; justify-content: center; font-family: sans-serif; flex-direction: column;"><h1>Application Fermée</h1><p style="color: gray;">Vous pouvez maintenant fermer cet onglet en toute sécurité.</p></div>';
        } else {
            // Changer d'utilisateur
            logout();
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-electric-blue border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,255,255,0.3)]"></div>
        </div>
    );

    return (
        <div className="h-screen bg-black text-white font-sans selection:bg-electric-blue selection:text-white flex overflow-hidden">

            {/* Barre de Navigation Latérale */}
            <div className="w-24 hidden md:flex flex-col items-center py-8 border-r border-gray-950 gap-8 bg-black/50 backdrop-blur-xl z-50">
                <div className="bg-electric-blue p-3 rounded-2xl shadow-lg shadow-electric-blue/30 rotate-3">
                    <Sparkles className="text-white" size={24} />
                </div>

                <div className="flex-1 flex flex-col gap-6 w-full pt-8">
                    <NavIcon
                        icon={<PlusSquare size={24} />}
                        label="Créer"
                        active={activeTab === 'creator'}
                        onClick={() => setActiveTab('creator')}
                    />
                    <NavIcon
                        icon={<LayoutGrid size={24} />}
                        label="Galerie"
                        active={activeTab === 'gallery'}
                        onClick={() => setActiveTab('gallery')}
                    />
                    <NavIcon
                        icon={<MessageSquare size={24} />}
                        label="Chat"
                        active={showChat}
                        onClick={() => setShowChat(!showChat)}
                    />
                </div>

                <div className="flex flex-col gap-6 w-full pb-4">
                    <NavIcon
                        icon={<LogOut size={20} />}
                        label="Quitter"
                        active={false}
                        onClick={handleQuit}
                    />
                </div>
            </div>

            {/* Zone de Contenu Principal */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="p-6 border-b border-gray-950 bg-black/40 backdrop-blur-md sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <h1 className="text-xl font-black tracking-tighter uppercase italic">
                            MEMEMASTER<span className="text-electric-blue">PRO</span>
                        </h1>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-gray-950 border border-gray-900 px-4 py-2 rounded-2xl hover:border-electric-blue/50 transition-all group cursor-default">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="P" className="w-8 h-8 rounded-full ring-2 ring-electric-blue/30 group-hover:ring-electric-blue transition-all" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-electric-blue/20 flex items-center justify-center text-electric-blue font-black text-xs">
                                        {(user?.displayName || guestName || '?')[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="hidden sm:block">
                                    <p className="text-[9px] text-gray-600 font-bold uppercase leading-none mb-1 tracking-widest">{user ? 'Maître Google' : 'Invité Fantôme'}</p>
                                    <p className="text-xs font-black truncate max-w-[120px] tracking-tight">{user?.displayName || guestName}</p>
                                </div>
                            </div>

                            {isGuest && (
                                <button
                                    onClick={loginWithGoogle}
                                    className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-electric-blue hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                >
                                    <Sparkles size={14} /> Connexion Google
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 pb-32 md:p-12 md:pb-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-electric-blue/5 via-black to-black">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        <AnimatePresence mode="wait">
                            {activeTab === 'creator' && (
                                <motion.div
                                    key="creator"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="pb-10"
                                >
                                    <MemeCreator
                                        editData={editingMeme}
                                        onClearEdit={() => setEditingMeme(null)}
                                        backgroundFromScene={selectedBackground}
                                        onBackgroundUsed={() => setSelectedBackground(null)}
                                    />
                                </motion.div>
                            )}
                            {activeTab === 'gallery' && (
                                <motion.div
                                    key="gallery"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    className="pb-10"
                                >
                                    <MemeGallery onEdit={handleEditMeme} />
                                </motion.div>
                            )}
                            {activeTab === 'chat' && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="flex-1 h-[calc(100dvh-180px)] lg:hidden"
                                >
                                    <CommunityChat />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Bottom Navigation for Mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-900 flex justify-around items-center p-3 pb-safe z-50">
                <button onClick={() => setActiveTab('creator')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'creator' ? 'text-electric-blue scale-110' : 'text-gray-500'}`}>
                    <PlusSquare size={20} />
                    <span className="text-[10px] uppercase font-bold">Créer</span>
                </button>
                <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'gallery' ? 'text-electric-blue scale-110' : 'text-gray-500'}`}>
                    <LayoutGrid size={20} />
                    <span className="text-[10px] uppercase font-bold">Galerie</span>
                </button>
                <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-electric-blue scale-110' : 'text-gray-500'}`}>
                    <MessageSquare size={20} />
                    <span className="text-[10px] uppercase font-bold">Chat</span>
                </button>
                <button onClick={handleQuit} className="flex flex-col items-center gap-1 text-gray-500">
                    <LogOut size={20} />
                    <span className="text-[10px] uppercase font-bold">Quitter</span>
                </button>
            </div>

            {/* Right Chat Panel */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ width: 0, x: 448 }}
                        animate={{ width: 448, x: 0 }}
                        exit={{ width: 0, x: 448 }}
                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                        className="hidden lg:block border-l border-gray-950 bg-black/50 backdrop-blur-3xl"
                    >
                        <CommunityChat />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button for Desktop */}
            <button
                onClick={() => setShowChat(!showChat)}
                title={showChat ? "Masquer le chat" : "Afficher le chat"}
                aria-label={showChat ? "Masquer le chat" : "Afficher le chat"}
                className={`hidden lg:block fixed top-1/2 -translate-y-1/2 right-0 bg-gray-950 border border-gray-900 border-r-0 p-3 rounded-l-2xl transition-all z-50 hover:bg-gray-900 hover:border-electric-blue/40 group ${showChat ? 'mr-[448px]' : 'mr-0'}`}
            >
                {showChat ? <ChevronRight size={20} className="text-electric-blue group-hover:scale-125 transition-transform" /> : <ChevronLeft size={20} className="text-electric-blue group-hover:scale-125 transition-transform" />}
            </button>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
}

export default App;
