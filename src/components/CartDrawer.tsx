import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cart, useCart } from '@/lib/cart';
import { watches } from '@/lib/watches';
import { Button } from '@/components/ui/button';

export function CartDrawer() {
  const { items, open, count } = useCart();
  return <>
    <button type="button" className="cart-fab" onClick={() => cart.setOpen(true)} aria-label={`Open cart, ${count} items`}>
      <ShoppingBag size={18} />
      {count > 0 && <span className="cart-badge">{count}</span>}
    </button>
    <Sheet open={open} onOpenChange={cart.setOpen}>
      <SheetContent className="cart-sheet">
        <SheetHeader>
          <SheetTitle className="cart-title">Your bag</SheetTitle>
          <SheetDescription>Complimentary insured courier delivery.</SheetDescription>
        </SheetHeader>
        {items.length === 0 ? <p className="cart-empty">Your bag is empty. Add a timepiece from the collection.</p> :
          <ul className="cart-list">{items.map(item => {
            const w = watches.find(x => x.id === item.id);
            if (!w) return null;
            return <li key={item.id} className="cart-row">
              <img src={w.image} alt="" />
              <div className="cart-row-info">
                <strong>{w.name}</strong><small>{w.finish}</small>
                <div className="cart-qty">
                  <button type="button" aria-label="Decrease" onClick={() => cart.setQty(item.id, item.qty - 1)}><Minus size={13} /></button>
                  <span>{item.qty}</span>
                  <button type="button" aria-label="Increase" onClick={() => cart.setQty(item.id, item.qty + 1)}><Plus size={13} /></button>
                  <button type="button" aria-label="Remove" className="cart-remove" onClick={() => cart.setQty(item.id, 0)}><Trash2 size={14} /></button>
                </div>
              </div>
            </li>;
          })}</ul>}
        {items.length > 0 && <div className="cart-footer">
          
          <Button type="button" className="cart-checkout" onClick={() => toast.info('Checkout is not available yet. No order has been placed and your bag has been kept.')}>Checkout</Button>
        </div>}
      </SheetContent>
    </Sheet>
  </>;
}
