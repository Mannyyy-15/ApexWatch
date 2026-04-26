import React from 'react';

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="aspect-[2/3] w-full bg-white/5 rounded-[2.5rem] border border-white/5"></div>
      <div className="space-y-3 px-2">
        <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-white/5 rounded-full w-1/2"></div>
          <div className="h-4 bg-white/5 rounded-md w-8"></div>
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
    return (
        <div className="relative w-full h-[85vh] md:h-[95vh] bg-[#050505] animate-pulse">
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="absolute bottom-20 left-8 md:left-20 space-y-6">
                <div className="h-4 bg-white/10 rounded-full w-32"></div>
                <div className="h-16 md:h-24 bg-white/10 rounded-2xl w-[60vw]"></div>
                <div className="h-6 bg-white/5 rounded-full w-[40vw]"></div>
                <div className="flex gap-4">
                    <div className="h-14 w-40 bg-white/10 rounded-2xl"></div>
                    <div className="h-14 w-40 bg-white/5 rounded-2xl"></div>
                </div>
            </div>
        </div>
    );
}

export function RowSkeleton() {
    return (
        <div className="space-y-6 px-8 md:px-20 py-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded-full w-48"></div>
            <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="min-w-[200px] aspect-[2/3] bg-white/5 rounded-[2rem]"></div>
                ))}
            </div>
        </div>
    );
}
