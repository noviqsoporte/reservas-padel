"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

function PadelPaddle() {
    return (
        <svg
            viewBox="0 0 70 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Paddle face — electric blue */}
            <ellipse cx="35" cy="44" rx="30" ry="38" fill="#0057FF" />
            {/* Horizontal strings — white on blue */}
            <line x1="13" y1="26" x2="57" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="10" y1="38" x2="60" y2="38" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="10" y1="50" x2="60" y2="50" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="10" y1="62" x2="60" y2="62" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="13" y1="74" x2="57" y2="74" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            {/* Vertical strings */}
            <line x1="22" y1="12" x2="22" y2="80" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
            <line x1="35" y1="7"  x2="35" y2="82" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
            <line x1="48" y1="12" x2="48" y2="80" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
            {/* Handle throat */}
            <path d="M26 82 C24 90 24 96 27 99 L43 99 C46 96 46 90 44 82 Z" fill="#0057FF" />
            {/* Handle grip */}
            <rect x="27" y="98" width="16" height="28" rx="8" fill="#0057FF" />
            {/* Grip wrap detail */}
            <rect x="27" y="98" width="16" height="5" rx="0" fill="white" fillOpacity="0.25" />
            <rect x="27" y="111" width="16" height="4" rx="0" fill="white" fillOpacity="0.18" />
        </svg>
    );
}

export default function IntroAnimation({ nombre }: { nombre: string }) {
    const [visible, setVisible] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const controls = useAnimation();

    // Effect 1: decide whether to show (runs once on mount)
    useEffect(() => {
        // ── TEMPORARY: comment the two lines below to always show the intro ──
        // if (sessionStorage.getItem("lood_intro_shown")) return;
        // sessionStorage.setItem("lood_intro_shown", "1");
        // ────────────────────────────────────────────────────────────────────
        setVisible(true);
    }, []);

    // Effect 2: start animation only AFTER visible=true causes the motion.div to render
    useEffect(() => {
        if (!visible) return;

        const run = async () => {
            // Phase 1: fade in + scale up
            await controls.start({
                opacity: 1,
                scale: 1,
                transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
            });

            // Hold
            await new Promise((res) => setTimeout(res, 720));

            // Phase 2: shrink + fly to navbar top-left
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            await controls.start({
                scale: 0.13,
                x: -(vw / 2 - 88),
                y: -(vh / 2 - 32),
                transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
            });

            // Fade out overlay
            setOverlayVisible(false);
        };

        run();
    }, [visible, controls]); // runs after motion.div is in the DOM

    if (!visible) return null;

    return (
        <AnimatePresence onExitComplete={() => setVisible(false)}>
            {overlayVisible && (
                <motion.div
                    key="intro-overlay"
                    className="fixed inset-0 z-[9999] bg-[#0a1628] flex items-center justify-center"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                >
                    <motion.div
                        className="flex items-center gap-5"
                        initial={{ opacity: 0, scale: 0.82 }}
                        animate={controls}
                    >
                        <div className="w-14 h-24 flex-shrink-0">
                            <PadelPaddle />
                        </div>
                        <span
                            className="font-bold tracking-tight select-none text-[#0057FF]"
                            style={{ fontSize: "6.5rem", lineHeight: 1, fontFamily: "var(--font-dm-sans), sans-serif" }}
                        >
                            {nombre}
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
