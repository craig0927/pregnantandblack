import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

import { Text } from "../../components/Ui";
import type { ScheduleStackParamList } from "../../navigation/ScheduleStack";
import { colors, fonts, radius, spacing, typography } from "../../theme/theme";

type Rte = RouteProp<ScheduleStackParamList, "SessionRequested">;

export default function SessionRequested() {
  const route = useRoute<Rte>();

  const advocateName = route.params?.advocateName ?? "your advocate";

  // -----------------------------
  // Pulse Animation
  // -----------------------------
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    const timeout = setTimeout(() => {
      pulse.stop();
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 5000);

    return () => {
      pulse.stop();
      clearTimeout(timeout);
    };
  }, [scaleAnim]);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.logoBlock, { transform: [{ scale: scaleAnim }] }]}
        >
          <Image
            source={require("../../../assets/images/pabLogoAccent.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.body}>
          Your meeting request has been sent to <Text bold>{advocateName}</Text>
          .
        </Text>

        <Text muted style={styles.muted}>
          You’ll receive a notification once {advocateName} confirms.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl * 6,
  },
  logoBlock: {
    width: 110,
    height: 110,
    borderRadius: radius.lg,
    //backgroundColor: colors.charcoal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logo: {
    width: 160,
    height: 160,
  },
  body: {
    ...typography.body,
    color: colors.charcoal,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
  },
  muted: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  link: {
    color: "#2563EB",
  },
});
