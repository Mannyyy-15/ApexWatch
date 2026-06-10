import React from 'react';

export function MovieCardSkeleton() {
 return (
 <div className="flex flex-col gap-3">
 <div className="aspect-[2/3] w-full bg-white/5 rounded-xl md:rounded-[20px] border border-white/5 shimmer"></div>
 <div className="space-y-2 px-1">
 <div className="h-3 bg-white/10 rounded-full w-3/4 shimmer"></div>
 <div className="flex justify-between items-center gap-4">
 <div className="h-2 bg-white/5 rounded-full w-1/2 shimmer"></div>
 <div className="h-3.5 bg-white/5 rounded-md w-8 shimmer"></div>
 </div>
 </div>
 </div>
 );
}

export function HeroSkeleton() {
 return (
 <div className="relative w-full h-[85vh] md:h-[95vh] bg-[#020202] overflow-hidden">
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
 <div className="space-y-5 px-4 md:px-16 lg:px-20 py-4">
 <div className="h-6 bg-white/10 rounded-full w-40 shimmer"></div>
 <div className="flex gap-4 md:gap-5 overflow-hidden">
 {[1, 2, 3, 4, 5, 6].map(i => (
 <div key={i} className="flex-shrink-0 w-[calc((100vw-48px-24px)/3)] md:w-[calc((100vw-160px-100px)/6)] aspect-[2/3] bg-white/5 rounded-xl md:rounded-[20px] shimmer"></div>
 ))}
 </div>
 </div>
 );
}

export function MovieDetailsSkeleton() {
 return (
 <div className="absolute inset-0 bg-[#050505] z-40 overflow-y-auto hide-scrollbar w-full h-[100dvh]">
 {/* Hero Section */}
 <div className="relative w-full h-[75vh] md:h-[90vh] bg-white/3 flex items-end pb-12 md:pb-24 px-6 md:px-20 overflow-hidden">
 <div className="absolute inset-0 bg-white/5 shimmer"></div>
 <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
 <div className="relative z-10 w-full grid lg:grid-cols-[280px_1fr] gap-8 md:gap-12 items-end">
 <div className="hidden lg:block aspect-[2/3] w-full bg-white/5 border border-white/5 rounded-2xl shimmer"></div>
 <div className="space-y-6 w-full">
 <div className="flex gap-2">
 <div className="h-4 bg-white/10 rounded w-24 shimmer"></div>
 <div className="h-4 bg-white/5 rounded w-16 shimmer"></div>
 </div>
 <div className="h-12 md:h-16 bg-white/10 rounded-2xl w-3/4 shimmer"></div>
 <div className="h-4 bg-white/5 rounded w-1/2 shimmer"></div>
 <div className="flex gap-3">
 <div className="h-12 md:h-14 w-36 bg-white/10 rounded-xl md:rounded-2xl shimmer"></div>
 <div className="h-12 md:h-14 w-36 bg-white/5 rounded-xl md:rounded-2xl shimmer"></div>
 </div>
 </div>
 </div>
 </div>
 {/* Tabs Section */}
 <div className="px-6 md:px-20 border-b border-white/5 py-5 bg-[#020202]">
 <div className="flex gap-8">
 <div className="h-4 bg-white/10 rounded w-20 shimmer"></div>
 <div className="h-4 bg-white/5 rounded w-20 shimmer"></div>
 <div className="h-4 bg-white/5 rounded w-24 shimmer"></div>
 </div>
 </div>
 {/* Content Section */}
 <div className="px-6 md:px-20 py-10 md:py-16 grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-20">
 <div className="space-y-12">
 <div className="space-y-4">
 <div className="h-3 bg-white/10 rounded w-24 shimmer"></div>
 <div className="h-5 bg-white/10 rounded-full w-full shimmer"></div>
 <div className="h-5 bg-white/10 rounded-full w-11/12 shimmer"></div>
 <div className="h-5 bg-white/5 rounded-full w-4/5 shimmer"></div>
 </div>
 <div className="space-y-4">
 <div className="h-3 bg-white/10 rounded w-32 shimmer"></div>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
 {[1, 2, 3, 4, 5].map(i => (
 <div key={i} className="space-y-2">
 <div className="aspect-[3/4] w-full bg-white/5 rounded-xl md:rounded-[20px] shimmer"></div>
 <div className="h-3 bg-white/10 rounded w-3/4 shimmer"></div>
 </div>
 ))}
 </div>
 </div>
 </div>
 <div className="h-80 bg-white/3 border border-white/5 p-6 rounded-[24px] shimmer"></div>
 </div>
 </div>
 );
}
