import React from 'react';

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="aspect-[2/3] w-full bg-white/5 rounded-[2.5rem] border border-white/5 shimmer"></div>
      <div className="space-y-3 px-2">
        <div className="h-4 bg-white/10 rounded-full w-3/4 shimmer"></div>
        <div className="flex justify-between items-center gap-4">
          <div className="h-3 bg-white/5 rounded-full w-1/2 shimmer"></div>
          <div className="h-4 bg-white/5 rounded-md w-8 shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
    return (
        <div className="relative w-full h-[85vh] md:h-[95vh] bg-[#050505] overflow-hidden">
            <div className="absolute inset-0 bg-white/5 shimmer"></div>
            <div className="absolute bottom-20 left-8 md:left-20 space-y-6">
                <div className="h-4 bg-white/10 rounded-full w-32 shimmer"></div>
                <div className="h-16 md:h-24 bg-white/10 rounded-2xl w-[60vw] shimmer"></div>
                <div className="h-6 bg-white/5 rounded-full w-[40vw] shimmer"></div>
                <div className="flex gap-4">
                    <div className="h-14 w-40 bg-white/10 rounded-2xl shimmer"></div>
                    <div className="h-14 w-40 bg-white/5 rounded-2xl shimmer"></div>
                </div>
            </div>
        </div>
    );
}

export function RowSkeleton() {
    return (
        <div className="space-y-6 px-8 md:px-20 py-6">
            <div className="h-8 bg-white/10 rounded-full w-48 shimmer"></div>
            <div className="flex gap-3 md:gap-5 overflow-hidden -mx-8 md:-mx-20 px-8 md:px-20">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex-shrink-0 w-[calc((100vw-48px-24px)/3)] md:w-[calc((100vw-160px-100px)/6)] aspect-[2/3] bg-white/5 rounded-[2rem] shimmer"></div>
                ))}
            </div>
        </div>
    );
}
