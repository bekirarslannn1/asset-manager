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
import AdminPage from "@/pages/admin";
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
        <Route path="/admin" component={AdminPage} />
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
        <Toaster />
        <Router />
        <CookieConsent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
