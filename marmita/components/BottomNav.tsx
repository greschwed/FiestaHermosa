'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

const items = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/insumos', label: 'Insumos', icon: 'package' },
  { href: '/receitas', label: 'Receitas', icon: 'book' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottomnav">
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link key={href} href={href} className={`navitem${active ? ' active' : ''}`}>
            <Icon name={icon} size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
