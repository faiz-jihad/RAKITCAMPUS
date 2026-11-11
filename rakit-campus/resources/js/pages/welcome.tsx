import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Award,
    Battery,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    FolderKanban,
    Globe,
    Kanban,
    Lock,
    MessageSquare,
    Minus,
    MoreHorizontal,
    MoreVertical,
    Plus,
    Quote,
    Rocket,
    RotateCw,
    Search,
    Share2,
    ShieldCheck,
    Sparkles,
    Square,
    Star,
    Trophy,
    Users,
    Wifi,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }
    ScrollTrigger.clearScrollMemory?.('manual');
    window.scrollTo(0, 0);
}

const featuresList = [
    {
        title: 'LIVING PROPOSAL',
        desc: 'Dokumen proposal interaktif & kolaborasi real-time',
        href: '#features',
    },
    {
        title: 'FAIR MATCHMAKING (AI)',
        desc: 'Pencocokan talenta & komposisi tim berimbang',
        href: '#features',
    },
    {
        title: 'TASK KANBAN BOARDS',
        desc: 'Pelacakan sprint proyek & milestone kompetisi',
        href: '#features',
    },
    {
        title: 'PORTOFOLIO TERVERIFIKASI',
        desc: 'Rekam jejak capaian tervalidasi program studi',
        href: '#features',
    },
];

const photoRowTop = [
    {
        title: 'Tim Hackathon Polindra',
        category: 'Teknik Informatika',
        badge: 'Gemastik Finalist',
        src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Kolaborasi Living Proposal',
        category: 'Rekayasa Perangkat Lunak',
        badge: 'Sprint Proyek',
        src: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Mentoring & Pitch Review',
        category: 'Kota Cerdas',
        badge: 'Pitching Deck',
        src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Workshop Riset & Inovasi',
        category: 'Inovasi Digital',
        badge: 'Inovasi Kampus',
        src: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Pengembangan Perangkat IoT',
        category: 'Teknik Komputer',
        badge: 'Hardware & AI',
        src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Demo Day & Evaluasi Tim',
        category: 'Showcase Prestasi',
        badge: 'Karya Terbaik',
        src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
    },
];

const photoRowBottom = [
    {
        title: 'Riset Rekayasa Software',
        category: 'Software Engineering',
        badge: 'Verifikasi Mutu',
        src: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Strategi Tim Kompetisi',
        category: 'Kompetisi Nasional',
        badge: 'Team Building',
        src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Smart Matching Talenta',
        category: 'AI Matchmaking',
        badge: 'Komposisi Tim',
        src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Brainstorming Ide Solusi',
        category: 'UI/UX Design Sprint',
        badge: 'Desain Interaktif',
        src: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Manajemen Tugas Kanban',
        category: 'Agile Project Sprint',
        badge: 'Pelacakan Real-time',
        src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Selebrasi Juara Mahasiswa',
        category: 'Prestasi Polindra',
        badge: 'Juara 1 Nasional',
        src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    },
];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [activeTab, setActiveTab] = useState<'board' | 'list'>('board');
    const laptopCardRef = useRef<HTMLDivElement>(null);
    const phoneCardRef = useRef<HTMLDivElement>(null);
    const showcaseRafRef = useRef<number | null>(null);

    // Feedback & Suggestions state
    const [feedbackCategory, setFeedbackCategory] = useState('saran_fitur');
    const [feedbackName, setFeedbackName] = useState('');
    const [feedbackEmail, setFeedbackEmail] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackMessage.trim() || feedbackMessage.trim().length < 5) {
            setFeedbackError('Pesan masukan minimal 5 karakter.');
            return;
        }
        setFeedbackError(null);
        setSubmittingFeedback(true);

        router.post(
            '/feedback',
            {
                category: feedbackCategory,
                name: feedbackName.trim() || (auth?.user?.name ?? null),
                email: feedbackEmail.trim() || (auth?.user?.email ?? null),
                message: feedbackMessage.trim(),
                rating: feedbackRating,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setFeedbackSubmitted(true);
                    setFeedbackMessage('');
                    setSubmittingFeedback(false);
                },
                onError: (errs) => {
                    const firstError = Object.values(errs)[0];
                    setFeedbackError(typeof firstError === 'string' ? firstError : 'Terjadi kendala saat mengirim masukan.');
                    setSubmittingFeedback(false);
                },
                onFinish: () => {
                    setSubmittingFeedback(false);
                },
            }
        );
    };

    const handleShowcaseMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        if (showcaseRafRef.current) cancelAnimationFrame(showcaseRafRef.current);
        showcaseRafRef.current = requestAnimationFrame(() => {
            if (laptopCardRef.current) {
                laptopCardRef.current.style.transform = `perspective(1800px) rotateX(${2.5 - y * 3.5}deg) rotateY(${x * 3.5}deg) translateZ(0)`;
            }
            if (phoneCardRef.current) {
                phoneCardRef.current.style.transform = `perspective(1800px) rotateX(${1.5 - y * 5}deg) rotateY(${x * 5}deg) translateZ(35px) translateY(-6px)`;
            }
        });
    };

    const handleShowcaseMouseEnter = () => {
        if (laptopCardRef.current) {
            laptopCardRef.current.style.transition = 'transform 0.12s cubic-bezier(0.2, 0, 0, 1)';
        }
        if (phoneCardRef.current) {
            phoneCardRef.current.style.transition = 'transform 0.12s cubic-bezier(0.2, 0, 0, 1)';
        }
    };

    const handleShowcaseMouseLeave = () => {
        if (showcaseRafRef.current) cancelAnimationFrame(showcaseRafRef.current);
        if (laptopCardRef.current) {
            laptopCardRef.current.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            laptopCardRef.current.style.transform = 'perspective(1800px) rotateX(2.5deg) rotateY(0deg) translateZ(0)';
        }
        if (phoneCardRef.current) {
            phoneCardRef.current.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            phoneCardRef.current.style.transform = 'perspective(1800px) rotateX(1.5deg) rotateY(0deg) translateZ(20px)';
        }
    };

    const [introStage, setIntroStage] = useState<0 | 1 | 2 | 3>(0);
    const [textRevealed, setTextRevealed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(true);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [isScrolledPastTop, setIsScrolledPastTop] = useState(false);
    const lastScrollYRef = useRef(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // GSAP ScrollTrigger Refs
    const pinContainerRef = useRef<HTMLDivElement>(null);
    const heroContentRef = useRef<HTMLDivElement>(null);
    const aboutSectionRef = useRef<HTMLDivElement>(null);
    const aboutLeftColRef = useRef<HTMLDivElement>(null);
    const aboutRightColRef = useRef<HTMLDivElement>(null);
    const videoBlurOverlayRef = useRef<HTMLDivElement>(null);
    const videoElementRef = useRef<HTMLVideoElement>(null);
    const bgParallaxLettersRef = useRef<HTMLDivElement>(null);
    const section2PinContainerRef = useRef<HTMLDivElement>(null);
    const rakitOverlayRef = useRef<HTMLDivElement>(null);
    const rakitTintRef = useRef<SVGTextElement>(null);
    const section2HeaderContentRef = useRef<HTMLDivElement>(null);
    const section2MockupRef = useRef<HTMLDivElement>(null);
    const showcaseGlowRef = useRef<HTMLDivElement>(null);
    const laptopShowcaseRef = useRef<HTMLDivElement>(null);
    const laptopSheenRef = useRef<HTMLDivElement>(null);
    const phoneShowcaseRef = useRef<HTMLDivElement>(null);
    const phoneSheenRef = useRef<HTMLDivElement>(null);
    const realSection2Ref = useRef<HTMLElement>(null);

    // Section 4 GSAP Pinned 5-Scene Refs (SOLUSI KAMI + 4 Fitur Utama)
    const section4PinRef = useRef<HTMLDivElement>(null);
    const slide0Ref = useRef<HTMLDivElement>(null);
    const slide1Ref = useRef<HTMLDivElement>(null);
    const slide2Ref = useRef<HTMLDivElement>(null);
    const slide3Ref = useRef<HTMLDivElement>(null);
    const slide4Ref = useRef<HTMLDivElement>(null);
    const slide1TextRef = useRef<HTMLDivElement>(null);
    const slide1ImageRef = useRef<HTMLDivElement>(null);
    const slide2TextRef = useRef<HTMLDivElement>(null);
    const slide2ImageRef = useRef<HTMLDivElement>(null);
    const slide3TextRef = useRef<HTMLDivElement>(null);
    const slide3ImageRef = useRef<HTMLDivElement>(null);
    const slide4TextRef = useRef<HTMLDivElement>(null);
    const slide4ImageRef = useRef<HTMLDivElement>(null);
    const wireframeRef = useRef<SVGSVGElement>(null);

    // Section 4 Morphing Octagram Geometric Animation Refs
    const octagramContainerRef = useRef<HTMLDivElement>(null);
    const octagramShape1Ref = useRef<HTMLDivElement>(null);
    const octagramShape2Ref = useRef<HTMLDivElement>(null);
    const octagramLine1Ref = useRef<SVGPathElement>(null);
    const octagramLine2Ref = useRef<SVGPathElement>(null);

    // Section 4 Scene 5 "ANGKA" Refs (Editorial Stats inside Section 4)
    const numbersSlideRef = useRef<HTMLDivElement>(null);
    const numbersHeadingRef = useRef<HTMLHeadingElement>(null);
    const numbersGridRef = useRef<HTMLDivElement>(null);
    const statNum1Ref = useRef<HTMLSpanElement>(null);
    const statNum2Ref = useRef<HTMLSpanElement>(null);
    const statNum3Ref = useRef<HTMLSpanElement>(null);
    const statNum4Ref = useRef<HTMLSpanElement>(null);

    // Section 7 GSAP Pinned Cara Kerja / Workflow Refs
    const workflowSectionRef = useRef<HTMLElement>(null);
    const workflowPinRef = useRef<HTMLDivElement>(null);
    const workflowHeaderRef = useRef<HTMLDivElement>(null);
    const workflowStageRef = useRef<HTMLDivElement>(null);
    const workflowStepText0Ref = useRef<HTMLDivElement>(null);
    const workflowStepText1Ref = useRef<HTMLDivElement>(null);
    const workflowStepText2Ref = useRef<HTMLDivElement>(null);
    const workflowPhotoViewportRef = useRef<HTMLDivElement>(null);
    const workflowPhotoTrackRef = useRef<HTMLDivElement>(null);
    const workflowPhoto0Ref = useRef<HTMLDivElement>(null);
    const workflowPhoto1Ref = useRef<HTMLDivElement>(null);
    const workflowPhoto2Ref = useRef<HTMLDivElement>(null);

    // Section 8 Testimonials / Success Stories Animation Refs
    const testimonialsSectionRef = useRef<HTMLElement>(null);
    const testimonialsHeaderRef = useRef<HTMLDivElement>(null);
    const testimonialsCardsRef = useRef<HTMLDivElement>(null);
    const testimonialCard1Ref = useRef<HTMLDivElement>(null);
    const testimonialCard2Ref = useRef<HTMLDivElement>(null);
    const testimonialCard3Ref = useRef<HTMLDivElement>(null);

    // Section 9 Bottom CTA Animation Refs
    const ctaSectionRef = useRef<HTMLElement>(null);
    const ctaCardRef = useRef<HTMLDivElement>(null);
    const ctaContentRef = useRef<HTMLDivElement>(null);

    const handleScrollDown = () => {
        if (pinContainerRef.current) {
            const targetScroll = pinContainerRef.current.offsetTop + window.innerHeight * 1.35;
            window.scrollTo({
                top: targetScroll,
                behavior: 'smooth',
            });
        } else {
            scrollToOverview();
        }
    };

    const handleNavAboutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setMobileMenuOpen(false);
        if (pinContainerRef.current) {
            const targetScroll = pinContainerRef.current.offsetTop + window.innerHeight * 1.35;
            window.scrollTo({
                top: targetScroll,
                behavior: 'smooth',
            });
        } else {
            const el = document.getElementById('about');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // GSAP ScrollTrigger Pinned Sequence:
    // Section 1: (Hero -> Blur on Video Banner -> Tentang)
    // Section 2: ("RAKIT" colossal zoom scale transition -> Real Section 2 Overview & Mockup)
    // ONLY initialize AFTER loading screen has fully completed (introStage === 3)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (introStage < 3) return;

        let onWorkflowRefreshInit: (() => void) | null = null;

        const ctx = gsap.context(() => {
            // SECTION 1 TIMELINE (Smooth Multi-Phase Scroll with End Buffer)
            if (pinContainerRef.current && heroContentRef.current && aboutSectionRef.current) {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: pinContainerRef.current,
                        start: 'top top',
                        end: '+=250%', // Generous scroll runway so the button is never rushed or clipped
                        pin: true,
                        scrub: 1.0,
                        invalidateOnRefresh: true,
                    },
                });

                // Phase 1 (0.0 -> 1.0): Hero elements exit upwards, video blurs
                tl.to(
                    heroContentRef.current,
                    {
                        y: '-115vh',
                        ease: 'power1.inOut',
                        duration: 1.0,
                    },
                    0
                );

                if (videoElementRef.current) {
                    tl.to(
                        videoElementRef.current,
                        {
                            filter: 'blur(10px)',
                            scale: 1.05,
                            ease: 'power1.inOut',
                            duration: 1.0,
                        },
                        0.15
                    );
                }

                if (videoBlurOverlayRef.current) {
                    tl.to(
                        videoBlurOverlayRef.current,
                        {
                            opacity: 0.65,
                            ease: 'power1.inOut',
                            duration: 1.0,
                        },
                        0.15
                    );
                }

                // Phase 2 (0.2 -> 1.0): Tentang enters smoothly into Image 2 position
                tl.fromTo(
                    aboutSectionRef.current,
                    {
                        y: '100vh',
                        opacity: 0,
                        pointerEvents: 'none',
                    },
                    {
                        y: '0vh',
                        opacity: 1,
                        pointerEvents: 'auto',
                        ease: 'power1.out',
                        duration: 0.8,
                    },
                    0.2
                );

                // Phase 3 (1.4 -> 2.2): Left quote gently scrolls up and clears out of view; right column rises into view (Image 2 -> Image 3)
                if (aboutLeftColRef.current) {
                    tl.to(
                        aboutLeftColRef.current,
                        {
                            y: '-70vh',
                            opacity: 0,
                            ease: 'power2.inOut',
                            duration: 0.8,
                        },
                        1.4
                    );
                }

                if (aboutRightColRef.current) {
                    tl.to(
                        aboutRightColRef.current,
                        {
                            y: '-42vh',
                            ease: 'power1.inOut',
                            duration: 0.8,
                        },
                        1.4
                    );
                }

                // Phase 4 (2.2 -> 3.2): Batas Akhir GSAP Hold Buffer
                // Ensures comfortable reading and clicking time without the pin immediately breaking
                tl.to(
                    {},
                    {
                        duration: 1.0,
                    },
                    2.2
                );

                // Phase 5 (3.2 -> 3.6): Graceful exit transition so Section 2 never slams into the button
                tl.to(
                    aboutSectionRef.current,
                    {
                        y: '-8vh',
                        opacity: 0,
                        ease: 'power1.in',
                        duration: 0.4,
                    },
                    3.2
                );
            }

            // SECTION 2 TIMELINE: Hardware-Accelerated Cutout Zoom transition from Transparent "RAKIT" into real Section 2
            if (
                section2PinContainerRef.current &&
                rakitOverlayRef.current &&
                realSection2Ref.current
            ) {
                const tl2 = gsap.timeline({
                    scrollTrigger: {
                        trigger: section2PinContainerRef.current,
                        start: 'top top',
                        end: '+=150%',
                        pin: true,
                        scrub: 0.35,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    },
                });

                // Initial states: Clean GPU composited layer
                gsap.set(rakitOverlayRef.current, {
                    autoAlpha: 1,
                    scale: 1,
                    transformOrigin: '50% 50%',
                    force3D: true,
                });
                gsap.set(realSection2Ref.current, {
                    pointerEvents: 'none',
                });
                // Konten Section 2 langsung aktif dan terlihat di balik lubang transparan teks "RAKIT"
                if (section2HeaderContentRef.current) {
                    gsap.set(section2HeaderContentRef.current, {
                        autoAlpha: 1,
                        y: 0,
                    });
                }
                if (rakitTintRef.current) {
                    gsap.set(rakitTintRef.current, {
                        opacity: 1,
                    });
                }

                // 1. "RAKIT" cutout mask zooms up smoothly, expanding past the screen
                tl2.to(
                    rakitOverlayRef.current,
                    {
                        scale: 5.0,
                        transformOrigin: '50% 50%',
                        ease: 'power1.inOut',
                        duration: 0.8,
                        force3D: true,
                    },
                    0
                );

                // 2. Tint text fades early so the underlying Section 2 content glows through crisply
                if (rakitTintRef.current) {
                    tl2.to(
                        rakitTintRef.current,
                        {
                            opacity: 0,
                            ease: 'power1.out',
                            duration: 0.25,
                        },
                        0.05
                    );
                }

                // 3. Seamlessly dissolve the mask overlay near the end of zoom & detach from compositor
                tl2.to(
                    rakitOverlayRef.current,
                    {
                        autoAlpha: 0,
                        display: 'none',
                        ease: 'power1.in',
                        duration: 0.3,
                    },
                    0.5
                );

                // 4. Enable interactive pointer events on Section 2 once fully revealed
                tl2.to(
                    realSection2Ref.current,
                    {
                        pointerEvents: 'auto',
                        duration: 0.01,
                    },
                    0.8
                );

                // 5. Hold settled state so user comfortably absorbs the overview before unpinning
                tl2.to({}, { duration: 0.2 }, 0.8);
            }

            // DEDICATED 3D SHOWCASE SECTION ENTRANCE (Optimized 60fps GPU Hardware-Accelerated Reveal)
            if (section2MockupRef.current) {
                const tlShowcase = gsap.timeline({
                    scrollTrigger: {
                        trigger: section2MockupRef.current,
                        start: 'top 85%',
                        once: true,
                    },
                });

                // 1. Background radial mesh glow gently fades in (No scale to prevent GPU fill-rate throttling on blur-3xl)
                if (showcaseGlowRef.current) {
                    tlShowcase.fromTo(
                        showcaseGlowRef.current,
                        { autoAlpha: 0 },
                        { autoAlpha: 1, duration: 0.7, ease: 'power2.out' },
                        0
                    );
                }

                // 2. Realistic 3D Laptop Entrance: Elevated from below with silky GPU hardware-accelerated translation & scale
                if (laptopShowcaseRef.current) {
                    tlShowcase.fromTo(
                        laptopShowcaseRef.current,
                        {
                            y: 60,
                            scale: 0.95,
                            autoAlpha: 0,
                            force3D: true,
                        },
                        {
                            y: 0,
                            scale: 1,
                            autoAlpha: 1,
                            duration: 0.85,
                            ease: 'power3.out',
                            force3D: true,
                        },
                        0.05
                    );
                }

                // 3. Screen Glass Light Sheen Sweep across the MacBook Display
                if (laptopSheenRef.current) {
                    tlShowcase.fromTo(
                        laptopSheenRef.current,
                        { xPercent: -120, opacity: 0 },
                        { xPercent: 220, opacity: 0.75, duration: 0.9, ease: 'power2.out', force3D: true },
                        0.3
                    );
                }

                // 4. Realistic 3D Smartphone Entrance: Crisp staggered slide-in from bottom right with tactile spring
                if (phoneShowcaseRef.current) {
                    tlShowcase.fromTo(
                        phoneShowcaseRef.current,
                        {
                            y: 65,
                            x: 20,
                            scale: 0.93,
                            autoAlpha: 0,
                            force3D: true,
                        },
                        {
                            y: 0,
                            x: 0,
                            scale: 1,
                            autoAlpha: 1,
                            duration: 0.75,
                            ease: 'back.out(1.15)',
                            force3D: true,
                        },
                        0.15
                    );
                }

                // 5. Phone Screen Glass Light Sheen Sweep
                if (phoneSheenRef.current) {
                    tlShowcase.fromTo(
                        phoneSheenRef.current,
                        { xPercent: -120, opacity: 0 },
                        { xPercent: 220, opacity: 0.8, duration: 0.75, ease: 'power2.out', force3D: true },
                        0.4
                    );
                }
            }

            // SECTION 4 TIMELINE: GSAP Pinned 6-Scene Sequence (SOLUSI KAMI + 4 Fitur Utama + ANGKA)
            if (
                section4PinRef.current &&
                slide0Ref.current &&
                slide1Ref.current &&
                slide2Ref.current &&
                slide3Ref.current &&
                slide4Ref.current &&
                numbersSlideRef.current
            ) {
                const tl4 = gsap.timeline({
                    scrollTrigger: {
                        trigger: section4PinRef.current,
                        start: 'top top',
                        end: '+=700%',
                        pin: true,
                        scrub: 0.8,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    },
                });

                // Initial states: Slide 0 visible, Slides 1-4 & Scene 5 ANGKA hidden
                gsap.set(slide0Ref.current, { autoAlpha: 1, y: 0, yPercent: 0, pointerEvents: 'auto' });
                gsap.set([slide1Ref.current, slide2Ref.current, slide3Ref.current, slide4Ref.current, numbersSlideRef.current], {
                    autoAlpha: 0,
                    y: 0,
                    pointerEvents: 'none',
                });
                if (numbersHeadingRef.current) {
                    gsap.set(numbersHeadingRef.current, { autoAlpha: 0, y: 60 });
                }
                if (numbersGridRef.current) {
                    gsap.set(numbersGridRef.current.children, { autoAlpha: 0, y: 80 });
                }

                // Autonomous Real-Time Counting Animation (independent of scroll position)
                let countTweens: gsap.core.Tween[] = [];
                let hasAutoCounted = false;

                const startAutoCount = () => {
                    countTweens.forEach((t) => t.kill());
                    countTweens = [];

                    const s1 = { val: 0 };
                    const s2 = { val: 0 };
                    const s3 = { val: 0 };
                    const s4 = { val: 0 };

                    countTweens.push(
                        gsap.to(s1, {
                            val: 95,
                            duration: 1.5,
                            ease: 'power2.out',
                            onUpdate: () => {
                                if (statNum1Ref.current) statNum1Ref.current.textContent = String(Math.round(s1.val));
                            },
                        })
                    );

                    countTweens.push(
                        gsap.to(s2, {
                            val: 3,
                            duration: 1.2,
                            delay: 0.1,
                            ease: 'power2.out',
                            onUpdate: () => {
                                if (statNum2Ref.current) statNum2Ref.current.textContent = String(Math.round(s2.val));
                            },
                        })
                    );

                    countTweens.push(
                        gsap.to(s3, {
                            val: 100,
                            duration: 1.5,
                            delay: 0.2,
                            ease: 'power2.out',
                            onUpdate: () => {
                                if (statNum3Ref.current) statNum3Ref.current.textContent = String(Math.round(s3.val));
                            },
                        })
                    );

                    countTweens.push(
                        gsap.to(s4, {
                            val: 500,
                            duration: 1.7,
                            delay: 0.3,
                            ease: 'power2.out',
                            onUpdate: () => {
                                if (statNum4Ref.current) statNum4Ref.current.textContent = String(Math.round(s4.val));
                            },
                        })
                    );
                };

                const resetAutoCount = () => {
                    countTweens.forEach((t) => t.kill());
                    countTweens = [];
                    if (statNum1Ref.current) statNum1Ref.current.textContent = '0';
                    if (statNum2Ref.current) statNum2Ref.current.textContent = '0';
                    if (statNum3Ref.current) statNum3Ref.current.textContent = '0';
                    if (statNum4Ref.current) statNum4Ref.current.textContent = '0';
                };

                resetAutoCount();
                if (slide1TextRef.current && slide2TextRef.current && slide3TextRef.current && slide4TextRef.current) {
                    gsap.set([slide1TextRef.current, slide2TextRef.current, slide3TextRef.current, slide4TextRef.current], {
                        autoAlpha: 0,
                        y: 25,
                    });
                }
                // Gambar-gambar di-set berada di bawah layar (y: 380) dengan autoAlpha 0 agar muncul dari bawah ke atas
                if (slide1ImageRef.current && slide2ImageRef.current && slide3ImageRef.current && slide4ImageRef.current) {
                    gsap.set([slide1ImageRef.current, slide2ImageRef.current, slide3ImageRef.current, slide4ImageRef.current], {
                        autoAlpha: 0,
                        y: 380,
                    });
                }
                if (wireframeRef.current) {
                    gsap.set(wireframeRef.current, { autoAlpha: 0 });
                }
                if (octagramContainerRef.current) {
                    gsap.set(octagramContainerRef.current, { autoAlpha: 0, transformOrigin: '50% 50%', force3D: true });
                }
                if (octagramShape1Ref.current) {
                    gsap.set(octagramShape1Ref.current, {
                        x: '-65vw',
                        y: 0,
                        rotation: 45,
                        opacity: 0,
                        transformOrigin: '50% 50%',
                        force3D: true,
                    });
                }
                if (octagramShape2Ref.current) {
                    gsap.set(octagramShape2Ref.current, {
                        x: '65vw',
                        y: 0,
                        rotation: 45,
                        opacity: 0,
                        transformOrigin: '50% 50%',
                        force3D: true,
                    });
                }
                if (octagramLine1Ref.current) {
                    gsap.set(octagramLine1Ref.current, { strokeDashoffset: 2800, stroke: '#FFFFFF' });
                }
                if (octagramLine2Ref.current) {
                    gsap.set(octagramLine2Ref.current, { strokeDashoffset: 2800, stroke: '#FFFFFF' });
                }

                // 1. Hold Slide 0 (Tampilan Awal: background polos, teks SOLUSI KAMI terbaca jelas)
                tl4.to({}, { duration: 0.5 });

                // 2. Step 1: Teks SOLUSI KAMI meluncur ke atas keluar layar tanpa efek menghilang (pure upward scroll translation)
                tl4.to(slide0Ref.current, {
                    yPercent: -120,
                    duration: 0.9,
                    ease: 'power2.inOut',
                });

                // 3. Step 2: Animasi garis kedua bentuk muncul di ujung kiri dan kanan dengan bentuk sudut runcing (diamond) yang sama persis
                if (octagramContainerRef.current) {
                    tl4.to(octagramContainerRef.current, {
                        autoAlpha: 1,
                        duration: 0.35,
                    });
                }

                if (octagramShape1Ref.current && octagramShape2Ref.current) {
                    tl4.to([octagramShape1Ref.current, octagramShape2Ref.current], {
                        opacity: 1,
                        duration: 0.6,
                        ease: 'power1.out',
                    }, '<');
                }

                if (octagramLine1Ref.current && octagramLine2Ref.current) {
                    tl4.to([octagramLine1Ref.current, octagramLine2Ref.current], {
                        strokeDashoffset: 0,
                        stroke: '#FFFFFF',
                        duration: 1.0,
                        ease: 'power2.out',
                    }, '<');
                }

                // Label setelah garis selesai tergambar dan siap meluncur ke tengah
                tl4.addLabel('converge');

                // 5. Step 3: Kedua bentuk meluncur ke tengah & KEDUA PERSEGI BERPUTAR saat mau bersatu
                // Persegi kiri berputar ke kanan (clockwise), persegi kanan berputar ke kiri (counter-clockwise)
                if (octagramShape1Ref.current && octagramShape2Ref.current) {
                    tl4.to(octagramShape1Ref.current, {
                        x: 0,
                        y: 0,
                        rotation: 112.5, // Berputar ke kanan (clockwise) dari 45 ke 112.5
                        duration: 1.4,
                        ease: 'power2.inOut',
                    }, 'converge');

                    tl4.to(octagramShape2Ref.current, {
                        x: 0,
                        y: 0,
                        rotation: -22.5, // Berputar ke kiri (counter-clockwise) dari 45 ke -22.5
                        duration: 1.4,
                        ease: 'power2.inOut',
                    }, 'converge');
                }

                // Transisi warna garis dari Putih ke Biru Permanen (#2563EB) saat meluncur masuk
                if (octagramLine1Ref.current && octagramLine2Ref.current) {
                    tl4.to([octagramLine1Ref.current, octagramLine2Ref.current], {
                        stroke: '#2563EB',
                        duration: 1.2,
                        ease: 'power2.out',
                    }, 'converge');
                }

                // Label saat kedua bentuk bersatu membentuk bintang Octagram sempurna di tengah
                tl4.addLabel('octagramConverged');

                // Jeda hold sebentar mengagumi bentuk bintang Octagram yang telah bergabung sempurna
                tl4.to({}, { duration: 0.4 });

                // ============================================================
                // BACKGROUND BERLAKU KE 4 JUDUL:
                // Persegi kiri terus berputar ke kanan (clockwise),
                // persegi kanan terus berputar ke kiri (counter-clockwise)
                // secara CONTINUOUS 100% konsisten tanpa henti ketika discroll.
                // ============================================================

                // 6. Transisi ke Slide 1 (01 / 04 Fair AI Matchmaking)
                if (octagramContainerRef.current) {
                    tl4.to(octagramContainerRef.current, {
                        opacity: 0.28,
                        scale: 0.95,
                        duration: 0.8,
                        ease: 'power2.inOut',
                    });
                }

                // ============================================================
                // SLIDE 1: FAIR AI MATCHMAKING (01 / 04)
                // Logika: Ketika gambar muncul dari bawah teks muncul,
                //         ketika gambar hilang teks juga hilang.
                // Menggunakan autoAlpha agar saat scroll ke atas (reverse)
                // transisinya 100% mulus tanpa pop-in.
                // ============================================================
                tl4.to(slide1Ref.current, { autoAlpha: 1, duration: 0.1, pointerEvents: 'auto' }, '<');
                if (slide1ImageRef.current) {
                    tl4.fromTo(
                        slide1ImageRef.current,
                        { y: 380, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power2.out' },
                        '<'
                    );
                }
                if (slide1TextRef.current) {
                    tl4.fromTo(
                        slide1TextRef.current,
                        { y: 25, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.75, ease: 'power2.out' },
                        '<'
                    );
                }

                // Hold Slide 1
                tl4.to({}, { duration: 0.8 });

                // Slide 1 Keluar: Gambar meluncur ke atas dan hilang, teks juga ikut hilang
                if (slide1ImageRef.current) {
                    tl4.to(slide1ImageRef.current, {
                        y: -380,
                        autoAlpha: 0,
                        duration: 0.85,
                        ease: 'power2.in',
                    });
                }
                if (slide1TextRef.current) {
                    tl4.to(
                        slide1TextRef.current,
                        {
                            y: -25,
                            autoAlpha: 0,
                            duration: 0.7,
                            ease: 'power2.in',
                        },
                        '<'
                    );
                }
                tl4.to(
                    slide1Ref.current,
                    {
                        autoAlpha: 0,
                        duration: 0.85,
                        ease: 'power2.in',
                    },
                    '<'
                );

                // Jeda singkat agar Slide 1 tuntas sebelum Slide 2 mulai (ZERO OVERLAP!)
                tl4.to({}, { duration: 0.1 });

                // ============================================================
                // SLIDE 2: LIVING PROPOSAL (02 / 04)
                // ============================================================
                tl4.to(slide2Ref.current, { autoAlpha: 1, duration: 0.1, pointerEvents: 'auto' });
                if (slide2ImageRef.current) {
                    tl4.fromTo(
                        slide2ImageRef.current,
                        { y: 380, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power2.out' },
                        '<'
                    );
                }
                if (slide2TextRef.current) {
                    tl4.fromTo(
                        slide2TextRef.current,
                        { y: 25, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.75, ease: 'power2.out' },
                        '<'
                    );
                }

                // Hold Slide 2
                tl4.to({}, { duration: 0.8 });

                // Slide 2 Keluar: Gambar meluncur ke atas dan hilang, teks juga ikut hilang
                if (slide2ImageRef.current) {
                    tl4.to(slide2ImageRef.current, {
                        y: -380,
                        autoAlpha: 0,
                        duration: 0.85,
                        ease: 'power2.in',
                    });
                }
                if (slide2TextRef.current) {
                    tl4.to(
                        slide2TextRef.current,
                        {
                            y: -25,
                            autoAlpha: 0,
                            duration: 0.7,
                            ease: 'power2.in',
                        },
                        '<'
                    );
                }
                tl4.to(
                    slide2Ref.current,
                    {
                        autoAlpha: 0,
                        duration: 0.85,
                        ease: 'power2.in',
                    },
                    '<'
                );

                // Jeda singkat agar Slide 2 tuntas sebelum Slide 3 mulai (ZERO OVERLAP!)
                tl4.to({}, { duration: 0.1 });

                // ============================================================
                // SLIDE 3: TASK KANBAN BOARDS (03 / 04)
                // ============================================================
                tl4.to(slide3Ref.current, { autoAlpha: 1, duration: 0.1, pointerEvents: 'auto' });
                if (slide3ImageRef.current) {
                    tl4.fromTo(
                        slide3ImageRef.current,
                        { y: 380, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power2.out' },
                        '<'
                    );
                }
                if (slide3TextRef.current) {
                    tl4.fromTo(
                        slide3TextRef.current,
                        { y: 25, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.75, ease: 'power2.out' },
                        '<'
                    );
                }

                // Hold Slide 3
                tl4.to({}, { duration: 0.8 });

                // Slide 3 Keluar: Gambar meluncur ke atas dan hilang, teks juga ikut hilang
                if (slide3ImageRef.current) {
                    tl4.to(slide3ImageRef.current, {
                        y: -380,
                        autoAlpha: 0,
                        duration: 0.85,
                        ease: 'power2.in',
                    });
                }
                if (slide3TextRef.current) {
                    tl4.to(
                        slide3TextRef.current,
                        {
                            y: -25,
                            autoAlpha: 0,
                            duration: 0.7,
                            ease: 'power2.in',
                        },
                        '<'
                    );
                }
                tl4.to(
                    slide3Ref.current,
                    {
                        autoAlpha: 0,
                        duration: 0.85,
                        ease: 'power2.in',
                    },
                    '<'
                );

                // Jeda singkat agar Slide 3 tuntas sebelum Slide 4 mulai (ZERO OVERLAP!)
                tl4.to({}, { duration: 0.1 });

                // ============================================================
                // SLIDE 4: PORTOFOLIO TERVALIDASI (04 / 04)
                // ============================================================
                tl4.to(slide4Ref.current, { autoAlpha: 1, duration: 0.1, pointerEvents: 'auto' });
                if (slide4ImageRef.current) {
                    tl4.fromTo(
                        slide4ImageRef.current,
                        { y: 380, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power2.out' },
                        '<'
                    );
                }
                if (slide4TextRef.current) {
                    tl4.fromTo(
                        slide4TextRef.current,
                        { y: 25, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.75, ease: 'power2.out' },
                        '<'
                    );
                }

                // Hold Slide 4 sebelum unpinning
                tl4.to({}, { duration: 0.8 });

                // Slide 4 Keluar: Gambar meluncur ke atas dan hilang, teks juga ikut hilang saat unpin
                if (slide4ImageRef.current) {
                    tl4.to(slide4ImageRef.current, {
                        y: -380,
                        autoAlpha: 0,
                        duration: 0.85,
                        ease: 'power2.in',
                    });
                }
                if (slide4TextRef.current) {
                    tl4.to(
                        slide4TextRef.current,
                        {
                            y: -25,
                            autoAlpha: 0,
                            duration: 0.7,
                            ease: 'power2.in',
                        },
                        '<'
                    );
                }
                tl4.to(
                    slide4Ref.current,
                    {
                        autoAlpha: 0,
                        duration: 0.85,
                        ease: 'power2.in',
                    },
                    '<'
                );
                if (octagramContainerRef.current) {
                    tl4.to(octagramContainerRef.current, { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, '<');
                }

                // Label saat Slide 4 tuntas dan Octagram selesai berputar
                tl4.addLabel('octagramExit');

                // CONTINUOUS, UNBROKEN ROTATION TWEEN:
                // Berputar terus menerus dengan kecepatan linear yang sempurna (ease: 'none')
                // mulai dari titik konvergensi sampai Slide 4 selesai tanpa jeda atau berhenti di tengah jalan!
                const octagramStart = tl4.labels['octagramConverged'] ?? 0;
                const octagramEnd = tl4.labels['octagramExit'] ?? octagramStart;
                const octagramRotateSpan = Math.max(0.1, octagramEnd - octagramStart);

                if (octagramShape1Ref.current && octagramShape2Ref.current) {
                    tl4.to(
                        octagramShape1Ref.current,
                        {
                            rotation: 112.5 + 540, // 540° rotasi searah jarum jam (clockwise)
                            duration: octagramRotateSpan,
                            ease: 'none',
                        },
                        'octagramConverged'
                    );
                    tl4.to(
                        octagramShape2Ref.current,
                        {
                            rotation: -22.5 - 540, // 540° rotasi berlawanan jarum jam (counter-clockwise)
                            duration: octagramRotateSpan,
                            ease: 'none',
                        },
                        'octagramConverged'
                    );
                }

                // ============================================================
                // SCENE 5: ANGKA (ADDICT Editorial Stats - Referensi Gambar 2)
                // Muncul dari bawah ke atas setelah scroll judul terakhir (Slide 4)
                // Berada di section yang sama (Section 4)
                // ============================================================
                tl4.to(numbersSlideRef.current, { autoAlpha: 1, duration: 0.1, pointerEvents: 'auto' });
                if (numbersHeadingRef.current) {
                    tl4.fromTo(
                        numbersHeadingRef.current,
                        { y: 60, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.85, ease: 'power2.out' },
                        '<'
                    );
                }
                if (numbersGridRef.current) {
                    tl4.fromTo(
                        numbersGridRef.current.children,
                        { y: 80, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.15, ease: 'power2.out' },
                        '<+=0.1'
                    );
                }

                // Autonomous real-time counting animation: runs automatically on clock, NOT tied to scroll movement!
                tl4.call(
                    () => {
                        const direction = tl4.scrollTrigger ? tl4.scrollTrigger.direction : 1;
                        if (direction === 1) {
                            if (!hasAutoCounted) {
                                hasAutoCounted = true;
                                startAutoCount();
                            }
                        } else if (direction === -1) {
                            hasAutoCounted = false;
                            resetAutoCount();
                        }
                    },
                    [],
                    '<+=0.15'
                );

                // Hold Scene 5 (ANGKA) agar nyaman dibaca sebelum unpin
                tl4.to({}, { duration: 1.0 });

                // Scene 5 Keluar saat unpinning ke section berikutnya (Workflow)
                tl4.to(numbersSlideRef.current, {
                    y: -40,
                    autoAlpha: 0,
                    duration: 0.7,
                    ease: 'power2.in',
                });
            }

            // SECTION 7 TIMELINE: GSAP Pinned Cara Kerja (Header exit + Scrolling Photo Reel with Neighbor Blur + Synchronized Step Text)
            if (
                workflowPinRef.current &&
                workflowHeaderRef.current &&
                workflowStageRef.current &&
                workflowStepText0Ref.current &&
                workflowStepText1Ref.current &&
                workflowStepText2Ref.current &&
                workflowPhotoViewportRef.current &&
                workflowPhotoTrackRef.current &&
                workflowPhoto0Ref.current &&
                workflowPhoto1Ref.current &&
                workflowPhoto2Ref.current
            ) {
                const tlWorkflow = gsap.timeline({
                    scrollTrigger: {
                        trigger: workflowPinRef.current,
                        start: 'top top',
                        end: '+=380%',
                        pin: true,
                        scrub: 0.8,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    },
                });

                const updateWorkflowGeometry = () => {
                    if (!workflowPhotoViewportRef.current || !workflowPhoto0Ref.current || !workflowPhotoTrackRef.current) return;
                    const vpHeight = workflowPhotoViewportRef.current.offsetHeight;
                    const cardHeight = workflowPhoto0Ref.current.offsetHeight;
                    if (vpHeight <= 0 || cardHeight <= 0) return;
                    const pad = Math.max(0, Math.floor((vpHeight - cardHeight) / 2));
                    workflowPhotoTrackRef.current.style.paddingTop = `${pad}px`;
                    workflowPhotoTrackRef.current.style.paddingBottom = `${pad}px`;
                };

                updateWorkflowGeometry();
                ScrollTrigger.addEventListener('refreshInit', updateWorkflowGeometry);
                onWorkflowRefreshInit = updateWorkflowGeometry;

                const getOffset1 = () => {
                    if (!workflowPhoto1Ref.current || !workflowPhoto0Ref.current) return 0;
                    return -(workflowPhoto1Ref.current.offsetTop - workflowPhoto0Ref.current.offsetTop);
                };

                const getOffset2 = () => {
                    if (!workflowPhoto2Ref.current || !workflowPhoto0Ref.current) return 0;
                    return -(workflowPhoto2Ref.current.offsetTop - workflowPhoto0Ref.current.offsetTop);
                };

                // Initial states: Step 0 visible, Steps 1 & 2 completely hidden (ZERO OVERLAP!)
                gsap.set(workflowHeaderRef.current, { y: 0, autoAlpha: 1 });
                gsap.set(workflowStageRef.current, { y: 0 });
                gsap.set(workflowStepText0Ref.current, { y: 0, autoAlpha: 1, pointerEvents: 'auto' });
                gsap.set(workflowStepText1Ref.current, { y: 25, autoAlpha: 0, pointerEvents: 'none' });
                gsap.set(workflowStepText2Ref.current, { y: 25, autoAlpha: 0, pointerEvents: 'none' });

                gsap.set(workflowPhotoTrackRef.current, { y: 0 });
                gsap.set(workflowPhoto0Ref.current, { filter: 'blur(0px)', opacity: 1, scale: 1 });
                gsap.set(workflowPhoto1Ref.current, { filter: 'blur(14px)', opacity: 0.5, scale: 0.97 });
                gsap.set(workflowPhoto2Ref.current, { filter: 'blur(14px)', opacity: 0.5, scale: 0.97 });

                // --- PHASE 1: Initial scroll moves header "CARA KERJA" and description upward ---
                tlWorkflow.to(
                    workflowHeaderRef.current,
                    {
                        y: -80,
                        autoAlpha: 0,
                        duration: 0.8,
                        ease: 'power2.inOut',
                    },
                    'headerExit'
                );

                // Hold Step 01 for comfortable reading
                tlWorkflow.to({}, { duration: 0.6 });

                // --- PHASE 2: Photo reel scrolls to Photo 2 + Step 2 text activates ---
                // 1. Text 0 exits quickly and disappears completely before Text 1 enters (ZERO OVERLAP / TIDAK BENTROK!)
                tlWorkflow.to(
                    workflowStepText0Ref.current,
                    {
                        y: -25,
                        autoAlpha: 0,
                        duration: 0.35,
                        ease: 'power2.in',
                        pointerEvents: 'none',
                    },
                    'step1to2'
                );

                // 2. Photo reel scrolls to Photo 2
                tlWorkflow.to(
                    workflowPhotoTrackRef.current,
                    {
                        y: () => getOffset1(),
                        duration: 1.2,
                        ease: 'power2.inOut',
                    },
                    'step1to2'
                );
                // Photo 0 becomes blurred (above)
                tlWorkflow.to(
                    workflowPhoto0Ref.current,
                    {
                        filter: 'blur(14px)',
                        opacity: 0.5,
                        scale: 0.97,
                        duration: 1.0,
                        ease: 'power2.inOut',
                    },
                    'step1to2'
                );
                // Photo 1 becomes sharp (centered)
                tlWorkflow.to(
                    workflowPhoto1Ref.current,
                    {
                        filter: 'blur(0px)',
                        opacity: 1,
                        scale: 1,
                        duration: 1.0,
                        ease: 'power2.inOut',
                    },
                    'step1to2'
                );

                // 3. Text 1 enters ONLY after Text 0 has completely vanished (ZERO OVERLAP!)
                tlWorkflow.fromTo(
                    workflowStepText1Ref.current,
                    { y: 25, autoAlpha: 0, pointerEvents: 'none' },
                    {
                        y: 0,
                        autoAlpha: 1,
                        duration: 0.5,
                        ease: 'power2.out',
                        pointerEvents: 'auto',
                    },
                    'step1to2+=0.35'
                );

                // Hold Step 02
                tlWorkflow.to({}, { duration: 0.8 });

                // --- PHASE 3: Photo reel scrolls to Photo 3 + Step 3 text activates ---
                // 1. Text 1 exits quickly and disappears completely before Text 2 enters (ZERO OVERLAP / TIDAK BENTROK!)
                tlWorkflow.to(
                    workflowStepText1Ref.current,
                    {
                        y: -25,
                        autoAlpha: 0,
                        duration: 0.35,
                        ease: 'power2.in',
                        pointerEvents: 'none',
                    },
                    'step2to3'
                );

                // 2. Photo reel scrolls to Photo 3
                tlWorkflow.to(
                    workflowPhotoTrackRef.current,
                    {
                        y: () => getOffset2(),
                        duration: 1.2,
                        ease: 'power2.inOut',
                    },
                    'step2to3'
                );
                // Photo 1 becomes blurred (above)
                tlWorkflow.to(
                    workflowPhoto1Ref.current,
                    {
                        filter: 'blur(14px)',
                        opacity: 0.5,
                        scale: 0.97,
                        duration: 1.0,
                        ease: 'power2.inOut',
                    },
                    'step2to3'
                );
                // Photo 2 becomes sharp (centered)
                tlWorkflow.to(
                    workflowPhoto2Ref.current,
                    {
                        filter: 'blur(0px)',
                        opacity: 1,
                        scale: 1,
                        duration: 1.0,
                        ease: 'power2.inOut',
                    },
                    'step2to3'
                );

                // 3. Text 2 enters ONLY after Text 1 has completely vanished (ZERO OVERLAP!)
                tlWorkflow.fromTo(
                    workflowStepText2Ref.current,
                    { y: 25, autoAlpha: 0, pointerEvents: 'none' },
                    {
                        y: 0,
                        autoAlpha: 1,
                        duration: 0.5,
                        ease: 'power2.out',
                        pointerEvents: 'auto',
                    },
                    'step2to3+=0.35'
                );

                // Hold Step 03 before unpinning
                tlWorkflow.to({}, { duration: 0.8 });
            }

            // SECTION 8 TIMELINE: Testimonials Scroll Entrance & Continuous Harmonic Float
            if (testimonialsSectionRef.current) {
                const tlTestimonials = gsap.timeline({
                    scrollTrigger: {
                        trigger: testimonialsSectionRef.current,
                        start: 'top 82%',
                        toggleActions: 'play none none reverse',
                    },
                });

                if (testimonialsHeaderRef.current) {
                    tlTestimonials.fromTo(
                        testimonialsHeaderRef.current.children,
                        { y: 35, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12, ease: 'power2.out' }
                    );
                }

                if (testimonialsCardsRef.current) {
                    tlTestimonials.fromTo(
                        testimonialsCardsRef.current.children,
                        { y: 65, autoAlpha: 0, scale: 0.93, rotationX: 8 },
                        { y: 0, autoAlpha: 1, scale: 1, rotationX: 0, duration: 0.95, stagger: 0.16, ease: 'power3.out' },
                        '-=0.4'
                    );
                }

                // Continuous harmonic idle breathing floating effect
                if (testimonialCard1Ref.current) {
                    gsap.to(testimonialCard1Ref.current, {
                        y: -8,
                        duration: 3.3,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut',
                    });
                }
                if (testimonialCard2Ref.current) {
                    gsap.to(testimonialCard2Ref.current, {
                        y: -11,
                        duration: 4.1,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut',
                        delay: 0.5,
                    });
                }
                if (testimonialCard3Ref.current) {
                    gsap.to(testimonialCard3Ref.current, {
                        y: -7,
                        duration: 3.6,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut',
                        delay: 1.0,
                    });
                }
            }

            // SECTION 9 TIMELINE: Bottom CTA Entrance & Dynamic Floating Animation
            if (ctaSectionRef.current && ctaCardRef.current) {
                const tlCTA = gsap.timeline({
                    scrollTrigger: {
                        trigger: ctaSectionRef.current,
                        start: 'top 82%',
                        toggleActions: 'play none none reverse',
                    },
                });

                tlCTA.fromTo(
                    ctaCardRef.current,
                    { y: 60, scale: 0.92, autoAlpha: 0 },
                    { y: 0, scale: 1, autoAlpha: 1, duration: 1.0, ease: 'power3.out' }
                );

                if (ctaContentRef.current) {
                    tlCTA.fromTo(
                        ctaContentRef.current.children,
                        { y: 25, autoAlpha: 0 },
                        { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12, ease: 'power2.out' },
                        '-=0.6'
                    );
                }
            }
        });

        ScrollTrigger.refresh();

        return () => {
            if (onWorkflowRefreshInit) {
                ScrollTrigger.removeEventListener('refreshInit', onWorkflowRefreshInit);
            }
            ctx.revert();
        };
    }, [introStage]);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setFeaturesDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        if (isPinned) return;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setFeaturesDropdownOpen(false);
        }, 400);
    };

    const handleFeatureItemClick = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setFeaturesDropdownOpen(false);
        setIsPinned(false);
        setMobileMenuOpen(false);

        if (href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setFeaturesDropdownOpen(false);
                setIsPinned(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setFeaturesDropdownOpen(false);
                setIsPinned(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Smart Scroll-Up Navbar Visibility Trigger:
    // Sembunyikan saat scroll ke bawah, munculkan seketika saat scroll ke atas
    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const lastScrollY = lastScrollYRef.current;
                    const scrollDiff = currentScrollY - lastScrollY;

                    setIsScrolledPastTop(currentScrollY > 40);

                    // Tetap tampilkan navbar jika menu samping atau dropdown sedang terbuka
                    if (mobileMenuOpen || featuresDropdownOpen) {
                        setIsNavVisible(true);
                        lastScrollYRef.current = currentScrollY;
                        ticking = false;
                        return;
                    }

                    if (currentScrollY < 60) {
                        // Di puncak halaman: selalu terlihat
                        setIsNavVisible(true);
                    } else if (scrollDiff < -6) {
                        // TRIGGER SCROLL KE ATAS: Munculkan navbar seketika
                        setIsNavVisible(true);
                    } else if (scrollDiff > 6) {
                        // Scroll ke bawah: Sembunyikan navbar agar tampilan bersih
                        setIsNavVisible(false);
                    }

                    lastScrollYRef.current = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [mobileMenuOpen, featuresDropdownOpen]);

    const scrollToOverview = () => {
        if (section2PinContainerRef.current) {
            window.scrollTo({
                top: section2PinContainerRef.current.offsetTop,
                behavior: 'smooth',
            });
        } else {
            const el = document.getElementById('overview');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        // Enforce returning to top on refresh/load so intro animation starts fresh from top
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        const handleBeforeUnload = () => {
            window.scrollTo(0, 0);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Sequence timing:
        // Stage 0: 0 - 500ms (Text "RAKIT CAMPUS" appears in center on pure white screen)
        // Stage 1: 500ms - 1600ms (Text smoothly moves apart, sharp borderless video appears in center)
        const t1 = setTimeout(() => {
            setIntroStage(1);
        }, 500);

        // Stage 2: 1600ms (Video expands to fullscreen via clip-path, text surges to opposite edges and vanishes)
        const t2 = setTimeout(() => {
            setIntroStage(2);
        }, 1600);

        // Text Reveal: 2100ms (Begins rising up smoothly right as video reaches fullscreen edges)
        const tText = setTimeout(() => {
            setTextRevealed(true);
        }, 2100);

        // Stage 3: 2800ms (Fully settled & interactive)
        const t3 = setTimeout(() => {
            setIntroStage(3);
        }, 2800);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
            window.removeEventListener('resize', checkMobile);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(tText);
            clearTimeout(t3);
        };
    }, []);

    const handleSkipIntro = () => {
        if (introStage < 2) {
            setIntroStage(2);
            setTimeout(() => {
                setTextRevealed(true);
                setIntroStage(3);
            }, 100);
        }
    };

    return (
        <div className="min-h-screen bg-white text-neutral-900 selection:bg-[#2563EB] selection:text-white font-sans antialiased">
            <Head title="RAKIT Campus — Simplify Student Projects, Boost Campus Achievements" />

            {/* Initial White Screen Curtain */}
            <div
                onClick={handleSkipIntro}
                className={`fixed inset-0 bg-white z-10 transition-opacity duration-1000 select-none ${
                    introStage >= 2 ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'
                }`}
            />

            {/* Floating Text "RAKIT CAMPUS" during Intro: Splitting evenly and surging outward to opposite edges */}
            {introStage < 3 && (
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden select-none">
                    {/* Left Text: RAKIT (anchored to center line 50%, right-aligned) */}
                    <div
                        className="absolute top-1/2 right-1/2 will-change-transform"
                        style={{
                            transform:
                                introStage === 0
                                    ? 'translate(-6px, -50%)'
                                    : introStage === 1
                                    ? isMobile
                                        ? 'translate(-97px, -50%)'
                                        : 'translate(-196px, -50%)'
                                    : 'translate(-120vw, -50%)',
                            opacity: introStage >= 2 ? 0 : 1,
                            transition:
                                introStage === 1
                                    ? 'transform 800ms cubic-bezier(0.16, 1, 0.3, 1)'
                                    : introStage >= 2
                                    ? 'transform 750ms cubic-bezier(0.12, 1, 0.2, 1), opacity 400ms ease-out'
                                    : 'all 500ms ease-out',
                        }}
                    >
                        <span className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-950 whitespace-nowrap">
                            RAKIT
                        </span>
                    </div>

                    {/* Right Text: CAMPUS (anchored to center line 50%, left-aligned) */}
                    <div
                        className="absolute top-1/2 left-1/2 will-change-transform"
                        style={{
                            transform:
                                introStage === 0
                                    ? 'translate(6px, -50%)'
                                    : introStage === 1
                                    ? isMobile
                                        ? 'translate(97px, -50%)'
                                        : 'translate(196px, -50%)'
                                    : 'translate(120vw, -50%)',
                            opacity: introStage >= 2 ? 0 : 1,
                            transition:
                                introStage === 1
                                    ? 'transform 800ms cubic-bezier(0.16, 1, 0.3, 1)'
                                    : introStage >= 2
                                    ? 'transform 750ms cubic-bezier(0.12, 1, 0.2, 1), opacity 400ms ease-out'
                                    : 'all 500ms ease-out',
                        }}
                    >
                        <span className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-950 whitespace-nowrap">
                            CAMPUS
                        </span>
                    </div>
                </div>
            )}

            {/* 1. Header / Navigation */}
                <header
                className={`fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ease-in-out ${
                    introStage < 2
                        ? 'opacity-0 pointer-events-none'
                        : isNavVisible
                        ? 'translate-y-0 opacity-100'
                        : '-translate-y-full opacity-0 pointer-events-none'
                } ${
                    isScrolledPastTop
                        ? 'py-2.5 sm:py-3.5 bg-[#121212] border-b border-white/10 shadow-2xl'
                        : 'pt-4 sm:pt-8 pb-3 bg-transparent border-b border-transparent'
                }`}
            >
                    {/* Logo (Serif All-Caps) */}
                    <Link href="/" className="flex items-center group whitespace-nowrap min-w-0 mr-2">
                        <span className="font-serif text-lg xs:text-xl sm:text-2xl md:text-3xl font-normal tracking-[0.15em] sm:tracking-[0.22em] text-white uppercase drop-shadow-md truncate">
                            RAKIT CAMPUS
                        </span>
                    </Link>

                    {/* Unified Solid Black Nav Toolbar (100% Match to Reference Layout) */}
                    <div className={`${isScrolledPastTop ? 'bg-transparent shadow-none' : 'bg-[#121212] shadow-2xl'} h-[44px] sm:h-[52px] flex items-stretch pl-2.5 sm:pl-8 pr-1.5 sm:pr-4 relative z-40 transition-colors duration-200 shrink-0`}>
                        {/* Desktop Menu Links */}
                        <nav className="hidden lg:flex items-stretch gap-7 xl:gap-8 text-[11px] font-bold tracking-[0.22em] text-white uppercase mr-6 xl:mr-8 select-none">
                            <a
                                href="#about"
                                onClick={handleNavAboutClick}
                                className="hover-blur-text flex items-center cursor-pointer"
                            >
                                TENTANG
                            </a>

                            {/* Interactive Pulldown: FITUR */}
                            <div
                                ref={dropdownRef}
                                className="relative flex items-center h-full z-40"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (timeoutRef.current) {
                                            clearTimeout(timeoutRef.current);
                                            timeoutRef.current = null;
                                        }
                                        setFeaturesDropdownOpen((prev) => {
                                            const next = !prev;
                                            setIsPinned(next);
                                            return next;
                                        });
                                    }}
                                    aria-expanded={featuresDropdownOpen}
                                    aria-haspopup="true"
                                    className="hover-blur-text flex items-center gap-1.5 cursor-pointer h-full text-white uppercase tracking-[0.22em] text-[11px] font-bold focus:outline-hidden"
                                >
                                    <span>FITUR</span>
                                    <ChevronDown
                                        className={`size-3 text-blue-500 transition-transform duration-300 stroke-[2.5] ${
                                            featuresDropdownOpen ? 'rotate-180' : 'rotate-0'
                                        }`}
                                    />
                                </button>

                                {/* Dropdown Menu Panel (Clean editorial list without bullets, stationary positioning) */}
                                <div
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                    className={`absolute top-full left-0 w-80 bg-[#121212] border border-white/10 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 transition-opacity duration-150 ${
                                        featuresDropdownOpen
                                            ? 'opacity-100 pointer-events-auto visible'
                                            : 'opacity-0 pointer-events-none invisible'
                                    }`}
                                >
                                    {/* Invisible hit bridge covering any gap between toolbar and dropdown */}
                                    <div className="absolute -top-3.5 left-0 right-0 h-3.5" />

                                    <ul className="flex flex-col gap-1">
                                        {featuresList.map((item, idx) => (
                                            <li key={idx}>
                                                <a
                                                    href={item.href}
                                                    onClick={(e) => handleFeatureItemClick(e, item.href)}
                                                    className="group block p-3 rounded-xs hover:bg-white/[0.04] transition-all duration-200 cursor-pointer select-none"
                                                >
                                                    <span className="text-xs font-bold tracking-[0.14em] text-white uppercase group-hover-blur-text block cursor-pointer">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400 font-sans tracking-[0.06em] uppercase block mt-1 group-hover-blur-subtext leading-relaxed cursor-pointer">
                                                        {item.desc}
                                                    </span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <Link
                                href="/projects"
                                className="hover-blur-text flex items-center cursor-pointer"
                            >
                                PROJECT HUB
                            </Link>
                            <Link
                                href="/competitions"
                                className="hover-blur-text flex items-center cursor-pointer"
                            >
                                KOMPETISI
                            </Link>
                            <a
                                href="#workflow"
                                className="hover-blur-text flex items-center cursor-pointer"
                            >
                                CARA KERJA
                            </a>
                        </nav>

                        {/* White Rectangular Action Buttons (Adjacent with 4px gap) */}
                        <div className="flex items-center gap-1 self-center">
                            {auth?.user ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className="hover-blur-text bg-white text-black text-[10px] sm:text-xs font-bold px-3.5 sm:px-6 h-[32px] sm:h-[38px] flex items-center justify-center tracking-[0.15em] sm:tracking-[0.2em] uppercase hover:bg-neutral-200 transition-colors shadow-xs"
                                    >
                                        DASHBOARD
                                    </Link>
                                    <Link
                                        method="post"
                                        href="/logout"
                                        as="button"
                                        className="hover-blur-text border border-white/40 text-white/90 hover:text-white hover:border-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 h-[32px] sm:h-[38px] flex items-center justify-center tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-colors"
                                    >
                                        KELUAR
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="hidden xs:flex hover-blur-text bg-white text-black text-[10px] sm:text-xs font-bold px-3 sm:px-5 md:px-6 h-[32px] sm:h-[38px] items-center justify-center tracking-[0.15em] sm:tracking-[0.2em] uppercase hover:bg-neutral-200 transition-colors shadow-xs"
                                    >
                                        MASUK
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="hover-blur-text bg-white text-black text-[10px] sm:text-xs font-bold px-3 sm:px-5 md:px-6 h-[32px] sm:h-[38px] flex items-center justify-center tracking-[0.15em] sm:tracking-[0.2em] uppercase hover:bg-neutral-200 transition-colors shadow-xs"
                                    >
                                        MULAI
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Borderless Hamburger Menu Button inside the unified bar */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle Navigation"
                            className="h-[32px] sm:h-[38px] px-2.5 sm:px-3.5 ml-1 sm:ml-2 flex flex-col items-center justify-center gap-1.5 hover:opacity-75 transition-opacity cursor-pointer self-center"
                        >
                            <span className="w-5 h-[1.5px] bg-white"></span>
                            <span className="w-5 h-[1.5px] bg-white"></span>
                        </button>
                    </div>
                </header>

                {/* Right Slide-over Sidebar Drawer (Drop-down entrance from the top) */}
                {/* Translucent Backdrop (Click to close) */}
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs transition-opacity duration-500 ${
                        mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                />

                {/* Right Sidebar Drawer: Slides down smoothly from the top */}
                <div
                    className={`fixed inset-y-0 right-0 z-[70] w-full sm:w-[380px] md:w-[420px] bg-[#121212] text-white flex flex-col justify-between p-6 sm:p-8 shadow-[-10px_0_35px_rgba(0,0,0,0.9)] overflow-y-auto no-scrollbar transition-all duration-500 ease-out will-change-transform ${
                        mobileMenuOpen
                            ? 'translate-y-0 opacity-100 pointer-events-auto'
                            : '-translate-y-full opacity-0 pointer-events-none'
                    }`}
                    style={{
                        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {/* Top Bar of Sidebar with Close Button (Border line removed as requested) */}
                    <div className="flex items-center justify-end">
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="h-[38px] w-[46px] bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
                            aria-label="Tutup Menu"
                        >
                            <X className="w-5 h-5 stroke-[2]" />
                        </button>
                    </div>

                    {/* Menu Items with Subtitles (Editorial Layout) */}
                    <div className="flex-1 flex flex-col justify-center gap-5 sm:gap-6 py-4 my-auto">
                        <Link
                            href="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className="group flex flex-col text-left cursor-pointer"
                        >
                            <span className="font-serif text-xl sm:text-2xl text-white font-normal tracking-[0.14em] uppercase group-hover-blur-text leading-tight">
                                BERANDA
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-neutral-400 font-sans tracking-[0.12em] uppercase mt-1 group-hover-blur-subtext">
                                HALAMAN UTAMA
                            </span>
                        </Link>

                        <a
                            href="#about"
                            onClick={handleNavAboutClick}
                            className="group flex flex-col text-left cursor-pointer"
                        >
                            <span className="font-serif text-xl sm:text-2xl text-white font-normal tracking-[0.14em] uppercase group-hover-blur-text leading-tight">
                                TENTANG
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-neutral-400 font-sans tracking-[0.12em] uppercase mt-1 group-hover-blur-subtext">
                                PROFIL &amp; MISI PLATFORM
                            </span>
                        </a>

                        <Link
                            href="/projects"
                            onClick={() => setMobileMenuOpen(false)}
                            className="group flex flex-col text-left cursor-pointer"
                        >
                            <span className="font-serif text-xl sm:text-2xl text-white font-normal tracking-[0.14em] uppercase group-hover-blur-text leading-tight">
                                KARYA
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-neutral-400 font-sans tracking-[0.12em] uppercase mt-1 group-hover-blur-subtext">
                                SHOWCASE &amp; PROJECT HUB
                            </span>
                        </Link>

                        {/* Fitur with Sub-items (Accordion) */}
                        <div className="flex flex-col text-left">
                            <button
                                type="button"
                                onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                                className="group flex flex-col text-left cursor-pointer focus:outline-hidden"
                            >
                                <span className="font-serif text-xl sm:text-2xl text-white font-normal tracking-[0.14em] uppercase group-hover-blur-text leading-tight flex items-center justify-between w-full">
                                    <span>FITUR</span>
                                    <ChevronDown
                                        className={`size-4 text-blue-500 transition-transform duration-300 stroke-[2.5] ${
                                            mobileFeaturesOpen ? 'rotate-180' : 'rotate-0'
                                        }`}
                                    />
                                </span>
                                <span className="text-[10px] sm:text-[11px] text-neutral-400 font-sans tracking-[0.12em] uppercase mt-1 group-hover-blur-subtext">
                                    LIVING PROPOSAL &amp; MATCHMAKING
                                </span>
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-out pl-4 flex flex-col gap-2.5 text-xs text-neutral-400 font-sans ${
                                    mobileFeaturesOpen ? 'max-h-60 opacity-100 mt-2.5' : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                                }`}
                            >
                                {featuresList.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.href}
                                        onClick={(e) => handleFeatureItemClick(e, item.href)}
                                        className="hover-blur-text text-neutral-300 hover:text-white py-1 flex items-center cursor-pointer text-xs font-semibold tracking-[0.1em]"
                                    >
                                        <span>{item.title}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <Link
                            href="/competitions"
                            onClick={() => setMobileMenuOpen(false)}
                            className="group flex flex-col text-left cursor-pointer"
                        >
                            <span className="font-serif text-xl sm:text-2xl text-white font-normal tracking-[0.14em] uppercase group-hover-blur-text leading-tight">
                                KOMPETISI
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-neutral-400 font-sans tracking-[0.12em] uppercase mt-1 group-hover-blur-subtext">
                                HACKATHON &amp; LOMBA MAHASISWA
                            </span>
                        </Link>

                        <a
                            href="#workflow"
                            onClick={() => setMobileMenuOpen(false)}
                            className="group flex flex-col text-left cursor-pointer"
                        >
                            <span className="font-serif text-xl sm:text-2xl text-white font-normal tracking-[0.14em] uppercase group-hover-blur-text leading-tight">
                                CARA KERJA
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-neutral-400 font-sans tracking-[0.12em] uppercase mt-1 group-hover-blur-subtext">
                                ALUR KOLABORASI MAHASISWA
                            </span>
                        </a>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-4 flex flex-col gap-2.5">
                        {auth?.user ? (
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/dashboard"
                                    className="hover-blur-text w-full bg-white text-black py-3.5 text-center text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-200 transition-colors shadow-sm"
                                >
                                    BUKA DASHBOARD
                                </Link>
                                <Link
                                    method="post"
                                    href="/logout"
                                    as="button"
                                    className="hover-blur-text w-full border border-red-500/50 text-red-400 py-3 text-center text-xs font-bold tracking-[0.2em] uppercase hover:bg-red-500/10 transition-colors"
                                >
                                    KELUAR DARI AKUN
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="hover-blur-text flex-1 bg-white text-black py-3.5 text-center text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-200 transition-colors shadow-sm"
                                >
                                    MASUK
                                </Link>
                                <Link
                                    href="/register"
                                    className="hover-blur-text flex-1 border border-white/60 text-white py-3.5 text-center text-xs font-bold tracking-[0.2em] uppercase hover:border-white hover:bg-white hover:text-black transition-colors"
                                >
                                    MULAI
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                
            {/* Section 1: Hero Section (Editorial Dark Aesthetic) */}
            <div
                ref={pinContainerRef}
                className="relative w-full h-screen min-h-screen overflow-hidden flex flex-col justify-between bg-black text-white"
            >
                {/* Hero Video Banner: Sharp edges (no border, no border-radius), expands to fullscreen of Section 1 via GPU-accelerated clip-path */}
                <div
                    className={`overflow-hidden rounded-none border-0 ${
                        introStage < 3
                            ? 'fixed inset-0 z-20 pointer-events-none'
                            : 'absolute inset-0 z-0'
                    }`}
                    style={{
                        clipPath:
                            introStage === 0
                                ? 'inset(50% 50% 50% 50%)'
                                : introStage === 1
                                ? isMobile
                                    ? 'inset(calc(50% - 48px) calc(50% - 85px) calc(50% - 48px) calc(50% - 85px))'
                                    : 'inset(calc(50% - 100px) calc(50% - 180px) calc(50% - 100px) calc(50% - 180px))'
                                : 'inset(0% 0% 0% 0%)',
                        opacity: introStage === 0 ? 0 : 1,
                        transition:
                            introStage === 1
                                ? 'clip-path 800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease-out'
                                : 'clip-path 1200ms cubic-bezier(0.16, 1, 0.3, 1)',
                        willChange: 'clip-path',
                    }}
                >
                    <video
                        ref={videoElementRef}
                        src="/videos/hero.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover will-change-[filter,transform]"
                    />
                    {/* Subtle Top & Bottom Gradient Overlay for Contrast (keeps video bright & colorful) */}
                    <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/35 transition-opacity duration-1000 ${
                            introStage >= 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                    />
                    {/* Progressive Video Blur Overlay: GSAP triggers subtle blur during scroll into Tentang */}
                    <div
                        ref={videoBlurOverlayRef}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-none opacity-0 transition-opacity"
                    />
                </div>

                {/* Header Height Spacer: Preserves exact hero layout spacing */}
                <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 h-[76px] sm:h-[84px] pointer-events-none shrink-0" aria-hidden="true" />

                {/* 2. Hero Elements Layer (Image 4) - Driven UPWARDS by GSAP as user scrolls down */}
                <div
                    ref={heroContentRef}
                    className="w-full flex-1 flex flex-col justify-between relative z-30 will-change-transform pb-4 sm:pb-7"
                >
                    {/* 2. Hero Headline with Staggered Masked Text Reveal */}
                    <div className="w-full px-3.5 sm:px-6 lg:px-8 pb-3 sm:pb-4 flex-1 flex flex-col justify-end select-none">
                        <h1 className="font-serif text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-normal tracking-[-0.02em] text-white uppercase leading-[0.92] flex flex-wrap gap-x-[0.25em]">
                            {/* Word 1: MERAKIT (Masked Rise) */}
                            <span className="inline-block overflow-hidden py-1">
                                <span
                                    className="inline-block drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] will-change-transform"
                                    style={{
                                        transform: textRevealed ? 'translateY(0%)' : 'translateY(120%)',
                                        opacity: textRevealed ? 1 : 0,
                                        filter: textRevealed ? 'blur(0px)' : 'blur(8px)',
                                        transition:
                                            'transform 1200ms cubic-bezier(0.16, 1, 0.3, 1) 0ms, opacity 800ms ease-out 0ms, filter 800ms ease-out 0ms',
                                    }}
                                >
                                    MERAKIT
                                </span>
                            </span>

                            {/* Word 2: KARYA (Masked Rise with Stagger) */}
                            <span className="inline-block overflow-hidden py-1">
                                <span
                                    className="inline-block drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] will-change-transform"
                                    style={{
                                        transform: textRevealed ? 'translateY(0%)' : 'translateY(120%)',
                                        opacity: textRevealed ? 1 : 0,
                                        filter: textRevealed ? 'blur(0px)' : 'blur(8px)',
                                        transition:
                                            'transform 1200ms cubic-bezier(0.16, 1, 0.3, 1) 180ms, opacity 800ms ease-out 180ms, filter 800ms ease-out 180ms',
                                    }}
                                >
                                    KARYA
                                </span>
                            </span>
                        </h1>

                        {/* Subtitle Masked Rise with Stagger */}
                        <div className="overflow-hidden mt-1 sm:mt-2 max-w-2xl">
                            <p
                                className="font-serif text-base xs:text-lg sm:text-2xl md:text-3xl text-neutral-100 font-light tracking-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] leading-snug will-change-transform"
                                style={{
                                    transform: textRevealed ? 'translateY(0%)' : 'translateY(120%)',
                                    opacity: textRevealed ? 1 : 0,
                                    filter: textRevealed ? 'blur(0px)' : 'blur(4px)',
                                    transition:
                                        'transform 1000ms cubic-bezier(0.16, 1, 0.3, 1) 380ms, opacity 900ms ease-out 380ms, filter 900ms ease-out 380ms',
                                }}
                            >
                                Sinergi talenta, rancang inovasi, raih kejuaraan.
                            </p>
                        </div>
                    </div>

                    {/* 3. Bottom Strip: News Ticker & Scroll Indicator */}
                    <div
                        className={`w-full px-3.5 sm:px-6 lg:px-8 pt-1 pb-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 transition-opacity duration-700 delay-400 ${
                            introStage >= 2 ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Left: News Ticker / Announcement Box */}
                        <div className="bg-black/85 backdrop-blur-md border border-white/20 px-3 sm:px-[18px] py-2 sm:py-[10.5px] text-[10px] sm:text-xs text-neutral-200 flex items-center gap-2 sm:gap-2.5 w-full sm:max-w-3xl font-mono shadow-sm">
                            <span className="text-white font-bold tracking-wider shrink-0 text-[9.5px] sm:text-xs">PENGUMUMAN</span>
                            <span className="text-neutral-400">|</span>
                            <span className="truncate">
                                Platform kolaborasi mahasiswa RAKIT CAMPUS: Living Proposal, Fair Matchmaking &amp; Portofolio Terverifikasi.
                            </span>
                        </div>

                        {/* Right: Scroll Down Button */}
                        <button
                            onClick={handleScrollDown}
                            className="flex items-center gap-2 py-1 px-1 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] sm:tracking-[0.25em] text-neutral-200 hover:text-white uppercase transition-colors group cursor-pointer self-end sm:self-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] shrink-0"
                        >
                            <span>GULIR KE BAWAH</span>
                            <ArrowDown className="size-3 sm:size-3.5 text-[#2563EB] animate-arrow-down-bounce drop-shadow-[0_0_8px_rgba(37,99,235,0.7)]" />
                        </button>
                    </div>
                </div>

                {/* Tentang & Deskripsi Layer (Matching Layout of Images 2 & 3 from ADDICT reference) */}
                <div
                    ref={aboutSectionRef}
                    id="about"
                    className="absolute inset-0 z-30 pointer-events-auto will-change-transform opacity-0 overflow-y-auto md:overflow-hidden pb-12 md:pb-0"
                >
                    {/* Staggered Content Canvas: Upper-Left (Image 2) & Lower-Right (Image 2 & 3) */}
                    <div className="relative w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Upper-Left Column: Watermark Title + Category + Manifesto Quote (Image 2) */}
                        <div
                            ref={aboutLeftColRef}
                            className="md:absolute md:top-[8vh] lg:top-[9vh] xl:top-[10vh] md:left-4 lg:left-6 xl:left-8 w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl flex flex-col z-10 pt-14 sm:pt-20 md:pt-0 will-change-transform"
                        >
                            {/* 1. Giant Watermark Headline: 1 single line, selectable text */}
                            <h2 className="font-serif text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5rem] 2xl:text-[5.5rem] text-white font-bold uppercase tracking-[0.04em] leading-tight sm:leading-none select-text cursor-default mb-2 sm:mb-4 whitespace-normal sm:whitespace-nowrap drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                                APA YANG KAMI BANGUN
                            </h2>

                            {/* Category Subhead: Title Case, serif style matching title & quote */}
                            <div>
                                <span className="text-xs sm:text-[15px] md:text-base font-serif tracking-[0.08em] text-white font-bold">
                                    Tentang RAKIT CAMPUS
                                </span>
                            </div>

                            {/* 2. Manifesto Quote: 2 sentences, strictly 1 single line each */}
                            <div className="mt-2 sm:mt-3 font-serif text-base xs:text-lg sm:text-2xl md:text-[1.7rem] lg:text-[1.85rem] xl:text-[2.05rem] text-white font-normal leading-snug sm:leading-[1.35] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)]">
                                <p className="whitespace-normal md:whitespace-nowrap">
                                    Memadukan potensi dan logika dengan keindahan karya.
                                </p>
                                <p className="mt-1 sm:mt-1.5 text-neutral-200 whitespace-normal md:whitespace-nowrap">
                                    Membawa antusiasme juara yang tak tertahankan ke setiap mahasiswa.
                                </p>
                            </div>
                        </div>

                        {/* Lower-Right Column: Significantly larger gap from "Tentang RAKIT CAMPUS" */}
                        <div
                            ref={aboutRightColRef}
                            className="md:absolute md:top-[66vh] lg:top-[68vh] xl:top-[70vh] 2xl:top-[72vh] md:right-4 lg:right-6 xl:right-8 w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[440px] flex flex-col z-10 mt-10 sm:mt-16 md:mt-0 will-change-transform"
                        >
                            {/* Small Label - Unbolded */}
                            <span className="text-xs sm:text-[13px] font-mono tracking-[0.25em] text-neutral-400 font-normal uppercase mb-2 sm:mb-3 block">
                                TENTANG
                            </span>

                            {/* Paragraph 1: Slender, text-justify (rata kanan kiri), enlarged font */}
                            <p className="text-xs xs:text-sm sm:text-[15px] md:text-[16px] lg:text-[16.5px] text-neutral-200 leading-relaxed sm:leading-[1.85] font-sans font-normal text-left sm:text-justify drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
                                RAKIT CAMPUS adalah platform kolaborasi mahasiswa terpadu yang bertujuan untuk menjadi jantung ekosistem inovasi kampus dengan mengintegrasikan sistem pembentukan tim cerdas berbasis kecocokan keahlian (AI-Powered), dokumen Living Proposal interaktif secara real-time, dan validasi portofolio terverifikasi program studi.
                            </p>

                            {/* Paragraph 2: Refined typography with text-justify, enlarged font */}
                            <p className="mt-3 sm:mt-4 text-xs xs:text-sm sm:text-[15px] md:text-[16px] lg:text-[16.5px] text-neutral-300 leading-relaxed sm:leading-[1.85] font-sans font-normal text-left sm:text-justify drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
                                Era pengerjaan proyek yang sporadis dan pembentukan tim serba kebetulan telah berakhir. Kami menggabungkan kebutuhan riil kompetisi dengan kepastian kurikulum akademik untuk menumbuhkan sinergi talenta yang menjadi modal prestasi nyata mahasiswa.
                            </p>

                            {/* CTA Button towards Student Dashboard with interactive effects */}
                            <div className="mt-5 sm:mt-7">
                                <Link
                                    href="/dashboard"
                                    className="group relative inline-flex items-center justify-center gap-3.5 bg-white hover:bg-neutral-50 text-neutral-900 text-xs sm:text-sm font-sans font-semibold px-5 py-3 sm:px-7 sm:py-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_10px_35px_rgba(255,255,255,0.25)] transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] overflow-hidden cursor-pointer w-full sm:w-auto"
                                >
                                    {/* Shimmer light sweep highlight effect */}
                                    <span 
                                        aria-hidden="true"
                                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-blue-500/15 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" 
                                    />

                                    <span className="relative z-10 tracking-wide">Lihat Platform</span>
                                    
                                    {/* Interactive animated blue diamond */}
                                    <span 
                                        aria-hidden="true"
                                        className="relative z-10 text-blue-600 text-xs sm:text-sm font-bold transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:scale-125 group-hover:rotate-45 inline-block"
                                    >
                                        ◆
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Pinned Container with GSAP Scroll Transition (Text Cutout Mask -> Overview) */}
            <div
                ref={section2PinContainerRef}
                id="section-rakit"
                className="relative w-full h-screen h-[100dvh] max-h-screen bg-white overflow-hidden"
            >
                {/* Layer 1: SVG Cutout Mask Overlay Container (Transparent "RAKIT" reveals Section 2 inside the letters) */}
                <div
                    ref={rakitOverlayRef}
                    className="absolute inset-0 w-full h-full pointer-events-none select-none z-20 transform-gpu will-change-[transform,opacity] [backface-visibility:hidden] overflow-hidden flex items-center justify-center bg-transparent"
                    style={{
                        transformOrigin: '50% 50%',
                    }}
                >
                    <svg
                        className="w-full h-full pointer-events-none select-none"
                        viewBox="0 0 1920 1080"
                        preserveAspectRatio="xMidYMid slice"
                    >
                        <defs>
                            <mask id="rakit-cutout-mask">
                                {/* Solid white base covering far beyond viewBox so zero edges or lines ever show */}
                                <rect x="-1000" y="-1000" width="3920" height="3080" fill="white" />
                                {/* Black text cuts out the letters to create transparent window holes */}
                                <text
                                    x="960"
                                    y="540"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    alignmentBaseline="central"
                                    fill="black"
                                    className="font-serif uppercase font-normal select-none"
                                    style={{
                                        fontFamily: 'var(--font-serif)',
                                        fontSize: isMobile ? '210px' : '360px',
                                        letterSpacing: '0.04em',
                                    }}
                                >
                                    RAKIT
                                </text>
                            </mask>
                        </defs>

                        {/* Solid white canvas with cutout mask applied: Section 2 shows ONLY through the letters */}
                        <rect
                            x="-1000"
                            y="-1000"
                            width="3920"
                            height="3080"
                            fill="white"
                            mask="url(#rakit-cutout-mask)"
                        />

                        {/* Tint overlay directly over the letters: provides the elegant dark/smoked tint from the ADDICT reference */}
                        <text
                            ref={rakitTintRef}
                            x="960"
                            y="540"
                            textAnchor="middle"
                            dominantBaseline="central"
                            alignmentBaseline="central"
                            fill="rgba(0, 0, 0, 0.20)"
                            className="font-serif uppercase font-normal select-none pointer-events-none"
                            style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: isMobile ? '210px' : '360px',
                                letterSpacing: '0.04em',
                            }}
                        >
                            RAKIT
                        </text>
                    </svg>
                </div>

                {/* Layer 2: Section 2 Yang Sebenarnya (Interactive Platform Overview: Only Text & Buttons) */}
                <section
                    ref={realSection2Ref}
                    id="overview"
                    className="relative z-10 w-full h-screen h-[100dvh] max-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6"
                >
                    {/* Subtle Dot Matrix & Ethereal Mesh Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-[650px] bg-gradient-to-b from-[#EEF2FF]/60 via-[#F8FAFC]/30 to-white pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12)_0%,rgba(147,197,253,0.08)_45%,transparent_70%)] pointer-events-none" />

                    {/* Section 2 Header: Title, Description & CTA Buttons */}
                    <div
                        ref={section2HeaderContentRef}
                        className="max-w-4xl lg:max-w-5xl mx-auto px-4 relative z-10 text-center w-full will-change-transform"
                    >
                        <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.15] sm:leading-[1.12]">
                            Simplify Project Collaboration <br />
                            <span className="text-blue-600">
                                Boost Campus Achievements
                            </span>
                        </h2>

                        <p className="mt-3.5 sm:mt-6 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                            Platform pembentukan tim mahasiswa berbasis AI, manajemen sprint Kanban interaktif, dan validasi Living Proposal kurikulum akademik.
                        </p>

                        {/* CTA Buttons with Micro-Interactions */}
                        <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-5 w-full max-w-xs sm:max-w-none mx-auto">
                            <Link
                                href={auth?.user ? "/dashboard" : "/register"}
                                className="group inline-flex items-center justify-center gap-2.5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm md:text-base font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg shadow-neutral-900/20 hover:shadow-neutral-900/30 hover:-translate-y-0.5 transition-all w-full sm:w-auto text-center"
                            >
                                <span>Get Started Free</span>
                                <ArrowRight className="size-4 sm:size-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm md:text-base font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-neutral-200/90 shadow-2xs hover:border-neutral-300 hover:-translate-y-0.5 transition-all w-full sm:w-auto text-center"
                            >
                                <Sparkles className="size-4 text-blue-600" />
                                <span>Coba Akun Demo Polindra</span>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            {/* Section 2.5: Dedicated 3D Interactive Platform Showcase (3D Laptop & Handphone) */}
            <section
                id="platform-showcase"
                className="relative w-full py-10 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white via-neutral-50/50 to-white text-neutral-900 overflow-hidden select-none border-b border-neutral-100"
            >
                {/* Subtle Dot Matrix & Ethereal Mesh Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
                <div ref={showcaseGlowRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.10)_0%,rgba(147,197,253,0.06)_50%,transparent_72%)] pointer-events-none will-change-[opacity]" />

                <div className="relative max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
                    {/* Dual-Device 3D Showcase: Realistic 3D Laptop with Google Chrome Desktop + Realistic 3D Handphone with Google Chrome Mobile */}
                    <div
                        ref={section2MockupRef}
                        onMouseMove={handleShowcaseMouseMove}
                        onMouseEnter={handleShowcaseMouseEnter}
                        onMouseLeave={handleShowcaseMouseLeave}
                        className="relative mx-auto w-full will-change-transform"
                        style={{ perspective: '2200px' }}
                    >
                        
                        {/* 1. Realistic 3D Laptop (Chassis, Chrome Desktop Browser & Dashboard) */}
                        <div ref={laptopShowcaseRef} className="w-full relative mx-auto transform-gpu will-change-transform [backface-visibility:hidden]">
                            <div 
                                ref={laptopCardRef}
                                className="relative mx-auto w-full max-w-5xl lg:max-w-[1000px] xl:max-w-[1040px] will-change-transform transform-gpu select-none"
                                style={{
                                    transform: 'perspective(1800px) rotateX(2.5deg) rotateY(0deg) translateZ(0)',
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                
                                {/* LAPTOP SCREEN LID (Display Housing with Anodized Space Gray Aluminum Shell) */}
                                <div className="relative bg-gradient-to-b from-[#282a34] via-[#1a1b22] to-[#111218] rounded-t-[16px] xs:rounded-t-[20px] sm:rounded-t-[26px] md:rounded-t-[30px] p-[5px] sm:p-[8px] md:p-[9px] pb-0 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.45),0_8px_20px_rgba(0,0,0,0.25)] ring-1 ring-white/15 border border-[#373946]">
                                    
                                    {/* Inner Black Glass Display Bezel */}
                                    <div className="relative bg-[#090a0d] rounded-t-[12px] sm:rounded-t-[18px] md:rounded-t-[21px] overflow-hidden border border-black/90">

                                        {/* Top Bezel with Integrated FaceTime HD Webcam */}
                                        <div className="relative w-full h-2.5 sm:h-3.5 bg-[#0a0a0e] flex items-center justify-center z-30 select-none">
                                            <div className="size-1.5 sm:size-2 rounded-full bg-[#040406] border border-neutral-700/60 flex items-center justify-center shadow-inner">
                                                <div className="size-0.5 rounded-full bg-blue-500/80 ring-1 ring-blue-400/30" />
                                            </div>
                                        </div>

                                        {/* Screen Gloss Reflection Overlay */}
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] z-20" />

                                        {/* Cinematic 3D Light Sheen Sweep Overlay */}
                                        <div 
                                            ref={laptopSheenRef}
                                            className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent z-25 will-change-transform opacity-0"
                                        />

                                {/* GOOGLE CHROME DESKTOP BROWSER UI (Matching Image 2 Reference) */}
                                <div className="w-full flex flex-col bg-[#eef1f5] border-b border-neutral-300/80 select-none text-left relative z-10 font-sans">
                                    <div className="flex items-center gap-1.5 sm:gap-4 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#dfe3e8]/90 border-b border-neutral-300">
                                        {/* macOS Window Controls (Monochrome for strict 3-color palette) */}
                                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                            <div className="size-2 sm:size-3 rounded-full bg-neutral-400/80 hover:bg-neutral-600 transition border border-neutral-500/30" />
                                            <div className="size-2 sm:size-3 rounded-full bg-neutral-300 hover:bg-neutral-500 transition border border-neutral-400/30" />
                                            <div className="size-2 sm:size-3 rounded-full bg-neutral-300 hover:bg-neutral-500 transition border border-neutral-400/30" />
                                        </div>

                                        {/* Back / Forward / Reload navigation */}
                                        <div className="hidden sm:flex items-center gap-1 text-neutral-400">
                                            <button type="button" className="p-1 rounded-full text-neutral-400 cursor-not-allowed">
                                                <ArrowLeft className="size-3 sm:size-3.5" />
                                            </button>
                                            <button type="button" className="p-1 rounded-full text-neutral-400 cursor-not-allowed">
                                                <ArrowRight className="size-3 sm:size-3.5" />
                                            </button>
                                            <button type="button" className="p-1 rounded-full text-neutral-600 hover:bg-neutral-200/60 transition">
                                                <RotateCw className="size-3 sm:size-3.5" />
                                            </button>
                                        </div>

                                        {/* Chrome Omnibox URL Bar */}
                                        <div className="flex-1 flex items-center justify-between bg-white border border-neutral-200/90 rounded-full px-2.5 sm:px-4 py-0.5 sm:py-1 text-[9px] sm:text-[11.5px] font-sans shadow-2xs min-w-0">
                                            <div className="flex items-center gap-1 sm:gap-2 truncate">
                                                <span className="size-1.5 rounded-full bg-blue-600 shrink-0" />
                                                <span className="text-neutral-400 hidden sm:inline font-mono">https://</span>
                                                <span className="text-neutral-900 font-bold font-mono">rakitcampus.id</span>
                                                <span className="text-neutral-500 font-mono truncate hidden xs:inline">/dashboard/polindra-sprint-2026</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 ml-1.5 sm:ml-2">
                                                <span className="text-[8px] sm:text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-200/70">
                                                    Polindra Hub
                                                </span>
                                            </div>
                                        </div>

                                        {/* Chrome User Profile */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <div className="size-4.5 sm:size-6 rounded-full bg-blue-600 text-white text-[8px] sm:text-[10px] font-bold flex items-center justify-center shadow-2xs">
                                                BS
                                            </div>
                                            <MoreVertical className="size-3.5 text-neutral-600 hidden sm:inline cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                {/* LAPTOP WEB DASHBOARD VIEWPORT (Inside Chrome) */}
                                <div className="w-full bg-white flex text-left font-sans select-none overflow-hidden relative z-10 min-h-[380px] xs:min-h-[420px] sm:min-h-[490px] md:min-h-[510px]">
                                    {/* Desktop Sidebar */}
                                    <aside className="w-48 sm:w-52 shrink-0 bg-white border-r border-neutral-200/80 p-3 sm:p-4 hidden sm:flex flex-col justify-between">
                                        <div>
                                            {/* App Logo */}
                                            <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
                                                <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
                                                    <Rocket className="size-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black tracking-tight text-neutral-900 leading-tight">RAKIT CAMPUS</div>
                                                    <div className="text-[9px] text-neutral-400 font-medium">Polindra Workspace</div>
                                                </div>
                                            </div>

                                            {/* Navigation Links */}
                                            <nav className="mt-4 space-y-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('board')}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 transition"
                                                >
                                                    <Kanban className="size-3.5 text-blue-600" />
                                                    <span>Sprint Kanban</span>
                                                </button>
                                                <div className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition cursor-pointer">
                                                    <Sparkles className="size-3.5 text-neutral-400" />
                                                    <span>AI Matchmaking</span>
                                                </div>
                                                <div className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition cursor-pointer">
                                                    <FolderKanban className="size-3.5 text-neutral-400" />
                                                    <span>Living Proposal</span>
                                                </div>
                                                <div className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition cursor-pointer">
                                                    <Trophy className="size-3.5 text-neutral-400" />
                                                    <span>Gemastik 2026</span>
                                                </div>
                                                <div className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition cursor-pointer">
                                                    <Users className="size-3.5 text-neutral-400" />
                                                    <span>Anggota Tim (4)</span>
                                                </div>
                                            </nav>
                                        </div>

                                        {/* User Card in Sidebar */}
                                        <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center gap-2.5">
                                            <div className="relative">
                                                <div className="size-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                                    BS
                                                </div>
                                                <span className="absolute bottom-0 right-0 size-2 bg-blue-600 rounded-full border border-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-bold text-neutral-900 truncate">Budi Santoso</div>
                                                <div className="text-[9px] text-neutral-500">Ketua Tim Hackathon</div>
                                            </div>
                                        </div>
                                    </aside>

                                    {/* Main Dashboard Canvas Area */}
                                    <main className="flex-1 p-2.5 sm:p-5 flex flex-col justify-between overflow-hidden bg-white">
                                        <div>
                                            {/* Subheader */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 sm:pb-3 border-b border-neutral-100 gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xs sm:text-sm font-bold text-neutral-900">Sprint Polindra 2026</h3>
                                                        <span className="text-[9px] sm:text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded border border-blue-200/60">
                                                            Active Sprint
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] sm:text-[11px] text-neutral-400 mt-0.5 truncate max-w-[240px] sm:max-w-none">
                                                        Target Validasi Living Proposal & Prototype IoT Gemastik
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <div className="flex items-center -space-x-1.5 mr-0.5 sm:mr-1">
                                                        <div className="size-4.5 sm:size-6 rounded-full bg-blue-600 text-white text-[7.5px] sm:text-[9px] font-bold flex items-center justify-center border-2 border-white">B</div>
                                                        <div className="size-4.5 sm:size-6 rounded-full bg-neutral-900 text-white text-[7.5px] sm:text-[9px] font-bold flex items-center justify-center border-2 border-white">S</div>
                                                        <div className="size-4.5 sm:size-6 rounded-full bg-blue-500 text-white text-[7.5px] sm:text-[9px] font-bold flex items-center justify-center border-2 border-white">A</div>
                                                        <div className="size-4.5 sm:size-6 rounded-full bg-neutral-100 text-neutral-800 text-[7.5px] sm:text-[9px] font-bold flex items-center justify-center border-2 border-white">+3</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('board')}
                                                        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-semibold transition ${
                                                            activeTab === 'board'
                                                                ? 'bg-neutral-900 text-white'
                                                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                                        }`}
                                                    >
                                                        Board
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('list')}
                                                        className={`hidden sm:inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold transition ${
                                                            activeTab === 'list'
                                                                ? 'bg-neutral-900 text-white'
                                                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                                        }`}
                                                    >
                                                        List
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="hidden md:inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md shadow-2xs hover:bg-blue-700 transition"
                                                    >
                                                        <Plus className="size-3" />
                                                        <span>Tambah Tugas</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* KPI Metrics Row */}
                                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mt-2.5 sm:mt-3 mb-2.5 sm:mb-3">
                                                <div className="p-1.5 sm:p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between min-w-0">
                                                    <div className="min-w-0">
                                                        <div className="text-[7.5px] sm:text-[9px] text-neutral-400 font-medium truncate">Sprint</div>
                                                        <div className="text-[10px] sm:text-xs md:text-sm font-bold text-neutral-900 truncate">78% Selesai</div>
                                                    </div>
                                                    <div className="w-8 sm:w-16 bg-neutral-200 h-1.5 rounded-full overflow-hidden shrink-0 ml-1">
                                                        <div className="bg-blue-600 h-full rounded-full w-[78%]" />
                                                    </div>
                                                </div>

                                                <div className="p-1.5 sm:p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between min-w-0">
                                                    <div className="min-w-0">
                                                        <div className="text-[7.5px] sm:text-[9px] text-neutral-400 font-medium truncate">Proposal</div>
                                                        <div className="text-[10px] sm:text-xs md:text-sm font-bold text-blue-700 truncate">v2.4 Valid</div>
                                                    </div>
                                                    <CheckCircle2 className="size-3 sm:size-4 text-blue-600 shrink-0 ml-1" />
                                                </div>

                                                <div className="p-1.5 sm:p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between min-w-0">
                                                    <div className="min-w-0">
                                                        <div className="text-[7.5px] sm:text-[9px] text-neutral-400 font-medium truncate">Gemastik</div>
                                                        <div className="text-[10px] sm:text-xs md:text-sm font-bold text-neutral-900 truncate">14 Hari Sisa</div>
                                                    </div>
                                                    <Trophy className="size-3 sm:size-4 text-blue-600 shrink-0 ml-1" />
                                                </div>
                                            </div>

                                            {/* 4-Column Live Kanban Board */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                                                {/* Column 1: To Do */}
                                                <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-2 sm:p-2.5 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-200/70 text-neutral-800">
                                                            To Do <span className="text-neutral-500 ml-1">3</span>
                                                        </span>
                                                        <MoreHorizontal className="size-3 text-neutral-400" />
                                                    </div>
                                                    {/* Card 1 */}
                                                    <div className="bg-white border border-neutral-200/90 rounded-lg p-2 sm:p-2.5 shadow-2xs">
                                                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                                                            High Priority
                                                        </span>
                                                        <h4 className="text-[10px] sm:text-[10.5px] font-bold text-neutral-900 mt-0.5 leading-snug line-clamp-2">
                                                            Competitive Analysis & Hackathon Pitch
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-[9px] text-neutral-400">
                                                            <span>2 Hari Lagi</span>
                                                            <div className="size-4 rounded-full bg-neutral-900 text-white text-[7px] font-bold flex items-center justify-center">B</div>
                                                        </div>
                                                    </div>
                                                    {/* Card 2 */}
                                                    <div className="hidden sm:block bg-white border border-neutral-200/90 rounded-lg p-2 sm:p-2.5 shadow-2xs">
                                                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                                                            Riset
                                                        </span>
                                                        <h4 className="text-[10px] sm:text-[10.5px] font-bold text-neutral-900 mt-0.5 leading-snug line-clamp-2">
                                                            Sensor IoT LoRaWAN Spec
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-[9px] text-neutral-400">
                                                            <span>4 Hari</span>
                                                            <div className="size-4 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center">A</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: In Process */}
                                                <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-2 sm:p-2.5 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                                                            In Process <span className="text-blue-500 ml-1">2</span>
                                                        </span>
                                                        <MoreHorizontal className="size-3 text-neutral-400" />
                                                    </div>
                                                    {/* Card 1 */}
                                                    <div className="bg-white border border-neutral-200/90 rounded-lg p-2 sm:p-2.5 shadow-2xs">
                                                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                                                            In Progress
                                                        </span>
                                                        <h4 className="text-[10px] sm:text-[10.5px] font-bold text-neutral-900 mt-0.5 leading-snug line-clamp-2">
                                                            Dashboard UI Refinement & 3D Web View
                                                        </h4>
                                                        <div className="w-full bg-neutral-100 h-1 rounded-full mt-2 overflow-hidden">
                                                            <div className="bg-blue-600 h-full rounded-full w-3/4" />
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1.5 text-[9px] text-neutral-400">
                                                            <span className="text-blue-600 font-semibold">75% Done</span>
                                                            <div className="size-4 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center">S</div>
                                                        </div>
                                                    </div>
                                                    {/* Card 2 */}
                                                    <div className="hidden sm:block bg-white border border-neutral-200/90 rounded-lg p-2 sm:p-2.5 shadow-2xs">
                                                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                                                            Backend
                                                        </span>
                                                        <h4 className="text-[10px] sm:text-[10.5px] font-bold text-neutral-900 mt-0.5 leading-snug line-clamp-2">
                                                            Algoritma Gemini Matching
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-[9px] text-neutral-400">
                                                            <span>Aktif</span>
                                                            <div className="size-4 rounded-full bg-neutral-900 text-white text-[7px] font-bold flex items-center justify-center">B</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 3: In Review */}
                                                <div className="hidden md:flex bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-2 sm:p-2.5 flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-200/70 text-neutral-800">
                                                            In Review <span className="text-neutral-500 ml-1">1</span>
                                                        </span>
                                                        <MoreHorizontal className="size-3 text-neutral-400" />
                                                    </div>
                                                    {/* Card 1 */}
                                                    <div className="bg-white border border-neutral-200/90 rounded-lg p-2 sm:p-2.5 shadow-2xs">
                                                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                                                            Review Ready
                                                        </span>
                                                        <h4 className="text-[10px] sm:text-[10.5px] font-bold text-neutral-900 mt-0.5 leading-snug line-clamp-2">
                                                            Living Proposal Bab 1-3 Review Dosen
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-[9px] text-neutral-400">
                                                            <span className="text-blue-600 font-semibold">Siap Diuji</span>
                                                            <div className="size-4 rounded-full bg-neutral-900 text-white text-[7px] font-bold flex items-center justify-center">A</div>
                                                        </div>
                                                    </div>
                                                    {/* Card 2 */}
                                                    <div className="bg-white border border-neutral-200/90 rounded-lg p-2 sm:p-2.5 shadow-2xs">
                                                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                                                            Testing
                                                        </span>
                                                        <h4 className="text-[10px] sm:text-[10.5px] font-bold text-neutral-900 mt-0.5 leading-snug line-clamp-2">
                                                            Task Automation Webhook
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-[9px] text-neutral-400">
                                                            <span>Verifikasi</span>
                                                            <div className="size-4 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center">D</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 4: Completed */}
                                                <div className="hidden md:flex bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-2 sm:p-2.5 flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                                                            Completed <span className="text-blue-500 ml-1">4</span>
                                                        </span>
                                                        <MoreHorizontal className="size-3 text-neutral-400" />
                                                    </div>
                                                    {/* Card 1 */}
                                                    <div className="bg-white border border-neutral-200/90 rounded-lg p-2 sm:p-2.5 shadow-2xs">
                                                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                                                            Completed
                                                        </span>
                                                        <h4 className="text-[10px] sm:text-[10.5px] font-bold text-neutral-900 mt-0.5 leading-snug line-clamp-2">
                                                            Design System & Strict 3-Color Tokens
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-[9px] text-neutral-400">
                                                            <span className="flex items-center gap-1 text-blue-600 font-semibold">
                                                                <CheckCircle2 className="size-2.5 text-blue-600" /> Terverifikasi
                                                            </span>
                                                            <div className="size-4 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center">D</div>
                                                        </div>
                                                    </div>
                                                    {/* Card 2 */}
                                                    <div className="bg-white border border-neutral-200/90 rounded-lg p-2 sm:p-2.5 shadow-2xs">
                                                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800">
                                                            Repository
                                                        </span>
                                                        <h4 className="text-[10px] sm:text-[10.5px] font-bold text-neutral-900 mt-0.5 leading-snug line-clamp-2">
                                                            GitHub CI/CD & Deploy Rules
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-[9px] text-neutral-400">
                                                            <span className="text-blue-600 font-semibold">Tersinkron</span>
                                                            <div className="size-4 rounded-full bg-neutral-900 text-white text-[7px] font-bold flex items-center justify-center">B</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Status Ticker */}
                                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-400">
                                            <div className="flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
                                                <span>Living Proposal Sync: Real-time via WebSocket</span>
                                            </div>
                                            <span className="hidden sm:inline text-neutral-500 font-mono">v2.4.0-prod</span>
                                        </div>
                                    </main>
                                </div>
{/* LAPTOP CHIN & UNIBODY ALUMINUM BASE (Matching Image 2 Reference) */}
                                    {/* Display Bottom Chin Bezel */}
                                    <div className="relative w-full h-2.5 sm:h-3 bg-[#0a0a0e] border-t border-black/40 flex items-center justify-center z-20">
                                        <div className="w-16 sm:w-20 h-0.5 bg-neutral-700/30 rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* RECESSED CENTER HINGE ASSEMBLY */}
                            <div className="relative w-full h-2 sm:h-2.5 bg-[#0d0e13] flex items-center justify-center z-10 border-t border-black/80">
                                <div className="w-44 sm:w-56 md:w-64 h-1.5 bg-[#050507] rounded-full shadow-inner border-x border-white/5" />
                            </div>

                            {/* 3D UNIBODY ALUMINUM BASE CHASSIS (Extends wider than screen, with horizon deck & CNC thumb scoop) */}
                            <div className="relative w-[104%] sm:w-[105%] md:w-[105.5%] -ml-[2%] sm:-ml-[2.5%] md:-ml-[2.75%] z-20">
                                {/* Base Deck Horizon Surface (Aluminum top plane catching light) */}
                                <div className="w-full h-2 sm:h-2.5 bg-gradient-to-b from-[#2e303c] via-[#20212a] to-[#15161d] border-t border-white/25 flex items-center justify-between px-6 sm:px-10">
                                    <div className="w-12 sm:w-16 h-[1px] bg-black/40 rounded-full" />
                                    <div className="w-32 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
                                    <div className="w-12 sm:w-16 h-[1px] bg-black/40 rounded-full" />
                                </div>

                                {/* Front Chamfer Highlight Line */}
                                <div className="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/45 to-white/10" />

                                {/* Front Lip / Chin (Sleek anodized aluminum front profile) */}
                                <div className="w-full h-3.5 sm:h-4.5 md:h-5 bg-gradient-to-b from-[#282a35] via-[#1a1b23] to-[#0c0d12] rounded-b-xl sm:rounded-b-2xl border-b border-black/80 shadow-[0_12px_28px_-4px_rgba(0,0,0,0.45)] relative flex items-start justify-center">
                                    {/* CNC-Machined Thumb Opening Notch */}
                                    <div className="w-24 sm:w-32 md:w-36 h-1 sm:h-1.5 bg-[#050507] rounded-b-lg shadow-inner border-t border-white/20" />

                                    {/* Left & Right Base Feet Peeking Underneath */}
                                    <div className="absolute -bottom-1 left-[8%] sm:left-[10%] w-12 sm:w-16 h-1 bg-[#060608] rounded-b-sm shadow-xs" />
                                    <div className="absolute -bottom-1 right-[8%] sm:right-[10%] w-12 sm:w-16 h-1 bg-[#060608] rounded-b-sm shadow-xs" />
                                </div>
                            </div>

                            {/* Realistic 3D Ground & Ambient Occlusion Shadows */}
                            <div className="relative w-full select-none pointer-events-none">
                                {/* Tight Contact Shadow right under the aluminum base */}
                                <div className="w-[98%] sm:w-[99%] h-2.5 sm:h-3.5 bg-black/45 blur-xs rounded-full mx-auto -mt-1" />
                                {/* Mid-range Ambient Shadow */}
                                <div className="w-[92%] sm:w-[94%] h-6 sm:h-8 bg-black/30 blur-md rounded-full mx-auto -mt-2" />
                                {/* Soft Floor Diffuse Shadow */}
                                <div className="w-[82%] sm:w-[85%] h-12 sm:h-16 bg-black/15 blur-2xl rounded-full mx-auto -mt-5" />
                                {/* Subtle Blue Display Floor Glow */}
                                <div className="w-[60%] h-8 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.18)_0%,transparent_70%)] rounded-full mx-auto -mt-8" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Realistic 3D Smartphone (iPhone 16 Pro Flagship) with Google Chrome Mobile */}
                    <div 
                        ref={phoneShowcaseRef}
                        className="absolute bottom-2 xs:bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 right-1 xs:right-2 sm:right-4 md:right-6 lg:right-8 z-30 select-none transform-gpu will-change-transform [backface-visibility:hidden]"
                    >
                        <div 
                            ref={phoneCardRef}
                            className="w-[145px] xs:w-[175px] sm:w-[210px] md:w-[225px] lg:w-[235px] h-[300px] xs:h-[360px] sm:h-[430px] md:h-[460px] lg:h-[480px] select-none rounded-[24px] xs:rounded-[30px] sm:rounded-[36px] md:rounded-[40px] transform-gpu will-change-transform"
                            style={{
                                transform: 'perspective(1800px) rotateX(1.5deg) rotateY(0deg) translateZ(20px)',
                                boxShadow: '-18px 25px 60px rgba(0,0,0,0.5), 0 10px 25px rgba(0,0,0,0.3)',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            {/* Phone Body Frame */}
                            <div className="relative bg-[#fafafa] border-[4px] xs:border-[6px] sm:border-[7px] md:border-[8px] border-[#181920] rounded-[24px] xs:rounded-[30px] sm:rounded-[36px] md:rounded-[40px] ring-1 ring-white/15 overflow-hidden w-full h-full flex flex-col justify-between">
                                
                                {/* Glass Specular Reflection Highlight */}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.07] z-20" />

                                {/* Phone Screen Light Sheen Sweep */}
                                <div 
                                    ref={phoneSheenRef}
                                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent z-25 will-change-transform opacity-0"
                                />

                                {/* Dynamic Island & Phone Status Bar */}
                                <div className="relative pt-1 sm:pt-2 pb-1 bg-white flex items-center justify-between px-2.5 sm:px-4 z-10 border-b border-neutral-100 shrink-0">
                                    <span className="text-[7.5px] sm:text-[9.5px] font-bold text-neutral-900 font-mono">09:41</span>
                                    {/* Dynamic Island Pill */}
                                    <div className="w-10 xs:w-12 sm:w-16 h-2.5 sm:h-3.5 bg-black rounded-full flex items-center justify-between px-1.5 sm:px-2 shadow-inner">
                                        <div className="size-1 rounded-full bg-[#181822]" />
                                        <div className="size-0.5 rounded-full bg-blue-500/80" />
                                    </div>
                                    <div className="flex items-center gap-1 text-neutral-900">
                                        <Wifi className="size-2 sm:size-2.5" />
                                        <Battery className="size-2.5 sm:size-3" />
                                    </div>
                                </div>

                                {/* GOOGLE CHROME MOBILE TOP BAR */}
                                <div className="bg-[#f8f9fa] border-b border-neutral-200/90 px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 z-10 relative select-none shrink-0">
                                    {/* Chrome Mobile Omnibox Pill */}
                                    <div className="flex-1 bg-white border border-neutral-200 rounded-full px-2 py-0.5 flex items-center justify-between text-[7.5px] sm:text-[8px] shadow-2xs">
                                        <div className="flex items-center gap-1 truncate">
                                            <span className="size-1 rounded-full bg-blue-600 shrink-0" />
                                            <span className="text-neutral-400 font-mono">m.</span>
                                            <span className="text-neutral-900 font-bold font-mono">rakitcampus.id</span>
                                        </div>
                                        <span className="text-[7px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200/60">
                                            SSL
                                        </span>
                                    </div>

                                    {/* Chrome Open Tabs Badge [3] */}
                                    <div className="size-3.5 sm:size-4 rounded-[3px] border border-neutral-800 flex items-center justify-center text-[7px] sm:text-[7.5px] font-bold text-neutral-900 font-mono shrink-0">
                                        3
                                    </div>

                                    {/* Chrome 3 Dots Menu */}
                                    <MoreVertical className="size-3 text-neutral-800 shrink-0 cursor-pointer" />
                                </div>

                                {/* PHONE SCREEN CONTENT: RAKIT CAMPUS RESPONSIVE MOBILE WEB */}
                                <div className="bg-[#fafafa] p-2 sm:p-2.5 text-left font-sans flex-1 min-h-0 flex flex-col justify-between relative z-10">
                                    <div className="space-y-1.5">
                                        {/* Mobile Web Header */}
                                        <div className="flex items-center justify-between pb-1 border-b border-neutral-200/60">
                                            <div className="flex items-center gap-1.5">
                                                <div className="size-4.5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                                                    <Rocket className="size-2.5" />
                                                </div>
                                                <span className="text-[10px] font-black text-neutral-900 tracking-tight">RAKIT</span>
                                            </div>
                                            <span className="text-[7.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200/70">
                                                Polindra Hub
                                            </span>
                                        </div>

                                        {/* Mobile Card 1: Active Sprint Progress */}
                                        <div className="p-1.5 sm:p-2 bg-white rounded-lg border border-neutral-200/90 shadow-2xs">
                                            <div className="flex items-center justify-between text-[8px] font-bold text-neutral-900">
                                                <span>Sprint Polindra 2026</span>
                                                <span className="text-blue-600">78%</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 h-1 rounded-full mt-1 overflow-hidden">
                                                <div className="bg-blue-600 h-full rounded-full w-[78%]" />
                                            </div>
                                            <div className="flex items-center justify-between mt-1 text-[7px] text-neutral-500">
                                                <span>14 Hari Tersisa</span>
                                                <span className="text-neutral-900 font-semibold">18/22 Tasks</span>
                                            </div>
                                        </div>

                                        {/* Mobile Card 2: AI Matchmaking Candidate */}
                                        <div className="p-1.5 sm:p-2 bg-white rounded-lg border border-neutral-200/90 shadow-2xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[7px] font-bold uppercase text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200/70">
                                                    + 98% MATCH
                                                </span>
                                                <span className="text-[7px] text-neutral-400">Mobile Dev</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="size-5 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center shrink-0">BS</div>
                                                <div className="min-w-0">
                                                    <h5 className="text-[9px] font-bold text-neutral-900 leading-tight truncate">Budi Santoso</h5>
                                                    <p className="text-[7px] text-neutral-500 truncate">Flutter & IoT Specialist</p>
                                                </div>
                                            </div>
                                            <div className="mt-1 pt-1 border-t border-neutral-100 flex items-center justify-between">
                                                <div className="flex gap-1 text-[6.5px] text-neutral-600">
                                                    <span className="px-1 py-0.2 bg-neutral-100 rounded">Flutter</span>
                                                    <span className="px-1 py-0.2 bg-neutral-100 rounded">MQTT</span>
                                                </div>
                                                <span className="text-[7.5px] font-bold text-blue-600 hover:underline cursor-pointer">Undang</span>
                                            </div>
                                        </div>

                                        {/* Mobile Card 3: Gemastik Milestone */}
                                        <div className="p-1.5 bg-neutral-50 rounded-lg border border-neutral-200/80 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Trophy className="size-3 text-blue-600 shrink-0" />
                                                <div>
                                                    <div className="text-[8px] font-bold text-neutral-900">Gemastik 2026</div>
                                                    <div className="text-[6.5px] text-neutral-400">Babak Finalis IoT</div>
                                                </div>
                                            </div>
                                            <span className="text-[7px] font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-neutral-200">
                                                H-14
                                            </span>
                                        </div>
                                    </div>

                                    {/* GOOGLE CHROME MOBILE BOTTOM TOOLBAR (Always fully visible inside phone) */}
                                    <div className="pt-1.5 border-t border-neutral-200/80 bg-white -mx-2 -mb-2 sm:-mx-2.5 sm:-mb-2.5 px-2.5 pb-1.5 mt-1 shrink-0">
                                        <div className="flex items-center justify-around text-neutral-600 text-[9px]">
                                            <ArrowLeft className="size-3 text-neutral-400" />
                                            <ArrowRight className="size-3 text-neutral-400" />
                                            <div className="size-4.5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                                                <Plus className="size-2.5" />
                                            </div>
                                            <div className="size-3 rounded-[2px] border border-neutral-700 flex items-center justify-center text-[6.5px] font-bold font-mono">
                                                3
                                            </div>
                                            <MoreVertical className="size-2.5 text-neutral-700" />
                                        </div>
                                        {/* Home Indicator */}
                                        <div className="w-16 sm:w-20 h-0.5 bg-neutral-900/80 rounded-full mx-auto mt-1.5 mb-0.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

            {/* 3. Dual-Row Animated Photo Marquee (Top moves Left, Bottom moves Right) */}
            <section className="py-6 sm:py-8 bg-white border-b border-neutral-100 overflow-hidden relative select-none">
                {/* Marquee Tracks Container */}
                <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
                    {/* Row 1: Moving to LEFT */}
                    <div className="relative w-full overflow-hidden">
                        <div className="animate-marquee-left flex items-center gap-2.5 sm:gap-4 will-change-transform">
                            {[...photoRowTop, ...photoRowTop].map((item, idx) => (
                                <div
                                    key={`top-${idx}`}
                                    className="relative w-[220px] xs:w-[260px] sm:w-[340px] md:w-[380px] h-[145px] xs:h-[170px] sm:h-[210px] md:h-[230px] overflow-hidden group shrink-0 select-none bg-neutral-100"
                                >
                                    <img
                                        src={item.src}
                                        alt={item.title}
                                        title={item.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                    {/* Bottom Text Overlay: Title & Category (No Badge) */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-2.5 sm:p-4.5 text-white pointer-events-none">
                                        <h3 className="font-bold text-xs sm:text-sm md:text-[15px] text-white tracking-tight leading-snug line-clamp-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                                            {item.title}
                                        </h3>
                                        <p className="text-[9.5px] sm:text-[11.5px] text-neutral-300 font-medium mt-0.5 line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                                            {item.category}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Row 2: Moving to RIGHT */}
                    <div className="relative w-full overflow-hidden">
                        <div className="animate-marquee-right flex items-center gap-2.5 sm:gap-4 will-change-transform">
                            {[...photoRowBottom, ...photoRowBottom].map((item, idx) => (
                                <div
                                    key={`bottom-${idx}`}
                                    className="relative w-[220px] xs:w-[260px] sm:w-[340px] md:w-[380px] h-[145px] xs:h-[170px] sm:h-[210px] md:h-[230px] overflow-hidden group shrink-0 select-none bg-neutral-100"
                                >
                                    <img
                                        src={item.src}
                                        alt={item.title}
                                        title={item.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                    {/* Bottom Text Overlay: Title & Category (No Badge) */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-2.5 sm:p-4.5 text-white pointer-events-none">
                                        <h3 className="font-bold text-xs sm:text-sm md:text-[15px] text-white tracking-tight leading-snug line-clamp-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                                            {item.title}
                                        </h3>
                                        <p className="text-[9.5px] sm:text-[11.5px] text-neutral-300 font-medium mt-0.5 line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                                            {item.category}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Section Fitur: GSAP Pinned 5-Scene Sequence (1 Judul SOLUSI KAMI + 4 Fitur Utama, Styling Referensi ADDICT) */}
            <section
                ref={section4PinRef}
                id="features"
                className="relative w-full h-screen min-h-screen bg-[#141416] text-white overflow-hidden select-none border-t border-neutral-900"
            >
                {/* Ambient Background Polygonal Wireframe Lines (ADDICT style - appears on Slides 1-4) */}
                <svg
                    ref={wireframeRef}
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-0 invisible z-0"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line x1="8%" y1="0%" x2="42%" y2="48%" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="42%" y1="48%" x2="88%" y2="16%" stroke="#2563EB" strokeWidth="1" />
                    <line x1="88%" y1="16%" x2="94%" y2="82%" stroke="#2563EB" strokeWidth="1" />
                    <line x1="42%" y1="48%" x2="16%" y2="86%" stroke="#2563EB" strokeWidth="1" />
                    <line x1="16%" y1="86%" x2="75%" y2="80%" stroke="#2563EB" strokeWidth="1" />
                    <line x1="75%" y1="80%" x2="94%" y2="82%" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="42%" cy="48%" r="3.5" fill="#2563EB" />
                    <circle cx="88%" cy="16%" r="3" fill="#2563EB" />
                    <circle cx="16%" cy="86%" r="3" fill="#2563EB" />
                    <circle cx="75%" cy="80%" r="3" fill="#2563EB" />
                </svg>

                {/* Subtle Radial Glow */}
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Dynamic Morphing Octagram Wireframe (ADDICT style geometric formation) */}
                <div
                    ref={octagramContainerRef}
                    className="absolute inset-0 w-full h-full pointer-events-none z-5 overflow-hidden"
                >
                    {/* SVG Shared Defs (Gradients) */}
                    <svg className="absolute w-0 h-0 pointer-events-none">
                        <defs>
                            {/* Dual-Tone White to Blue Gradients */}
                            <linearGradient id="whiteToBlue1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" />
                                <stop offset="35%" stopColor="#93C5FD" />
                                <stop offset="70%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#1D4ED8" />
                            </linearGradient>
                            <linearGradient id="whiteToBlue2" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" />
                                <stop offset="35%" stopColor="#BFDBFE" />
                                <stop offset="70%" stopColor="#2563EB" />
                                <stop offset="100%" stopColor="#1E40AF" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Shape 1: First Geometric Square (Starts from Far Left Edge / Ujung Kiri - Mathematically Mirrored for Symmetrical Drawing) */}
                    <div
                        ref={octagramShape1Ref}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform"
                    >
                        <svg
                            viewBox="-500 -500 1000 1000"
                            className="w-[92vw] h-[92vw] sm:w-[96vh] sm:h-[96vh] md:w-[110vh] md:h-[110vh] lg:w-[122vh] lg:h-[122vh] xl:w-[128vh] xl:h-[128vh] max-w-[1500px] max-h-[1500px] aspect-square overflow-visible"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                ref={octagramLine1Ref}
                                d="M -350,350 L -350,-350 L 350,-350 L 350,350 Z"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth="1.4"
                                strokeDasharray="2800"
                                strokeDashoffset="2800"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    {/* Shape 2: Second Geometric Square (Starts from Far Right Edge / Ujung Kanan) */}
                    <div
                        ref={octagramShape2Ref}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform"
                    >
                        <svg
                            viewBox="-500 -500 1000 1000"
                            className="w-[92vw] h-[92vw] sm:w-[96vh] sm:h-[96vh] md:w-[110vh] md:h-[110vh] lg:w-[122vh] lg:h-[122vh] xl:w-[128vh] xl:h-[128vh] max-w-[1500px] max-h-[1500px] aspect-square overflow-visible"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                ref={octagramLine2Ref}
                                d="M 350,-350 L -350,-350 L -350,350 L 350,350 Z"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth="1.4"
                                strokeDasharray="2800"
                                strokeDashoffset="2800"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* SCENE 0: JUDUL SECTION (SOLUSI KAMI - Referensi Image 1)     */}
                {/* ============================================================ */}
                <div
                    ref={slide0Ref}
                    className="absolute inset-0 w-full h-full flex items-center px-4 sm:px-6 lg:px-8 z-10"
                >
                    <div className="max-w-6xl xl:max-w-7xl mx-auto w-full text-left">
                        <h2 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif tracking-tight text-white uppercase leading-[1.05]">
                            SOLUSI KAMI
                        </h2>
                        <p className="mt-2.5 sm:mt-4 text-base xs:text-lg sm:text-2xl md:text-3xl text-neutral-300 font-serif max-w-2xl leading-relaxed">
                            Empat pilar akselerasi inovasi, Living Proposal & kolaborasi kompetisi mahasiswa
                        </p>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* SCENE 1: FITUR 01 / 04 - FAIR AI MATCHMAKING (Ref Image 2)    */}
                {/* Layout: Text Kiri, Foto Kanan, Angka 01 di Kiri Bawah        */}
                {/* ============================================================ */}
                <div
                    ref={slide1Ref}
                    className="absolute inset-0 w-full h-full flex items-center px-3.5 sm:px-6 lg:px-8 z-10"
                >
                    <div className="max-w-6xl xl:max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-20 xl:gap-24 items-center">
                        {/* Text Left Column */}
                        <div ref={slide1TextRef} className="flex flex-col justify-between text-left will-change-transform">
                            <div>
                                <h3 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-white uppercase leading-[1.08]">
                                    FAIR AI<br />MATCHMAKING
                                </h3>
                                <p className="mt-2 sm:mt-4 md:mt-6 text-xs xs:text-sm sm:text-lg md:text-xl lg:text-[22px] text-neutral-200 font-serif leading-snug sm:leading-relaxed">
                                    Pencocokan talenta cerdas berdasarkan portofolio dan peran yang saling melengkapi.
                                </p>
                                <div className="mt-2.5 sm:mt-5 space-y-2 sm:space-y-4 text-xs xs:text-sm sm:text-base md:text-[16.5px] lg:text-[17px] text-neutral-300 leading-relaxed font-sans max-w-xl text-left sm:text-justify">
                                    <p>
                                        Membangun tim proyek atau kompetisi di kampus kini tidak lagi terkendala lingkaran pertemanan sempit atau ketimpangan peran teknis.
                                    </p>
                                    <p className="hidden xs:block">
                                        Algoritma cerdas kami menganalisis keahlian teknis (IoT, Mobile, Web, AI), riwayat proyek, dan komitmen waktu mahasiswa untuk merekomendasikan komposisi tim paling ideal dan berimbang.
                                    </p>
                                </div>
                            </div>

                            {/* Colossal Number 01 / 04 at Bottom-Left */}
                            <div className="mt-3 sm:mt-8 flex items-baseline justify-start gap-1.5 font-['Playfair_Display',Georgia,serif] select-none">
                                <span className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl text-white font-normal leading-none tracking-tighter">01</span>
                                <span className="text-[10px] sm:text-sm font-sans tracking-widest text-neutral-400">/ 04</span>
                            </div>
                        </div>

                        {/* Photo Right Column */}
                        <div className="w-full flex justify-center lg:justify-end">
                            <div
                                ref={slide1ImageRef}
                                className="relative w-full max-w-[280px] xs:max-w-sm sm:max-w-lg lg:max-w-xl overflow-hidden border border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/10 will-change-transform"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80"
                                    alt="Fair AI Matchmaking Tim Mahasiswa"
                                    className="w-full aspect-[16/9] sm:aspect-[16/10] object-cover max-h-[140px] xs:max-h-[180px] sm:max-h-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* SCENE 2: FITUR 02 / 04 - LIVING PROPOSAL (Ref Image 3 - Mirrored) */}
                {/* Layout: Foto Kiri, Text Kanan, Angka 02 di Kanan Bawah       */}
                {/* ============================================================ */}
                <div
                    ref={slide2Ref}
                    className="absolute inset-0 w-full h-full flex items-center px-3.5 sm:px-6 lg:px-8 z-10"
                >
                    <div className="max-w-6xl xl:max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-20 xl:gap-24 items-center">
                        {/* Photo Left Column */}
                        <div className="order-2 lg:order-1 w-full flex justify-center lg:justify-start">
                            <div
                                ref={slide2ImageRef}
                                className="relative w-full max-w-[280px] xs:max-w-sm sm:max-w-lg lg:max-w-xl overflow-hidden border border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/10 will-change-transform"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80"
                                    alt="Living Proposal Kolaborasi Real-time"
                                    className="w-full aspect-[16/9] sm:aspect-[16/10] object-cover max-h-[140px] xs:max-h-[180px] sm:max-h-none"
                                />
                            </div>
                        </div>

                        {/* Text Right Column */}
                        <div ref={slide2TextRef} className="order-1 lg:order-2 flex flex-col justify-between text-left will-change-transform">
                            <div>
                                <h3 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-white uppercase leading-[1.08]">
                                    LIVING<br />PROPOSAL
                                </h3>
                                <p className="mt-2 sm:mt-4 md:mt-6 text-xs xs:text-sm sm:text-lg md:text-xl lg:text-[22px] text-neutral-200 font-serif leading-snug sm:leading-relaxed">
                                    Dokumen proposal interaktif yang tersinkronisasi real-time dengan dosen pembimbing.
                                </p>
                                <div className="mt-2.5 sm:mt-5 space-y-2 sm:space-y-4 text-xs xs:text-sm sm:text-base md:text-[16.5px] lg:text-[17px] text-neutral-300 leading-relaxed font-sans max-w-xl text-left sm:text-justify">
                                    <p>
                                        Proposal proyek bukan lagi berkas statis PDF yang tercecer di folder drive. Living Proposal adalah dokumen interaktif yang disusun bersama secara real-time.
                                    </p>
                                    <p className="hidden xs:block">
                                        Setiap revisi, umpan balik dosen pembimbing, serta matriks rubrik akademik Gemastik dan PKM diperbarui secara otomatis dan transparan antaranggota tim.
                                    </p>
                                </div>
                            </div>

                            {/* Colossal Number 02 / 04 at Bottom-Right (Aligned Right matching Reference Image) */}
                            <div className="mt-3 sm:mt-8 flex items-baseline justify-end gap-1.5 font-['Playfair_Display',Georgia,serif] select-none w-full">
                                <span className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl text-white font-normal leading-none tracking-tighter">02</span>
                                <span className="text-[10px] sm:text-sm font-sans tracking-widest text-neutral-400">/ 04</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* SCENE 3: FITUR 03 / 04 - TASK KANBAN BOARDS (Ref Image 2 Layout) */}
                {/* Layout: Text Kiri, Foto Kanan, Angka 03 di Kiri Bawah        */}
                {/* ============================================================ */}
                <div
                    ref={slide3Ref}
                    className="absolute inset-0 w-full h-full flex items-center px-3.5 sm:px-6 lg:px-8 z-10"
                >
                    <div className="max-w-6xl xl:max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-20 xl:gap-24 items-center">
                        {/* Text Left Column */}
                        <div ref={slide3TextRef} className="flex flex-col justify-between text-left will-change-transform">
                            <div>
                                <h3 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-white uppercase leading-[1.08]">
                                    TASK KANBAN<br />BOARDS
                                </h3>
                                <p className="mt-2 sm:mt-4 md:mt-6 text-xs xs:text-sm sm:text-lg md:text-xl lg:text-[22px] text-neutral-200 font-serif leading-snug sm:leading-relaxed">
                                    Manajemen sprint agile yang terhubung langsung dengan linimasa kompetisi.
                                </p>
                                <div className="mt-2.5 sm:mt-5 space-y-2 sm:space-y-4 text-xs xs:text-sm sm:text-base md:text-[16.5px] lg:text-[17px] text-neutral-300 leading-relaxed font-sans max-w-xl text-left sm:text-justify">
                                    <p>
                                        Mengubah ide besar menjadi eksekusi mingguan yang terukur. Papan Kanban visual di RAKIT dirancang khusus untuk ritme kerja mahasiswa.
                                    </p>
                                    <p className="hidden xs:block">
                                        Membagi milestone kompetisi seperti Gemastik dan Hackathon ke dalam sprint mingguan dengan pembagian beban kerja merata tanpa free-rider.
                                    </p>
                                </div>
                            </div>

                            {/* Colossal Number 03 / 04 at Bottom-Left */}
                            <div className="mt-3 sm:mt-8 flex items-baseline justify-start gap-1.5 font-['Playfair_Display',Georgia,serif] select-none">
                                <span className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl text-white font-normal leading-none tracking-tighter">03</span>
                                <span className="text-[10px] sm:text-sm font-sans tracking-widest text-neutral-400">/ 04</span>
                            </div>
                        </div>

                        {/* Photo Right Column */}
                        <div className="w-full flex justify-center lg:justify-end">
                            <div
                                ref={slide3ImageRef}
                                className="relative w-full max-w-[280px] xs:max-w-sm sm:max-w-lg lg:max-w-xl overflow-hidden border border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/10 will-change-transform"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80"
                                    alt="Task Kanban Boards Sprint Agile"
                                    className="w-full aspect-[16/9] sm:aspect-[16/10] object-cover max-h-[140px] xs:max-h-[180px] sm:max-h-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* SCENE 4: FITUR 04 / 04 - PORTOFOLIO TERVALIDASI (Ref Image 3 Mirrored) */}
                {/* Layout: Foto Kiri, Text Kanan, Angka 04 di Kanan Bawah       */}
                {/* ============================================================ */}
                <div
                    ref={slide4Ref}
                    className="absolute inset-0 w-full h-full flex items-center px-3.5 sm:px-6 lg:px-8 z-10"
                >
                    <div className="max-w-6xl xl:max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-20 xl:gap-24 items-center">
                        {/* Photo Left Column */}
                        <div className="order-2 lg:order-1 w-full flex justify-center lg:justify-start">
                            <div
                                ref={slide4ImageRef}
                                className="relative w-full max-w-[280px] xs:max-w-sm sm:max-w-lg lg:max-w-xl overflow-hidden border border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/10 will-change-transform"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                                    alt="Portofolio Capaian Prestasi Tervalidasi"
                                    className="w-full aspect-[16/9] sm:aspect-[16/10] object-cover max-h-[140px] xs:max-h-[180px] sm:max-h-none"
                                />
                            </div>
                        </div>

                        {/* Text Right Column */}
                        <div ref={slide4TextRef} className="order-1 lg:order-2 flex flex-col justify-between text-left will-change-transform">
                            <div>
                                <h3 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-white uppercase leading-[1.08]">
                                    PORTOFOLIO<br />TERVALIDASI
                                </h3>
                                <p className="mt-2 sm:mt-4 md:mt-6 text-xs xs:text-sm sm:text-lg md:text-xl lg:text-[22px] text-neutral-200 font-serif leading-snug sm:leading-relaxed">
                                    Rekam jejak capaian yang diakui resmi oleh program studi dan institusi.
                                </p>
                                <div className="mt-2.5 sm:mt-5 space-y-2 sm:space-y-4 text-xs xs:text-sm sm:text-base md:text-[16.5px] lg:text-[17px] text-neutral-300 leading-relaxed font-sans max-w-xl text-left sm:text-justify">
                                    <p>
                                        Hasil karya dan kerja keras mahasiswa tidak berhenti di ruang kelas atau kompetisi sesaat.
                                    </p>
                                    <p className="hidden xs:block">
                                        Setiap kontribusi tugas, keberhasilan sprint, dan capaian milestone tercatat permanen dalam rekam jejak digital mahasiswa, siap dikonversi ke nilai SKS mata kuliah proyek akademik.
                                    </p>
                                </div>
                            </div>

                            {/* Colossal Number 04 / 04 at Bottom-Right (Aligned Right matching Reference Image) */}
                            <div className="mt-3 sm:mt-8 flex items-baseline justify-end gap-1.5 font-['Playfair_Display',Georgia,serif] select-none w-full">
                                <span className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl text-white font-normal leading-none tracking-tighter">04</span>
                                <span className="text-[10px] sm:text-sm font-sans tracking-widest text-neutral-400">/ 04</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* SCENE 5: ANGKA (ADDICT Dark Editorial Stats - Referensi Gambar 2) */}
                {/* Tergabung dalam SATU SECTION (Section 4) setelah scroll Judul 04 */}
                {/* ============================================================ */}
                <div
                    ref={numbersSlideRef}
                    className="absolute inset-0 w-full h-full flex items-center px-4 sm:px-6 md:px-8 lg:px-10 z-10 pointer-events-none"
                >
                    <div className="max-w-6xl mx-auto w-full">
                        {/* Header: ANGKA (Editorial Serif Typography matching Image 2) */}
                        <div className="mb-4 sm:mb-10 lg:mb-16">
                            <h2
                                ref={numbersHeadingRef}
                                className="font-serif text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-white tracking-tight uppercase select-none will-change-transform"
                            >
                                ANGKA
                            </h2>
                        </div>

                        {/* 4 Stat Columns Grid matching Image 2 */}
                        <div
                            ref={numbersGridRef}
                            className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8 will-change-transform"
                        >
                            {/* Column 1: 95% */}
                            <div className="flex flex-col">
                                <div className="w-full h-px bg-white/20 mb-3 sm:mb-6 lg:mb-8" />
                                <div className="flex items-baseline gap-1.5 sm:gap-3">
                                    <span className="font-['Playfair_Display',Georgia,serif] [font-feature-settings:'lnum'_1,'pnum'_1] text-3xl xs:text-4xl sm:text-6xl lg:text-7xl text-white font-normal leading-none tracking-tight">
                                        <span ref={statNum1Ref}>95</span>%
                                    </span>
                                    <span className="text-[10px] sm:text-[13px] text-neutral-400 font-sans leading-tight">
                                        Tingkat<br />Akurasi
                                    </span>
                                </div>
                                <h3 className="mt-2.5 sm:mt-6 lg:mt-7 text-xs sm:text-base font-bold text-white tracking-wide truncate">
                                    Smart AI Matchmaking
                                </h3>
                                <p className="mt-1 sm:mt-2 text-[10px] sm:text-[13px] text-neutral-400 font-sans leading-relaxed line-clamp-2 sm:line-clamp-none">
                                    Tingkat akurasi kecocokan rekan tim berbasis analisis keahlian teknis dan komitmen waktu antar mahasiswa.
                                </p>
                            </div>

                            {/* Column 2: 3x */}
                            <div className="flex flex-col">
                                <div className="w-full h-px bg-white/20 mb-3 sm:mb-6 lg:mb-8" />
                                <div className="flex items-baseline gap-1.5 sm:gap-3">
                                    <span className="font-['Playfair_Display',Georgia,serif] [font-feature-settings:'lnum'_1,'pnum'_1] text-3xl xs:text-4xl sm:text-6xl lg:text-7xl text-white font-normal leading-none tracking-tight">
                                        <span ref={statNum2Ref}>3</span>x
                                    </span>
                                    <span className="text-[10px] sm:text-[13px] text-neutral-400 font-sans leading-tight">
                                        Lebih Cepat<br />Bentuk Tim
                                    </span>
                                </div>
                                <h3 className="mt-2.5 sm:mt-6 lg:mt-7 text-xs sm:text-base font-bold text-white tracking-wide truncate">
                                    Akselerasi Pembentukan Tim
                                </h3>
                                <p className="mt-1 sm:mt-2 text-[10px] sm:text-[13px] text-neutral-400 font-sans leading-relaxed line-clamp-2 sm:line-clamp-none">
                                    Rekrutmen talenta proyek & kompetisi tanpa hambatan batasan lingkaran pertemanan sempit.
                                </p>
                            </div>

                            {/* Column 3: 100% */}
                            <div className="flex flex-col">
                                <div className="w-full h-px bg-white/20 mb-3 sm:mb-6 lg:mb-8" />
                                <div className="flex items-baseline gap-1.5 sm:gap-3">
                                    <span className="font-['Playfair_Display',Georgia,serif] [font-feature-settings:'lnum'_1,'pnum'_1] text-3xl xs:text-4xl sm:text-6xl lg:text-7xl text-white font-normal leading-none tracking-tight">
                                        <span ref={statNum3Ref}>100</span>%
                                    </span>
                                    <span className="text-[10px] sm:text-[13px] text-neutral-400 font-sans leading-tight">
                                        Portofolio<br />Terverifikasi
                                    </span>
                                </div>
                                <h3 className="mt-2.5 sm:mt-6 lg:mt-7 text-xs sm:text-base font-bold text-white tracking-wide truncate">
                                    Living Proposal & Validasi
                                </h3>
                                <p className="mt-1 sm:mt-2 text-[10px] sm:text-[13px] text-neutral-400 font-sans leading-relaxed line-clamp-2 sm:line-clamp-none">
                                    Dokumen proposal interaktif dan matriks rubrik akademik terverifikasi resmi oleh dosen pembimbing.
                                </p>
                            </div>

                            {/* Column 4: 500+ */}
                            <div className="flex flex-col">
                                <div className="w-full h-px bg-white/20 mb-3 sm:mb-6 lg:mb-8" />
                                <div className="flex items-baseline gap-1.5 sm:gap-3">
                                    <span className="font-['Playfair_Display',Georgia,serif] [font-feature-settings:'lnum'_1,'pnum'_1] text-3xl xs:text-4xl sm:text-6xl lg:text-7xl text-white font-normal leading-none tracking-tight">
                                        <span ref={statNum4Ref}>500</span>+
                                    </span>
                                    <span className="text-[10px] sm:text-[13px] text-neutral-400 font-sans leading-tight">
                                        Mahasiswa<br />Kolaborator
                                    </span>
                                </div>
                                <h3 className="mt-2.5 sm:mt-6 lg:mt-7 text-xs sm:text-base font-bold text-white tracking-wide truncate">
                                    Rekam Jejak Terverifikasi
                                </h3>
                                <p className="mt-1 sm:mt-2 text-[10px] sm:text-[13px] text-neutral-400 font-sans leading-relaxed line-clamp-2 sm:line-clamp-none">
                                    Mahasiswa aktif dan calon kolaborator terverifikasi dalam ekosistem kampus.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Cara Kerja / Alur Kolaborasi (Editorial Style matching ADDICT Japan) */}
            <section id="workflow" ref={workflowSectionRef} className="relative w-full bg-[#fbfbfb] text-neutral-900 border-t border-neutral-200/80 select-none">
                <div ref={workflowPinRef} className="w-full h-screen relative overflow-hidden bg-[#fbfbfb]">
                    
                    {/* Top Header: "CARA KERJA" + "Layanan & Alur RAKIT" */}
                    <div ref={workflowHeaderRef} className="absolute top-0 left-0 right-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 lg:pt-8 pb-2 will-change-transform z-20 pointer-events-none">
                        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-neutral-900 tracking-tight uppercase">
                            CARA KERJA
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-neutral-500 font-sans tracking-wide">
                            Layanan & Alur RAKIT
                        </p>
                    </div>

                    {/* Main Content Stage: Left Text & Right Photo Reel */}
                    <div ref={workflowStageRef} className="w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-10 lg:gap-14 items-center relative z-10 will-change-transform pt-14 sm:pt-20 md:pt-0">
                        
                        {/* Left Column: Synchronized Step Texts */}
                        <div className="md:col-span-5 relative flex flex-col justify-center pr-0 md:pr-2 lg:pr-6 md:h-full min-h-0 shrink-0">
                            
                            {/* STEP 01 TEXT */}
                            <div ref={workflowStepText0Ref} className="w-full flex flex-col justify-center will-change-transform">
                                <div className="flex items-start gap-3 sm:gap-5">
                                    {/* Big Serif Number 01 / 03 */}
                                    <div className="flex items-baseline gap-1.5 font-serif shrink-0">
                                        <span className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-normal text-neutral-900 leading-none tracking-tight">
                                             01
                                        </span>
                                        <span className="text-[10px] sm:text-sm text-neutral-400 font-sans tracking-widest">
                                            / 03
                                        </span>
                                    </div>

                                    {/* Tag & Title with Diamond Accent */}
                                    <div className="flex flex-col pt-0.5 sm:pt-1">
                                        <span className="text-[9px] sm:text-xs font-sans tracking-[0.2em] uppercase text-neutral-400 font-medium mb-1">
                                            ONBOARDING CEPAT
                                        </span>
                                        <h3 className="font-serif text-base xs:text-lg sm:text-xl lg:text-2xl font-normal text-neutral-900 tracking-tight leading-snug">
                                            Simple And Fast <span className="inline-flex items-center whitespace-nowrap">Setup<span className="inline-block size-1.5 sm:size-2.5 bg-blue-600 rotate-45 ml-1.5 -translate-y-px shrink-0" /></span>
                                        </h3>
                                    </div>
                                </div>

                                {/* Description Paragraph */}
                                <p className="mt-2.5 sm:mt-5 text-xs xs:text-sm lg:text-base text-neutral-600 font-sans leading-relaxed max-w-md">
                                    Daftar menggunakan akun kampus Polindra, pilih bidang keahlian, dan tentukan jam ketersediaan mingguan untuk langsung terhubung dengan ekosistem riset kampus.
                                </p>
                            </div>

                            {/* STEP 02 TEXT */}
                            <div ref={workflowStepText1Ref} style={{ opacity: 0, visibility: 'hidden' }} className="w-full absolute inset-0 flex flex-col justify-center will-change-transform pointer-events-none">
                                <div className="flex items-start gap-3 sm:gap-5">
                                    {/* Big Serif Number 02 / 03 */}
                                    <div className="flex items-baseline gap-1.5 font-serif shrink-0">
                                        <span className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-normal text-neutral-900 leading-none tracking-tight">
                                            02
                                        </span>
                                        <span className="text-[10px] sm:text-sm text-neutral-400 font-sans tracking-widest">
                                            / 03
                                        </span>
                                    </div>

                                    {/* Tag & Title with Diamond Accent */}
                                    <div className="flex flex-col pt-0.5 sm:pt-1">
                                        <span className="text-[9px] sm:text-xs font-sans tracking-[0.2em] uppercase text-neutral-400 font-medium mb-1">
                                            SMART AI MATCHMAKING
                                        </span>
                                        <h3 className="font-serif text-base xs:text-lg sm:text-xl lg:text-2xl font-normal text-neutral-900 tracking-tight leading-snug">
                                            Work Together <span className="inline-flex items-center whitespace-nowrap">Effortlessly<span className="inline-block size-1.5 sm:size-2.5 bg-blue-600 rotate-45 ml-1.5 -translate-y-px shrink-0" /></span>
                                        </h3>
                                    </div>
                                </div>

                                {/* Description Paragraph */}
                                <p className="mt-2.5 sm:mt-5 text-xs xs:text-sm lg:text-base text-neutral-600 font-sans leading-relaxed max-w-md">
                                    Temukan kolaborator ideal lewat analisis algoritma cerdas berbasis keahlian teknis (IoT, AI, Mobile, Web) atau bentuk tim baru untuk kompetisi hackathon nasional.
                                </p>
                            </div>

                            {/* STEP 03 TEXT */}
                            <div ref={workflowStepText2Ref} style={{ opacity: 0, visibility: 'hidden' }} className="w-full absolute inset-0 flex flex-col justify-center will-change-transform pointer-events-none">
                                <div className="flex items-start gap-3 sm:gap-5">
                                    {/* Big Serif Number 03 / 03 */}
                                    <div className="flex items-baseline gap-1.5 font-serif shrink-0">
                                        <span className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-normal text-neutral-900 leading-none tracking-tight">
                                            03
                                        </span>
                                        <span className="text-[10px] sm:text-sm text-neutral-400 font-sans tracking-widest">
                                            / 03
                                        </span>
                                    </div>

                                    {/* Tag & Title with Diamond Accent */}
                                    <div className="flex flex-col pt-0.5 sm:pt-1">
                                        <span className="text-[9px] sm:text-xs font-sans tracking-[0.2em] uppercase text-neutral-400 font-medium mb-1">
                                            LIVING PROPOSAL & SPRINT
                                        </span>
                                        <h3 className="font-serif text-base xs:text-lg sm:text-xl lg:text-2xl font-normal text-neutral-900 tracking-tight leading-snug">
                                            Monitor Your Progress & <span className="inline-flex items-center whitespace-nowrap">Achievements<span className="inline-block size-1.5 sm:size-2.5 bg-blue-600 rotate-45 ml-1.5 -translate-y-px shrink-0" /></span>
                                        </h3>
                                    </div>
                                </div>

                                {/* Description Paragraph */}
                                <p className="mt-2.5 sm:mt-5 text-xs xs:text-sm lg:text-base text-neutral-600 font-sans leading-relaxed max-w-md">
                                    Kelola milestone proyek dengan Kanban terintegrasi, sinkronisasi umpan balik dosen pembimbing secara real-time, dan validasi portofolio permanen untuk konversi SKS.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Full-Height Photo Reel Viewport (Mentok Atas Bawah!) */}
                        <div className="md:col-span-7 h-[220px] xs:h-[260px] sm:h-[340px] md:h-screen flex items-center justify-center relative min-h-0 w-full">
                            <div 
                                ref={workflowPhotoViewportRef} 
                                className="w-full h-full overflow-hidden relative"
                            >
                                {/* Sliding Track containing all 3 photos */}
                                <div 
                                    ref={workflowPhotoTrackRef} 
                                    className="w-full flex flex-col gap-6 sm:gap-8 lg:gap-10 will-change-transform"
                                >
                                    {/* PHOTO 01 */}
                                    <div 
                                        ref={workflowPhoto0Ref} 
                                        className="w-full aspect-[16/10] overflow-hidden bg-neutral-100 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] relative will-change-[filter,transform] rounded-md transition-shadow duration-500"
                                    >
                                        <img
                                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                                            alt="Simple And Fast Setup Onboarding"
                                            className="w-full h-full object-cover select-none pointer-events-none"
                                            loading="lazy"
                                            onLoad={() => ScrollTrigger.refresh()}
                                        />
                                    </div>

                                    {/* PHOTO 02 */}
                                    <div 
                                        ref={workflowPhoto1Ref} 
                                        style={{ filter: 'blur(14px)', opacity: 0.5 }}
                                        className="w-full aspect-[16/10] overflow-hidden bg-neutral-100 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] relative will-change-[filter,transform] rounded-md transition-shadow duration-500"
                                    >
                                        <img
                                            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"
                                            alt="Work Together Effortlessly Collaboration"
                                            className="w-full h-full object-cover select-none pointer-events-none"
                                            loading="lazy"
                                            onLoad={() => ScrollTrigger.refresh()}
                                        />
                                    </div>

                                    {/* PHOTO 03 */}
                                    <div 
                                        ref={workflowPhoto2Ref} 
                                        style={{ filter: 'blur(14px)', opacity: 0.5 }}
                                        className="w-full aspect-[16/10] overflow-hidden bg-neutral-100 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] relative will-change-[filter,transform] rounded-md transition-shadow duration-500"
                                    >
                                        <img
                                            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
                                            alt="Monitor Your Progress And Achievements"
                                            className="w-full h-full object-cover select-none pointer-events-none"
                                            loading="lazy"
                                            onLoad={() => ScrollTrigger.refresh()}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 8. Success Stories & Real Impact */}
            <section
                id="testimonials"
                ref={testimonialsSectionRef}
                className="py-14 sm:py-24 lg:py-28 bg-gradient-to-b from-[#fbfbfb] via-white to-[#fbfbfb] border-t border-neutral-200/80 relative overflow-hidden select-none"
            >
                {/* Subtle Ambient Background Mesh & Dynamic Orbs */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-50 pointer-events-none" />
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-400/8 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                    
                    {/* Header */}
                    <div ref={testimonialsHeaderRef} className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 will-change-transform">
                        <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight">
                            Real Results, Real Impact. <br />
                            Our Success Stories
                        </h2>
                        <p className="mt-3 sm:mt-4 text-xs xs:text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed">
                            Pengalaman nyata mahasiswa Polindra yang sukses membangun tim, memvalidasi proposal, dan menjuarai kompetisi nasional.
                        </p>
                    </div>

                    {/* 3 Interactive Floating Cards */}
                    <div ref={testimonialsCardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch will-change-transform">
                        
                        {/* Testimonial Card 1 */}
                        <div ref={testimonialCard1Ref} className="w-full flex will-change-transform">
                            <div className="group relative w-full bg-white/90 backdrop-blur-xs border border-neutral-200/90 hover:border-blue-400/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_22px_45px_-12px_rgba(37,99,235,0.18)] transition-all duration-500 ease-out hover:-translate-y-2 flex flex-col justify-between overflow-hidden cursor-default">
                                
                                {/* Ambient Corner Sheen Glow on Hover */}
                                <div className="pointer-events-none absolute -top-20 -right-20 size-40 bg-gradient-to-br from-amber-400/15 via-blue-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                
                                {/* Decorative Watermark Quote Icon */}
                                <Quote className="size-10 sm:size-12 text-neutral-100 group-hover:text-blue-100/70 absolute right-4 sm:right-5 top-4 sm:top-5 -rotate-12 transition-all duration-500 pointer-events-none" />

                                <div>
                                    {/* 5-Star Rating */}
                                    <div className="flex items-center gap-1 text-amber-400 mb-3 sm:mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="size-3.5 sm:size-4 fill-amber-400 group-hover:scale-110 transition-transform duration-300" style={{ transitionDelay: `${i * 35}ms` }} />
                                        ))}
                                    </div>

                                    {/* Testimonial Quote */}
                                    <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed italic relative z-10">
                                        "Lewat <span className="text-neutral-900 font-semibold underline decoration-blue-300/80 underline-offset-2">Smart Matching di RAKIT</span>, kami menemukan rekan tim mobile developer dalam waktu 2 hari. Tim kami lolos tahap final kompetisi inovasi!"
                                    </p>
                                </div>

                                {/* Author Profile Footer */}
                                <div className="mt-5 sm:mt-7 pt-3.5 sm:pt-4 border-t border-neutral-100 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 sm:size-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs group-hover:ring-4 group-hover:ring-purple-100 group-hover:scale-105 transition-all duration-300">
                                            B
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <h5 className="text-xs sm:text-[13px] font-bold text-neutral-900">Budi Santoso</h5>
                                                <CheckCircle2 className="size-3 text-blue-600 shrink-0" />
                                            </div>
                                            <span className="text-[9.5px] sm:text-[10px] text-neutral-400 font-sans block">Project Leader IoT • Polindra</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial Card 2 */}
                        <div ref={testimonialCard2Ref} className="w-full flex will-change-transform">
                            <div className="group relative w-full bg-white/90 backdrop-blur-xs border border-neutral-200/90 hover:border-blue-400/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_22px_45px_-12px_rgba(37,99,235,0.18)] transition-all duration-500 ease-out hover:-translate-y-2 flex flex-col justify-between overflow-hidden cursor-default">
                                
                                {/* Ambient Corner Sheen Glow on Hover */}
                                <div className="pointer-events-none absolute -top-20 -right-20 size-40 bg-gradient-to-br from-blue-400/15 via-cyan-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                
                                {/* Decorative Watermark Quote Icon */}
                                <Quote className="size-10 sm:size-12 text-neutral-100 group-hover:text-blue-100/70 absolute right-4 sm:right-5 top-4 sm:top-5 -rotate-12 transition-all duration-500 pointer-events-none" />

                                <div>
                                    {/* 5-Star Rating */}
                                    <div className="flex items-center gap-1 text-amber-400 mb-3 sm:mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="size-3.5 sm:size-4 fill-amber-400 group-hover:scale-110 transition-transform duration-300" style={{ transitionDelay: `${i * 35}ms` }} />
                                        ))}
                                    </div>

                                    {/* Testimonial Quote */}
                                    <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed italic relative z-10">
                                        "<span className="text-neutral-900 font-semibold underline decoration-blue-300/80 underline-offset-2">Kanban workspace-nya</span> sangat intuitif. Pembagian tugas dan pelacakan deadline hackathon jadi rapi dan transparan antar anggota tim."
                                    </p>
                                </div>

                                {/* Author Profile Footer */}
                                <div className="mt-5 sm:mt-7 pt-3.5 sm:pt-4 border-t border-neutral-100 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 sm:size-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs group-hover:ring-4 group-hover:ring-blue-100 group-hover:scale-105 transition-all duration-300">
                                            S
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <h5 className="text-xs sm:text-[13px] font-bold text-neutral-900">Siti Rahma</h5>
                                                <CheckCircle2 className="size-3 text-blue-600 shrink-0" />
                                            </div>
                                            <span className="text-[9.5px] sm:text-[10px] text-neutral-400 font-sans block">Mobile Flutter Dev • Polindra</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial Card 3 */}
                        <div ref={testimonialCard3Ref} className="w-full flex will-change-transform">
                            <div className="group relative w-full bg-white/90 backdrop-blur-xs border border-neutral-200/90 hover:border-blue-400/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_22px_45px_-12px_rgba(37,99,235,0.18)] transition-all duration-500 ease-out hover:-translate-y-2 flex flex-col justify-between overflow-hidden cursor-default">
                                
                                {/* Ambient Corner Sheen Glow on Hover */}
                                <div className="pointer-events-none absolute -top-20 -right-20 size-40 bg-gradient-to-br from-emerald-400/15 via-teal-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                
                                {/* Decorative Watermark Quote Icon */}
                                <Quote className="size-10 sm:size-12 text-neutral-100 group-hover:text-blue-100/70 absolute right-4 sm:right-5 top-4 sm:top-5 -rotate-12 transition-all duration-500 pointer-events-none" />

                                <div>
                                    {/* 5-Star Rating */}
                                    <div className="flex items-center gap-1 text-amber-400 mb-3 sm:mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="size-3.5 sm:size-4 fill-amber-400 group-hover:scale-110 transition-transform duration-300" style={{ transitionDelay: `${i * 35}ms` }} />
                                        ))}
                                    </div>

                                    {/* Testimonial Quote */}
                                    <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed italic relative z-10">
                                        "<span className="text-neutral-900 font-semibold underline decoration-blue-300/80 underline-offset-2">Portofolio publik otomatis</span> memudahkan saya melampirkan bukti kontribusi nyata saat mendaftar magang dan beasiswa."
                                    </p>
                                </div>

                                {/* Author Profile Footer */}
                                <div className="mt-5 sm:mt-7 pt-3.5 sm:pt-4 border-t border-neutral-100 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 sm:size-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs group-hover:ring-4 group-hover:ring-emerald-100 group-hover:scale-105 transition-all duration-300">
                                            A
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <h5 className="text-xs sm:text-[13px] font-bold text-neutral-900">Agus Prasetyo</h5>
                                                <CheckCircle2 className="size-3 text-blue-600 shrink-0" />
                                            </div>
                                            <span className="text-[9.5px] sm:text-[10px] text-neutral-400 font-sans block">Backend Engineer • Polindra</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 9. Saran & Masukan Sistem */}
            <section 
                ref={ctaSectionRef} 
                id="feedback"
                className="py-12 sm:py-20 lg:py-24 relative bg-slate-50 border-t border-slate-200/80"
            >
                <div className="max-w-3xl mx-auto px-3.5 sm:px-6 relative z-10">
                    <div 
                        ref={ctaCardRef} 
                        className="bg-white rounded-2xl p-4 sm:p-8 md:p-10 border border-slate-200/80 shadow-xs"
                    >
                        <div ref={ctaContentRef}>
                            {/* Header */}
                            <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
                                <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                    Saran & Masukan Sistem
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                                    Bantu kami mengembangkan RAKIT Campus menjadi platform kolaborasi yang lebih baik. Kami menerima aspirasi fitur, laporan kendala, atau masukan desain dari Anda.
                                </p>
                            </div>

                            {feedbackSubmitted ? (
                                <div className="py-8 text-center flex flex-col items-center">
                                    <div className="size-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
                                        <CheckCircle2 className="size-6" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Terima Kasih atas Masukan Anda!
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
                                        Saran dan masukan Anda telah berhasil tersimpan ke sistem kami. Tim pengembang akan meninjau setiap masukan untuk penyempurnaan berkala.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFeedbackSubmitted(false);
                                            setFeedbackMessage('');
                                            setFeedbackRating(null);
                                        }}
                                        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                                    >
                                        <span>Kirim Masukan Lain</span>
                                        <Plus className="size-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                    {/* Kategori Masukan */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                            Kategori Masukan
                                        </label>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {[
                                                { id: 'saran_fitur', label: 'Saran Fitur Baru' },
                                                { id: 'antarmuka_ui', label: 'Desain & Tampilan' },
                                                { id: 'kendala_bug', label: 'Laporan Kendala / Bug' },
                                                { id: 'performa', label: 'Kecepatan & Performa' },
                                                { id: 'lainnya', label: 'Lainnya' },
                                            ].map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setFeedbackCategory(cat.id)}
                                                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs transition cursor-pointer ${
                                                        feedbackCategory === cat.id
                                                            ? 'bg-blue-50 border border-blue-600 text-blue-700 font-semibold shadow-2xs'
                                                            : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                                                    }`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Nama & Email */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                                Nama Lengkap <span className="text-slate-400 font-normal">(Opsional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={feedbackName}
                                                onChange={(e) => setFeedbackName(e.target.value)}
                                                placeholder={auth?.user?.name || "Nama Anda"}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                                Email Kontak <span className="text-slate-400 font-normal">(Opsional)</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={feedbackEmail}
                                                onChange={(e) => setFeedbackEmail(e.target.value)}
                                                placeholder={auth?.user?.email || "email@kampus.ac.id"}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Rating Pengalaman */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                            Penilaian Kepuasan Sistem <span className="text-slate-400 font-normal">(Opsional)</span>
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setFeedbackRating(feedbackRating === star ? null : star)}
                                                    className="p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer text-slate-300 hover:text-amber-400"
                                                    title={`${star} dari 5 bintang`}
                                                >
                                                    <Star
                                                        className={`size-4 transition ${
                                                            (feedbackRating ?? 0) >= star
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-slate-300'
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                            {feedbackRating && (
                                                <span className="text-[11px] font-semibold text-slate-600 ml-1.5">
                                                    {feedbackRating} / 5 Bintang
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pesan Masukan */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-medium text-slate-700">
                                                Detail Saran & Masukan <span className="text-rose-500">*</span>
                                            </label>
                                            <span className="text-[10px] text-slate-400">
                                                {feedbackMessage.length}/2000
                                            </span>
                                        </div>
                                        <textarea
                                            rows={4}
                                            required
                                            value={feedbackMessage}
                                            onChange={(e) => setFeedbackMessage(e.target.value)}
                                            placeholder="Tuliskan pengalaman Anda menggunakan sistem, fitur baru yang Anda butuhkan, atau kendala spesifik yang ditemukan..."
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition resize-none leading-relaxed"
                                        />
                                        {feedbackError && (
                                            <p className="text-xs text-rose-600 mt-1 font-medium">{feedbackError}</p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                                        <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                                            Setiap masukan ditinjau langsung oleh tim pengembang RAKIT Campus.
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={submittingFeedback || feedbackMessage.trim().length < 5}
                                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 w-full sm:w-auto"
                                        >
                                            {submittingFeedback ? (
                                                <>
                                                    <RotateCw className="size-3.5 animate-spin" />
                                                    <span>Mengirim...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Kirim Masukan</span>
                                                    <ArrowRight className="size-3.5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 10. Footer */}
            <footer className="border-t border-slate-200/80 py-8 sm:py-10 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 text-center sm:text-left">
                    <div className="flex items-center gap-2.5">
                        <img src="/images/rakit-mark.png" alt="RAKIT" className="h-6 w-auto object-contain" />
                        <span className="text-sm font-bold text-slate-900">
                            RAKIT Campus
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
                        <Link href="/projects" className="hover:text-slate-900 transition">Project Hub</Link>
                        <Link href="/competitions" className="hover:text-slate-900 transition">Competition Hub</Link>
                        <Link href="/matching" className="hover:text-slate-900 transition">Smart Matching</Link>
                        <Link href="/portfolio" className="hover:text-slate-900 transition">Portofolio</Link>
                    </div>

                    <p className="text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} RAKIT Campus. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
