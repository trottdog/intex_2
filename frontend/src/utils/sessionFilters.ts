import type { SessionUser } from '../app/session'
import type { Resident, Safehouse } from '../data/mockData'

export function filterResidentsForSessionUser(user: SessionUser, residents: Resident[]): Resident[] {
  if (user.role === 'super-admin') return residents
  if (user.role === 'admin' && user.safehouseIds?.length) {
    const allowed = new Set(user.safehouseIds)
    return residents.filter((r) => allowed.has(r.safehouseId))
  }
  return residents
}

export function filterSafehousesForSessionUser(user: SessionUser, safehouses: Safehouse[]): Safehouse[] {
  if (user.role === 'super-admin') return safehouses
  if (user.role === 'admin' && user.safehouseIds?.length) {
    const allowed = new Set(user.safehouseIds)
    return safehouses.filter((s) => allowed.has(s.safehouseId))
  }
  return safehouses
}

export function canSessionUserAccessResident(user: SessionUser, resident: Resident): boolean {
  if (user.role === 'super-admin') return true
  if (user.role === 'admin') {
    if (!user.safehouseIds?.length) return true
    return user.safehouseIds.includes(resident.safehouseId)
  }
  return false
}

export function canSessionUserAccessSafehouse(user: SessionUser, safehouseId: number): boolean {
  if (user.role === 'super-admin') return true
  if (user.role === 'admin') {
    if (!user.safehouseIds?.length) return true
    return user.safehouseIds.includes(safehouseId)
  }
  return false
}
