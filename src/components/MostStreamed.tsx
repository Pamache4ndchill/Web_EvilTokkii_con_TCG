import { resolveAssetUrl } from '../utils/assets';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StreamedItem {
    id: number;
    title: string;
    image_url: string;
    description?: string;
    order_index?: number;
}

interface MostStreamedProps {
    hideHeader?: boolean;
    onGamesLoad?: (images: string[]) => void;
    onlyLoad?: boolean;
}

const MostStreamed: React.FC<MostStreamedProps> = ({ hideHeader = false, onGamesLoad, onlyLoad = false }) => {
    const [streamedData, setStreamedData] = useState<StreamedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStreamed = async () => {
            try {
                const { data, error } = await supabase
                    .from('most_streamed')
                    .select('*')
                    .order('order_index', { ascending: true });

                if (error) throw error;
                setStreamedData(data || []);
            } catch (err) {
                console.error("Error fetching most streamed from Supabase 2:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStreamed();
    }, []);

    const getImageUrl = (imagePath: string) => resolveAssetUrl(imagePath);

    useEffect(() => {
        if (streamedData.length > 0 && onGamesLoad) {
            onGamesLoad(streamedData.map(item => getImageUrl(item.image_url)));
        }
    }, [streamedData, onGamesLoad]);

    if (loading || streamedData.length === 0) return null;
    if (onlyLoad) return null;

    return (
        <div style={{ width: '100%' }}>
            {!hideHeader && (
                <div className="section-head-arcade" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <div className="section-tag-badge"><span>STREAM</span> CATÁLOGO</div>
                        <h2 className="section-title-arcade">LO STREMEADO ÚLTIMAMENTE</h2>
                    </div>
                </div>
            )}

            <div 
                className="streamed-two-columns-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '1.5rem',
                    width: '100%',
                    marginTop: '10px'
                }}
            >
                {streamedData.map((item) => (
                    <div 
                        key={item.id} 
                        className="streamed-horizontal-card"
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'stretch',
                            gap: '18px',
                            background: '#20103a',
                            border: '3.5px solid #000000',
                            borderRadius: '20px',
                            padding: '0 20px 0 0',
                            boxShadow: '6px 6px 0 #000000',
                            overflow: 'hidden',
                            minHeight: '140px',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                    >
                        {/* Miniatura Izquierda: Ocupa todo el alto de la casilla */}
                        <div 
                            className="streamed-card-thumb"
                            style={{
                                width: '120px',
                                minWidth: '120px',
                                maxWidth: '120px',
                                alignSelf: 'stretch',
                                background: '#180d2f',
                                borderRight: '3px solid #000000',
                                flexShrink: 0,
                                display: 'flex',
                                overflow: 'hidden'
                            }}
                        >
                            <img 
                                src={getImageUrl(item.image_url)} 
                                alt={item.title} 
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    display: 'block'
                                }}
                                onError={(e: any) => {
                                    e.target.src = `${import.meta.env.VITE_R2_BASE_URL}/logo.png`;
                                }}
                            />
                        </div>

                        {/* Contenido Derecho: Título arriba + Descripción */}
                        <div 
                            className="streamed-card-body"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                gap: '8px',
                                flex: 1,
                                minWidth: 0,
                                padding: '16px 0'
                            }}
                        >
                            <h3 
                                className="streamed-card-title"
                                style={{
                                    margin: 0,
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.25rem',
                                    fontWeight: 900,
                                    color: 'var(--yellow)',
                                    textShadow: '2px 2px 0 #000000',
                                    lineHeight: 1.2,
                                    letterSpacing: '-0.01em'
                                }}
                            >
                                {item.title}
                            </h3>

                            {item.description ? (
                                <p 
                                    className="streamed-card-desc"
                                    style={{
                                        margin: 0,
                                        fontSize: '0.92rem',
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        lineHeight: 1.5,
                                        fontWeight: 500,
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-line'
                                    }}
                                >
                                    {item.description}
                                </p>
                            ) : (
                                <p 
                                    className="streamed-card-desc placeholder"
                                    style={{
                                        margin: 0,
                                        fontSize: '0.9rem',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontStyle: 'italic',
                                        lineHeight: 1.5
                                    }}
                                >
                                    Partidas, directos y momentos destacados de {item.title}.
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MostStreamed;
