import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function AdzList() {
  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    speed: 2000,
    autoplaySpeed: 3000,
    cssEase: "linear",
    arrows: false,
  };
  return (
    <div className="slider-container h-full [&_.slick-slider]:h-full [&_.slick-list]:h-full [&_.slick-track]:h-full [&_.slick-slide]:h-full [&_.slick-slide>div]:h-full">
      <Slider {...settings}>
        <div className="bg-white h-full">
          <img src="/adz-1.png" alt="" className="w-full h-full" />
        </div>
        <div className="bg-white h-full">
          <img src="/adz-1.png" alt="" className="w-full h-full" />
        </div>
        <div className="bg-white h-full">
          <img src="/adz-1.png" alt="" className="w-full h-full" />
        </div>
      </Slider>
    </div>
  );
}

export default AdzList;
