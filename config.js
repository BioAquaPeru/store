export const STORE_CONFIG = {
  storeName: "Hilda's Store",
  slogan: "Streetwear con presencia, color y actitud.",
  description:
    "Colecciones urbanas con identidad visual fuerte, prendas versátiles y drops pensados para destacar.",
  location: "Lima, Perú",
  whatsappNumber: "51999999999",
  socialLinks: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    facebook: "https://facebook.com/",
  },
  navigation: [
    { label: "Inicio", href: "index.html#inicio" },
    { label: "Catálogo", href: "catalogo.html" },
    { label: "Contacto", href: "index.html#contacto" },
  ],
  branding: {
    logoUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=160&q=80",
    heroSlides: [
      {
        title: "Nueva energía urbana",
        subtitle: "Drops con color, siluetas modernas y estética streetwear.",
        image:
          "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1600&q=80",
      },
      {
        title: "Colecciones que se sienten vivas",
        subtitle: "Combina texturas, capas y actitud en cada look.",
        image:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80",
      },
      {
        title: "Streetwear elegante",
        subtitle: "Diseño visual fuerte sin perder limpieza ni versatilidad.",
        image:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80",
      },
    ],
  },
  theme: {
    fontPrimary: "'Space Grotesk', sans-serif",
    fontSecondary: "'Outfit', sans-serif",
    colors: {
      bg: "#f6f3ee",
      surface: "#fff7f0",
      surfaceStrong: "#ffffff",
      text: "#181313",
      textMuted: "#6f6460",
      accent: "#ea5b2a",
      accentAlt: "#f0bf46",
      accentSoft: "#f4d0c4",
      dark: "#090909",
      border: "rgba(24, 19, 19, 0.12)",
      success: "#1b9c61",
    },
  },
  currency: "PEN",
};

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_88xCURzXPpn5itd5VXmOM1wCXcOgzVw",
  authDomain: "tienda-ropa-3af7e.firebaseapp.com",
  projectId: "tienda-ropa-3af7e",
  storageBucket: "tienda-ropa-3af7e.firebasestorage.app",
  messagingSenderId: "478236602884",
  appId: "1:478236602884:web:38249f423a4258b6c4fb51",
};
