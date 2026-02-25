"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Truck, Map, ShieldCheck, ArrowRight } from "lucide-react";

export default function LandingPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-[#000]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="z-10 text-center max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-xl">
                            <Truck className="w-12 h-12 text-cyan-400" />
                        </div>
                    </div>

                    <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-500 mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        KOU LOGISTICS
                    </h1>

                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Advanced Route Optimization & Fleet Command System.
                        <br />
                        <span className="text-sm text-slate-500 uppercase tracking-widest mt-2 block">Powered by Yazlab Alpha-3 Protocol</span>
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                >
                    <Link href="/user">
                        <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm cursor-pointer overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 group-hover:via-cyan-500/10 transition-all" />
                            <div className="relative z-10 flex flex-col items-center">
                                <ShieldCheck className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h2 className="text-2xl font-bold text-white mb-2">User Portal</h2>
                                <p className="text-slate-400 text-sm">Submit cargo requests & track shipments</p>
                                <ArrowRight className="w-5 h-5 text-cyan-500 mt-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/dashboard">
                        <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/50 transition-all duration-300 backdrop-blur-sm cursor-pointer overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-violet-500/5 group-hover:via-violet-500/10 transition-all" />
                            <div className="relative z-10 flex flex-col items-center">
                                <Map className="w-10 h-10 text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h2 className="text-2xl font-bold text-white mb-2">Command Center</h2>
                                <p className="text-slate-400 text-sm">Admin dashboard & Global optimization</p>
                                <ArrowRight className="w-5 h-5 text-violet-500 mt-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </div>

            <div className="absolute bottom-10 text-slate-600 text-sm">
                System Status: <span className="text-emerald-500">ONLINE</span> • Latency: <span className="text-emerald-500">12ms</span>
            </div>
        </main>
    );
}
