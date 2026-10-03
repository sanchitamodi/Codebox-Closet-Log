import { useEffect, useState } from 'react';
import OutfitForm from './components/OutfitForm';
import OutfitCard from './components/OutfitCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.');
  return payload;
}

export default function App() {
  const [outfits, setOutfits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingOutfit, setEditingOutfit] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => { loadOutfits(); }, []);

  async function loadOutfits() {
    setIsLoading(true);
    try {
      const result = await api('/outfits');
      setOutfits(result.data);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function saveOutfit(values) {
    setIsSaving(true);
    try {
      if (editingOutfit) {
        const result = await api(`/outfits/${editingOutfit.id}`, { method: 'PUT', body: JSON.stringify(values) });
        setOutfits((current) => current.map((outfit) => outfit.id === result.data.id ? result.data : outfit));
        setNotice({ type: 'success', text: 'Outfit updated — looking good.' });
        setEditingOutfit(null);
      } else {
        const result = await api('/outfits', { method: 'POST', body: JSON.stringify(values) });
        setOutfits((current) => [result.data, ...current]);
        setNotice({ type: 'success', text: 'Outfit saved to your closet.' });
      }
      return true;
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteOutfit(outfit) {
    if (!window.confirm(`Delete “${outfit.name}”? This can’t be undone.`)) return;
    setDeletingId(outfit.id);
    try {
      await api(`/outfits/${outfit.id}`, { method: 'DELETE' });
      setOutfits((current) => current.filter(({ id }) => id !== outfit.id));
      if (editingOutfit?.id === outfit.id) setEditingOutfit(null);
      setNotice({ type: 'success', text: 'Outfit deleted.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setDeletingId(null);
    }
  }

  function editOutfit(outfit) {
    setEditingOutfit(outfit);
    setNotice(null);
    document.querySelector('#outfit-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="#top" className="font-display text-2xl font-bold tracking-tight">closet<span className="text-clay">log</span></a>
        <a href="#outfit-form" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-bold transition hover:border-ink hover:bg-white">+ Add look</a>
      </header>

      <section id="top" className="relative mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="absolute -right-24 top-0 -z-10 h-72 w-72 rounded-full bg-sand/70 blur-3xl" />
        <p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-clay">Your personal style archive</p>
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl leading-[.95] tracking-tight sm:text-7xl">Remember every <em className="font-normal text-moss">good outfit.</em></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/65">A quiet little place for the looks you loved, the ideas you want to try, and the moments you want to dress for.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-20 sm:px-8 lg:grid-cols-[360px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-6"><OutfitForm editingOutfit={editingOutfit} onSubmit={saveOutfit} onCancel={() => setEditingOutfit(null)} isSaving={isSaving} /></aside>
        <section aria-live="polite">
          <div className="mb-6 flex items-end justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-clay">Saved looks</p><h2 className="mt-1 font-display text-3xl">The collection <span className="text-ink/40">({outfits.length})</span></h2></div>
          </div>
          {notice && <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${notice.type === 'success' ? 'border-moss/25 bg-[#eef3ec] text-[#41533d]' : 'border-clay/25 bg-[#fff0eb] text-[#873d28]'}`}><span className="mr-2">{notice.type === 'success' ? '✓' : '!'}</span>{notice.text}</div>}
          {isLoading ? <div className="grid min-h-64 place-items-center rounded-3xl bg-white text-ink/50">Loading your closet…</div> : outfits.length === 0 ? (
            <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-ink/20 bg-white p-8 text-center"><div><p className="font-display text-2xl">Your closet is ready.</p><p className="mt-2 text-ink/55">Save your first outfit idea to start collecting.</p></div></div>
          ) : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{outfits.map((outfit) => <OutfitCard key={outfit.id} outfit={outfit} onEdit={editOutfit} onDelete={deleteOutfit} isDeleting={deletingId === outfit.id} />)}</div>}
        </section>
      </div>
    </main>
  );
}
