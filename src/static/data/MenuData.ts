export interface MenuItem {
    id: number;
    name: string;
    route: string;
    subMenus: SubMenuItem[]
  }

  interface SubMenuItem {
    name: string;
    route: string;
  }
  
  export const menuData: MenuItem[] = [
    {
        id:1,
        name: "Dashboard",
        route: "/",
        subMenus: []
    },
    {
      id:2,
      name: "Sprzedaż",
      route: '/',
      subMenus: [
       {
         name: "Zamówienia",
         route: "/sale/order"
       },
       {
        name:"Wysyłki",
        route: "/sale/shipment"
       }
      ]
    },
    {
      id:3,
      name: "Katalog",
      route: "/",
      subMenus: [
        {
          name: "Produkty",
          route: "/catalog/product"
        },
        {
            name:"Kategorie",
            route:"/catalog/category"
        },
        {
          name:"Grupa atrybutów",
          route:"/catalog/attribute-group"
        },
        {
          name: "Opcje produktu",
          route:"/catalog/product-option"
        },
        {
          name: "Atrybuty produktowe",
          route:"/catalog/product-attribute"
        }
      ]
    },
    {
      id:4,
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
      id:5,
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
      ]
    },
    {
      id:6,
      name: "Bezpieczeństwo",
      route: "/",
      subMenus: [
        {
          name: "Certyfikaty i Bezpieczeństwo",
          route: "/safety/CertyficationAndSafety"
        }
      ]
    }
  ]