import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link } from 'react-router-dom';
import { supabase, supabaseAuth } from '../lib/supabase';
import { renderBadge } from './UserRoleBadge';

const Navbar: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [loginConsent, setLoginConsent] = useState(false);
    const userMenuTimeoutRef = React.useRef<any>(null);

    const handleMouseEnterUser = () => {
        if (userMenuTimeoutRef.current) {
            clearTimeout(userMenuTimeoutRef.current);
            userMenuTimeoutRef.current = null;
        }
        setShowUserMenu(true);
    };

    const handleMouseLeaveUser = () => {
        userMenuTimeoutRef.current = setTimeout(() => {
            setShowUserMenu(false);
        }, 250);
    };

    const [unreadSections, setUnreadSections] = useState<Record<string, boolean>>({
        noticias: false,
        dinamicas: false,
        minijuegos: false
    });

    // Check last visited vs latest content timestamps
    const checkUnreadStatus = async () => {
        try {
            const [
                { data: dinamicasData },
                { data: minigamesData }
            ] = await Promise.all([
                supabase.from('content_items').select('created_at').order('created_at', { ascending: false }).limit(1),
                supabaseAuth.from('minigames_content').select('updated_at').order('updated_at', { ascending: false }).limit(1)
            ]);

            const lastDinamicasTime = dinamicasData && dinamicasData[0] ? new Date(dinamicasData[0].created_at).getTime() : 0;
            const lastMinigamesTime = minigamesData && minigamesData[0] ? new Date(minigamesData[0].updated_at).getTime() : 0;

            const readNewsTime = parseInt(localStorage.getItem('last_read_noticias') || '0', 10);
            const readDinamicasTime = parseInt(localStorage.getItem('last_read_dinamicas') || '0', 10);
            const readMinigamesTime = parseInt(localStorage.getItem('last_read_minijuegos') || '0', 10);

            setUnreadSections({
                noticias: false,
                dinamicas: lastDinamicasTime > readDinamicasTime,
                minijuegos: lastMinigamesTime > readMinigamesTime
            });
        } catch (err) {
            console.error("Error checking unread status:", err);
        }
    };

    const handleSectionClick = (section: string) => {
        localStorage.setItem(`last_read_${section}`, Date.now().toString());
        setUnreadSections(prev => ({ ...prev, [section]: false }));
    };

    const fetchProfile = async (userId: string, authUser?: any) => {
        try {
            const { data } = await supabaseAuth
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                let currentProfile = data;
                if (authUser) {
                    const metaAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || authUser.user_metadata?.profile_image_url;
                    const metaUsername = authUser.user_metadata?.preferred_username || authUser.user_metadata?.name || authUser.user_metadata?.full_name;

                    const needsUpdate = 
                        (metaAvatar && data.avatar_url !== metaAvatar) || 
                        (metaUsername && data.username !== metaUsername);

                    if (needsUpdate) {
                        const updates: any = {};
                        if (metaAvatar) updates.avatar_url = metaAvatar;
                        if (metaUsername) updates.username = metaUsername;

                        const { data: updatedData } = await supabaseAuth
                            .from('profiles')
                            .update(updates)
                            .eq('id', userId)
                            .select()
                            .maybeSingle();

                        if (updatedData) {
                            currentProfile = updatedData;
                        }
                    }
                }
                setProfile(currentProfile);
            } else if (authUser) {
                // Si el perfil aún no existe en DB, crearlo / upsert con datos de auth
                const metaAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || authUser.user_metadata?.profile_image_url || '';
                const metaUsername = authUser.user_metadata?.preferred_username || authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'Usuario';
                
                const { data: createdProfile } = await supabaseAuth
                    .from('profiles')
                    .upsert({
                        id: userId,
                        username: metaUsername,
                        avatar_url: metaAvatar,
                        role: 'usuario',
                        points: 0
                    }, { onConflict: 'id' })
                    .select()
                    .maybeSingle();

                if (createdProfile) {
                    setProfile(createdProfile);
                } else {
                    setProfile({
                        id: userId,
                        username: metaUsername,
                        avatar_url: metaAvatar,
                        role: 'usuario',
                        points: 0
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching profile in Navbar:", err);
            if (authUser) {
                setProfile({
                    id: userId,
                    username: authUser.user_metadata?.preferred_username || authUser.user_metadata?.name || 'Usuario',
                    avatar_url: authUser.user_metadata?.avatar_url || '',
                    role: 'usuario',
                    points: 0
                });
            }
        }
    };

    useEffect(() => {
        checkUnreadStatus();

        // Realtime channels to light up glowing dots instantly when new content is added
        const contentChannel = supabase
            .channel('navbar-unread-dinamicas')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, () => {
                checkUnreadStatus();
            })
            .subscribe();

        const minigamesChannel = supabaseAuth
            .channel('navbar-unread-minigames')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'minigames_content' }, () => {
                checkUnreadStatus();
            })
            .subscribe();

        supabaseAuth.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id, currentUser);
            }
        });

        const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id, currentUser);
            } else {
                setProfile(null);
            }
        });

        // Realtime subscription for user profile points changes
        const profileChannel = supabaseAuth
            .channel('navbar-profile-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                if (payload.new && user && (payload.new as any).id === user.id) {
                    setProfile((prev: any) => prev ? { ...prev, points: (payload.new as any).points } : payload.new);
                }
            })
            .subscribe();

        const handlePointsUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.points === 'number') {
                setProfile((prev: any) => prev ? { ...prev, points: customEvent.detail.points } : prev);
            } else {
                supabaseAuth.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user) {
                        fetchProfile(session.user.id, session.user);
                    }
                });
            }
        };
        window.addEventListener('points-updated', handlePointsUpdate);

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(contentChannel);
            supabaseAuth.removeChannel(minigamesChannel);
            supabaseAuth.removeChannel(profileChannel);
            window.removeEventListener('points-updated', handlePointsUpdate);
        };
    }, [user?.id]);

    const handleLoginWithTwitch = async () => {
        if (!loginConsent) {
            alert('Debes confirmar que autorizas el inicio de sesión con Twitch para continuar.');
            return;
        }

        try {
            setShowLoginModal(false);
            setLoginConsent(false);

            const currentUrl = window.location.href.split('#')[0];
            const { data, error } = await supabaseAuth.auth.signInWithOAuth({
                provider: 'twitch',
                options: {
                    redirectTo: currentUrl,
                    skipBrowserRedirect: false
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.assign(data.url);
            }
        } catch (err: any) {
            console.error('Twitch OAuth error:', err);
            alert('No se pudo iniciar sesión con Twitch: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleLogout = async () => {
        setShowUserMenu(false);
        setUser(null);
        setProfile(null);

        try {
            await supabaseAuth.auth.signOut({ scope: 'local' });
        } catch (err) {
            console.warn("Error signing out:", err);
        }

        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (_) {}

        window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));

        if (window.location.pathname.includes('/perfil')) {
            window.location.href = '/';
        }
    };

    return (
        <>
        <nav className="navbar glass">
            <div className="wrap nav-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="logo-container">
                    <img src="/Logo_2.png" alt="EvilTokkii Logo" className="logo-img" />
                    <span className="logo-text">EvilTokkii</span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <ul className="nav-links">
                        <li>
                            <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end>Home</NavLink>
                        </li>
                        <li style={{ position: 'relative' }}>
                            <NavLink 
                                to="/noticias" 
                                className={({ isActive }) => (isActive ? 'active' : '')}
                                onClick={() => handleSectionClick('noticias')}
                            >
                                Noticias
                            </NavLink>
                            {unreadSections.noticias && <span className="nav-badge-dot" title="¡Nuevas noticias!" />}
                        </li>
                        <li style={{ position: 'relative' }}>
                            <NavLink 
                                to="/dinamicas" 
                                className={({ isActive }) => (isActive ? 'active' : '')}
                                onClick={() => handleSectionClick('dinamicas')}
                            >
                                Dinámicas
                            </NavLink>
                            {unreadSections.dinamicas && <span className="nav-badge-dot" title="¡Nuevas dinámicas!" />}
                        </li>
                        <li>
                            <NavLink to="/sobre" className={({ isActive }) => (isActive ? 'active' : '')}>Sobre EvilTokkii</NavLink>
                        </li>
                        <li style={{ position: 'relative' }}>
                            <NavLink 
                                to="/minijuegos" 
                                className={({ isActive }) => (isActive ? 'active' : '')}
                                onClick={() => handleSectionClick('minijuegos')}
                            >
                                Minijuegos
                            </NavLink>
                            {unreadSections.minijuegos && <span className="nav-badge-dot" title="¡Nuevos minijuegos!" />}
                        </li>
                        <li>
                            <NavLink to="/tierlists" className={({ isActive }) => (isActive ? 'active' : '')}>Tierlists</NavLink>
                        </li>
                        <li>
                            <NavLink to="/ayuda" className={({ isActive }) => (isActive ? 'active' : '')}>Ayuda</NavLink>
                        </li>
                        <li>
                            <a 
                                href={(import.meta as any).env?.VITE_TCG_URL || 'http://localhost:5173'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nav-btn-tcg"
                                title="Abrir Colección Tokkii TCG en pantalla completa"
                            >
                                TCG
                            </a>
                        </li>
                    </ul>
                    <div className="auth-nav-section"
                         style={{ 
                             borderLeft: '1px solid rgba(255,255,255,0.1)', 
                             paddingLeft: '20px', 
                             position: 'relative',
                             display: 'flex',
                             alignItems: 'center',
                             paddingTop: '8px',
                             paddingBottom: '8px',
                             cursor: 'pointer'
                         }}
                         onMouseEnter={handleMouseEnterUser}
                         onMouseLeave={handleMouseLeaveUser}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', letterSpacing: '0.03em' }}>
                                        {profile?.username || user.user_metadata?.preferred_username || user.user_metadata?.name || user.user_metadata?.full_name || 'Usuario'}
                                        {renderBadge(profile?.role || 'usuario')}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>&bull;</span>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--highlight)', fontWeight: 'bold', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
                                        {profile?.points ?? 0} Pts
                                    </span>
                                </div>
                                {(profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.profile_image_url) && (
                                    <img 
                                        src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.profile_image_url || ''} 
                                        referrerPolicy="no-referrer" 
                                        alt="Avatar" 
                                        style={{ width: '32px', height: '32px', minWidth: '32px', maxWidth: '32px', borderRadius: '50%', border: '2px solid var(--highlight)', objectFit: 'cover', display: 'block', flexShrink: 0 }} 
                                    />
                                )}

                                {/* Hover Submenu */}
                                {showUserMenu && (
                                    <div className="user-menu-dropdown">
                                        <Link 
                                            to="/perfil"
                                            className="user-menu-item"
                                        >
                                            👤 Mi perfil
                                        </Link>
                                        <button 
                                            onClick={handleLogout}
                                            className="user-menu-item logout"
                                        >
                                            🔌 Desconectar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowLoginModal(true)} 
                                className="btn secondary" 
                                style={{
                                    padding: '0.45rem 1.25rem',
                                    minHeight: 'auto',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    borderColor: 'rgba(233, 176, 255, 0.08)'
                                }}
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>

            {/* Twitch Login Modal Dialog */}
            {showLoginModal && !user && createPortal((
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 50% 42%, rgba(145, 70, 255, 0.22) 0%, rgba(20, 10, 30, 0.22) 28%, rgba(0, 0, 0, 0.92) 72%), rgba(0, 0, 0, 0.88)',
                    zIndex: 999999,
                    display: 'grid',
                    placeItems: 'center',
                    backdropFilter: 'blur(16px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(120%)',
                    padding: '1rem',
                    overflowY: 'auto',
                }}>
                    <div className="glass" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '2rem 1.75rem', 
                        gap: '1rem', 
                        maxWidth: '460px', 
                        width: '100%', 
                        maxHeight: 'calc(100dvh - 2rem)',
                        overflowY: 'auto',
                        margin: 'auto',
                        textAlign: 'center', 
                        position: 'relative',
                        background: 'rgba(20, 10, 30, 0.96)',
                        border: '2px solid #9146FF',
                        borderRadius: '28px',
                        boxShadow: '0 0 70px rgba(145, 70, 255, 0.35), 0 28px 70px rgba(0, 0, 0, 0.65)',
                        animation: 'scaleIn 0.2s ease-out'
                    }}>
                        
                        <button 
                            onClick={() => {
                                setShowLoginModal(false);
                                setLoginConsent(false);
                            }}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '50%',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                padding: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '34px',
                                height: '34px',
                                lineHeight: 1
                            }}
                            aria-label="Cerrar ventana de inicio de sesion"
                        >
                            &times;
                        </button>

                        <div style={{
                            alignSelf: 'center',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            background: 'linear-gradient(135deg, #9146FF 0%, #6441A5 100%)',
                            color: '#fff',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px',
                            boxShadow: '0 12px 30px rgba(145, 70, 255, 0.35)',
                            marginBottom: '-0.15rem'
                        }}>
                            TW
                        </div>

                        <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#9146FF', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Inicia Sesión</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                            Conéctate con tu cuenta de Twitch para registrar tu usuario del canal y competir por los mejores puestos del marcador.
                        </p>
                        
                        <div style={{
                            textAlign: 'left',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '20px',
                            padding: '0.9rem',
                            color: 'rgba(255,255,255,0.82)',
                            fontSize: '0.82rem',
                            lineHeight: 1.45
                        }}>
                            <strong style={{ color: '#00d27f' }}>Antes de abrir Twitch, confirma tu autorizacion:</strong>
                            <ul style={{ margin: '0.55rem 0 0 1.1rem', padding: 0 }}>
                                <li>Usaremos OAuth de Twitch para validar tu identidad.</li>
                                <li>Podremos recibir tu ID unico, nombre publico y avatar publico de Twitch.</li>
                                <li>Estos datos se usan para perfil, puntos, rachas, reportes, seguridad y prevencion de abuso.</li>
                            </ul>
                            <p style={{ margin: '0.6rem 0 0 0' }}>
                                No recibimos tu contrasena de Twitch. No vendemos ni cedemos tus datos a terceros comerciales.
                            </p>
                        </div>

                        <label style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            textAlign: 'left',
                            color: 'rgba(255,255,255,0.82)',
                            fontSize: '0.8rem',
                            lineHeight: 1.38,
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={loginConsent}
                                onChange={(e) => setLoginConsent(e.target.checked)}
                                style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#9146FF' }}
                            />
                            <span>
                                Autorizo el inicio de sesion con Twitch y el tratamiento de estos datos para las funciones comunitarias de EvilTokkii. Declaro haber revisado la{' '}
                                <Link to="/legal?tab=privacidad" onClick={() => setShowLoginModal(false)} style={{ color: '#00e5ff', fontWeight: 800 }}>
                                    Politica de Privacidad
                                </Link>.
                            </span>
                        </label>
                        
                        <button 
                            onClick={handleLoginWithTwitch}
                            className="btn primary"
                            style={{ 
                                width: '100%', 
                                justifyContent: 'center',
                                padding: '0.8rem',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                borderRadius: '16px',
                                background: loginConsent ? 'linear-gradient(135deg, #9146FF 0%, #6441A5 100%)' : 'rgba(255,255,255,0.08)',
                                border: 'none',
                                boxShadow: loginConsent ? '0 8px 20px rgba(145, 70, 255, 0.25)' : 'none',
                                cursor: loginConsent ? 'pointer' : 'not-allowed',
                                opacity: loginConsent ? 1 : 0.65
                            }}
                        >
                            Conectar con Twitch
                        </button>
                        <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.4 }}>
                            Se abrira una ventana emergente segura de Twitch. Puedes cancelar el proceso antes de autorizar.
                        </p>
                    </div>
                </div>
            ), document.body)}
        </>
    );
};

export default Navbar;
