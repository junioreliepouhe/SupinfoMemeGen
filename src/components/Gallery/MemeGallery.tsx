import * as React from 'react';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, deleteDoc } from '@firebase/firestore';
import { Heart, Share2, Calendar, MessageCircle, Search, Trash2, Edit, Folder, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Meme {
    id: string;
    imageUrl: string;
    topText: string;
    bottomText: string;
    category?: string;
    likes: number;
    authorName?: string;
    authorId?: string;
    authorPhoto?: string;
    isPrivate?: boolean;
    createdAt: any;
}

interface MemeGalleryProps {
    onEdit: (meme: Meme) => void;
}

import { useAuth } from '../../context/AuthContext';

export const MemeGallery: React.FC<MemeGalleryProps> = ({ onEdit }) => {
    const { user, guestName } = useAuth();
    const [memes, setMemes] = useState<Meme[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tous');

    const currentId = user?.uid || `guest_${guestName}`;

    // Écoute en temps réel de la collection 'memes'
    useEffect(() => {
        const q = query(collection(db, 'memes'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot: any) => {
                const memeData = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt || { seconds: Date.now() / 1000 }
                })) as Meme[];
                setMemes(memeData);
                setLoading(false);
            },
            (error: any) => {
                console.error("❌ Erreur de flux Galerie:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleLike = async (memeId: string) => {
        try {
            const memeRef = doc(db, 'memes', memeId);
            await updateDoc(memeRef, {
                likes: increment(1)
            });
        } catch (error) {
            console.error("Erreur de like:", error);
        }
    };

    const handleShare = async (meme: Meme) => {
        try {
            const shareText = `"${meme.topText} ${meme.bottomText}" - Créé sur MEMEMASTER PRO !`;

            if (navigator.share) {
                await navigator.share({
                    title: 'MEMEMASTER PRO',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                alert("Légende et lien copiés dans le presse-papier !");
            }
        } catch (error) {
            console.error("Erreur de partage:", error);
        }
    };

    const filteredMemes = memes.filter(meme => {
        // Filtrer les mèmes privés
        if (meme.isPrivate && meme.authorId !== currentId) {
            return false;
        }

        const matchesSearch =
            (meme.topText?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (meme.bottomText?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (meme.category?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (meme.authorName?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
            selectedCategory === 'Tous' ||
            meme.category === selectedCategory ||
            (selectedCategory === 'Mes Masters' && meme.authorId === currentId);

        return matchesSearch && matchesCategory;
    });

    const categories = ['Tous', 'Mes Masters', ...Array.from(new Set(memes.map(m => m.category).filter(Boolean)))];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-electric-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold">Chargement des chefs-d'œuvre...</p>
            </div>
        );
    }

    if (memes.length === 0) {
        return (
            <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-gray-800">
                <MessageCircle className="mx-auto text-gray-700 mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">La galerie est vide</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Soyez le premier à publier un mème de génie ! Allez dans le studio de création.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Galerie */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Galerie <span className="text-electric-blue">Élite</span></h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Le Réseau des Masters</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-hover:text-electric-blue transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par texte, auteur, catégorie..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-950 border border-gray-900 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-electric-blue w-full sm:w-80 transition-all font-bold shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* Filtres de catégories */}
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat!)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                            ${selectedCategory === cat ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20' : 'bg-gray-900 text-gray-500 hover:border-gray-600 border border-gray-800'}`}
                    >
                        {cat === 'Tous' ? <Filter size={14} /> : <Folder size={14} />}
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <AnimatePresence>
                    {filteredMemes.map((meme) => (
                        <motion.div
                            key={meme.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass rounded-3xl overflow-hidden group hover:border-electric-blue/50 transition-all duration-300 shadow-xl"
                        >
                            {/* Image du Mème */}
                            <div className="aspect-square relative overflow-hidden bg-gray-900">
                                <img
                                    src={meme.imageUrl}
                                    alt="Mème"
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <button
                                        onClick={() => handleLike(meme.id)}
                                        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-electric-blue hover:text-white transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        <Heart size={16} fill="currentColor" /> J'aime
                                    </button>
                                </div>
                            </div>

                            {/* Détails du Mème */}
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {meme.authorPhoto ? (
                                            <img src={meme.authorPhoto} alt="" className="w-6 h-6 rounded-full ring-1 ring-electric-blue/30" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gray-950 border border-gray-900 flex items-center justify-center text-[8px] font-black text-gray-600 uppercase">
                                                {meme.authorName ? meme.authorName[0] : '?'}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-0.5">Auteur</span>
                                            <span className="text-[10px] text-gray-300 font-black truncate max-w-[80px]">{meme.authorName || 'Anonyme'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {meme.isPrivate && (
                                            <div className="flex items-center gap-1 text-red-400 text-[9px] uppercase font-bold tracking-widest bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                                                Privé
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-gray-500 text-[9px] uppercase font-bold tracking-widest bg-gray-950 px-2 py-1 rounded-lg border border-gray-900">
                                            <Folder size={10} className="text-electric-blue" />
                                            {meme.category || 'Général'}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm font-medium text-gray-300 truncate">
                                    {meme.topText || meme.bottomText ? (
                                        <span>"{meme.topText} {meme.bottomText}"</span>
                                    ) : (
                                        <span className="italic text-gray-600">Sans texte</span>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-gray-800/50 mt-2">
                                    <button
                                        onClick={() => handleShare(meme)}
                                        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                                    >
                                        <Share2 size={14} />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Partager</span>
                                    </button>
                                    <button
                                        onClick={() => onEdit(meme)}
                                        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-electric-blue hover:bg-gray-800 transition-all"
                                    >
                                        <Edit size={14} />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Modifier</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if(window.confirm("Êtes-vous sûr de vouloir supprimer ce mème ?")) {
                                                try {
                                                    await deleteDoc(doc(db, 'memes', meme.id));
                                                } catch(e) {
                                                    alert("Erreur: Vous n'avez pas l'autorisation de supprimer ce mème.");
                                                }
                                            }
                                        }}
                                        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-500 hover:bg-gray-800 transition-all"
                                    >
                                        <Trash2 size={14} />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Supprimer</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
