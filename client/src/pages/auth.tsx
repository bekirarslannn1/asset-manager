import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Mail, Lock, User as UserIcon, Phone } from "lucide-react";

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isLoggedIn, isLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  useEffect(() => {
    if (isLoggedIn) setLocation("/");
  }, [isLoggedIn, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast({ title: "Hata", description: "Tüm alanları doldurunuz", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast({ title: "Başarılı", description: "Giriş yapıldı" });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoggedIn) return null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" data-testid="text-login-title">Giriş Yap</h1>
            <p className="text-muted-foreground text-sm">Hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">E-posta veya Kullanıcı Adı</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="E-posta veya kullanıcı adınız"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="pl-10"
                  data-testid="input-login-username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifreniz"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 pr-10"
                  data-testid="input-login-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full neon-glow" disabled={loading} data-testid="button-login-submit">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Giriş Yap
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <button onClick={() => setLocation("/uye-ol")} className="text-primary hover:underline font-medium" data-testid="link-go-register">
              Üye Ol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register, isLoggedIn, isLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });

  useEffect(() => {
    if (isLoggedIn) setLocation("/");
  }, [isLoggedIn, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.username || !form.email || !form.password) {
      toast({ title: "Hata", description: "Zorunlu alanları doldurunuz", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Hata", description: "Şifre en az 6 karakter olmalıdır", variant: "destructive" });
      return;
    }
    if (form.password !== form.passwordConfirm) {
      toast({ title: "Hata", description: "Şifreler eşleşmiyor", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      toast({ title: "Başarılı", description: "Hesabınız oluşturuldu" });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoggedIn) return null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12" data-testid="register-page">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" data-testid="text-register-title">Üye Ol</h1>
            <p className="text-muted-foreground text-sm">Hemen ücretsiz üye olun</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Adınız Soyadınız"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="pl-10"
                  data-testid="input-register-fullname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-username">Kullanıcı Adı *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-username"
                  placeholder="Kullanıcı adınız"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="pl-10"
                  data-testid="input-register-username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">E-posta *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10"
                  data-testid="input-register-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-phone"
                  placeholder="05XX XXX XX XX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="pl-10"
                  data-testid="input-register-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password">Şifre *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="En az 6 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 pr-10"
                  data-testid="input-register-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-register-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password-confirm">Şifre Tekrar *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-password-confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi tekrar girin"
                  value={form.passwordConfirm}
                  onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                  className="pl-10"
                  data-testid="input-register-password-confirm"
                />
              </div>
            </div>

            <Button type="submit" className="w-full neon-glow" disabled={loading} data-testid="button-register-submit">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Üye Ol
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Zaten üye misiniz?{" "}
            <button onClick={() => setLocation("/giris")} className="text-primary hover:underline font-medium" data-testid="link-go-login">
              Giriş Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
