import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitch, faInstagram, faTiktok, faXTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="arcade-footer">
            <div className="arcade-footer-container">
                {/* Fila Principal: Copyright, Términos & Redes Sociales */}
                <div className="arcade-footer-top-simple">
                    <span className="arcade-footer-copy">
                        &copy; 2026 EVILTOKKII.
                    </span>

                    <span className="arcade-footer-bullet">•</span>

                    <Link to="/legal" className="arcade-footer-legal-link">
                        Términos, Privacidad & DMCA
                    </Link>

                    <span className="arcade-footer-bullet">•</span>

                    {/* Botones de Redes Sociales Sticker */}
                    <div className="arcade-footer-socials">
                        <a href="https://www.twitch.tv/eviltokkii" target="_blank" rel="noopener noreferrer" className="arcade-footer-social-btn footer-btn-twitch" title="Twitch">
                            <FontAwesomeIcon icon={faTwitch} /> Twitch
                        </a>
                        <a href="https://www.instagram.com/eviltokkii" target="_blank" rel="noopener noreferrer" className="arcade-footer-social-btn footer-btn-instagram" title="Instagram">
                            <FontAwesomeIcon icon={faInstagram} /> Instagram
                        </a>
                        <a href="https://www.tiktok.com/@eviltokkii" target="_blank" rel="noopener noreferrer" className="arcade-footer-social-btn footer-btn-tiktok" title="TikTok">
                            <FontAwesomeIcon icon={faTiktok} /> TikTok
                        </a>
                        <a href="https://x.com/EvilTokkii" target="_blank" rel="noopener noreferrer" className="arcade-footer-social-btn footer-btn-x" title="Twitter / X">
                            <FontAwesomeIcon icon={faXTwitter} /> Twitter / X
                        </a>
                        <a href="https://discord.com/invite/Kxvw4KfSBF" target="_blank" rel="noopener noreferrer" className="arcade-footer-social-btn footer-btn-discord" title="Discord">
                            <FontAwesomeIcon icon={faDiscord} /> Discord
                        </a>
                    </div>
                </div>

                {/* Descargo de Responsabilidad de Marcas */}
                <div className="arcade-footer-bottom">
                    <p className="arcade-footer-legal">
                        <strong>Aviso Legal de Marcas:</strong> EvilTokkii es un proyecto comunitario independiente sin afiliación, patrocinio ni licencia oficial con Nintendo, Sony, Microsoft ni desarrolladores de videojuegos. Todas las marcas registradas pertenecen a sus respectivos dueños bajo el marco de Uso Justo (Fair Use).
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
