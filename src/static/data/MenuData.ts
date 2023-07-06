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
        name: "Katalog",
        route: "/",
        subMenus: [
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
      id:3,
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
        },
      ]
    }
    
  ]