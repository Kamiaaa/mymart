import Carousel from "./components/Carousel";
import CategoryCard from "./components/CategoryCard";
import NewArrivalsSlider from "./components/NewArrivalsSlider";
import ProductsPage from "./components/Products";

export default function Home() {
  return (
    <>
      <Carousel/>
      <CategoryCard/>
      <NewArrivalsSlider/>
      <ProductsPage/>
    </>
  );
}
