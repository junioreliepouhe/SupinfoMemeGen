/**
 * Service de suggestion de légendes MEMEMASTER PRO
 * Fournit des textes percutants pour des mèmes viraux
 */
const topCaptions = [
    "Moi quand",
    "Pov:",
    "Personne:",
    "Quand tu réalises",
    "Ma réaction quand",
    "Le code compile",
    "Lundi matin",
    "Attendre que",
    "Fin de projet",
    "Le client:",
    "Moi à 3h du mat",
    "Le stagiaire:",
    "Ma patience:",
    "Mon cerveau:",
    "Le prof:"
];

const bottomCaptions = [
    "C'est exactement ce que je voulais... ou pas.",
    "Moi essayant d'expliquer pourquoi je suis en retard.",
    "Je suis un génie.",
    "Un petit changement de dernière minute.",
    "Arrête de ventiler.",
    "Les erreurs dans la console.",
    "Enfin compris la récursion.",
    "Sommeil non trouvé.",
    "Ça marche sur ma machine.",
    "Moi après 5 minutes de sport.",
    "Il attend encore.",
    "Réalises qu'on est lundi demain.",
    "Mes responsabilités.",
    "Ce mème est d'argent.",
    "Weekend enfin là.",
    "Je ne regrette rien.",
    "La légende raconte qu'il est encore là.",
    "Une journée normale de dev.",
    "C'est pour ça qu'on m'appelle Master.",
    "Tout se passe comme prévu."
];

export const suggestCaption = async (type: 'top' | 'bottom' | 'both' = 'bottom'): Promise<{ top?: string, bottom?: string }> => {
    // Simule un délai de traitement "Master AI"
    await new Promise(resolve => setTimeout(resolve, 600));

    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    if (type === 'top') {
        return { top: getRandom(topCaptions) };
    } else if (type === 'bottom') {
        return { bottom: getRandom(bottomCaptions) };
    } else {
        // Mode Inspiration Totale : On choisit un couple qui a du sens
        const randomTop = getRandom(topCaptions);
        const randomBottom = getRandom(bottomCaptions);
        return {
            top: randomTop,
            bottom: randomBottom
        };
    }
};
