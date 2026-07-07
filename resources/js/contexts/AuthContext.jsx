import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('wantex_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(!!localStorage.getItem('wantex_token'));

    useEffect(() => {
        if (localStorage.getItem('wantex_token')) {
            api.get('/user')
                .then((r) => {
                    setUser(r.data);
                    localStorage.setItem('wantex_user', JSON.stringify(r.data));
                })
                .catch(() => {
                    localStorage.removeItem('wantex_token');
                    localStorage.removeItem('wantex_user');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/login', { email, password });
        localStorage.setItem('wantex_token', data.token);
        localStorage.setItem('wantex_user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try { await api.post('/logout'); } catch {}
        localStorage.removeItem('wantex_token');
        localStorage.removeItem('wantex_user');
        setUser(null);
    };

    const can = (permission) => {
        if (user?.is_admin) return true;
        const perms = user?.permissions ?? [];
        if (perms.includes(permission)) return true;

        const parts = permission.split('.');
        if (parts.length === 2) {
            const [moduleOrSection, action] = parts;
            return perms.some((p) => (
                p.startsWith(`${moduleOrSection}.`) && p.endsWith(`.${action}`)
            ) || p.endsWith(`.${moduleOrSection}.${action}`));
        }

        return false;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, can }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
