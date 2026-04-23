import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text } from "../../components/Ui";
import { colors, fonts, radius, spacing } from "../../theme/theme";

type Slide = {
  id: string;
  image: any; // require(...)
  title: string;
  body: string;
};

const logo = require("../../../assets/images/pabLogoAccent.png");

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const snapCount = useRef(0);
  const insets = useSafeAreaInsets();

  const framePadding = spacing.lg; // 16pt breathing room around image
  const imageWidth = width - framePadding * 2;
  const imageHeight = height * 0.5;
  const imageRadius = 24;

  const slides: Slide[] = useMemo(
    () => [
      {
        id: "1",
        image: require("../../../assets/welcome/pexels-cottonbro-5853820.jpg"),
        title: "Someone who's always\nthere for you",
        body:
          "Browse approved health care advocates, explore support styles, and request a session with someone who fits your needs.",
      },
      {
        id: "2",
        image: require("../../../assets/welcome/pexels-ermias-tarekegn-1107682-2100864.jpg"),
        title: "Learn, prepare, and\nfeel empowered",
        body:
          "Use educational tools and trusted resources to stay informed through pregnancy, birth, and postpartum care.",
      },
      {
        id: "3",
        image: require("../../../assets/welcome/pexels-shvets-production-6991890.jpg"),
        title: "Stay connected before\nand after your sessions",
        body:
          "Message your advocate, follow session updates, and keep up with important activity all in one place.",
      },
    ],
    [],
  );

  return (
    <View style={styles.root}>
      {/* Framed image carousel with rounded corners and breathing room */}
      <View
        style={[
          styles.imageFrame,
          {
            marginTop: insets.top + spacing.sm,
            marginHorizontal: framePadding,
            height: imageHeight,
            borderRadius: imageRadius,
          },
        ]}
      >
        <Carousel
          width={imageWidth}
          height={imageHeight}
          data={slides}
          loop
          autoPlay={isPlaying}
          autoPlayInterval={3500}
          scrollAnimationDuration={900}
          pagingEnabled
          onSnapToItem={(i) => {
            setIndex(i);
            snapCount.current += 1;
            if (snapCount.current >= slides.length - 1) {
              setIsPlaying(false);
            }
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image
                source={item.image}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </View>
          )}
        />

        {/* Logo centered over image */}
        <View style={styles.logoContainer} pointerEvents="none">
          <Image source={logo} style={styles.brandLogo} resizeMode="contain" />
        </View>
      </View>

      {/* Content area below image */}
      <View style={styles.contentArea}>
        <Text style={styles.title}>{slides[index]?.title}</Text>
        <Text style={styles.body}>{slides[index]?.body}</Text>

        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                i === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Button
          label="Create a New Account"
          onPress={() => navigation.navigate("CreateAccount")}
          style={styles.cta}
        />

        <View style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate("SignIn")}>
            <Text style={styles.signinLink}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },

  imageFrame: {
    overflow: "hidden",
    // Subtle shadow to lift the image off the background
    shadowColor: "#C4A98C",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 5,
  },
  slide: { flex: 1 },
  image: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(250, 243, 232, 0.15)",
  },

  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.xxl,
  },
  brandLogo: {
    width: 200,
    height: 200,
  },

  contentArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: fonts.bold,
    color: colors.charcoal,
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.regular,
    color: colors.charcoal,
    opacity: 0.65,
    marginBottom: spacing.lg,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  dotActive: { backgroundColor: colors.coral },
  dotInactive: { backgroundColor: colors.peach },

  cta: {
    borderRadius: 12,
  },

  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  signinText: {
    color: colors.warmGray,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  signinLink: {
    color: colors.coral,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    textDecorationLine: "underline",
  },
});
