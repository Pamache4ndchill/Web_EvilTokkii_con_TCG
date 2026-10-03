import React, { useState, useRef } from 'react';
import './Tcg.css';

const Tcg: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Default to localhost in dev or custom env in production
  const tcgUrl = (import.meta as any).env?.VITE_TCG_URL || 'http://localhost:5173';

  return (
    <div className="tcg-page-wrapper fade-in">
      <div className="tcg-container">
        {/* Main Embedded TCG Frame (100% Isolated Sandbox) */}
        <div className="tcg-frame-container">
          {isLoading && (
            <div className="tcg-loading-overlay">
              <div className="tcg-spinner" />
              <span className="tcg-loading-text">Cargando Visor Tokkii TCG...</span>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={tcgUrl}
            title="Visor de Cartas Tokkii TCG"
            className="tcg-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default Tcg;
