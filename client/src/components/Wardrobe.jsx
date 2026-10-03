import { useRef, useState } from 'react';

export default function Wardrobe({ items, pickedItemId, onPick, onUpload, onDelete, isUploading }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const fileInput = useRef(null);

  async function submit(event) {
    event.preventDefault();
    if (!file) return;
    const saved = await onUpload({ name, file });
    if (saved) {
      setName('');
      setFile(null);
      fileInput.current.value = '';
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">Build a look</p>
      <h2 className="mt-1 font-display text-3xl">My wardrobe</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">Upload pieces, then drag them into the Outfit builder.</p>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Item name — e.g. linen shirt" className="input" />
        <input required ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block w-full text-sm text-ink/60 file:mr-3 file:rounded-lg file:border-0 file:bg-sand file:px-3 file:py-2 file:text-sm file:font-bold file:text-ink hover:file:bg-[#ddcfbe]" />
        <button disabled={isUploading} className="rounded-xl bg-moss px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#50634c] disabled:opacity-60">{isUploading ? 'Uploading…' : 'Upload item'}</button>
      </form>
      {items.length > 0 && <div className="mt-6 grid grid-cols-3 gap-3">
        {items.map((item) => {
          return <div key={item.id} className="group relative">
            <button type="button" draggable onClick={() => onPick(item.id)} onDragStart={(event) => { event.dataTransfer.setData('application/x-closet-item', item.id); event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; onPick(item.id); }} className={`relative aspect-square w-full cursor-grab overflow-hidden rounded-xl border-2 transition active:cursor-grabbing ${pickedItemId === item.id ? 'border-clay ring-2 ring-clay/20' : 'border-transparent hover:border-clay'}`} aria-pressed={pickedItemId === item.id} aria-label={`Drag or select ${item.name} for the outfit builder`}>
              <img draggable="false" src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
            </button>
            <p className="mt-1 truncate text-xs font-semibold" title={item.name}>{item.name}</p>
            <button type="button" onClick={() => onDelete(item)} className="absolute -right-1 -top-1 hidden h-5 w-5 rounded-full bg-ink text-xs text-white group-hover:block" aria-label={`Delete ${item.name}`}>×</button>
          </div>;
        })}
      </div>}
      {items.length === 0 && <p className="mt-5 rounded-xl bg-cream p-4 text-sm text-ink/55">Your uploaded pieces will live here.</p>}
    </section>
  );
}
