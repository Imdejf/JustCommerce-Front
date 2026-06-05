export const menuData: MenuItem[] = [
  {
    id: 1,
    name: "Dashboard",
    route: "/",
    subMenus: []
  },
  {
    id: 2,
    name: "Sprzedaż",
    route: "/",
    subMenus: [
      {
        name: "Zamówienia",
        route: "/sale/order"
      },
      {
        name: "Wysyłki",
        route: "/sale/shipment"
      },
      {
        name: "Oferty",
        route: "/sale/offer"
      },
      {
        name: "Statystyki",
        route: "/sale/statistics"
      }
    ]
  },
  {
    id: 3,
    name: "Allegro",
    route: "/",
    subMenus: [
      {
        name: "Konto Allegro",
        route: "/allegro/account"
      },
      {
        name: "Produkty Allegro",
        route: "/allegro/products"
      },
      {
        name: "Oferty Allegro",
        route: "/allegro/offers"
      },
      {
        name: "Zamówienia Allegro",
        route: "/allegro/orders"
      },
      {
        name: "Ustawienia Allegro",
        route: "/allegro/settings"
      }
    ]
  },
  {
    id: 4,
    name: "Kurierzy",
    route: "/",
    subMenus: [
      {
        name: "Zlecenia",
        route: "/courier/orders"
      }
    ]
  },
  {
    id: 5,
    name: "Katalog",
    route: "/",
    subMenus: [
      {
        name: "Produkty",
        route: "/catalog/product"
      },
      {
        name: "Kategorie",
        route: "/catalog/category"
      },
      {
        name: "Grupa atrybutów",
        route: "/catalog/attribute-group"
      },
      {
        name: "Opcje produktu",
        route: "/catalog/product-option"
      },
      {
        name: "Atrybuty produktowe",
        route: "/catalog/product-attribute"
      }
    ]
  },
  {
    id: 6,
    name: "Menadżer kontentu",
    route: "/",
    subMenus: [
      {
        name: "Kategorie blog",
        route: "/manager-content/category-blogs"
      },
      {
        name: "Posty blog",
        route: "/manager-content/post-blogs"
      }
    ]
  },
  {
    id: 7,
    name: "System",
    route: "/",
    subMenus: [
      {
        name: "Reguły",
        route: "/system/rule"
      },
      {
        name: "Producenci",
        route: "/system/brand"
      },
      {
        name: "Magazyny",
        route: "/system/warehouseBrand"
      }
    ]
  },
  {
    id: 8,
    name: "Bezpieczeństwo",
    route: "/",
    subMenus: [
      {
        name: "Certyfikaty i Bezpieczeństwo",
        route: "/safety/CertyficationAndSafety"
      }
    ]
  },
  {
    id: 9,
    name: "Śledzenie",
    route: "/",
    subMenus: [
      {
        name: "Użytkownicy",
        route: "/tracking/user"
      },
      {
        name: "Strony",
        route: "/tracking/user"
      }
    ]
  }
];