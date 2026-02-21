import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Heart, Search, Menu, X, Phone, Mail, MapPin,
  ChevronDown, User, Package, Truck, Shield, Award, MessageCircle,
  Instagram, Twitter, Facebook, Youtube, LogOut, Settings,
} from "lucide-react";
import type { Category } from "@shared/schema";

function AnnouncementBar() {
  const { getSetting } = useSettings();
  const text = getSetting("announcement_text");
  if (!text) return null;
  return (
    <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs font-semibold tracking-wide" data-testid="announcement-bar">
      {text}
    </div>
  );
}

function UserMenu() {
  const [, setLocation] = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setLocation("/giris")}
          className="px-3 py-1.5 text-sm font-medium hover:text-primary transition-colors rounded-lg hover-elevate"
          data-testid="link-login"
        >
          Giriş
        </button>
        <Button
          size="sm"
          className="neon-glow text-xs"
          onClick={() => setLocation("/uye-ol")}
          data-testid="link-register"
        >
          Üye Ol
        </Button>
      </div>
    );
  }

  const isAdmin = user && ["super_admin", "admin"].includes(user.role);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 hover:text-primary transition-colors rounded-lg hover-elevate"
        data-testid="button-user-menu"
      >
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{user?.fullName?.charAt(0).toUpperCase()}</span>
        </div>
        <span className="text-sm font-medium hidden sm:inline max-w-[100px] truncate">{user?.fullName?.split(" ")[0]}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl py-2 z-50" data-testid="user-dropdown">
          <div className="px-4 py-2 border-b border-border mb-1">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setLocation("/admin"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              data-testid="link-admin-panel"
            >
              <Settings className="w-4 h-4" /> Admin Panel
            </button>
          )}
          <button
            onClick={() => { logout(); setOpen(false); setLocation("/"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left text-red-400"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}

function MobileAuthLinks({ onClose }: { onClose: () => void }) {
  const { user, isLoggedIn, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!isLoggedIn) {
    return (
      <>
        <Link href="/giris" onClick={onClose}>
          <span className="block px-4 py-3 rounded-lg hover:bg-muted text-sm font-medium cursor-pointer" data-testid="mobile-link-login">Giriş Yap</span>
        </Link>
        <Link href="/uye-ol" onClick={onClose}>
          <span className="block px-4 py-3 rounded-lg hover:bg-muted text-sm font-medium text-primary cursor-pointer" data-testid="mobile-link-register">Üye Ol</span>
        </Link>
      </>
    );
  }

  const isAdmin = user && ["super_admin", "admin"].includes(user.role);

  return (
    <>
      <div className="px-4 py-2 text-sm text-muted-foreground">{user?.fullName}</div>
      {isAdmin && (
        <Link href="/admin" onClick={onClose}>
          <span className="block px-4 py-3 rounded-lg hover:bg-muted text-sm font-medium cursor-pointer" data-testid="mobile-link-admin">Admin Panel</span>
        </Link>
      )}
      <button
        onClick={() => { logout(); onClose(); setLocation("/"); }}
        className="block w-full text-left px-4 py-3 rounded-lg hover:bg-muted text-sm font-medium text-red-400 cursor-pointer"
        data-testid="mobile-button-logout"
      >
        Çıkış Yap
      </button>
    </>
  );
}

function Header() {
  const [, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems } = useCart();
  const { getSetting } = useSettings();

  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/urunler?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border" data-testid="header">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" data-testid="link-home">
              {getSetting("logo_url") ? (
                <img src={getSetting("logo_url")} alt={getSetting("site_name") || "FitSupp"} className="h-10 w-auto object-contain" data-testid="img-logo" />
              ) : (
                <span className="text-2xl font-bold neon-text text-primary font-heading">
                  {getSetting("site_name") || "FitSupp"}
                </span>
              )}
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1" data-testid="nav-main">
            <Link href="/">
              <span className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors rounded-md hover-elevate cursor-pointer">
                Ana Sayfa
              </span>
            </Link>
            <div className="relative group">
              <button className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 rounded-md hover-elevate" data-testid="button-categories-menu">
                Kategoriler <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-0 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all pt-2 z-50">
                <div className="bg-card border border-border rounded-xl shadow-xl p-4 min-w-[280px]">
                  {categories.map((cat) => (
                    <Link key={cat.id} href={`/kategori/${cat.slug}`}>
                      <span className="block px-4 py-2.5 text-sm hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer" data-testid={`link-category-${cat.id}`}>
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/urunler">
              <span className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors rounded-md hover-elevate cursor-pointer">
                Tüm Ürünler
              </span>
            </Link>
            <Link href="/markalar">
              <span className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors rounded-md hover-elevate cursor-pointer">
                Markalar
              </span>
            </Link>
            <Link href="/supplement-sihirbazi">
              <span className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors rounded-md hover-elevate cursor-pointer" data-testid="link-wizard">
                Sihirbaz
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:text-primary transition-colors rounded-lg hover-elevate" data-testid="button-search">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/favoriler">
              <span className="p-2 hover:text-primary transition-colors rounded-lg hover-elevate relative cursor-pointer" data-testid="link-favorites">
                <Heart className="w-5 h-5" />
              </span>
            </Link>
            <Link href="/sepet">
              <span className="p-2 hover:text-primary transition-colors rounded-lg hover-elevate relative cursor-pointer" data-testid="link-cart">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground" data-testid="badge-cart-count">
                    {totalItems}
                  </Badge>
                )}
              </span>
            </Link>
            <UserMenu />
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-background px-4 py-3" data-testid="search-bar">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
            <Input
              placeholder="Ürün ara... (örn: whey protein)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
              data-testid="input-search"
            />
            <Button type="submit" className="neon-glow" data-testid="button-search-submit">Ara</Button>
          </form>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-4 space-y-1" data-testid="mobile-menu">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <span className="block px-4 py-3 rounded-lg hover:bg-muted text-sm font-medium cursor-pointer">Ana Sayfa</span>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/kategori/${cat.slug}`} onClick={() => setMobileMenuOpen(false)}>
              <span className="block px-4 py-3 rounded-lg hover:bg-muted text-sm cursor-pointer">{cat.name}</span>
            </Link>
          ))}
          <Link href="/urunler" onClick={() => setMobileMenuOpen(false)}>
            <span className="block px-4 py-3 rounded-lg hover:bg-muted text-sm font-medium cursor-pointer">Tüm Ürünler</span>
          </Link>
          <div className="border-t border-border mt-2 pt-2">
            <MobileAuthLinks onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

function AdvantagesBar() {
  return (
    <div className="bg-card border-b border-border" data-testid="advantages-bar">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, text: "500₺ Üzeri Ücretsiz Kargo" },
            { icon: Shield, text: "%100 Orijinal Ürün" },
            { icon: Package, text: "Aynı Gün Kargo" },
            { icon: Award, text: "Güvenli Ödeme" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 justify-center text-sm text-muted-foreground" data-testid={`advantage-${i}`}>
              <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const { getSetting } = useSettings();
  const { data: pages = [] } = useQuery<{ id: number; title: string; slug: string }[]>({ queryKey: ["/api/pages"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  return (
    <footer className="bg-card border-t border-border mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <span className="text-2xl font-bold neon-text text-primary font-heading">
              {getSetting("site_name") || "FitSupp"}
            </span>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {getSetting("site_description") || "Türkiye'nin En Güvenilir Supplement Mağazası"}
            </p>
            <div className="flex gap-3 mt-4">
              {getSetting("instagram") && (
                <a href={getSetting("instagram")} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:text-primary transition-colors" data-testid="link-instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {getSetting("twitter") && (
                <a href={getSetting("twitter")} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:text-primary transition-colors" data-testid="link-twitter">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {getSetting("facebook") && (
                <a href={getSetting("facebook")} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:text-primary transition-colors" data-testid="link-facebook">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {getSetting("youtube") && (
                <a href={getSetting("youtube")} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:text-primary transition-colors" data-testid="link-youtube">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" data-testid="text-footer-categories">Kategoriler</h3>
            <div className="space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <Link key={cat.id} href={`/kategori/${cat.slug}`}>
                  <span className="block text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid={`link-footer-cat-${cat.id}`}>
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" data-testid="text-footer-info">Bilgi</h3>
            <div className="space-y-2.5">
              {pages.map((page) => (
                <Link key={page.id} href={`/sayfa/${page.slug}`}>
                  <span className="block text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid={`link-footer-page-${page.id}`}>
                    {page.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" data-testid="text-footer-contact">İletişim</h3>
            <div className="space-y-3">
              {getSetting("phone") && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{getSetting("phone")}</span>
                </div>
              )}
              {getSetting("email") && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{getSetting("email")}</span>
                </div>
              )}
              {getSetting("address") && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{getSetting("address")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {getSetting("site_name") || "FitSupp"}. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  const { getSetting } = useSettings();
  const whatsapp = getSetting("whatsapp");
  if (!whatsapp) return null;
  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
      data-testid="button-whatsapp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <AdvantagesBar />
      <main className="flex-1" data-testid="main-content">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
