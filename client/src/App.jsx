import { useEffect, useState } from 'react';
import OutfitForm from './components/OutfitForm';
import OutfitCard from './components/OutfitCard';
import Wardrobe from './components/Wardrobe';
import OutfitBuilder from './components/OutfitBuilder';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers }
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.');
  return payload;
}

export default function App() {
  const [outfits, setOutfits] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState(null);
  const [notice, setNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [pickedItemId, setPickedItemId] = useState(null);

  useEffect(() => { loadCloset(); }, []);

  async function loadCloset() {
    setIsLoading(true);
    try {
      const [outfitResult, itemResult] = await Promise.all([api('/outfits'), api('/closet-items')]);
      setOutfits(outfitResult.data);
      setItems(itemResult.data);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function saveOutfit(values, createNew = false) {
    setIsSaving(true);
    try {
      if (editingOutfit && !createNew) {
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
    setActiveTab('add');
  }

  async function uploadItem({ name, file }) {
    setIsUploading(true);
    const data = new FormData();
    data.append('name', name);
    data.append('image', file);
    try {
      const result = await api('/closet-items', { method: 'POST', body: data });
      setItems((current) => [result.data, ...current]);
      setNotice({ type: 'success', text: 'Piece added to your wardrobe.' });
      return true;
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
      return false;
    } finally { setIsUploading(false); }
  }

  async function uploadInspirationImage(file) {
    const data = new FormData();
    data.append('image', file);
    try {
      const result = await api('/inspiration-images', { method: 'POST', body: data });
      return result.data;
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
      return null;
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Remove “${item.name}” from your wardrobe?`)) return;
    setDeletingItemId(item.id);
    try {
      await api(`/closet-items/${item.id}`, { method: 'DELETE' });
      setItems((current) => current.filter(({ id }) => id !== item.id));
      if (pickedItemId === item.id) setPickedItemId(null);
      setNotice({ type: 'success', text: 'Wardrobe piece removed.' });
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
    finally { setDeletingItemId(null); }
  }

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const inspirationOutfits = outfits.filter((outfit) => outfit.kind !== 'my_outfit');
  const myOutfits = outfits.filter((outfit) => outfit.kind === 'my_outfit');
  const tabs = [
    ['home', 'Home'],
    ['closet', 'My closet'],
    ['add', 'Add inspiration']
  ];

  function Notice() {
    return notice && <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${notice.type === 'success' ? 'border-moss/25 bg-[#eef3ec] text-[#41533d]' : 'border-clay/25 bg-[#fff0eb] text-[#873d28]'}`}><span className="mr-2">{notice.type === 'success' ? '✓' : '!'}</span>{notice.text}</div>;
  }

  function Gallery({ title, eyebrow, looks, empty }) {
    return <section>
      <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-clay">{eyebrow}</p><h2 className="mt-1 font-display text-3xl">{title} <span className="text-ink/40">({looks.length})</span></h2></div></div>
      {looks.length === 0 ? <div className="grid min-h-44 place-items-center rounded-3xl border border-dashed border-ink/20 bg-white p-8 text-center text-ink/55">{empty}</div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{looks.map((outfit) => <OutfitCard key={outfit.id} outfit={outfit} itemMap={itemMap} onEdit={editOutfit} onDelete={deleteOutfit} isDeleting={deletingId === outfit.id} />)}</div>}
    </section>;
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <button onClick={() => setActiveTab('home')} className="font-display text-2xl font-bold tracking-tight">closet<span className="text-clay">log</span></button>
        <nav className="flex rounded-full border border-ink/10 bg-white p-1" aria-label="Main navigation">{tabs.map(([id, label]) => <button key={id} onClick={() => { setActiveTab(id); setEditingOutfit(null); }} className={`rounded-full px-3 py-2 text-sm font-bold transition sm:px-4 ${activeTab === id ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'}`}>{label}</button>)}</nav>
      </header>

      {activeTab === 'home' && <><section id="top" className="relative mx-auto max-w-7xl px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="absolute -right-24 top-0 -z-10 h-72 w-72 rounded-full bg-sand/70 blur-3xl" />
        <p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-clay">Your personal style archive</p>
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl leading-[.95] tracking-tight sm:text-7xl">Remember every <em className="font-normal text-moss">good outfit.</em></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/65">A quiet little place for the looks you loved, the ideas you want to try, and the moments you want to dress for.</p>
        </div>
      </section><div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 sm:px-8" aria-live="polite"><Notice />{isLoading ? <div className="grid min-h-64 place-items-center rounded-3xl bg-white text-ink/50">Loading your closet…</div> : <><Gallery title="My outfits" eyebrow="Built from my closet" looks={myOutfits} empty="Create a look in My closet to see it here." /><Gallery title="Inspiration" eyebrow="Outfit ideas" looks={inspirationOutfits} empty="Add an outfit idea from the Add inspiration tab." /></>}</div></>}

      {activeTab === 'add' && <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8"><div className="max-w-xl"><Notice /><OutfitForm editingOutfit={editingOutfit} onSubmit={saveOutfit} onImageUpload={uploadInspirationImage} onCancel={() => setEditingOutfit(null)} isSaving={isSaving} /></div>{!isLoading && <div className="mt-14"><Gallery title="Inspiration" eyebrow="Your saved ideas" looks={inspirationOutfits} empty="Your saved inspiration looks will appear here." /></div>}</div>}

      {activeTab === 'closet' && <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8"><div className="grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start"><div><Notice /><Wardrobe items={items} pickedItemId={pickedItemId} onPick={setPickedItemId} onUpload={uploadItem} onDelete={deleteItem} isUploading={isUploading || Boolean(deletingItemId)} /></div><OutfitBuilder items={items} pickedItemId={pickedItemId} onPick={setPickedItemId} onSave={(values) => saveOutfit(values, true)} isSaving={isSaving} /></div>{!isLoading && <div className="mt-14"><Gallery title="My outfits" eyebrow="Built from my closet" looks={myOutfits} empty="Build your first outfit above to see it here." /></div>}</div>}
    </main>
  );
}
