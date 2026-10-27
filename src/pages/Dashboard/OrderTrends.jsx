import { useEffect, useId, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react'; // eslint-disable-line no-unused-vars -- JSX components
import api from '../../utils/api';

const COLORS = {
    Pending: '#d97706', Packing: '#7c3aed', 'On the way': '#0891b2',
    Delivered: '#16a34a', Cancelled: '#dc2626',
};
const PERIODS = [
    ['weekly', 'Weekly · Last 7 days'], ['monthly', 'Monthly · This month'],
    ['quarterly', 'Three months · Through today'], ['yearly', 'Yearly · This year'],
];
const number = value => value.toLocaleString('en-IN');
function dateLabel(value, monthly = false) {
    return new Date(`${value}${value.length === 7 ? '-01' : ''}T00:00:00+05:30`).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata', ...(monthly ? { month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }),
    });
}

export default function OrderTrends({ refreshKey }) {
    const id = useId();
    const [period, setPeriod] = useState('monthly');
    const [customerType, setCustomerType] = useState('all');
    const [status, setStatus] = useState('Delivered');
    const [result, setResult] = useState({ loading: true, data: null, error: '' });
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setResult({ loading: true, data: null, error: '' });
            try {
                const { data } = await api.get('/admin/order-trends', {
                    params: { period, customerType, status }, signal: controller.signal,
                });
                if (!controller.signal.aborted) setResult({ loading: false, data, error: '' });
            } catch {
                if (!controller.signal.aborted) setResult({ loading: false, data: null, error: 'Unable to load order trends. Please retry.' });
            }
        }
        load();
        return () => controller.abort();
    }, [period, customerType, status, refreshKey, retry]);

    const { data, loading, error } = result;
    const points = data?.points || [];
    const statuses = data?.statuses || [];
    const peak = Math.max(1, ...points.flatMap(point => Object.values(point.counts)));
    const step = Math.max(1, Math.ceil(peak / 4));
    const ceiling = step * 4;
    const x = index => 60 + (points.length > 1 ? index / (points.length - 1) : 0.5) * 880;
    const y = count => 252 - count / ceiling * 212;
    const labelEvery = Math.max(1, Math.ceil(points.length / 7));

    return (
        <section aria-labelledby={`${id}-title`} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 id={`${id}-title`} className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" /> Order Trends
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Track delivered orders or compare order statuses across B2C and B2B.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {[
                        { name: 'Customer type', value: customerType, change: setCustomerType, options: [['all', 'All · B2C + B2B'], ['Retail', 'B2C · Retail'], ['Business', 'B2B · Business']] },
                        { name: 'Order status', value: status, change: setStatus, options: [['all', 'Compare all statuses'], ...Object.keys(COLORS).map(name => [name, name])] },
                        { name: 'Period', value: period, change: setPeriod, options: PERIODS },
                    ].map(filter => (
                        <label key={filter.name} className="flex flex-col gap-1 text-xs font-bold text-slate-500">
                            {filter.name}
                            <select value={filter.value} onChange={event => filter.change(event.target.value)} className="border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-green-600">
                                {filter.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>
                    ))}
                </div>
            </div>

            <div aria-live="polite" aria-busy={loading}>
                {loading ? <div className="h-72 flex items-center justify-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading order trends…</div>
                    : error ? <div role="alert" className="p-6 bg-red-50 rounded-xl text-red-700">{error} <button onClick={() => setRetry(value => value + 1)} className="underline font-bold ml-2">Retry</button></div>
                        : data && <>
                            <div className="flex flex-wrap justify-between gap-3 items-center">
                                <div><span className="text-3xl font-black text-slate-900">{number(data.total)}</span><span className="ml-2 text-sm text-slate-500">{status === 'all' ? 'orders' : `${status.toLowerCase()} orders`}</span></div>
                                <span className="text-sm text-slate-500">{new Date(data.startDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(data.endDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })} · IST</span>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3">
                                {statuses.map(name => <span key={name} className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[name] }} />{name}</span>)}
                            </div>
                            {data.total === 0 ? <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No matching orders for these filters.</div> :
                                <div className="overflow-x-auto mt-3">
                                    <svg viewBox="0 0 980 305" className="w-full min-w-[600px]" role="img" aria-labelledby={`${id}-chart-title ${id}-chart-desc`}>
                                        <title id={`${id}-chart-title`}>Order count by {data.granularity}</title>
                                        <desc id={`${id}-chart-desc`}>Orders grouped by date placed and current status in Asia/Kolkata. Exact values are available in the data table below.</desc>
                                        {[0, 1, 2, 3, 4].map(tick => <g key={tick}>
                                            <line x1="60" x2="940" y1={y(tick * step)} y2={y(tick * step)} stroke="#e2e8f0" strokeDasharray="4 4" />
                                            <text x="48" y={y(tick * step) + 4} textAnchor="end" fontSize="12" fill="#64748b">{number(tick * step)}</text>
                                        </g>)}
                                        {points.map((point, index) => (index % labelEvery === 0 || index === points.length - 1) && <text key={point.date} x={x(index)} y="280" textAnchor="middle" fontSize="11" fill="#64748b">{dateLabel(point.date, data.granularity === 'month')}</text>)}
                                        {statuses.map(name => <g key={name}>
                                            <polyline fill="none" stroke={COLORS[name]} strokeWidth="3" strokeLinejoin="round" strokeDasharray={name === 'Cancelled' ? '6 4' : undefined} points={points.map((point, index) => `${x(index)},${y(point.counts[name])}`).join(' ')} />
                                            {points.map((point, index) => <circle key={point.date} cx={x(index)} cy={y(point.counts[name])} r="4" fill={COLORS[name]} stroke="white" strokeWidth="1.5"><title>{dateLabel(point.date, data.granularity === 'month')} · {name}: {number(point.counts[name])}</title></circle>)}
                                        </g>)}
                                    </svg>
                                </div>}
                            <details className="mt-3 text-sm text-slate-600">
                                <summary className="cursor-pointer font-semibold w-fit">View trend data</summary>
                                <div className="overflow-auto max-h-72 mt-3">
                                    <table className="w-full text-sm text-left">
                                        <caption className="sr-only">Order counts by date placed and current status</caption>
                                        <thead className="sticky top-0 bg-slate-50"><tr><th scope="col" className="p-2">Date</th>{statuses.map(name => <th scope="col" className="p-2" key={name}>{name}</th>)}</tr></thead>
                                        <tbody>{points.map(point => <tr key={point.date} className="border-t border-slate-100"><th scope="row" className="p-2 font-medium">{dateLabel(point.date, data.granularity === 'month')}</th>{statuses.map(name => <td key={name} className="p-2">{number(point.counts[name])}</td>)}</tr>)}</tbody>
                                    </table>
                                </div>
                            </details>
                        </>}
            </div>
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">Grouped by order placed date and current status, not delivery date or past status changes. Weekly: last 7 days. Monthly: month to date. Three months: current and previous two months. Yearly: year to date, grouped by month. Times use IST. These filters apply only to this chart.</p>
        </section>
    );
}
