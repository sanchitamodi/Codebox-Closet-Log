import { useState } from 'react';

const slotLabels = { top: 'Top', bottom: 'Bottom', shoes: 'Shoes', accessories: 'Accessories' };
const emptySlots = { top: null, bottom: null, shoes: null, accessories: null };

export default function OutfitBuilder({ items, pickedItemId, onPick, onSave, isSaving }) {
  const [slots, setSlots] = useState(emptySlots);
  const [values, setValues] = useState({ name: '', occasion: '', season: '' });
  const [dragging, setDragging] = useState(null);

  function placeItem(slot, itemId) {
    if (!itemId) return;
    setSlots((current) => ({ ...current, [slot]: itemId }));
    setDragging(null);
    onPick(null);
  }

  function clearSlot(slot) {
    setSlots((current) => ({ ...current, [slot]: null }));
  }

  function drop(event, slot) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('application/x-closet-item') || event.dataTransfer.getData('text/plain') || pickedItemId;
    placeItem(slot, itemId);
  }

  async function submit(event) {
    event.preventDefault();
    if (!Object.values(slots).some(Boolean)) return;
    const saved = await onSave({ ...values, imageUrl: '', slots, kind: 'my_outfit' });
    if (saved) {
      setValues({ name: '', occasion: '', season: '' });
      setSlots(emptySlots);
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-clay">Create a combination</p>
      <h2 className="mt-1 font-display text-3xl">Outfit builder</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">Drag pieces from My wardrobe into the matching spaces.</p>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(slotLabels).map(([slot, label]) => {
            const item = items.find(({ id }) => id === slots[slot]);
            return <div key={slot} onClick={() => placeItem(slot, pickedItemId)} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={(event) => drop(event, slot)} className={`relative min-h-32 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-2 transition ${dragging ? 'border-clay/50 bg-[#fff8f4]' : 'border-ink/15 bg-cream/50'}`}>
              <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/60">{label}</span>
              {item ? <><img src={item.imageUrl} alt={item.name} className="h-28 w-full rounded-xl object-cover" /><p className="mt-1 truncate px-1 text-xs font-bold">{item.name}</p><button type="button" onClick={(event) => { event.stopPropagation(); clearSlot(slot); }} className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-xs text-white" aria-label={`Remove ${item.name}`}>×</button></> : <div className="grid h-28 place-items-center pt-5 text-center text-xs font-medium text-ink/35">Drop {label.toLowerCase()} here</div>}
            </div>;
          })}
        </div>
        <input required value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="Name this outfit" className="input" />
        <div className="grid grid-cols-2 gap-3"><input required value={values.occasion} onChange={(event) => setValues((current) => ({ ...current, occasion: event.target.value }))} placeholder="Occasion" className="input" /><select required value={values.season} onChange={(event) => setValues((current) => ({ ...current, season: event.target.value }))} className="input"><option value="" disabled>Season</option>{['Spring', 'Summer', 'Fall', 'Winter', 'All season'].map((season) => <option key={season}>{season}</option>)}</select></div>
        <button disabled={isSaving || !Object.values(slots).some(Boolean)} className="rounded-xl bg-clay px-4 py-3 text-sm font-bold text-white transition hover:bg-[#9f4f35] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Saving…' : 'Save to My outfits'}</button>
      </form>
      <p className="mt-3 text-center text-xs text-ink/45">{pickedItemId ? 'Now drop it—or click a category—to place it.' : dragging ? 'Drop it into a category.' : 'Drag a piece here, or select one and click a category.'}</p>
    </section>
  );
}
