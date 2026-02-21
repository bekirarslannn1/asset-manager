import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import ThemeEngine from "@/components/theme-engine";
import CookieConsent from "@/components/cookie-consent";
import HomePage from "@/pages/home";
import ProductsPage from "@/pages/products";
import ProductDetailPage from "@/pages/product-detail";
import CategoryPage from "@/pages/category";
import CartPage from "@/pages/cart";
import FavoritesPage from "@/pages/favorites";
import BrandsPage from "@/pages/brands";
import StaticPage from "@/pages/static-page";
import CheckoutPage from "@/pages/checkout";
import { LoginPage, RegisterPage } from "@/pages/auth";
import AdminPage from "@/pages/admin";
import SupplementWizardPage from "@/pages/supplement-wizard";
import BlogPage from "@/pages/blog";
import BlogDetailPage from "@/pages/blog-detail";
import SeoHead from "@/components/seo-head";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/urunler" component={ProductsPage} />
        <Route path="/urun/:slug" component={ProductDetailPage} />
        <Route path="/kategori/:slug" component={CategoryPage} />
        <Route path="/sepet" component={CartPage} />
        <Route path="/favoriler" component={FavoritesPage} />
        <Route path="/markalar" component={BrandsPage} />
        <Route path="/sayfa/:slug" component={StaticPage} />
        <Route path="/odeme" component={CheckoutPage} />
        <Route path="/giris" component={LoginPage} />
        <Route path="/uye-ol" component={RegisterPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/supplement-sihirbazi" component={SupplementWizardPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/blog/:slug" component={BlogDetailPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeEngine />
        <SeoHead />
        <Toaster />
        <Router />
        <CookieConsent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
