PRODUCT PHOTOS
==============

Put your product photos in this folder, then tell the store which photo belongs to which product.

1. Save the photo here, for example:   earbuds.jpg
   - Square photos look best (for example 800 x 800 pixels).
   - A plain white or light background matches the store design.
   - JPG, PNG or WEBP all work. Keep each file under about 300 KB so the store loads fast.

2. Open products.js and add  image: "earbuds.jpg"  to that product's line, for example:

   { id: 1, cat: "electronics", name: "Wireless Earbuds", price: 1499, mrp: 2999, rating: 4.3, icon: "🎧", image: "earbuds.jpg" },

That's it. The photo then shows everywhere: product cards, the product page, search suggestions,
the cart, wishlist, Deal of the Day and the homepage rows.

Products without a photo keep showing their emoji, and if a photo file is missing or misspelled
the store quietly shows the emoji instead, so nothing breaks.

Only use photos you own or have permission to use (for example, from your supplier).
