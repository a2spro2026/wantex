import { navigation } from '../config/navigation';

export function getPageMeta(pathname) {
    for (const group of navigation) {
        if (group.to === pathname) {
            return { title: group.label, icon: group.icon, subtitle: null };
        }
        for (const child of group.children || []) {
            if (pathname === child.to || pathname.startsWith(child.to + '/')) {
                return { title: child.label, subtitle: group.label, icon: child.icon };
            }
        }
    }
    return { title: 'BatiXpert', icon: null, subtitle: null };
}

export function getPageTitle(pathname) {
    return getPageMeta(pathname).title;
}
