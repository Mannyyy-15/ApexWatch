import { CategoryRow } from './CategoryRow';

export function Browse() {
 return (
 <div className="min-h-screen pt-28 md:pt-36 px-4 md:px-16 lg:px-20 pb-32 w-full max-w-[1600px] mx-auto relative z-10">
 <div className="mb-10 md:mb-16">
 <div className="flex items-center gap-4 mb-4">
 <div className="w-1.5 h-8 bg-red-600 rounded-full "></div>
 <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
 Browse <span className="text-red-600">All</span>
 </h1>
 </div>
 <p className="text-white/50 text-sm md:text-base font-medium ml-5">Explore channels, popular genres, languages and sports.</p>
 </div>

 <div className="space-y-12 md:space-y-16">
 <CategoryRow title="Channels" type="channel" />
 <CategoryRow title="Popular Languages" type="language" />
 <CategoryRow title="Popular Genres" type="genre" />
 <CategoryRow title="Sports" type="sport" />
 </div>
 </div>
 );
}
