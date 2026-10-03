const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'%3E%3Crect width='800' height='1000' fill='%23e9dfd2'/%3E%3Cpath d='M290 280h220l55 135-75 48v260H310V463l-75-48z' fill='%23b86143' opacity='.75'/%3E%3Ccircle cx='400' cy='190' r='60' fill='%23647660' opacity='.6'/%3E%3Ctext x='400' y='850' text-anchor='middle' font-family='serif' font-size='36' fill='%2361544a'%3ECLOSET LOG%3C/text%3E%3C/svg%3E";

export default function OutfitCard({ outfit, onEdit, onDelete, isDeleting }) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/4.6] overflow-hidden bg-sand">
        <img src={outfit.imageUrl || fallbackImage} alt={outfit.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow-sm">{outfit.season}</span>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-clay">{outfit.occasion}</p>
        <h3 className="mt-1 truncate font-display text-2xl">{outfit.name}</h3>
        <div className="mt-5 flex gap-2">
          <button onClick={() => onEdit(outfit)} className="flex-1 rounded-lg border border-ink/15 py-2 text-sm font-bold transition hover:border-ink hover:bg-cream">Edit</button>
          <button disabled={isDeleting} onClick={() => onDelete(outfit)} className="flex-1 rounded-lg border border-clay/25 py-2 text-sm font-bold text-clay transition hover:bg-[#fff3ef] disabled:opacity-50">{isDeleting ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </article>
  );
}
