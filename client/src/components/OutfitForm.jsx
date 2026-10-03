import { useEffect, useState } from 'react';

const blankOutfit = { name: '', occasion: '', season: '', imageUrl: '' };
const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'All season'];

export default function OutfitForm({ editingOutfit, onSubmit, onCancel, isSaving }) {
  const [values, setValues] = useState(blankOutfit);

  useEffect(() => {
    setValues(editingOutfit
      ? { name: editingOutfit.name, occasion: editingOutfit.occasion, season: editingOutfit.season, imageUrl: editingOutfit.imageUrl || '' }
      : blankOutfit);
  }, [editingOutfit]);

  function updateValue(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    const saved = await onSubmit(values);
    if (saved && !editingOutfit) setValues(blankOutfit);
  }

  return (
    <section id="outfit-form" className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-clay">Your wardrobe</p>
          <h2 className="mt-1 font-display text-3xl text-ink">{editingOutfit ? 'Refine an outfit' : 'Add an outfit'}</h2>
        </div>
        {editingOutfit && <button onClick={onCancel} className="text-sm font-semibold text-ink/60 transition hover:text-clay">Cancel</button>}
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-semibold">Outfit name
          <input required name="name" value={values.name} onChange={updateValue} placeholder="Sunday market layers" className="input" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Occasion
            <input required name="occasion" value={values.occasion} onChange={updateValue} placeholder="Weekend brunch" className="input" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Season
            <select required name="season" value={values.season} onChange={updateValue} className="input">
              <option value="" disabled>Select season</option>
              {seasons.map((season) => <option key={season}>{season}</option>)}
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 text-sm font-semibold">Image URL <span className="font-normal text-ink/50">(optional)</span>
          <input name="imageUrl" type="url" value={values.imageUrl} onChange={updateValue} placeholder="https://images.unsplash.com/..." className="input" />
        </label>
        <button disabled={isSaving} className="mt-2 rounded-xl bg-clay px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#9f4f35] disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? 'Saving…' : editingOutfit ? 'Save changes' : 'Save outfit'}
        </button>
      </form>
    </section>
  );
}
