import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({ title, value, subtext, trend, icon: Icon, color = "cyan" }) {
    const colors = {
        cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
        violet: "text-violet-400 bg-violet-400/10 border-violet-400/20",
        emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
        amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    }[color];

    return (
        <div className="p-6 rounded-xl bg-glass border border-glass-border backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">{title}</p>
                    <h3 className="text-3xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${colors}`}>
                    {Icon && <Icon className="w-6 h-6" />}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {trend && (
                    <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(trend)}%
                    </span>
                )}
                <span className="text-slate-500 text-xs">{subtext}</span>
            </div>

            {/* Glossy Effect */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
        </div>
    );
}
