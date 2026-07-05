export interface NavItem { id: string; icon: string; label: string; route?: string; badge?: number; }
export interface NavSection { id: string; label: string; items: NavItem[]; }
