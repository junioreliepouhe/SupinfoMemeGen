export type MemeFilter = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast' | 'hue-rotate';

export interface OverlayElement {
    id: string;
    image: HTMLImageElement;
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

export interface SubjectConfig {
    x: number;
    y: number;
    scale: number;
    opacity: number;
}

export const applyFilter = (ctx: CanvasRenderingContext2D, width: number, height: number, filter: MemeFilter) => {
    if (filter === 'none') {
        ctx.filter = 'none';
        return;
    }

    switch (filter) {
        case 'grayscale': ctx.filter = 'grayscale(100%)'; break;
        case 'sepia': ctx.filter = 'sepia(100%)'; break;
        case 'invert': ctx.filter = 'invert(100%)'; break;
        case 'blur': ctx.filter = 'blur(5px)'; break;
        case 'brightness': ctx.filter = 'brightness(150%)'; break;
        case 'contrast': ctx.filter = 'contrast(200%)'; break;
        case 'hue-rotate': ctx.filter = 'hue-rotate(90deg)'; break;
        default: ctx.filter = 'none';
    }
};

export const drawMeme = (
    canvas: HTMLCanvasElement,
    userImage: HTMLImageElement | null,
    topText: string,
    bottomText: string,
    filter: MemeFilter,
    topPos: { x: number, y: number },
    bottomPos: { x: number, y: number },
    fontSize: number,
    backgroundImage: HTMLImageElement | null = null,
    subjectConfig: SubjectConfig = { x: 50, y: 60, scale: 1, opacity: 1 },
    overlays: OverlayElement[] = [],
    hideOverlays: boolean = false
) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const BASE_SIZE = 1080;
    canvas.width = BASE_SIZE;
    canvas.height = BASE_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ==========================================
    // NIVEAU 1 : LE FOND (Z-INDEX: 1)
    // ==========================================
    if (backgroundImage) {
        ctx.save();
        const scale = Math.max(canvas.width / backgroundImage.width, canvas.height / backgroundImage.height);
        const x = (canvas.width - backgroundImage.width * scale) / 2;
        const y = (canvas.height - backgroundImage.height * scale) / 2;
        ctx.drawImage(backgroundImage, x, y, backgroundImage.width * scale, backgroundImage.height * scale);
        ctx.restore();
    } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Filtre global (fond)
    applyFilter(ctx, canvas.width, canvas.height, filter);

    // ==========================================
    // NIVEAU 2 : LE SUJET (Z-INDEX: 2)
    // ==========================================
    if (userImage) {
        ctx.save();
        ctx.globalAlpha = subjectConfig.opacity;

        const baseScale = (canvas.width * 0.8) / userImage.width;
        const finalScale = baseScale * subjectConfig.scale;
        const dw = userImage.width * finalScale;
        const dh = userImage.height * finalScale;

        // Position centrée sur Coordonnées %
        const dx = (subjectConfig.x / 100) * canvas.width;
        const dy = (subjectConfig.y / 100) * canvas.height;

        ctx.translate(dx, dy);
        // Ici on pourrait ajouter une rotation sujet si besoin
        ctx.drawImage(userImage, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
    }

    // ==========================================
    // NIVEAU 3 : ACCESSOIRES / GIFs (Z-INDEX: 3)
    // ==========================================
    if (!hideOverlays) {
        overlays.forEach(overlay => {
            ctx.save();
            const ox = (overlay.x / 100) * canvas.width;
            const oy = (overlay.y / 100) * canvas.height;
            const ow = overlay.image.width * overlay.scale;
            const oh = overlay.image.height * overlay.scale;

            ctx.translate(ox, oy);
            ctx.rotate((overlay.rotation * Math.PI) / 180);
            ctx.drawImage(overlay.image, -ow / 2, -oh / 2, ow, oh);
            ctx.restore();
        });
    }

    // ==========================================
    // NIVEAU 4 : LE TEXTE (Z-INDEX: 4)
    // ==========================================
    ctx.filter = 'none';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.max(2, (fontSize / 10) * (canvas.width / 500));
    ctx.textAlign = 'center';
    ctx.font = `900 ${fontSize * (canvas.width / 500)}px Impact, "Arial Black", sans-serif`;

    if (topText) {
        ctx.textBaseline = 'top';
        const tx = (topPos.x / 100) * canvas.width;
        const ty = (topPos.y / 100) * canvas.height;
        ctx.strokeText(topText.toUpperCase(), tx, ty);
        ctx.fillText(topText.toUpperCase(), tx, ty);
    }

    if (bottomText) {
        ctx.textBaseline = 'bottom';
        const bx = (bottomPos.x / 100) * canvas.width;
        const by = (bottomPos.y / 100) * canvas.height;
        ctx.strokeText(bottomText.toUpperCase(), bx, by);
        ctx.fillText(bottomText.toUpperCase(), bx, by);
    }
};

