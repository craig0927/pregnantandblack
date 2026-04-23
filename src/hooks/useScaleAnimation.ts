import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function useScaleAnimation(active: boolean) {
  const scale = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  }, [active, scale]);

  return {
    transform: [
      {
        scale: scale.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.05],
        }),
      },
    ],
  };
}
