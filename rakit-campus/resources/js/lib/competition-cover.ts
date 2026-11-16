export function getCompetitionCover(comp: any): string {
    const rawCover = comp?.cover_image || comp?.cover_image_url;
    if (
        rawCover &&
        typeof rawCover === 'string' &&
        rawCover.trim() !== '' &&
        rawCover !== '0' &&
        rawCover !== 'null' &&
        rawCover !== 'undefined'
    ) {
        return rawCover;
    }

    const name = (comp?.name || '').toLowerCase();
    const cat = (comp?.category || '').toLowerCase();

    // 1. IoT & Hardware
    if (name.includes('iot') || cat.includes('iot') || name.includes('smart') || name.includes('sensor')) {
        return '/images/competitions/iot-challenge.svg';
    }

    // 2. Hackathon & Software Engineering
    if (name.includes('hackathon') || cat.includes('hackathon') || name.includes('camp') || name.includes('code') || name.includes('coding')) {
        return '/images/competitions/hackathon-camp.svg';
    }

    // 3. UI/UX, Design, Creative
    if (name.includes('ui') || name.includes('ux') || name.includes('desain') || name.includes('design') || cat.includes('design') || cat.includes('ui')) {
        return '/images/competitions/uiux-sprint.svg';
    }

    // 4. Research, Scientific Writing, PKM-RE/AI/GT
    if (name.includes('lktin') || name.includes('riset') || name.includes('ilmiah') || name.includes('paper') || cat.includes('research') || cat.includes('scientific')) {
        return '/images/competitions/scientific-paper.svg';
    }

    // 5. Business Plan, PKM-K, Startup, Entrepreneurship
    if (name.includes('pkm') || name.includes('bisnis') || name.includes('business') || name.includes('startup') || cat.includes('business') || cat.includes('entrepreneurship')) {
        return '/images/competitions/pkm-k.svg';
    }

    // 6. Global Summit, MUN, Debat, SDGs
    if (name.includes('mun') || name.includes('debat') || name.includes('global') || name.includes('international') || name.includes('summit') || cat.includes('other')) {
        return '/images/competitions/global-summit.svg';
    }

    // 7. Default: AI, Data Science & Technology
    return '/images/competitions/gemastik-ai.svg';
}
