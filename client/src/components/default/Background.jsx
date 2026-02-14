import { memo } from "react";
import { motion } from "framer-motion";

function Background() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950 to-blue-700" />

      <div className="absolute inset-0 overflow-hidden opacity-40">
        <motion.div
          className="absolute left-[10%] bottom-[20%] w-80 h-80 rounded-full bg-red-500 blur-3xl"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute right-[15%] bottom-[25%] w-64 h-80 rounded-full bg-orange-500 blur-3xl"
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 25, -35, 0],
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute right-[30%] top-[15%] w-96 h-32 rounded-full bg-blue-100 blur-3xl"
          animate={{
            x: [0, 60, -40, 0],
            y: [0, 40, -20, 0],
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>
    </div>
  );
}

export default memo(Background);
