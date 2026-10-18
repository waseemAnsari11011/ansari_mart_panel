import { customerText } from '../../utils/customerLabels';
import { formatPrice } from '../../utils/formatPrice';
import { useEffect, useId, useState } from 'react';
import api from '../../utils/api';

const newRule = () => ({ name: '', active: false, customerType: 'All', firstOrderOnly: false, threshold: 0, minSubtotal: 0, maxSubtotal: null, productPrices: [], discountType: 'fixed', value: 50 });

export function ProductPicker({ products, value, onChange, inputClass }) {
    const [search, setSearch] = useState('');
    const id = useId();
    const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const matches = products.filter(product => {
        const text = `${product.name || ''} ${product.brand || ''}`.toLocaleLowerCase();
        return terms.every(term => text.includes(term));
    });
    const selected = products.find(product => product._id === value);
    const selectedOutsideResults = selected && !matches.some(product => product._id === value);

    return <div className="space-y-2 min-w-0">
        <label className="block" htmlFor={`${id}-search`}>Search products</label>
        <input
            id={`${id}-search`}
            type="search"
            className={inputClass}
            placeholder="Search by name or brand"
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }}
            aria-controls={`${id}-products`}
        />
        <label className="block" htmlFor={`${id}-products`}>Product</label>
        <select id={`${id}-products`} required className={inputClass} value={value} onChange={event => onChange(event.target.value)}>
            <option value="">Select product</option>
            {value && !selected && <option value={value}>Unavailable product — select again</option>}
            {selectedOutsideResults && <option value={selected._id}>{selected.name} (selected)</option>}
            {matches.map(product => <option key={product._id} value={product._id}>{product.name}{product.brand ? ` — ${product.brand}` : ''}</option>)}
        </select>
        {search.trim() && <p role="status" className="text-xs text-slate-500">
            {matches.length ? `${matches.length} matching product${matches.length === 1 ? '' : 's'}` : 'No matching products. Try another name or brand.'}
        </p>}
    </div>;
}

export default function DiscountSettings({ initialRules, onSave }) {
    const [rules, setRules] = useState(() => (initialRules || []).map(rule => ({ ...rule, threshold: rule.threshold ?? rule.maxSubtotal ?? rule.minSubtotal ?? 0, productPrices: rule.productPrices || [] })));
    const [products, setProducts] = useState([]);
    const [productError, setProductError] = useState('');
    const [productLoading, setProductLoading] = useState(true);
    const [productReload, setProductReload] = useState(0);
    useEffect(() => {
        let active = true;
        async function load() {
            setProductLoading(true);
            setProductError('');
            try {
                let page = 1;
                let pages = 1;
                const all = [];
                do {
                    const { data } = await api.get('/products', { params: { page, limit: 100 } });
                    all.push(...data.products);
                    pages = data.pages;
                    page += 1;
                } while (page <= pages && active);
                if (active) setProducts(all);
            } catch {
                if (active) setProductError('Could not load products.');
            } finally {
                if (active) setProductLoading(false);
            }
        }
        load();
        return () => { active = false; };
    }, [productReload]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [failed, setFailed] = useState(false);
    const change = (index, field, value) => {
        setRules(current => current.map((rule, i) => i === index ? { ...rule, [field]: value } : rule));
        setMessage('');
    };
    const save = async event => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const discountRules = rules.map(rule => ({ ...rule, value: ['product_price', 'order_product_price'].includes(rule.discountType) ? 0 : Number(rule.value), threshold: rule.discountType === 'product_price' ? 0 : Number(rule.threshold), minSubtotal: 0, maxSubtotal: null, productPrices: ['product_price', 'order_product_price'].includes(rule.discountType) ? rule.productPrices.map(item => ({ ...item, tierIndex: Number(item.tierIndex), offerPrice: Number(item.offerPrice) })) : [] }));
            const { data } = await api.put('/settings/discounts', { discountRules });
            onSave(data.settings);
            setFailed(false);
            setMessage('Discount rules saved. Active offers apply automatically at checkout.');
        } catch (error) {
            setFailed(true);
            setMessage(error.response?.data?.message || 'Could not save discounts. Please try again.');
        } finally {
            setSaving(false);
        }
    };
    const input = 'w-full border border-slate-300 rounded-lg p-2 mt-1 text-slate-900 bg-white';
    return (
        <form onSubmit={save} className="bg-white rounded-3xl border border-slate-200 p-8 text-slate-900 space-y-5">
            <div>
                <h3 className="text-lg font-black">Automatic discounts</h3>
                <p className="text-sm text-slate-500 mt-1">The largest eligible offer applies. Offers do not stack. Fixed and percentage offers require the items total to exceed the order value threshold. Product offers discount one unit per order. Choose Product offer on order value to require a minimum items total; regular product offers have no minimum spend.</p>
                <p className="text-sm text-slate-500 mt-1">First order means no previous orders, including cancelled orders. Existing orders retain the rules saved when placed.</p>
            </div>
            <fieldset disabled={saving} className="space-y-5">
                {rules.length === 0 && <p className="text-slate-500">No discount rules yet. Add a rule or start with an example.</p>}
                {rules.map((rule, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 p-5 space-y-4">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <label>Offer name<input className={input} required maxLength={100} value={customerText(rule.name)} onChange={e => change(index, 'name', e.target.value)} /></label>
                            <label>Customers<select className={input} value={rule.customerType} onChange={e => change(index, 'customerType', e.target.value)}><option>All</option><option value="Retail">Customer</option><option>Business</option></select></label>
                            <label>Discount type<select className={input} value={rule.discountType} onChange={e => change(index, 'discountType', e.target.value)}><option value="fixed">Fixed amount (₹)</option><option value="percentage">Percentage (%)</option><option value="product_price">Product offer price (₹)</option><option value="order_product_price">Product offer on order value (₹)</option></select></label>
                            {!['product_price', 'order_product_price'].includes(rule.discountType) && <label>Discount ({rule.discountType === 'fixed' ? '₹' : '%'})<input className={input} type="number" min="0.01" max={rule.discountType === 'percentage' ? 100 : 10000000} step="0.01" required value={rule.value} onChange={e => change(index, 'value', e.target.value)} /></label>}
                            {rule.discountType !== 'product_price' && <label>{rule.discountType === 'order_product_price' ? 'Minimum items total (₹)' : 'Order value must exceed (₹)'}<input className={input} type="number" min="0" max="10000000" step="0.01" required value={rule.threshold} onChange={e => change(index, 'threshold', e.target.value)} /><span className="text-xs text-slate-500">{rule.discountType === 'order_product_price' ? `Items total ₹${formatPrice(rule.threshold || 0)} or more: offer applies. Delivery is excluded.` : `Above ₹${formatPrice(rule.threshold || 0)}: offer applies.`}</span></label>}
                        </div>
                        {['product_price', 'order_product_price'].includes(rule.discountType) && <div className="space-y-3">
                            <p className="text-sm text-slate-500">Select multiple products and set an offer price for each. Only ONE unit of ONE eligible product receives the offer per order, choosing the biggest saving. All remaining products and quantities stay at normal price. {rule.discountType === 'order_product_price' ? 'The items total must reach the minimum order value. Delivery charges do not count.' : 'No order value requirement.'} Products must already be in the cart. Set offer price to ₹0 for a free unit. For All customers, the option index applies to both Customer and Business.</p>
                            {productLoading && <p>Loading products…</p>}
                            {productError && <p role="alert">{productError} <button type="button" onClick={() => setProductReload(value => value + 1)}>Retry</button></p>}
                            {rule.productPrices.map((selected, productIndex) => {
                                const product = products.find(item => item._id === selected.product);
                                const tiers = product?.[rule.customerType === 'Business' ? 'businessPricing' : 'retailPricing'] || [];
                                const updateProduct = patch => change(index, 'productPrices', rule.productPrices.map((item, i) => i === productIndex ? { ...item, ...patch } : item));
                                return <div key={productIndex} className="grid md:grid-cols-4 gap-3 text-sm border rounded-lg p-3">
                                    <ProductPicker
                                        key={selected.product || 'unselected'}
                                        products={products}
                                        value={selected.product}
                                        onChange={product => updateProduct({ product, tierIndex: 0 })}
                                        inputClass={input}
                                    />
                                    <label>Pack / option<select required className={input} value={selected.tierIndex} onChange={e => updateProduct({ tierIndex: Number(e.target.value) })}>
                                        {!tiers.length && <option value="">Select a product first</option>}
                                        {tiers.map((tier, i) => <option key={i} value={i}>{tier.label || tier.unit || `Option ${i + 1}`} — ₹{formatPrice(tier.price)}</option>)}
                                    </select></label>
                                    <label>Offer price per unit (₹)<input required className={input} type="number" min="0" max="10000000" step="0.01" value={selected.offerPrice} onChange={e => updateProduct({ offerPrice: e.target.value })} /></label>
                                    <button type="button" className="text-red-600" onClick={() => change(index, 'productPrices', rule.productPrices.filter((_, i) => i !== productIndex))}>Remove product</button>
                                </div>;
                            })}
                            <button type="button" className="border rounded-lg p-2" disabled={productLoading || !!productError || rule.productPrices.length >= 100} onClick={() => change(index, 'productPrices', [...rule.productPrices, { product: '', tierIndex: 0, offerPrice: 1 }])}>+ Select product</button>
                        </div>}
                        <div className="flex flex-wrap gap-5 text-sm">
                            <label><input type="checkbox" checked={rule.active} onChange={e => change(index, 'active', e.target.checked)} /> Active</label>
                            <label><input type="checkbox" checked={rule.firstOrderOnly} onChange={e => change(index, 'firstOrderOnly', e.target.checked)} /> First order only</label>
                            <button type="button" className="text-red-600 ml-auto" onClick={() => setRules(current => current.filter((_, i) => i !== index))}>Remove offer</button>
                        </div>
                    </div>
                ))}
                <div className="flex flex-wrap gap-3 text-sm">
                    <button type="button" className="border rounded-lg p-3" disabled={rules.length >= 50} onClick={() => setRules([...rules, newRule()])}>+ Add offer</button>
                    <button type="button" className="border rounded-lg p-3" disabled={rules.length >= 50} onClick={() => setRules([...rules, { ...newRule(), name: 'Free product on ₹1,000 shopping', discountType: 'order_product_price', threshold: 1000, value: 0, productPrices: [{ product: '', tierIndex: 0, offerPrice: 0 }] }])}>Example: Free product on ₹1,000</button>
                    <button type="button" className="border rounded-lg p-3" disabled={rules.length >= 50} onClick={() => setRules([...rules, { ...newRule(), name: '₹50 off orders above ₹2,000', threshold: 2000 }])}>Example: ₹50 off above ₹2,000</button>
                    <button type="button" className="border rounded-lg p-3" disabled={rules.length >= 50} onClick={() => setRules([...rules, { ...newRule(), name: '₹100 off your first order', value: 100, firstOrderOnly: true }])}>Example: ₹100 off first order</button>
                    <button type="submit" className="bg-green-600 text-white rounded-lg p-3 font-bold ml-auto">{saving ? 'Saving…' : 'Save discount rules'}</button>
                </div>
            </fieldset>
            {message && <p role="status" className={failed ? 'text-red-600' : 'text-green-700'}>{message}</p>}
        </form>
    );
}
