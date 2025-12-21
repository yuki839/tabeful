import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CarouselContainerProps {
  children: React.ReactNode[];
  slideToShow: number;
}

export default function CarouselContainer({
  children,
  slideToShow,
}: CarouselContainerProps) {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full"
    >
      <CarouselContent>
        {children.map((child, index) => (
          <CarouselItem
            key={index}
            //className="basis-1/2"
            style={{ flexBasis: `${100 / slideToShow}%` }}
          >
            <div className="p-1">
              <div>{child}</div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
