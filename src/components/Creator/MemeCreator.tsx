import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Sparkles, Filter, Save, Trash2, Move, FolderPlus, Folder, Search, Image as ImageIcon, Film, User } from 'lucide-react';
import { drawMeme, MemeFilter, OverlayElement, SubjectConfig } from '../../services/canvasService';
import { suggestCaption } from '../../services/aiService';
import { storage, db } from '../../lib/firebase';
import { ref, uploadString, getDownloadURL } from '@firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, onSnapshot } from '@firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { storeImage, getImage } from '../../lib/storage';

interface MemeCreatorProps {
    editData?: any;
    onClearEdit?: () => void;
    backgroundFromScene?: string | null;
    onBackgroundUsed?: () => void;
}

interface SceneItem {
    id: string;
    url: string;
    thumb: string;
    author: string;
    type: 'image' | 'gif';
}

// BASE DE DONNEES DE SECOURS MASTER ELITE (ZERO API NEEDED)
const MASTER_DATABASE: Record<string, SceneItem[]> = {
    'nature': [
        { id: 'n1', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80', author: 'Nature Master', type: 'image' },
        { id: 'n2', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=200&q=80', author: 'Forest Master', type: 'image' },
        { id: 'n3', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=200&q=80', author: 'Mist Master', type: 'image' }
    ],
    'espace': [
        { id: 'e1', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80', author: 'Space Master', type: 'image' },
        { id: 'e2', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=200&q=80', author: 'Orbit Master', type: 'image' }
    ],
    'ville': [
        { id: 'v1', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=200&q=80', author: 'City Master', type: 'image' },
        { id: 'v2', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=200&q=80', author: 'Urban Master', type: 'image' }
    ],
    'bureau': [
        { id: 'b1', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=200&q=80', author: 'Office Master', type: 'image' },
        { id: 'b2', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80', author: 'Meeting Master', type: 'image' }
    ],
    'cyber': [
        { id: 'c1', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80', author: 'Cyber Master', type: 'image' },
        { id: 'c2', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=200&q=80', author: 'Binary Master', type: 'image' }
    ],
    // Stickers avec Twemoji (gratuit, pas d'API externe nécessaire)
    'stickers': [
        { id: 's1', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f600.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f600.png', author: 'Emoji Master', type: 'gif' },
        { id: 's2', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f602.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f602.png', author: 'Emoji Master', type: 'gif' },
        { id: 's3', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f604.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f604.png', author: 'Emoji Master', type: 'gif' },
        { id: 's4', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f923.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f923.png', author: 'Emoji Master', type: 'gif' },
        { id: 's5', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f44d.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f44d.png', author: 'Emoji Master', type: 'gif' },
        { id: 's6', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f44e.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f44e.png', author: 'Emoji Master', type: 'gif' },
        { id: 's7', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f64f.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f64f.png', author: 'Emoji Master', type: 'gif' },
        { id: 's8', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/2764.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/2764.png', author: 'Emoji Master', type: 'gif' },
        { id: 's9', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f4aa.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f4aa.png', author: 'Emoji Master', type: 'gif' },
        { id: 's10', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f389.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f389.png', author: 'Emoji Master', type: 'gif' },
        { id: 's11', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f3b5.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f3b5.png', author: 'Emoji Master', type: 'gif' },
        { id: 's12', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f3af.png', thumb: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f3af.png', author: 'Emoji Master', type: 'gif' }
    ],
    // Catégories supplémentaires pour fallback local
    'paris': [
        { id: 'p1', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=200&q=80', author: 'Paris Master', type: 'image' },
        { id: 'p2', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=200&q=80', author: 'Paris Master', type: 'image' }
    ],
    'plage': [
        { id: 'pb1', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80', author: 'Beach Master', type: 'image' },
        { id: 'pb2', url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=200&q=80', author: 'Ocean Master', type: 'image' }
    ],
    'montagne': [
        { id: 'm1', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80', author: 'Mountain Master', type: 'image' },
        { id: 'm2', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1080&q=80', thumb: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=200&q=80', author: 'Peak Master', type: 'image' }
    ]
};

export const MemeCreator: React.FC<MemeCreatorProps> = ({
    editData,
    onClearEdit,
    backgroundFromScene,
    onBackgroundUsed
}) => {
    const { user, isGuest, guestName } = useAuth();
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
    const [overlays, setOverlays] = useState<OverlayElement[]>([]);

    // Configuration du Sujet (Votre photo)
    const [subjectConfig, setSubjectConfig] = useState<SubjectConfig>({
        x: 50,
        y: 60,
        scale: 1,
        opacity: 1
    });

    const [topText, setTopText] = useState('');
    const [bottomText, setBottomText] = useState('');
    const [filter, setFilter] = useState<MemeFilter>('none');
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    // Moteur de recherche intégré
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SceneItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchMode, setSearchMode] = useState<'image' | 'gif'>('image');
    const [showSearch, setShowSearch] = useState(false);
    const [targetLayer, setTargetLayer] = useState<'background' | 'subject' | 'overlay'>('subject'); // 'background' pour le décor, 'subject' pour userImage
    const [draggingSubject, setDraggingSubject] = useState(false);
    const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    const authorName = user?.displayName || guestName || 'Master Anonyme';
    const authorId = user?.uid || `guest_${guestName}`;
    const authorPhoto = user?.photoURL || null;

    // Personnalisation
    const [fontSize, setFontSize] = useState(40);
    const [topPos, setTopPos] = useState({ x: 50, y: 10 });
    const [bottomPos, setBottomPos] = useState({ x: 50, y: 90 });
    const [category, setCategory] = useState('Général');
    const [customCategory, setCustomCategory] = useState('');
    const [existingCategories, setExistingCategories] = useState<string[]>(['Général', 'Travail', 'Privé', 'Humour']);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // PERSISTANCE : Sauvegarde auto
    useEffect(() => {
        const state = {
            topText,
            bottomText,
            fontSize,
            topPos,
            bottomPos,
            filter,
            category,
            subjectConfig,
            hasImage: !!image,
            imageSrc: image?.src,
            hasBackground: !!backgroundImage,
            backgroundSrc: backgroundImage?.src,
            overlays: overlays.map(o => ({ id: o.id, x: o.x, y: o.y, scale: o.scale, rotation: o.rotation, src: o.image.src }))
        };
        localStorage.setItem('mememaster_studio_state', JSON.stringify(state));
    }, [topText, bottomText, fontSize, topPos, bottomPos, filter, category, subjectConfig, image, backgroundImage, overlays]);

    // PERSISTANCE : Restauration au montage
    useEffect(() => {
        const saved = localStorage.getItem('mememaster_studio_state');
        if (saved && !editData) {
            try {
                const state = JSON.parse(saved);
                setTopText(state.topText || '');
                setBottomText(state.bottomText || '');
                setFontSize(state.fontSize || 40);
                setTopPos(state.topPos || { x: 50, y: 10 });
                setBottomPos(state.bottomPos || { x: 50, y: 90 });
                setFilter(state.filter || 'none');
                setCategory(state.category || 'Général');
                setSubjectConfig(state.subjectConfig || { x: 50, y: 60, scale: 1, opacity: 1 });

                if (state.hasImage) {
                    getImage('user_image').then(base64 => {
                        if (base64) {
                            const img = new Image();
                            img.crossOrigin = "anonymous";
                            img.onload = () => setImage(img);
                            img.src = base64;
                        }
                    });
                }
                if (state.hasBackground) {
                    getImage('background_image').then(base64 => {
                        if (base64) {
                            const img = new Image();
                            img.crossOrigin = "anonymous";
                            img.onload = () => setBackgroundImage(img);
                            img.src = base64;
                        }
                    });
                }
                if (state.overlays && state.overlays.length > 0) {
                    const loadedOverlays: OverlayElement[] = [];
                    state.overlays.forEach((o: any) => {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.onload = () => {
                            loadedOverlays.push({
                                id: o.id,
                                x: o.x,
                                y: o.y,
                                scale: o.scale,
                                rotation: o.rotation || 0,
                                image: img
                            });
                            if (loadedOverlays.length === state.overlays.length) {
                                setOverlays(loadedOverlays);
                            }
                        };
                        img.src = o.src;
                    });
                }
            } catch (e) {
                console.warn("Échec de restauration de session:", e);
            }
        }
    }, [editData]);

    // Charger les données en cas d'édition
    useEffect(() => {
        if (editData) {
            console.log("🛠️ Chargement des données d'édition...", editData.category);
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                setImage(img);
                setTopText(editData.topText || '');
                setBottomText(editData.bottomText || '');
                setCategory(editData.category || 'Général');
            };
            img.src = editData.imageUrl;
        }
    }, [editData]);

    // Charger un background depuis les scènes (Lien externe direct)
    useEffect(() => {
        if (backgroundFromScene) {
            console.log("🏙️ Chargement du décor externe :", backgroundFromScene);
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                setBackgroundImage(img);
                if (onBackgroundUsed) onBackgroundUsed();
            };
            img.src = backgroundFromScene;
        }
    }, [backgroundFromScene, onBackgroundUsed]);

    const handleCancelEdit = () => {
        if (onClearEdit) onClearEdit();
        setImage(null);
        setBackgroundImage(null);
        setOverlays([]);
        setTopText('');
        setBottomText('');
    };

    useEffect(() => {
        try {
            const q = query(collection(db, 'memes'), limit(200));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const cats = new Set(['Général', 'Travail', 'Privé', 'Humour']);
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.category) cats.add(data.category);
                });
                setExistingCategories(Array.from(cats));
            }, (error) => {
                console.warn("⚠️ [FIRESTORE] Échec de l'écoute en temps réel (Listen):", error);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("❌ [FIRESTORE] Erreur fatale sur l'abonnement:", error);
        }
    }, []);

    // MOTEUR DE RENDU MASTER : Loop haute performance pour GIFs et Drag & Drop
    useEffect(() => {
        let animationFrame: number;

        const render = () => {
            if (canvasRef.current) {
                drawMeme(
                    canvasRef.current,
                    image,
                    topText,
                    bottomText,
                    filter,
                    topPos,
                    bottomPos,
                    fontSize,
                    backgroundImage,
                    subjectConfig,
                    overlays,
                    true // Masquer les overlays sur le canvas pendant la création (doublon DOM animé)
                );
            }
            animationFrame = requestAnimationFrame(render);
        };

        animationFrame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrame);
    }, [image, backgroundImage, overlays, subjectConfig, topText, bottomText, filter, topPos, bottomPos, fontSize]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            const img = new Image();
            img.onload = () => {
                setImage(img);
                // On réinitialise la config sujet pour un nouvel import
                setSubjectConfig({ x: 50, y: 60, scale: 1, opacity: 1 });
                // Persistence IndexedDB
                storeImage('user_image', base64);
            };
            img.src = base64;
        };
        reader.readAsDataURL(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    const handleSuggest = async (type: 'top' | 'bottom' | 'both') => {
        setAiLoading(true);
        try {
            const suggestion = await suggestCaption(type);
            if (suggestion.top !== undefined) setTopText(suggestion.top);
            if (suggestion.bottom !== undefined) setBottomText(suggestion.bottom);
        } catch (error) {
            console.error("Erreur de suggestion:", error);
        } finally {
            setAiLoading(false);
        }
    };

    const translateForMaster = (query: string): string => {
        const dictionary: Record<string, string> = {
            'paris': 'paris', 'tour eiffel': 'eiffel tower', 'louvre': 'louvre',
            'mur': 'wall', 'brique': 'brick wall', 'rue': 'street', 'ville': 'city',
            'immeuble': 'building', 'gratte-ciel': 'skyscraper', 'bureau': 'office',
            'maison': 'house', 'chambre': 'bedroom', 'salon': 'living room',
            'cuisine': 'kitchen', 'jardin': 'garden', 'parc': 'park',
            'foret': 'forest', 'bois': 'woods', 'montagne': 'mountain', 'alpes': 'alps',
            'plage': 'beach', 'mer': 'ocean', 'riviere': 'river',
            'lac': 'lake', 'galaxie': 'galaxy', 'lune': 'moon',
            'soleil': 'sun', 'ciel': 'sky', 'nuage': 'clouds', 'nuit': 'night',
            'eau': 'water', 'glace': 'ice', 'neige': 'snow',
            'pluie': 'rain', 'orage': 'storm', 'eclair': 'lightning',
            'chien': 'dog', 'chat': 'cat', 'lion': 'lion', 'tigre': 'tiger',
            'singe': 'monkey', 'oiseau': 'bird', 'poisson': 'fish', 'requin': 'shark',
            'rebelle': 'thug', 'thug': 'thug', 'lunettes': 'sunglasses', 'flamme': 'flame',
            'explosion': 'explosion', 'argent': 'money', 'billet': 'cash',
            'rire': 'laugh', 'pleurer': 'cry', 'colere': 'angry', 'coeur': 'heart',
            'amour': 'love', 'fete': 'party', 'danse': 'dance', 'musique': 'music',
            'pizza': 'pizza', 'burger': 'burger', 'biere': 'beer', 'cafe': 'coffee',
            'ordinateur': 'computer', 'code': 'coding', 'travail': 'work',
            'ecole': 'school', 'voiture': 'car', 'moto': 'motorcycle', 'avion': 'plane',
            'astronaute': 'astronaut', 'robot': 'robot', 'alien': 'alien', 'geek': 'geek',
            'fun': 'funny', 'cool': 'cool', 'espace': 'space', 'feu': 'fire'
        };
        const q = query.toLowerCase().trim();
        const singular = q.endsWith('s') && q.length > 3 ? q.slice(0, -1) : q;
        return dictionary[q] || dictionary[singular] || q;
    };

    const searchScenes = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearchLoading(true);
        let resultsToSet: SceneItem[] = [];
        const translatedQuery = translateForMaster(searchQuery);
        console.log(`🌐 Master Trad: "${searchQuery}" -> "${translatedQuery}"`);

        try {
            if (searchMode === 'image') {
                const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
                if (!accessKey || accessKey === 'MISSING') {
                    throw new Error("Master Fallback (No Unsplash Key)");
                }

                const response = (await fetch(`https://api.unsplash.com/search/photos?query=${translatedQuery}&per_page=12&client_id=${accessKey}`).catch(() => null)) as Response | null;

                if (!response || !response.ok) {
                    throw new Error(`Master Fallback (Unsplash Error ${response?.status})`);
                }

                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    resultsToSet = data.results.map((img: any) => ({
                        id: img.id,
                        url: img.urls.regular,
                        thumb: img.urls.small,
                        author: img.user.name,
                        type: 'image'
                    }));
                } else {
                    throw new Error("No Unsplash results found");
                }
            } else {
                const giphyKey = 'dc6zaTOxFJmzC';
                const response = (await fetch(`https://api.giphy.com/v1/stickers/search?q=${translatedQuery}&limit=12&api_key=${giphyKey}`).catch(() => null)) as Response | null;

                if (!response || !response.ok) {
                    throw new Error(`Master Fallback (Giphy Error ${response?.status})`);
                }

                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    resultsToSet = data.data
                        .filter((gif: any) => gif.images?.fixed_height?.url && !gif.images.fixed_height.url.includes('notfound') && !gif.images.fixed_height.url.includes('spacer.gif'))
                        .map((gif: any) => ({
                            id: gif.id,
                            url: gif.images.fixed_height.url,
                            thumb: gif.images.fixed_width_small?.url || gif.images.fixed_height_small.url,
                            author: gif.username || 'Artiste Giphy',
                            type: 'gif'
                        }));
                } else {
                    throw new Error("No Giphy stickers found");
                }
            }
        } catch (error) {
            console.warn("🌐 Moteur Master Fallback activé :", error);
            const q = searchQuery.toLowerCase();

            if (searchMode === 'image') {
                if (q.includes('nature') || q.includes('foret') || q.includes('forest') || q.includes('montagne') || q.includes('arbre') || q.includes('soleil') || q.includes('sky')) {
                    resultsToSet = MASTER_DATABASE.nature;
                } else if (q.includes('espace') || q.includes('planète') || q.includes('étoile') || q.includes('galaxie') || q.includes('lune') || q.includes('space')) {
                    resultsToSet = MASTER_DATABASE.espace;
                } else if (q.includes('paris') || q.includes('tour eiffel') || q.includes('louvre')) {
                    resultsToSet = MASTER_DATABASE.paris;
                } else if (q.includes('plage') || q.includes('mer') || q.includes('ocean') || q.includes('beach') || q.includes('côte')) {
                    resultsToSet = MASTER_DATABASE.plage;
                } else if (q.includes('ville') || q.includes('rue') || q.includes('urban') || q.includes('city') || q.includes('immeuble')) {
                    resultsToSet = MASTER_DATABASE.ville;
                } else if (q.includes('bureau') || q.includes('travail') || q.includes('ordi') || q.includes('salon') || q.includes('office')) {
                    resultsToSet = MASTER_DATABASE.bureau;
                } else if (q.includes('cyber') || q.includes('tech') || q.includes('futur') || q.includes('robot')) {
                    resultsToSet = MASTER_DATABASE.cyber;
                } else {
                    resultsToSet = [...MASTER_DATABASE.nature, ...MASTER_DATABASE.ville].sort(() => Math.random() - 0.5).slice(0, 6);
                }
            } else {
                resultsToSet = MASTER_DATABASE.stickers;
            }
        } finally {
            setSearchResults(resultsToSet);
            setSearchLoading(false);
        }
    };

    const handleSelectResult = (item: SceneItem) => {
        console.log(`🚀 Master: Sélection de ${item.type} [${item.id}]`);
        const img = new Image();
        img.crossOrigin = "anonymous";

        const loadingTimeout = setTimeout(() => {
            console.warn(`⏳ Master: Chargement de l'image ${item.id} anormalement long...`);
            alert("Le chargement de l'image est lent. Vérifiez votre connexion.");
        }, 8000);

        img.onload = () => {
            clearTimeout(loadingTimeout);
            console.log(`✅ Master: Image ${item.id} chargée avec succès.`);
            if (targetLayer === 'background') {
                setBackgroundImage(img);
                // Convertir en Base64 pour persistence IndexedDB
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCtx.drawImage(img, 0, 0);
                    storeImage('background_image', tempCanvas.toDataURL('image/jpeg', 0.8));
                }
            } else {
                const newOverlay: OverlayElement = {
                    id: `overlay-${Date.now()}`,
                    image: img,
                    x: 50,
                    y: 50,
                    scale: 0.3, // Taille par défaut pour un sticker
                    rotation: 0
                };
                setOverlays((prev: OverlayElement[]) => [...prev, newOverlay]);
            }
        };

        img.onerror = (err) => {
            clearTimeout(loadingTimeout);
            console.error(`❌ Master: Erreur fatale au chargement de l'image ${item.id}:`, err);
            alert("Erreur de chargement. Cette image n'est peut-être pas accessible.");
        };

        img.src = item.url;
    };

    const removeOverlay = (id: string) => {
        setOverlays((prev: OverlayElement[]) => prev.filter(o => o.id !== id));
    };

    // LOGIQUE DRAG & DROP MASTER
    const getCanvasMousePos = (e: React.MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getCanvasMousePos(e);
        setLastMousePos({ x, y });

        // Vérifier d'abord les overlays (plus haut Z-index que le sujet)
        for (let i = overlays.length - 1; i >= 0; i--) {
            const o = overlays[i];
            const dist = Math.sqrt(Math.pow(x - o.x, 2) + Math.pow(y - o.y, 2));
            if (dist < 10) { // Rayon de capture
                setDraggingOverlayId(o.id);
                return;
            }
        }

        // Vérifier le sujet
        if (image) {
            const dist = Math.sqrt(Math.pow(x - subjectConfig.x, 2) + Math.pow(y - subjectConfig.y, 2));
            if (dist < 15) {
                setDraggingSubject(true);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingSubject && !draggingOverlayId) return;

        const { x, y } = getCanvasMousePos(e);
        const dx = x - lastMousePos.x;
        const dy = y - lastMousePos.y;

        if (draggingSubject) {
            setSubjectConfig(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        } else if (draggingOverlayId) {
            setOverlays(prev => prev.map(o => o.id === draggingOverlayId ? { ...o, x: o.x + dx, y: o.y + dy } : o));
        }

        setLastMousePos({ x, y });
    };

    const handleMouseUp = () => {
        setDraggingSubject(false);
        setDraggingOverlayId(null);
    };

    const handleDownload = () => {
        if (canvasRef.current) {
            drawMeme(
                canvasRef.current,
                image,
                topText,
                bottomText,
                filter,
                topPos,
                bottomPos,
                fontSize,
                backgroundImage,
                subjectConfig,
                overlays,
                false // Inclure les overlays pour l'export final PNG
            );
            const link = document.createElement('a');
            link.download = `mememaster-pro-${Date.now()}.png`;
            link.href = canvasRef.current.toDataURL('image/png');
            link.click();
        }
    };

    const handleSaveToGallery = async () => {
        if (!canvasRef.current || (!image && !backgroundImage)) return;
        setLoading(true);

        const safetyTimeout = setTimeout(() => {
            setLoading(false);
            console.log("⚠️ Timeout de sécurité atteint.");
        }, 15000);

        try {
            const finalCategory = category === 'new' ? (customCategory || 'Sans catégorie') : category;

            if (canvasRef.current) {
                drawMeme(
                    canvasRef.current,
                    image,
                    topText,
                    bottomText,
                    filter,
                    topPos,
                    bottomPos,
                    fontSize,
                    backgroundImage,
                    subjectConfig,
                    overlays,
                    false // Inclure les overlays pour l'export final Galerie
                );
            }

            const dataUrl = canvasRef.current!.toDataURL('image/jpeg', 0.8);

            await addDoc(collection(db, 'memes'), {
                imageUrl: dataUrl,
                topText,
                bottomText,
                category: finalCategory,
                likes: 0,
                authorName,
                authorId,
                authorPhoto,
                createdAt: serverTimestamp()
            });

            setLoading(false);
            setTimeout(() => {
                alert(`Mème Master publié avec succès dans la galerie "${finalCategory}" !`);
                if (onClearEdit) onClearEdit();
            }, 150);
        } catch (error) {
            console.error("❌ Erreur de publication:", error);
            setLoading(false);
            alert("Erreur lors de la publication.");
        } finally {
            clearTimeout(safetyTimeout);
            setLoading(false);
        }
    };

    const filters: { id: MemeFilter; label: string }[] = [
        { id: 'none', label: 'Original' },
        { id: 'grayscale', label: 'N&B' },
        { id: 'sepia', label: 'Sépia' },
        { id: 'invert', label: 'Inverser' },
        { id: 'blur', label: 'Flou' },
        { id: 'brightness', label: 'Éclat' },
        { id: 'contrast', label: 'Contraste' },
        { id: 'hue-rotate', label: 'Hue' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Colonne Gauche : Plan de Travail */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="text-electric-blue" size={24} />
                        Plan de Travail Pro
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setShowSearch(false); setTargetLayer('subject'); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${targetLayer === 'subject' ? 'bg-electric-blue text-white shadow-lg' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}
                        >
                            <User size={14} /> Sujet
                        </button>
                        <button
                            onClick={() => { setShowSearch(!showSearch); setTargetLayer('background'); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${showSearch && targetLayer === 'background' ? 'bg-electric-blue text-white shadow-lg' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}
                        >
                            <ImageIcon size={14} /> Décor
                        </button>
                        <button
                            onClick={() => { setShowSearch(!showSearch); setTargetLayer('overlay'); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${showSearch && targetLayer === 'overlay' ? 'bg-electric-blue text-white shadow-lg' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}
                        >
                            <Film size={14} /> Sticker
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {/* LE CANVAS MASTER : Toujours visible si une image existe */}
                    {(image || backgroundImage) ? (
                        <div className="space-y-4">
                            <div className="glass rounded-[40px] overflow-hidden shadow-2xl bg-black relative border-gray-900 border-4">
                                {/* CALQUE 1 & 2 & 4 : CANVAS (Fond, Sujet, Texte) */}
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    className={`w-full h-auto max-h-[550px] object-contain mx-auto ${draggingSubject || draggingOverlayId ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                                />

                                {/* CALQUE 3 : DOM OVERLAY (Stickers / GIFs Animés) */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {overlays.map((overlay) => (
                                        <motion.div
                                            key={overlay.id}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                                            style={{
                                                left: `${overlay.x}%`,
                                                top: `${overlay.y}%`,
                                                width: `${overlay.scale * 100}%`,
                                                transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg)`,
                                                zIndex: 30
                                            }}
                                            onMouseDown={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                // Simuler un MouseDown pour le canvas pour démarrer le drag
                                                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                                                if (rect) {
                                                    setLastMousePos({
                                                        x: e.clientX - rect.left,
                                                        y: e.clientY - rect.top
                                                    });
                                                    setDraggingOverlayId(overlay.id);
                                                }
                                            }}
                                        >
                                            <img
                                                src={overlay.image.src}
                                                alt="sticker"
                                                className="w-full h-auto select-none pointer-events-none"
                                            />
                                            {draggingOverlayId === overlay.id && (
                                                <div className="absolute -inset-2 border-2 border-electric-blue rounded-lg animate-pulse" />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center px-4">
                                <div className="flex gap-4">
                                    {image && (
                                        <button
                                            onClick={() => setImage(null)}
                                            className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors text-[9px] font-black uppercase tracking-widest"
                                        >
                                            <Trash2 size={12} /> Réinit. Sujet
                                        </button>
                                    )}
                                    {backgroundImage && (
                                        <button
                                            onClick={() => setBackgroundImage(null)}
                                            className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors text-[9px] font-black uppercase tracking-widest"
                                        >
                                            <Trash2 size={12} /> Réinit. Fond
                                        </button>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-800 font-mono italic">Studio Live Preview</span>
                            </div>
                        </div>
                    ) : (
                        <div
                            {...getRootProps()}
                            className={`aspect-square flex flex-col items-center justify-center p-12 transition-all cursor-pointer bg-gray-900/30 rounded-[40px] border-2 border-dashed
                                ${isDragActive ? 'border-electric-blue bg-electric-blue/5 scale-[1.02]' : 'border-gray-800 hover:border-gray-600'}`}
                        >
                            <input {...getInputProps()} />
                            <div className="bg-gray-800 p-6 rounded-3xl mb-6 shadow-xl">
                                <Upload className="text-gray-400" size={40} />
                            </div>
                            <p className="text-lg font-black text-gray-300 uppercase tracking-tighter">1. Votre Photo</p>
                            <p className="text-xs text-gray-600 mt-2 font-bold uppercase tracking-widest text-center">Importez votre sujet pour commencer le montage Master</p>
                        </div>
                    )}

                    {/* OVERLAY DE RECHERCHE : Superposé pour ne pas masquer le travail */}
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="absolute inset-0 z-50 glass rounded-[40px] p-6 flex flex-col gap-6 border-electric-blue/50 shadow-[0_0_50px_rgba(0,210,255,0.2)]"
                            >
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue">
                                        Recherche : {targetLayer === 'background' ? 'Lieu Master' : 'Accessoire Studio'}
                                    </h4>
                                    <button onClick={() => setShowSearch(false)} className="text-gray-600 hover:text-white transition-colors text-[9px] font-black uppercase">Fermer</button>
                                </div>

                                <div className="flex bg-black/40 p-1 rounded-xl border border-gray-900">
                                    <button onClick={() => setSearchMode('image')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${searchMode === 'image' ? 'bg-electric-blue text-white' : 'text-gray-600'}`}>Photos (Lieux)</button>
                                    <button onClick={() => setSearchMode('gif')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${searchMode === 'gif' ? 'bg-electric-blue text-white' : 'text-gray-600'}`}>GIFs (Stickers)</button>
                                </div>

                                <form onSubmit={searchScenes} className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searchMode === 'image' ? "Lieu : Paris, Espace, Mer..." : "Sticker : Rebelle, Lunettes, Feu..."}
                                        className="w-full bg-black/60 border border-gray-800 rounded-2xl px-5 py-4 focus:border-electric-blue outline-none text-sm font-bold transition-all"
                                    />
                                    <button type="submit" title="Rechercher" className="absolute right-2 top-2 bg-white text-black p-2.5 rounded-xl hover:bg-electric-blue hover:text-white transition-all shadow-lg active:scale-95">
                                        <Search size={18} />
                                    </button>
                                </form>

                                <div className="grid grid-cols-4 gap-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelectResult(item)}
                                            className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-electric-blue transition-all group relative bg-gray-900/50"
                                        >
                                            <img
                                                src={item.thumb}
                                                alt=""
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                loading="lazy"
                                                onError={(e) => {
                                                    // Masquer si l'image est cassée
                                                    (e.target as HTMLImageElement).closest('.aspect-square')?.classList.add('hidden');
                                                }}
                                            />
                                            {item.type === 'gif' && <span className="absolute bottom-1 left-1 bg-yellow-500 text-[6px] font-black px-1 rounded text-black shadow-lg">MOV</span>}
                                        </div>
                                    ))}
                                    {searchLoading && <div className="col-span-4 py-10 text-center text-gray-600 text-[10px] uppercase font-bold animate-pulse">Scan Master en cours...</div>}
                                    {!searchLoading && searchResults.length === 0 && <div className="col-span-4 py-10 text-center text-gray-800 text-[10px] uppercase font-black italic">Entrez un mot-clé (ex: Paris, Thug, Fire...)</div>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Outils de Retouche Master */}
                {(image || backgroundImage || overlays.length > 0) && (
                    <div className="glass p-6 rounded-[32px] space-y-6 border-gray-900 shadow-xl">
                        <div className="flex justify-between items-center border-b border-gray-900 pb-4">
                            <h4 className="font-black flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                                <Move size={14} className="text-electric-blue" /> Tools Master Pro
                            </h4>
                            <div className="flex gap-2">
                                <span className="bg-electric-blue/10 text-electric-blue text-[8px] font-black px-2 py-1 rounded uppercase">Z-Index : {overlays.length + 2} Layers</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Transformation Sujet */}
                            {image && (
                                <div className="space-y-4">
                                    <span className="text-[9px] text-white uppercase font-black tracking-widest flex items-center gap-2">
                                        <User size={12} /> Retouche Photo (Sujet)
                                    </span>
                                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-gray-900">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                                                    <span>Position H (X)</span>
                                                </div>
                                                <input type="range" title="Position Horizontale" min="0" max="100" value={subjectConfig.x} onChange={(e) => setSubjectConfig({ ...subjectConfig, x: parseInt(e.target.value) })} className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-electric-blue" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                                                    <span>Position V (Y)</span>
                                                </div>
                                                <input type="range" title="Position Verticale" min="0" max="100" value={subjectConfig.y} onChange={(e) => setSubjectConfig({ ...subjectConfig, y: parseInt(e.target.value) })} className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-electric-blue" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                                                    <span>Zoom</span>
                                                    <span className="text-electric-blue">{Math.round(subjectConfig.scale * 100)}%</span>
                                                </div>
                                                <input type="range" title="Niveau de Zoom" min="0.1" max="3" step="0.1" value={subjectConfig.scale} onChange={(e) => setSubjectConfig({ ...subjectConfig, scale: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-electric-blue" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                                                    <span>Opacité</span>
                                                    <span className="text-electric-blue">{Math.round(subjectConfig.opacity * 100)}%</span>
                                                </div>
                                                <input type="range" title="Niveau d'Opacité" min="0" max="1" step="0.1" value={subjectConfig.opacity} onChange={(e) => setSubjectConfig({ ...subjectConfig, opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-electric-blue" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Liste des Calques / Overlays */}
                            <div className="space-y-4">
                                <span className="text-[9px] text-white uppercase font-black tracking-widest flex items-center gap-2">
                                    <FolderPlus size={12} /> Calques Stickers ({overlays.length})
                                </span>
                                <div className="max-h-[140px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {overlays.length === 0 ? (
                                        <div className="text-[8px] text-gray-800 uppercase font-bold italic p-4 border border-dashed border-gray-900 rounded-xl text-center">Aucun accessoire ajouté</div>
                                    ) : (
                                        overlays.map((o: OverlayElement, idx: number) => (
                                            <div key={o.id} className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-gray-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-gray-900 border border-gray-800 overflow-hidden">
                                                        <img src={o.image.src} alt={`Sticker ${idx + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase">Sticker #{idx + 1}</span>
                                                </div>
                                                <button onClick={() => removeOverlay(o.id)} title="Supprimer ce calque" className="p-1.5 text-gray-600 hover:text-red-500 transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Colonne Droite : Personnalisation */}
            <div className="glass p-8 rounded-[40px] space-y-8 border-gray-900 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase">Studio <span className="text-electric-blue">Même</span></h3>
                    <div className="flex gap-2">
                        {editData && (
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
                            >
                                <Trash2 size={12} /> Annuler Modif.
                            </button>
                        )}
                        {(image || backgroundImage) && (
                            <button
                                onClick={() => handleSuggest('both')}
                                disabled={aiLoading}
                                className="px-3 py-1.5 bg-electric-blue/10 border border-electric-blue/30 rounded-lg text-electric-blue text-[10px] font-bold uppercase tracking-wider hover:bg-electric-blue hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-electric-blue/10"
                            >
                                <Sparkles size={12} /> {aiLoading ? 'Génération...' : 'Inspiration IA'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Texte du haut</label>
                            <button
                                onClick={() => handleSuggest('top')}
                                disabled={(!image && !backgroundImage) || aiLoading}
                                className="text-[9px] font-black text-electric-blue hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50 uppercase tracking-widest"
                            >
                                <Sparkles size={10} /> Idée Master
                            </button>
                        </div>
                        <input
                            type="text"
                            value={topText}
                            onChange={(e) => setTopText(e.target.value)}
                            className="w-full bg-black border border-gray-800 rounded-2xl px-6 py-4 focus:border-electric-blue outline-none transition-all text-sm font-bold shadow-inner"
                            placeholder="Entrez le texte supérieur..."
                            disabled={!image && !backgroundImage}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Texte du bas</label>
                            <button
                                onClick={() => handleSuggest('bottom')}
                                disabled={(!image && !backgroundImage) || aiLoading}
                                className="text-[9px] font-black text-electric-blue hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50 uppercase tracking-widest"
                            >
                                <Sparkles size={10} /> Idée Master
                            </button>
                        </div>
                        <input
                            type="text"
                            value={bottomText}
                            onChange={(e) => setBottomText(e.target.value)}
                            className="w-full bg-black border border-gray-800 rounded-2xl px-6 py-4 focus:border-electric-blue outline-none transition-all text-sm font-bold shadow-inner"
                            placeholder="Entrez le texte inférieur..."
                            disabled={!image && !backgroundImage}
                        />
                    </div>
                </div>

                {/* Configuration Typographie Master */}
                {(image || backgroundImage) && (
                    <div className="space-y-6 pt-2">
                        <div className="space-y-3">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                <span>Taille de Police</span>
                                <span className="text-electric-blue">{fontSize}px</span>
                            </div>
                            <input type="range" title="Taille de Police" min="10" max="150" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-electric-blue" />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Texte Haut (V)</span>
                                <input type="range" title="Position Verticale Texte Haut" min="0" max="50" value={topPos.y} onChange={(e) => setTopPos({ ...topPos, y: parseInt(e.target.value) })} className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-electric-blue" />
                            </div>
                            <div className="space-y-3">
                                <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Texte Bas (V)</span>
                                <input type="range" title="Position Verticale Texte Bas" min="50" max="100" value={bottomPos.y} onChange={(e) => setBottomPos({ ...bottomPos, y: parseInt(e.target.value) })} className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-electric-blue" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Filter size={14} /> Effets Studio Pro
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {filters.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                disabled={!image && !backgroundImage}
                                className={`py-2 rounded-xl border text-[9px] font-black transition-all uppercase tracking-tighter
                  ${filter === f.id ? 'bg-electric-blue border-electric-blue text-white shadow-lg shadow-electric-blue/30' : 'bg-gray-950 border-gray-900 text-gray-600 hover:border-gray-700'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-900/50">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Folder size={14} /> Dossier de Galerie
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            title="Sélectionner un dossier de galerie"
                            className="w-full bg-black border border-gray-800 rounded-2xl px-6 py-4 focus:border-electric-blue outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                            disabled={!image && !backgroundImage}
                        >
                            {existingCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="new">+ Créer un nouveau dossier...</option>
                        </select>

                        {category === 'new' && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="relative flex-1">
                                <FolderPlus className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                <input
                                    type="text"
                                    placeholder="Nom du nouveau dossier..."
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="w-full bg-black border border-gray-800 rounded-2xl pl-12 pr-6 py-4 focus:border-electric-blue outline-none transition-all text-sm font-bold"
                                />
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={handleDownload}
                        disabled={!image && !backgroundImage}
                        className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-black py-5 rounded-[24px] transition-all border border-gray-800 disabled:opacity-20 text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95"
                    >
                        <Download size={18} /> Télécharger
                    </button>
                    <button
                        onClick={handleSaveToGallery}
                        disabled={(!image && !backgroundImage) || loading}
                        className="flex items-center justify-center gap-2 bg-electric-blue hover:bg-electric-blue/80 text-white font-black py-5 rounded-[24px] transition-all shadow-2xl shadow-electric-blue/30 disabled:opacity-20 text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={18} /> Publier Master</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

