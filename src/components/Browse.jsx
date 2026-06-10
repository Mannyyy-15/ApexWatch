import { CategoryRow } from './CategoryRow';

export function Browse() {
 return (
 <div className="min-h-screen pt-28 md:pt-36 px-2 md:px-8 lg:px-10 pb-32 w-full relative z-10">
 <h1 className="text-3xl md:text-5xl font-black text-white/90 uppercase italic tracking-tighter mb-8 md:mb-12 px-1">
 Browse
 </h1>

 <div className="space-y-12 md:space-y-16">
 <CategoryRow title="Channels" type="channel" />
 <CategoryRow title="Popular Languages" type="language" />
 <CategoryRow title="Popular Genres" type="genre" />
 <CategoryRow title="Sports" type="sport" />
 </div>
 </div>
 );
}
