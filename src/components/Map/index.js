"use client";

import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./CommandMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-black/50 text-cyan-500 animate-pulse">
            Initializing Satellite Link...
        </div>
    ),
});

export default DynamicMap;
