import { NavItem } from './nav-item/nav-item';
import { navItems } from './sidebar-data';

function normalizePath(path: string): string {
  return (path || '/').split('?')[0].replace(/\/+$/, '') || '/';
}

function collectNavRoutes(items: NavItem[]): string[] {
  const routes: string[] = [];
  for (const item of items) {
    if (item.route && item.route !== '/menu-level') {
      routes.push(normalizePath(item.route));
    }
    if (item.children?.length) {
      routes.push(...collectNavRoutes(item.children));
    }
  }
  return routes;
}

let cachedRoutes: string[] | null = null;

function allNavRoutes(): string[] {
  if (!cachedRoutes) {
    cachedRoutes = collectNavRoutes(navItems);
  }
  return cachedRoutes;
}

/** Ruta del menú que mejor coincide con la URL actual (la más específica). */
export function bestMatchingNavRoute(url: string): string | null {
  const normalizedUrl = normalizePath(url);
  let best: string | null = null;

  for (const route of allNavRoutes()) {
    if (normalizedUrl === route || normalizedUrl.startsWith(route + '/')) {
      if (!best || route.length > best.length) {
        best = route;
      }
    }
  }

  return best;
}

export function isNavItemRouteActive(
  itemRoute: string | undefined,
  currentUrl: string
): boolean {
  if (!itemRoute || itemRoute === '/menu-level') return false;
  const route = normalizePath(itemRoute);
  return bestMatchingNavRoute(currentUrl) === route;
}
