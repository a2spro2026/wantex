import { navigation } from './navigation';

export const EMAIL_DOMAIN = '@wantex.ma';

export const PERMISSION_ACTIONS = [
    { key: 'view', label: 'Voir', short: 'V' },
    { key: 'create', label: 'Saisir', short: 'S' },
    { key: 'edit', label: 'Modifier', short: 'M' },
    { key: 'import', label: 'Importer', short: 'I' },
    { key: 'delete', label: 'Supprimer', short: 'X' },
    { key: 'print', label: 'Imprimer', short: 'P' },
    { key: 'export', label: 'Exporter', short: 'E' },
];

export function permissionSlug(sectionId, moduleKey, action) {
    return `${sectionId}.${moduleKey}.${action}`;
}

// Sous-éléments explicites pour les sections sans sous-menu (ex. Tableau de Bord).
// Permet de choisir précisément quoi afficher.
const VIEW_ONLY = ['view'];

const SECTION_MODULE_OVERRIDES = {
    dashboard: [
        { key: 'total-debit', label: 'Carte — Total Débit', to: '/', actions: VIEW_ONLY },
        { key: 'credit-instance', label: 'Carte — Crédit en Instance', to: '/', actions: VIEW_ONLY },
        { key: 'valeur-stock', label: 'Carte — Valeur Stock Dépôt', to: '/', actions: VIEW_ONLY },
        { key: 'total-charges', label: 'Carte — Total Charges', to: '/', actions: VIEW_ONLY },
        { key: 'clients-actifs', label: 'Carte — Clients Actifs', to: '/', actions: VIEW_ONLY },
        { key: 'tableaux', label: 'Tableaux analytiques', to: '/', actions: ['view', 'export', 'print'] },
    ],
};

export function moduleActions(module) {
    if (!module?.actions) return PERMISSION_ACTIONS;
    return PERMISSION_ACTIONS.filter((a) => module.actions.includes(a.key));
}

export function buildPermissionMatrix() {
    return navigation.map((section) => {
        let modules;

        if (SECTION_MODULE_OVERRIDES[section.id]) {
            modules = SECTION_MODULE_OVERRIDES[section.id].map((m) => ({
                ...m,
                parentLabel: section.label,
                fullLabel: `${section.label} → ${m.label}`,
            }));
        } else if (section.children) {
            modules = section.children.map((child) => {
                const parts = child.to.split('/').filter(Boolean);
                const moduleKey = parts[parts.length - 1];

                return {
                    key: moduleKey,
                    label: child.label,
                    parentLabel: section.label,
                    fullLabel: `${section.label} → ${child.label}`,
                    to: child.to,
                };
            });
        } else {
            modules = [{
                key: 'main',
                label: section.label,
                parentLabel: section.label,
                fullLabel: section.label,
                to: section.to,
            }];
        }

        return {
            id: section.id,
            label: section.label,
            modules,
        };
    });
}

export function allPermissionSlugs() {
    const matrix = buildPermissionMatrix();

    return matrix.flatMap((section) => (
        section.modules.flatMap((module) => (
            moduleActions(module).map((action) => permissionSlug(section.id, module.key, action.key))
        ))
    ));
}

export function moduleSlugs(sectionId, moduleKey) {
    const matrix = buildPermissionMatrix();
    const section = matrix.find((s) => s.id === sectionId);
    const module = section?.modules.find((m) => m.key === moduleKey);
    const actions = module ? moduleActions(module) : PERMISSION_ACTIONS;

    return actions.map((action) => permissionSlug(sectionId, moduleKey, action.key));
}
