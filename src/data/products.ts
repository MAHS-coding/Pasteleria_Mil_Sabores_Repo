import imgTc001 from "/images/products/tortas/tradicional/torta-cuadrada-chocolate.png";
import imgTc002 from "/images/products/tortas/tradicional/torta-cuadrada-frutas.jpg";
import imgTt001 from "/images/products/tortas/tradicional/torta-circular-vainilla.jpg";
import imgTt002 from "/images/products/tortas/tradicional/torta-circular-manjar.jpg";
import imgPi001 from "/images/products/postres-individuales/mousse-chocolate.png";
import imgPi002 from "/images/products/postres-individuales/tiramisu.jpg";
import imgPsa001 from "/images/products/tortas/sin-azucar/torta-sin-azucar-naranja.png";
import imgPsa002 from "/images/products/cheesecake/sin-azucar/cheesecake-sin-azucar.avif";
import imgPt001 from "/images/products/pasteleria-tradicional/empanada-manzana.jpg";
import imgPt002 from "/images/products/pasteleria-tradicional/tarta-santiago.png";
import imgPg001 from "/images/products/sin-gluten/brownie-sin-gluten.jpg";
import imgPg002 from "/images/products/sin-gluten/pan-sin-gluten.jpg";
import imgPv001 from "/images/products/tortas/vegana/vegana-chocolate.jpg";
import imgPv002 from "/images/products/galletas/vegana/galletas-vegana.jpg";
import imgTe001 from "/images/products/tortas/especial/torta-especial-cumpleaños.png";
import imgTe002 from "/images/products/tortas/especial/torta-especial-boda.jpeg";

export type Product = {
    code: string;
    productName: string;
    price: number;
    img: string;
    category: string;
    desc?: string;
    // Optional inventory fields used by the app
    stock?: number;
    stockCritico?: number;
    capacidadDiaria?: number;
};

export const products: Product[] = [
    {
        code: "TC001",
        productName: "Torta Cuadrada de Chocolate",
        price: 45000,
        img: imgTc001,
        category: "tortas-cuadradas",
        desc: "Deliciosa torta de chocolate con varias capas de esponjoso bizcocho, rellenas de ganache de chocolate belga y un toque de avellanas tostadas. Decorada con virutas de chocolate y una cobertura brillante, es ideal para los amantes del cacao intenso. Perfecta para celebraciones especiales o para consentirte en cualquier ocasión."
    },
    {
        code: "TC002",
        productName: "Torta Cuadrada de Frutas",
        price: 50000,
        img: imgTc002,
        category: "tortas-cuadradas",
        desc: "Una mezcla exquisita de frutas frescas de temporada y crema chantilly natural sobre un suave bizcocho de vainilla. Cada bocado es una explosión de frescura y dulzura, decorada con frutas seleccionadas y glaseado ligero. Ideal para quienes buscan un postre colorido, refrescante y elegante."
    },
    {
        code: "TT001",
        productName: "Torta Circular de Vainilla",
        price: 40000,
        img: imgTt001,
        category: "tortas-circulares",
        desc: "Bizcocho de vainilla clásico, suave y aromático, relleno con generosa crema pastelera y cubierto con un glaseado dulce y delicado. Decorada con detalles de chocolate blanco y perlas de azúcar, es una opción tradicional que nunca falla en cumpleaños y reuniones familiares."
    },
    {
        code: "TT002",
        productName: "Torta Circular de Manjar",
        price: 42000,
        img: imgTt002,
        category: "tortas-circulares",
        desc: "Torta tradicional chilena con capas de bizcocho esponjoso, rellenas de abundante manjar artesanal y nueces trozadas. Su cobertura de merengue italiano y decoración con nueces enteras la convierten en un clásico irresistible para los fanáticos del sabor dulce y la textura crujiente."
    },
    {
        code: "PI001",
        productName: "Mousse de Chocolate",
        price: 5000,
        img: imgPi001,
        category: "postres-individuales",
        desc: "Postre cremoso y suave, elaborado con chocolate de alta calidad y una textura aireada que se deshace en la boca. Perfecto para los amantes del chocolate, ideal como broche de oro para cualquier comida o celebración. Se sirve frío y decorado con virutas de chocolate y frutos rojos."
    },
    {
        code: "PI002",
        productName: "Tiramisú Clásico",
        price: 5500,
        img: imgPi002,
        category: "postres-individuales",
        desc: "El clásico postre italiano con capas de bizcocho empapado en café, crema de mascarpone y cacao puro. Su sabor equilibrado y textura suave lo convierten en el favorito de quienes buscan un postre sofisticado y reconfortante. Presentado en porciones individuales listas para disfrutar."
    },
    {
        code: "PSA001",
        productName: "Torta Sin Azúcar de Naranja",
        price: 48000,
        img: imgPsa001,
        category: "productos-sin-azucar",
        desc: "Torta ligera y deliciosa, endulzada naturalmente con jugo de naranja y edulcorantes saludables. Su bizcocho esponjoso y su aroma cítrico la hacen perfecta para quienes cuidan su consumo de azúcar sin renunciar al placer de un buen postre."
    },
    {
        code: "PSA002",
        productName: "Cheesecake Sin Azúcar",
        price: 47000,
        img: imgPsa002,
        category: "productos-sin-azucar",
        desc: "Cheesecake suave y cremoso, elaborado con queso crema light y endulzado sin azúcar refinada. Su base de galleta integral y su cobertura de frutas frescas lo hacen irresistible y apto para quienes buscan opciones más saludables."
    },
    {
        code: "PT001",
        productName: "Empanada de Manzana",
        price: 3000,
        img: imgPt001,
        category: "pasteleria-tradicional",
        desc: "Empanada tradicional rellena de manzanas frescas, canela y pasas, envuelta en una masa dorada y crujiente. Un clásico de la pastelería chilena, ideal para acompañar el té o el café de la tarde."
    },
    {
        code: "PT002",
        productName: "Tarta de Santiago",
        price: 6000,
        img: imgPt002,
        category: "pasteleria-tradicional",
        desc: "Tarta española hecha con almendras molidas, azúcar y huevos, decorada con la tradicional cruz de Santiago en azúcar glas. Su sabor intenso y textura húmeda la convierten en una delicia para los amantes de la repostería europea."
    },
    {
        code: "PG001",
        productName: "Brownie Sin Gluten",
        price: 3500,
        img: imgPg001,
        category: "productos-sin-gluten",
        desc: "Brownie denso y húmedo, elaborado sin gluten pero con todo el sabor del chocolate. Ideal para personas celíacas o quienes buscan alternativas más saludables, sin sacrificar el placer de un buen postre."
    },
    {
        code: "PG002",
        productName: "Pan Sin Gluten",
        price: 3500,
        img: imgPg002,
        category: "productos-sin-gluten",
        desc: "Pan suave y esponjoso, libre de gluten, perfecto para acompañar cualquier comida o preparar deliciosos sándwiches. Su sabor neutro y textura ligera lo hacen apto para toda la familia."
    },
    {
        code: "PV001",
        productName: "Torta Vegana de Chocolate",
        price: 38000,
        img: imgPv001,
        category: "productos-veganos",
        desc: "Torta húmeda y esponjosa, elaborada sin productos de origen animal. Rellena de crema de chocolate vegana y decorada con frutas frescas o frutos secos. Una opción deliciosa y ética para quienes siguen una dieta vegana."
    },
    {
        code: "PV002",
        productName: "Galletas Veganas de Avena",
        price: 4500,
        img: imgPv002,
        category: "productos-veganos",
        desc: "Galletas crujientes y sabrosas, hechas con avena integral, plátano y chips de chocolate vegano. Son una opción saludable y energética para disfrutar en cualquier momento del día."
    },
    {
        code: "TE001",
        productName: "Torta Especial de Cumpleaños",
        price: 55000,
        img: imgTe001,
        category: "tortas-especiales",
        desc: "Celebra a lo grande con una torta de cumpleaños totalmente personalizable: elige sabores, colores y decoraciones temáticas. Rellena de crema suave y frutas o chocolate, y decorada con fondant artístico, figuras y mensajes especiales. Sorprende a tus seres queridos con una torta única y deliciosa, hecha a tu medida."
    },
    {
        code: "TE002",
        productName: "Torta Especial de Boda",
        price: 60000,
        img: imgTe002,
        category: "tortas-especiales",
        desc: "Elegante torta de boda de varios pisos, elaborada con ingredientes premium y decorada con flores naturales o de azúcar. Rellena de crema de vainilla, frutos rojos o chocolate, según tu preferencia. Un centro de mesa espectacular y delicioso para el día más importante de tu vida."
    }
];