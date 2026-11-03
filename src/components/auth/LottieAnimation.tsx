"use client";

import Lottie from "lottie-react";
import splashAnimation from "../../../public/lottie/splash.json";

export default function LottieAnimation() {
    return (
        <div className="mb-6">
            <Lottie
                animationData={splashAnimation}
                loop={true}
                autoplay={true}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}