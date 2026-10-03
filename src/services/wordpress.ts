// Servicio de Integración con WordPress REST API para Noticias

export interface WPNewsItem {
  id: number | string;
  title: string;
  subtitle: string;
  content: string;
  header_image: string;
  slug: string;
  author: string;
  category: 'VIDEOJUEGOS' | 'ANIME';
  categorySlug: 'videojuegos' | 'animes';
  published_at: string;
}

// Función para determinar el endpoint correcto según sea WordPress.com o self-hosted
function getWordPressApiBase(): string {
  const configured = import.meta.env.VITE_WORDPRESS_URL || 'https://webtokkoo.wordpress.com';
  const cleanUrl = configured.replace(/\/$/, '').trim();
  
  // Si es un subdominio de wordpress.com (ej: https://webtokkoo.wordpress.com)
  if (cleanUrl.includes('.wordpress.com')) {
    const siteDomain = cleanUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return `https://public-api.wordpress.com/wp/v2/sites/${siteDomain}`;
  }
  
  // Si es un dominio personalizado con WordPress instalado
  return `${cleanUrl}/wp-json/wp/v2`;
}

// Helper para decodificar entidades HTML comunes en títulos de WordPress
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  const entities: Record<string, string> = {
    '&#8211;': '–',
    '&#8212;': '—',
    '&#8216;': "'",
    '&#8217;': "'",
    '&#8220;': '"',
    '&#8221;': '"',
    '&#038;': '&',
    '&amp;': '&',
    '&quot;': '"',
    '&#039;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&#8230;': '...',
  };
  return text.replace(/&#\d+;|&[a-z]+;/gi, match => entities[match] || match);
}

// Helper para limpiar tags HTML de extractos
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

function cleanWordPressExcerpt(rawExcerpt: string): string {
  if (!rawExcerpt) return '';
  const plain = decodeHtmlEntities(stripHtml(rawExcerpt));
  return plain
    .replace(/\[&hellip;\]|&hellip;|\[\.\.\.\]|\.\.\./gi, '')
    .replace(/^["“'\s]+|["”'\s]+$/g, '')
    .trim();
}

// Parser de un post de WordPress con _embed a la interfaz de EvilTokkii
export function transformWordPressPost(post: any): WPNewsItem {
  const rawTitle = post?.title?.rendered || 'Sin Título';
  const decodedTitle = decodeHtmlEntities(rawTitle);

  // 1. Extraer Subtítulo / Bajada (Excerpt limpio)
  const rawExcerpt = post?.excerpt?.rendered || '';
  const cleanExcerpt = cleanWordPressExcerpt(rawExcerpt);

  // 2. Extraer Imagen Destacada
  let featuredImage = '';
  if (post?._embedded?.['wp:featuredmedia']?.[0]) {
    const media = post._embedded['wp:featuredmedia'][0];
    featuredImage = media?.source_url || media?.media_details?.sizes?.large?.source_url || media?.media_details?.sizes?.full?.source_url || '';
  }

  // 3. Extraer Autor
  let authorName = 'EvilTokkii';
  if (post?._embedded?.['author']?.[0]?.name) {
    authorName = post._embedded['author'][0].name;
  }

  // 4. Extraer y Normalizar Categoría (Videojuegos vs Anime)
  let categorySlug: 'videojuegos' | 'animes' = 'videojuegos';
  let categoryLabel: 'VIDEOJUEGOS' | 'ANIME' = 'VIDEOJUEGOS';

  if (post?._embedded?.['wp:term']) {
    const terms = post._embedded['wp:term'].flat();
    const isAnime = terms.some((term: any) => {
      const slug = (term?.slug || '').toLowerCase();
      const name = (term?.name || '').toLowerCase();
      return ['anime', 'animes', 'manga', 'otaku', 'japon'].includes(slug) || 
             ['anime', 'animes', 'manga', 'otaku'].includes(name);
    });

    if (isAnime) {
      categorySlug = 'animes';
      categoryLabel = 'ANIME';
    }
  }

  // Si no se detectó por term, buscar en título o contenido
  if (categorySlug === 'videojuegos') {
    const textToCheck = `${decodedTitle} ${cleanExcerpt}`.toLowerCase();
    const animeKeywords = ['anime', 'manga', 'crunchyroll', 'demon slayer', 'kimetsu', 'shingeki', 'jujutsu', 'one piece', 'dragon ball', 'naruto', 'solo leveling'];
    if (animeKeywords.some(k => textToCheck.includes(k))) {
      categorySlug = 'animes';
      categoryLabel = 'ANIME';
    }
  }

  return {
    id: post.id,
    title: decodedTitle,
    subtitle: cleanExcerpt,
    content: post?.content?.rendered || '',
    header_image: featuredImage || `${import.meta.env.VITE_R2_BASE_URL || ''}/logo.png`,
    slug: post.slug || String(post.id),
    author: authorName,
    category: categoryLabel,
    categorySlug: categorySlug,
    published_at: post.date || post.date_gmt || new Date().toISOString()
  };
}

// Obtener lista de noticias desde WordPress
export async function getWordPressNews(params?: {
  categorySlug?: 'videojuegos' | 'animes';
  page?: number;
  perPage?: number;
}): Promise<WPNewsItem[]> {
  try {
    const page = params?.page || 1;
    const perPage = params?.perPage || 20;
    const apiBase = getWordPressApiBase();
    
    const url = new URL(`${apiBase}/posts`);
    url.searchParams.set('_embed', 'true');
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('orderby', 'date');
    url.searchParams.set('order', 'desc');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[WordPress] Error HTTP ${res.status} al obtener noticias desde ${url.toString()}`);
      return [];
    }

    const posts = await res.json();
    if (!Array.isArray(posts)) return [];

    const transformed = posts.map(transformWordPressPost);

    if (params?.categorySlug) {
      return transformed.filter(item => item.categorySlug === params.categorySlug);
    }

    return transformed;
  } catch (error) {
    console.error('[WordPress] Error al conectar con la API de noticias:', error);
    return [];
  }
}

// Obtener una noticia específica por su SLUG
export async function getWordPressNewsBySlug(slug: string): Promise<WPNewsItem | null> {
  try {
    const apiBase = getWordPressApiBase();
    const url = new URL(`${apiBase}/posts`);
    url.searchParams.set('slug', slug);
    url.searchParams.set('_embed', 'true');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[WordPress] Error HTTP ${res.status} buscando noticia por slug: ${slug}`);
      return null;
    }

    const posts = await res.json();
    if (Array.isArray(posts) && posts.length > 0) {
      return transformWordPressPost(posts[0]);
    }

    return null;
  } catch (error) {
    console.error(`[WordPress] Error buscando noticia ${slug}:`, error);
    return null;
  }
}
