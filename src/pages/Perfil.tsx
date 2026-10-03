import { useState, useEffect } from 'react';
import { supabaseMinigames as supabase } from '../lib/supabase';
import { checkAndRotateMonthlyLeaderboard } from '../utils/monthlyRotation';
import { Sparkles, Trophy, Calendar, CheckCircle, MessageSquare, Mail, CornerDownRight } from 'lucide-react';
import { renderBadge } from '../components/UserRoleBadge';
import './TierList.css';

export default function Perfil() {
  const [profile, setProfile] = useState<any>(null);
  const [completions, setCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [userReports, setUserReports] = useState<any[]>([]);

  useEffect(() => {
    let reportsSub: any = null;

    const fetchProfileAndStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const authUser = session.user;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileData) {
        let currentProfile = profileData;
        const metaAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || authUser.user_metadata?.profile_image_url;
        const metaUsername = authUser.user_metadata?.preferred_username || authUser.user_metadata?.name || authUser.user_metadata?.full_name;

        const needsUpdate = 
          (metaAvatar && profileData.avatar_url !== metaAvatar) || 
          (metaUsername && profileData.username !== metaUsername);

        if (needsUpdate) {
          const updates: any = {};
          if (metaAvatar) updates.avatar_url = metaAvatar;
          if (metaUsername) updates.username = metaUsername;

          const { data: updatedData } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', authUser.id)
            .select()
            .maybeSingle();

          if (updatedData) {
            currentProfile = updatedData;
            window.dispatchEvent(new Event('points-updated'));
          }
        }
        setProfile(currentProfile);
      } else {
        // Create profile if missing
        const metaAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || authUser.user_metadata?.profile_image_url || '';
        const metaUsername = authUser.user_metadata?.preferred_username || authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'Usuario';
        
        const { data: createdProfile } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
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
            id: authUser.id,
            username: metaUsername,
            avatar_url: metaAvatar,
            role: 'usuario',
            points: 0,
            created_at: new Date().toISOString()
          });
        }
      }

      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const { data: completionsData } = await supabase
        .from('user_quiz_completions')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('completed_date', today);

      if (completionsData) {
        setCompletions(completionsData);
      }

      // Fetch user's reports
      const fetchReports = async () => {
        const { data: rData } = await supabase
          .from('user_reports')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (rData) {
          setUserReports(rData);
        }
      };

      fetchReports();

      // Realtime listener for reports updates
      reportsSub = supabase
        .channel('my-reports-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_reports', filter: `user_id=eq.${authUser.id}` }, () => {
          fetchReports();
        })
        .subscribe();

      try {
        await checkAndRotateMonthlyLeaderboard(supabase);
      } catch (e) {
        console.error("Monthly rotation check error:", e);
      }

      const { data: boards } = await supabase
        .from('monthly_leaderboards')
        .select('*')
        .order('year_month', { ascending: false });

      if (boards) {
        setLeaderboards(boards);
        if (boards.length > 0) {
          setSelectedMonth(boards[0].year_month);
        }
      }

      setLoading(false);
    };

    fetchProfileAndStats();

    return () => {
      if (reportsSub) {
        supabase.removeChannel(reportsSub);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando estadísticas de perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ padding: '3rem 2rem', background: '#20103a', border: '3.5px solid #000000', borderRadius: '22px', boxShadow: '6px 6px 0 #000000', maxWidth: '450px', textAlign: 'center' }}>
          <Trophy size={48} style={{ color: 'var(--yellow)', marginBottom: '1.5rem' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--yellow)', textShadow: '2px 2px 0 #000', fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem' }}>Inicia Sesión</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Debes estar registrado para ver las estadísticas de tu perfil y competir en las tablas de clasificación de la comunidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="wrap" style={{ maxWidth: '900px' }}>
        
        <header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px', 
          padding: '2.25rem 2rem', 
          background: '#20103a',
          border: '3.5px solid #000000',
          borderRadius: '22px',
          boxShadow: '6px 6px 0 #000000',
          marginBottom: '2rem' 
        }}>
          {profile.avatar_url && (
            <img src={profile.avatar_url} referrerPolicy="no-referrer" 
              alt="Avatar" 
              style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3.5px solid #000000', display: 'block', boxShadow: '3px 3px 0 #000000', objectFit: 'cover' }} 
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="header-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
              <Sparkles size={12} />
              PERFIL DE USUARIO
            </span>
            <h1 className="header-title" style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, display: 'inline-flex', alignItems: 'center' }}>
              {profile.username}
              {renderBadge(profile.role, 'lg')}
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Miembro desde: {new Date(profile.created_at || Date.now()).toLocaleDateString()}</p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="controls-bar" style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
            <Trophy size={28} style={{ color: 'var(--highlight)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Puntos del Mes</span>
            <strong style={{ fontSize: '1.6rem', color: '#fff' }}>{profile.points ?? 0} Pts</strong>
          </div>
          <div className="controls-bar" style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
            <Calendar size={28} style={{ color: '#ff7b00' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Racha Actual</span>
            <strong style={{ fontSize: '1.6rem', color: '#fff' }}>{profile.current_streak || 0} Días</strong>
          </div>
          <div className="controls-bar" style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
            <CheckCircle size={28} style={{ color: '#00cc88' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Completados Hoy</span>
            <strong style={{ fontSize: '1.6rem', color: '#fff' }}>{completions.length} Trivias</strong>
          </div>
        </div>

        {/* SECCIÓN: Buzón de Mensajes y Reportes del Usuario */}
        <div style={{ 
          padding: '2.25rem 2rem', 
          background: '#20103a',
          border: '3.5px solid #000000',
          borderRadius: '22px',
          boxShadow: '6px 6px 0 #000000',
          marginTop: '2rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--hot-pink)',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0 #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <Mail size={20} />
            </div>
            <div>
              <h2 style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', 
                fontWeight: 900, 
                color: 'var(--yellow)',
                textShadow: '2px 2px 0 #000000',
                margin: '0 0 2px 0',
                letterSpacing: '-0.01em'
              }}>
                Buzón de Mensajes y Soporte
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                Historial de reportes enviados y respuestas del equipo.
              </p>
            </div>
          </div>

          {userReports.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {userReports.map((report) => {
                const reportTypeLabels: Record<string, string> = {
                  bug: 'Bug / Error',
                  sugerencia: 'Sugerencia',
                  cambio: 'Cambio Propuesto'
                };
                const reportDate = new Date(report.created_at).toLocaleString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={report.id}
                    style={{
                      background: '#180d2f',
                      border: '2.5px solid #000000',
                      boxShadow: '3px 3px 0 #000000',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    {/* Header del reporte */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '8px',
                          border: '2px solid #000000',
                          boxShadow: '2px 2px 0 #000000',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: report.report_type === 'bug' ? '#ff4b4b' : 'var(--hot-pink)',
                          color: '#ffffff'
                        }}>
                          {reportTypeLabels[report.report_type] || report.report_type}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                          {reportDate}
                        </span>
                      </div>

                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '8px',
                        border: '2px solid #000000',
                        boxShadow: '2px 2px 0 #000000',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        background: report.admin_response ? '#22c55e' : 'var(--yellow)',
                        color: '#000000'
                      }}>
                        {report.admin_response ? 'RESPONDIDO' : 'EN REVISIÓN'}
                      </span>
                    </div>

                    {/* Contenido del mensaje del usuario */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--yellow)', fontWeight: 700 }}>
                        <MessageSquare size={14} /> Tu mensaje:
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        color: 'rgba(255,255,255,0.95)',
                        lineHeight: 1.5,
                        background: '#110822',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        border: '2px solid #000000'
                      }}>
                        {report.description}
                      </p>

                      {/* Imágenes adjuntas si existen */}
                      {report.images && report.images.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {report.images.map((imgUrl: string, idx: number) => (
                            <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={imgUrl} 
                                alt={`Adjunto ${idx + 1}`}
                                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #000000', boxShadow: '2px 2px 0 #000000' }}
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Respuesta de Soporte si existe */}
                    {report.admin_response ? (
                      <div style={{
                        marginTop: '4px',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        background: '#110822',
                        border: '2px solid var(--hot-pink)',
                        boxShadow: '2px 2px 0 #000000',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--hot-pink)', fontWeight: 800 }}>
                          <CornerDownRight size={16} /> Respuesta de Soporte EvilTokkii:
                        </div>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', lineHeight: 1.5 }}>
                          {report.admin_response}
                        </p>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                        ⏳ Un agente de soporte está procesando tu reporte. Recibirás respuesta aquí pronto.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2.5rem 1.5rem', 
              background: '#180d2f',
              border: '2.5px solid #000000',
              boxShadow: '3px 3px 0 #000000',
              borderRadius: '16px',
              color: 'rgba(255, 255, 255, 0.85)' 
            }}>
              <MessageSquare size={36} style={{ color: 'var(--yellow)', marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Aún no has enviado ningún reporte o sugerencia.</p>
            </div>
          )}
        </div>

        {leaderboards.length > 0 && (
          <div style={{ 
            padding: '2.25rem 2rem', 
            background: '#20103a',
            border: '3.5px solid #000000',
            borderRadius: '22px',
            boxShadow: '6px 6px 0 #000000',
            marginTop: '2rem' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', 
                  fontWeight: 900, 
                  color: 'var(--yellow)',
                  textShadow: '2px 2px 0 #000000',
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.01em'
                }}>
                  Tablas de Clasificación Históricas
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>Consulta el ranking de meses anteriores.</p>
              </div>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: '#180d2f',
                  border: '2px solid #000000',
                  boxShadow: '2px 2px 0 #000000',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-display)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {leaderboards.map((b) => (
                  <option key={b.year_month} value={b.year_month} style={{ background: '#120b1d' }}>
                    Mes: {b.year_month}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const currentBoard = leaderboards.find(b => b.year_month === selectedMonth);
              if (!currentBoard) return null;
              const data = Array.isArray(currentBoard.leaderboard_data) ? currentBoard.leaderboard_data : [];
              if (data.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No hay datos para este mes.</p>;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '0.5rem' }}>
                  {data.slice(0, 10).map((user: any, idx: number) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1.1rem',
                        background: '#180d2f',
                        borderRadius: '12px',
                        border: idx === 0 
                          ? '2.5px solid var(--yellow)' 
                          : '2px solid #000000',
                        boxShadow: '2px 2px 0 #000000'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontSize: '1rem', 
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900, 
                          color: idx === 0 ? 'var(--yellow)' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#f59e0b' : 'rgba(255,255,255,0.6)',
                          width: '28px'
                        }}>
                          #{idx + 1}
                        </span>
                        {user.avatar_url && (
                          <img 
                            src={user.avatar_url} 
                            alt="Avatar" 
                            style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #000000', boxShadow: '1px 1px 0 #000000', objectFit: 'cover' }} 
                          />
                        )}
                        <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center' }}>
                          {user.username}
                          {renderBadge(user.role)}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: idx === 0 ? 'var(--yellow)' : 'var(--cyan)' }}>
                        {user.points} PTS
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
