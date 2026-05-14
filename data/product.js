// Local fallback catalog used by the storefront before or alongside products
// loaded from Supabase/admin-created entries.
const products = [
  {
    id: 1,
    name: "Glow Reset Mask Set",
    category: "skincare",
    mood: "cozy-reset",
    price: 500,
    image: "images/products/product1.jpg",
    description:
      "A calming face mask set made to refresh tired skin and bring back a soft healthy glow.",
  },
  {
    id: 2,
    name: "Lip Care Treatment Mask",
    category: "skincare",
    mood: "soft-calming",
    price: 500,
    image: "images/products/product02.jpg",
    description:
      "A deeply nourishing lip treatment that helps soften dry lips and keep them smooth all day.",
  },
  {
    id: 3,
    name: "Under-Eye Refresh Patches",
    category: "skincare",
    mood: "fresh-clean",
    price: 500,
    image: "images/products/product03.jpg",
    description:
      "Cooling under-eye patches that help your eyes look brighter, fresher, and less tired.",
  },
  {
    id: 4,
    name: "Cute Acne Patch Set",
    category: "skincare",
    mood: "glow-boost",
    price: 1200,
    image: "images/products/product04.jpg",
    description:
      "Fun and effective acne patches that help protect blemishes while adding a cute touch.",
  },
  {
    id: 5,
    name: "Soft Breeze Mini Fan",
    category: "beauty-tools",
    mood: "fresh-clean",
    price: 4000,
    image: "images/products/product5.jpeg",
    description:
      "A cute portable mini fan that keeps you cool during skincare, makeup, or everyday outings.",
  },
  {
    id: 6,
    name: "Cloud Bloom LED Mirror",
    category: "beauty-tools",
    mood: "soft-calming",
    price: 3500,
    image: "images/products/product6.jpeg",
    description:
      "A soft-glow mirror perfect for skincare, makeup touch-ups, and pretty vanity setups.",
  },
  {
    id: 7,
    name: "Velvet Lash Tray",
    category: "beauty-tools",
    mood: "glow-boost",
    price: 3500,
    image: "images/products/product7.jpeg",
    description:
      "A beauty essential made for storing lashes neatly while keeping your setup stylish and organized.",
  },
  {
    id: 8,
    name: "Rose Glow Nail Set",
    category: "beauty-tools",
    mood: "glow-boost",
    price: 2500,
    image: "images/products/product8.jpeg",
    description:
      "A chic nail set designed to give your hands a polished, elegant, and feminine finish.",
  },
  {
    id: 9,
    name: "Plush Bow Scrunchie Set",
    category: "hair-accessories",
    mood: "cozy-reset",
    price: 5500,
    image: "images/products/product9.jpeg",
    description:
      "A soft scrunchie set with cute bow details for cozy hairstyles and gentle everyday styling.",
  },
  {
    id: 10,
    name: "Satin Scrunchie Collection",
    category: "hair-accessories",
    mood: "soft-calming",
    price: 5500,
    image: "images/products/product10.jpeg",
    description:
      "Smooth satin scrunchies that feel gentle on the hair and add a soft elegant finish.",
  },
  {
    id: 11,
    name: "Fluffy Headband",
    category: "hair-accessories",
    mood: "cozy-reset",
    price: 3000,
    image: "images/products/product011.jpeg",
    description:
      "A fluffy headband perfect for wash days, skincare routines, and cute relaxed moments.",
  },
  {
    id: 12,
    name: "Sweet Bow Hair Clip",
    category: "hair-accessories",
    mood: "soft-calming",
    price: 4000,
    image: "images/products/product11.jpeg",
    description:
      "A pretty bow clip that adds charm to simple hairstyles and soft everyday looks.",
  },
  {
    id: 13,
    name: "Blush Charm Necklace",
    category: "jewelry",
    mood: "glow-boost",
    price: 3000,
    image: "images/products/product12.jpeg",
    description:
      "A delicate necklace with a sweet charm detail that gives your outfit a polished glow.",
  },
  {
    id: 14,
    name: "Sweetheart Pendant Set",
    category: "jewelry",
    mood: "soft-calming",
    price: 4000,
    image: "images/products/product13.jpeg",
    description:
      "A romantic pendant set made to add a soft and graceful touch to your jewelry collection.",
  },
  {
    id: 15,
    name: "Hair Charms",
    category: "hair-accessories",
    mood: "glow-boost",
    price: 2500,
    image: "images/products/product14.jpeg",
    description:
      "A stylish ring collection that adds elegance and shine whether worn alone or stacked.",
  },
  {
    id: 16,
    name: "Pearl Bracelet",
    category: "jewelry",
    mood: "fresh-clean",
    price: 3500,
    image: "images/products/product15.jpeg",
    description:
      "A pretty bracelet with a soft pearl-inspired finish for clean and graceful styling.",
  },
  {
    id: 17,
    name: "Dreamy Pink Tote Bag",
    category: "fashion-accessories",
    mood: "soft-calming",
    price: 7000,
    image: "images/products/product16.jpeg",
    description:
      "A cute tote bag made for everyday essentials with a soft look that feels light and stylish.",
  },
  {
    id: 18,
    name: "Clear Chic Glasses",
    category: "fashion-accessories",
    mood: "fresh-clean",
    price: 5500,
    image: "images/products/product17.jpeg",
    description:
      "Minimal clear-frame glasses that bring a fresh, modern, and effortless vibe to your look.",
  },
  {
    id: 19,
    name: "Butterfly Fashion Frames",
    category: "fashion-accessories",
    mood: "glow-boost",
    price: 4000,
    image: "images/products/product18.jpeg",
    description:
      "Statement fashion frames with a playful butterfly feel for bold and pretty styling.",
  },
  {
    id: 20,
    name: "Pastel Pop Sticker Pack",
    category: "lifestyle",
    mood: "cozy-reset",
    price: 3000,
    image: "images/products/product19.jpeg",
    description:
      "A fun pastel sticker set for decorating journals, cases, mirrors, and cute personal spaces.",
  },

{
  id: 21,
  name: "Gold Hair Clip",
  category: "hair-accessories",
  mood: "soft-calming",
  price: 3000,
  image: "images/products/product20.jpeg",
  description: "An elegant gold hair clip designed to hold your hair beautifully while adding a polished touch to your look."
},
{
  id: 22,
  name: "LED Lights (16.4ft)",
  category: "lifestyle",
  mood: "cozy-reset",
  price: 6500,
  image: "images/products/product21.jpeg",
  description: "Soft LED lights perfect for creating a cozy bedroom, vanity, or self-care corner with a warm glow."
},
{
  id: 23,
  name: "Eye Liner",
  category: "beauty-tools",
  mood: "glow-boost",
  price: 2500,
  image: "images/products/product22.jpeg",
  description: "A smooth and easy-to-use eyeliner that helps create clean, bold, and effortless eye looks."
},
{
  id: 24,
  name: "Tote Bag",
  category: "fashion-accessories",
  mood: "soft-calming",
  price: 6000,
  image: "images/products/product23.jpeg",
  description: "A stylish everyday tote bag with enough space for your essentials while keeping your look cute and simple."
},
{
  id: 25,
  name: "Glass Bottle",
  category: "lifestyle",
  mood: "fresh-clean",
  price: 7000,
  image: "images/products/product24.jpeg",
  description: "A reusable glass bottle made to keep your drinks fresh while adding a clean and aesthetic touch."
},
{
  id: 26,
  name: "Rainbow Hair Clip",
  category: "hair-accessories",
  mood: "glow-boost",
  price: 2500,
  image: "images/products/product25.jpeg",
  description: "A colorful rainbow hair clip that adds a playful and cheerful detail to your hairstyle."
},
{
  id: 27,
  name: "Pink Head Band",
  category: "hair-accessories",
  mood: "cozy-reset",
  price: 3000,
  image: "images/products/product26.jpeg",
  description: "A soft pink headband perfect for skincare routines, makeup sessions, and relaxed self-care days."
},
{
  id: 28,
  name: "Colorful Head Bands",
  category: "hair-accessories",
  mood: "soft-calming",
  price: 4500,
  image: "images/products/product27.jpeg",
  description: "A collection of colorful headbands designed to keep your hair in place while adding a fun touch."
},
{
  id: 29,
  name: "Pink Fur Cap",
  category: "fashion-accessories",
  mood: "cozy-reset",
  price: 2500,
  image: "images/products/product28.jpeg",
  description: "A fluffy pink cap made to keep you warm while adding a soft and cozy feel to your outfit."
},
{
  id: 30,
  name: "Pink Hair Kit",
  category: "hair-accessories",
  mood: "soft-calming",
  price: 5000,
  image: "images/products/product29.jpeg",
  description: "A complete pink hair accessory kit with clips, ties, and essentials for cute everyday hairstyles."
},
{
  id: 31,
  name: "4 in 1 Glasses",
  category: "fashion-accessories",
  mood: "fresh-clean",
  price: 7000,
  image: "images/products/product30.jpeg",
  description: "Versatile glasses with four interchangeable looks, perfect for matching different moods and outfits."
},
{
  id: 32,
  name: "Purple Influencer Light",
  category: "beauty-tools",
  mood: "glow-boost",
  price: 3500,
  image: "images/products/product31.jpeg",
  description: "A purple influencer light designed to brighten your selfies, videos, and beauty setup with a soft glow."
},
];

window.products = products;
