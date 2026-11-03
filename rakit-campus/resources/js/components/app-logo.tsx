export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5 py-1">
            <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-white border border-neutral-200/90 shadow-xs p-1">
                <img src="/images/rakit-mark.png" alt="RAKIT" className="size-6 object-contain" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-none">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-extrabold text-[#0E121B] tracking-tight text-sm">RAKIT</span>
                    <span className="text-[10px] font-bold text-[#5448EE] uppercase px-1.5 py-0.5 rounded bg-[#EEEDFD] border border-[#5448EE]/20 tracking-wider">
                        Campus
                    </span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium truncate">Opportunity & Team Platform</span>
            </div>
        </div>
    );
}
