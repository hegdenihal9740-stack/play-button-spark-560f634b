import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Instagram, Mail, MessageCircle, MoreVertical, Phone, UserRound, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cart, useCart } from '@/lib/cart';
import { supabase } from '@/integrations/supabase/client';

// Contact links — placeholders until the owner shares real accounts.
const contacts = [
  { label: 'WhatsApp', icon: MessageCircle, href: '#' },
  { label: 'Instagram', icon: Instagram, href: '#' },
  { label: 'Email', icon: Mail, href: '#' },
];

const CUSTOMER_KEY = 'pf-customer';
const DEMO_OTP = '123456';
export type LocalCustomer = { name: string; mobile: string };
export const getLocalCustomer = (): LocalCustomer | null => {
  try { const r = localStorage.getItem(CUSTOMER_KEY); return r ? (JSON.parse(r) as LocalCustomer) : null; } catch { return null; }
};

function MobileLogin({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const phone = `+91${mobile}`;
  const send = async () => {
    if (!name.trim()) { toast.error('Enter your name'); return; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { toast.error('Enter a valid 10-digit mobile number'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true, data: { display_name: name.trim() } } });
    setBusy(false);
    if (error) {
      // No SMS provider configured yet — fall back to a demo code so login still works.
      setDemo(true); setSent(true);
      toast.info(`SMS not set up yet. Use demo code ${DEMO_OTP}`, { duration: 10000 });
      return;
    }
    setDemo(false); setSent(true); toast.success(`OTP sent to ${phone}`);
  };
  const verify = async () => {
    if (demo) {
      if (otp !== DEMO_OTP) { toast.error('Wrong code. Try again.'); return; }
    } else {
      setBusy(true);
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
    }
    const data = null;
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: name.trim(), mobile }));
    window.dispatchEvent(new Event('pf-customer'));
    toast.success(`Welcome, ${name.trim()}!`);
    onOpenChange(false); setSent(false); setOtp('');
    void data;
  };
  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    setBusy(false);
    if (result.error) { toast.error('Google sign-in failed. Please try again.'); return; }
    if (!result.redirected) onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="shop-login">
      <DialogTitle className="shop-login-title">Login / Register</DialogTitle>
      <button type="button" className="fk-buy shop-login-btn" disabled={busy} onClick={google}>Continue with Google</button>
      <DialogDescription className="shop-login-sub">Or get a one-time code (OTP) on your mobile number.</DialogDescription>
      <input className="shop-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} disabled={sent} />
      <div className="shop-phone"><span>+91</span><input inputMode="numeric" maxLength={10} placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} disabled={sent} /></div>
      {sent && <input className="shop-input" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />}
      <button type="button" className="fk-buy shop-login-btn" disabled={busy} onClick={sent ? verify : send}>{busy ? 'Please wait…' : sent ? 'Verify OTP' : 'Send OTP'}</button>
    </DialogContent>
  </Dialog>;
}

export function ShopHeader() {
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);
  const [customer, setCustomer] = useState<LocalCustomer | null>(null);
  useEffect(() => {
    const read = () => setCustomer(getLocalCustomer());
    const fromSession = (user: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined) => {
      if (!user || getLocalCustomer()) return;
      const name = String(user.user_metadata?.['full_name'] ?? user.user_metadata?.['name'] ?? user.email ?? 'Customer');
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, mobile: '' }));
      read();
    };
    read();
    void supabase.auth.getUser().then(({ data }) => fromSession(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') { fromSession(session?.user); toast.success('Signed in with Google'); }
    });
    window.addEventListener('pf-customer', read);
    return () => { window.removeEventListener('pf-customer', read); sub.subscription.unsubscribe(); };
  }, []);
  const { count } = useCart();
  return <header className="shop-header">
    <div className="shop-menu-wrap">
      <button type="button" className="shop-icon-btn" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><MoreVertical size={20} /></button>
      {menu && <div className="shop-menu">
        <p className="shop-menu-label"><Phone size={14} /> Contact</p>
        <div className="shop-contacts">{contacts.map(({ label, icon: Icon, href }) => <a key={label} href={href} aria-label={label} title={label} className="shop-contact"><Icon size={20} /><span>{label}</span></a>)}</div>
      </div>}
    </div>
    <Link to="/" className="shop-brand">Private Flight</Link>
    <div className="shop-right">
      <button type="button" className="shop-icon-btn" aria-label="Open bag" onClick={() => cart.setOpen(true)}><ShoppingBag size={19} />{count > 0 && <span className="shop-count">{count}</span>}</button>
      {customer ? <button type="button" className="shop-login-link" onClick={() => { localStorage.removeItem(CUSTOMER_KEY); window.dispatchEvent(new Event('pf-customer')); toast.success('Logged out'); }}><UserRound size={16} /> {customer.name.split(' ')[0]} · Logout</button>
        : <button type="button" className="shop-login-link" onClick={() => setLogin(true)}><UserRound size={16} /> Login / Register</button>}
    </div>
    <MobileLogin open={login} onOpenChange={setLogin} />
  </header>;
}
