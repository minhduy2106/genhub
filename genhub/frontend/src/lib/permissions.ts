import type { AuthUser } from '@/lib/stores/auth.store';

export function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? '';
}

export function isOwner(user?: AuthUser | null) {
  return normalizeRole(user?.role) === 'owner';
}

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string,
) {
  if (!user) return false;
  if (isOwner(user)) return true;
  return user.permissions.includes(permission);
}

export function canAccessPath(
  user: AuthUser | null | undefined,
  pathname: string,
) {
  if (!user) return false;

  if (pathname.startsWith('/dashboard')) {
    return hasPermission(user, 'reports:view');
  }

  if (pathname.startsWith('/reports')) {
    return hasPermission(user, 'reports:view');
  }

  if (pathname.startsWith('/settings')) {
    return isOwner(user);
  }

  if (pathname.startsWith('/products')) {
    return hasPermission(user, 'products:view');
  }

  if (pathname.startsWith('/inventory')) {
    return hasPermission(user, 'inventory:view');
  }

  if (pathname.startsWith('/orders')) {
    return hasPermission(user, 'orders:view');
  }

  if (pathname.startsWith('/customers')) {
    return hasPermission(user, 'customers:view');
  }

  if (pathname.startsWith('/pos')) {
    return (
      hasPermission(user, 'orders:create') &&
      hasPermission(user, 'products:view')
    );
  }

  return true;
}

export function getDefaultAuthorizedPath(user: AuthUser | null | undefined) {
  if (!user) return '/login';
  if (hasPermission(user, 'reports:view')) return '/dashboard';
  if (hasPermission(user, 'orders:create')) return '/pos';
  if (hasPermission(user, 'orders:view')) return '/orders';
  if (hasPermission(user, 'inventory:view')) return '/inventory';
  if (hasPermission(user, 'products:view')) return '/products';
  if (hasPermission(user, 'customers:view')) return '/customers';
  return '/profile';
}
