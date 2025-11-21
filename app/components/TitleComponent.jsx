
export default function TitleComponent({product,Title, font, color}) {
    return (
       <h4 style={{color: color, fontSize: font}} className={`mt-3 ${font} order-${Title}`}>{product.title}</h4>
    )
}
