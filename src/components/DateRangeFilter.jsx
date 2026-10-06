import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { DATE_PRESETS, dateKey, parseDay, presetRange } from '../utils/dateRange';

function RangeDialog({ value, onApply, onClose }) {
    const [draft, setDraft] = useState(value);
    const [month, setMonth] = useState(() => {
        const date = value.end ? parseDay(value.end) : new Date();
        return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    });
    const [selectingEnd, setSelectingEnd] = useState(false);
    const dialogRef = useRef(null);
    const today = dateKey(new Date());
    const valid = draft.preset === 'All time' || (draft.start && draft.end && draft.start <= draft.end && draft.end <= today);

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialogRef.current.focus();
        const onKey = (event) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'Tab') {
                const elements = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
                const first = elements[0];
                const last = elements[elements.length - 1];
                if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
                    event.preventDefault(); last.focus();
                } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
                    event.preventDefault(); first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKey);
            previousFocus?.focus();
        };
    }, [onClose]);

    const chooseDay = (day) => {
        if (!selectingEnd) {
            setDraft({ preset: 'Custom', start: day, end: day });
            setSelectingEnd(true);
        } else {
            setDraft({ preset: 'Custom', start: day < draft.start ? day : draft.start, end: day < draft.start ? draft.start : day });
            setSelectingEnd(false);
        }
    };
    const choosePreset = (preset) => {
        const next = preset === 'Custom' ? { ...draft, preset } : presetRange(preset);
        setDraft(next);
        setSelectingEnd(false);
        if (next.end) {
            const end = parseDay(next.end);
            setMonth(new Date(end.getFullYear(), end.getMonth() - 1, 1));
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="date-range-title" tabIndex={-1} className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl outline-none md:flex-row">
                <nav aria-label="Date range presets" className="flex shrink-0 overflow-x-auto border-b border-slate-200 py-3 md:w-52 md:flex-col md:border-b-0 md:border-r md:py-5">
                    {DATE_PRESETS.map(preset => <button key={preset} onClick={() => choosePreset(preset)} aria-pressed={draft.preset === preset} className={`whitespace-nowrap px-6 py-3 text-left text-sm font-medium transition-colors md:py-3.5 ${draft.preset === preset ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:bg-slate-50'}`}>{preset}</button>)}
                </nav>
                <div className="min-w-0 flex-1 p-5 sm:p-8">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 id="date-range-title" className="text-lg font-bold text-slate-900">Select a date range</h3>
                        <button onClick={onClose} aria-label="Close date filter" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {['start', 'end'].map(field => <label key={field} className="space-y-2 text-sm text-slate-500">
                            <span>{field === 'start' ? 'Start date' : 'End date'}</span>
                            <input type="date" value={draft[field]} max={today} onChange={event => { setDraft({ ...draft, preset: 'Custom', [field]: event.target.value }); setSelectingEnd(false); }} className="w-full min-w-0 rounded-lg border border-slate-400 px-3 py-3 text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                        </label>)}
                    </div>
                    <div className="mb-4 mt-6 flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800">{selectingEnd ? 'Select an end date' : 'Select a custom range'}</p>
                        <div className="flex gap-2">
                            <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronLeft size={20} /></button>
                            <button aria-label="Next month" disabled={dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 1)) >= today.slice(0, 7) + '-01'} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {[0, 1].map(offset => {
                            const first = new Date(month.getFullYear(), month.getMonth() + offset, 1);
                            const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
                            const blanks = (first.getDay() + 6) % 7;
                            return <section key={offset} aria-label={first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}>
                                <h4 className="mb-4 font-bold uppercase text-slate-800">{first.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</h4>
                                <div className="grid grid-cols-7 text-center text-sm">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={`weekday-${index}`} className="pb-3 font-semibold text-slate-400">{day}</span>)}
                                    {Array.from({ length: blanks }, (_, index) => <span key={`blank-${index}`} />)}
                                    {Array.from({ length: days }, (_, index) => {
                                        const date = new Date(first.getFullYear(), first.getMonth(), index + 1);
                                        const key = dateKey(date);
                                        const edge = key === draft.start || key === draft.end;
                                        const inside = draft.start && draft.end && key > draft.start && key < draft.end;
                                        return <button key={key} disabled={key > today} aria-label={date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} aria-pressed={Boolean(edge || inside)} onClick={() => chooseDay(key)} className={`my-0.5 aspect-square w-full rounded-full text-sm transition-colors disabled:text-slate-300 ${edge ? 'bg-blue-600 font-bold text-white' : inside ? 'rounded-none bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'} ${key === today && !edge ? 'ring-1 ring-inset ring-blue-300' : ''}`}>{index + 1}</button>;
                                    })}
                                </div>
                            </section>;
                        })}
                    </div>
                    {!valid && <p role="alert" className="mt-4 text-sm text-red-600">Choose both dates, with the end on or after the start and no later than today.</p>}
                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                        <button onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
                        <button disabled={!valid} onClick={() => { onApply(draft); onClose(); }} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Apply range</button>
                    </div>
                </div>
            </div>
        </div>, document.body
    );
}

export default function DateRangeFilter({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const label = value.preset === 'Custom' ? `${parseDay(value.start).toLocaleDateString('en-GB')} – ${parseDay(value.end).toLocaleDateString('en-GB')}` : value.preset;
    return <>
        <button onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:border-blue-300">
            <Filter className="h-4 w-4 shrink-0" /><span>{value.preset === 'All time' ? 'Filter · All time' : label}</span>
        </button>
        {open && <RangeDialog value={value} onApply={onChange} onClose={() => setOpen(false)} />}
    </>;
}
