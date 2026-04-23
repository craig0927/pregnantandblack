import { Picker } from "@react-native-picker/picker";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import BabySizeCard from "../../components/BabySizeCard";
import { Card, Text } from "../../components/Ui";
import UsStateHeroMap from "../../components/UsStateHeroMap";
import { useAuth } from "../../context/AuthContext";
import { STATE_DATA, type StateAbbr } from "../../data/state_data";
import { colors, fonts, neumorph, radius, spacing } from "../../theme/theme";

import {
    Resource,
    RESOURCES,
    Trimester,
} from "../../data/resources";

type Mode = "trimester" | "state";

const US_STATES = Object.values(STATE_DATA)
  .map((s) => ({ label: s.name, value: s.abbr }))
  .sort((a, b) => a.label.localeCompare(b.label));

function getTrimesterPrep(trimester: Trimester): {
  title: string;
  description: string;
  items: string[];
} {
  switch (trimester) {
    case "1st":
      return {
        title: "Preparing for Baby",
        description:
          "Families in this trimester often begin thinking about essential items that support comfort and early care.",
        items: [
          "Prenatal vitamins",
          "Support bras",
          "Nausea relief",
          "Hydration bottle",
        ],
      };
    case "2nd":
      return {
        title: "Growing Stronger",
        description:
          "Your baby is growing rapidly and starting to interact with the world around them.",
        items: [
          "Belly support band",
          "Pregnancy pillow",
          "Baby registry",
          "Birthing classes",
        ],
      };
    case "3rd":
      return {
        title: "Almost There",
        description:
          "Your baby is getting ready to meet you. Focus on rest, preparation, and self-care.",
        items: [
          "Hospital bag",
          "Car seat",
          "Postpartum care",
          "Newborn essentials",
        ],
      };
    default:
      return { title: "", description: "", items: [] };
  }
}

export default function DashboardResources() {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { profile } = useAuth();

  const displayName = profile?.preferredName || profile?.username || "";

  const [mode, setMode] = useState<Mode>("trimester");
  const [selectedTrimester, setSelectedTrimester] = useState<Trimester>("1st");
  const [modeRowWidth, setModeRowWidth] = useState(0);
  const [trimesterRowWidth, setTrimesterRowWidth] = useState(0);
  const modeSliderAnim = useRef(new Animated.Value(0)).current;
  const trimesterSliderAnim = useRef(new Animated.Value(0)).current;

  const [selectedState, setSelectedState] = useState<StateAbbr | null>(null);

  // ===============================
  // Trimester filtering
  // ===============================

  const trimesterResources = useMemo<Resource[]>(() => {
    return RESOURCES.filter((r) => r.trimester === selectedTrimester);
  }, [selectedTrimester]);

  // ===============================
  // State filtering
  // ===============================

  const stateResources = useMemo<Resource[]>(() => {
    if (!selectedState) return [];
    return RESOURCES.filter((r) => r.state === selectedState);
  }, [selectedState]);

  const stateData = selectedState ? STATE_DATA[selectedState] : null;

  // ===============================
  // Navigation
  // ===============================

  const goToResource = (resource: Resource) => {
    navigation.navigate("ResourceDetail", { resource });
  };

  useEffect(() => {
    Animated.timing(modeSliderAnim, {
      toValue: mode === "trimester" ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
      easing: (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    }).start();
  }, [mode, modeSliderAnim]);

  useEffect(() => {
    const trimesterIndex =
      selectedTrimester === "1st" ? 0 : selectedTrimester === "2nd" ? 1 : 2;
    Animated.timing(trimesterSliderAnim, {
      toValue: trimesterIndex,
      duration: 300,
      useNativeDriver: true,
      easing: (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    }).start();
  }, [selectedTrimester, trimesterSliderAnim]);

  // ===============================
  // UI
  // ===============================

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: tabBarHeight + spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sectionTop}>
        <View style={styles.welcome}>
          <Text bold style={styles.welcomeHeading}>{displayName ? `Welcome, ${displayName}.` : "Welcome to Pregnant and Black."} You&apos;re not alone.</Text>
          <Text muted style={styles.welcomeSubtitle}>
            Explore the resources to find information, connect with an advocate for support, and join the community.
          </Text>
        </View>

        <View
          style={styles.pillRow}
          onLayout={(e) => setModeRowWidth(e.nativeEvent.layout.width)}
        >
          {modeRowWidth > 0 && (
            <Animated.View
              style={[
                styles.pillSlider,
                {
                  width: (modeRowWidth - 8) / 2,
                  transform: [
                    {
                      translateX: modeSliderAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (modeRowWidth - 8) / 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          {([
            { key: "trimester" as const, label: "Trimester" },
            { key: "state" as const, label: "State" },
          ]).map((item) => {
            const isActive = mode === item.key;
            return (
              <Pressable
                key={item.key}
                style={styles.segmentPill}
                onPress={() => {
                  if (item.key === "trimester") setSelectedState(null);
                  setMode(item.key);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* =========================
            TRIMESTER MODE
           ========================= */}
        {mode === "trimester" && (
          <View style={styles.stack}>
            {trimesterResources.map((r) => (
              <Pressable key={r.id} onPress={() => goToResource(r)}>
                <Card style={styles.definedCard}>
                  <Text bold>{r.title}</Text>
                  {!!r.subtitle && (
                    <Text muted style={{ marginTop: spacing.sm }}>
                      {r.subtitle}
                    </Text>
                  )}
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {/* =========================
            STATE MODE
           ========================= */}
        {mode === "state" && (
          <View style={styles.stack}>
            {/* Dropdown */}
            <Card style={styles.definedCard}>
              <Text bold style={styles.cardHeader}>
                Select a state
              </Text>
              <View style={styles.dropdownWrap}>
                <Picker
                  selectedValue={selectedState}
                  onValueChange={(value) => setSelectedState(value as StateAbbr)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  {...(Platform.OS === "ios" ? {} : { mode: "dropdown" as const })}
                >
                  <Picker.Item label="Select a state..." value={null} color={colors.charcoal} />
                  {US_STATES.map((s) => (
                    <Picker.Item
                      key={s.value}
                      label={s.label}
                      value={s.value}
                      color={colors.charcoal}
                    />
                  ))}
                </Picker>
              </View>
            </Card>

            {/* HERO MAP */}
            <UsStateHeroMap
              selectedState={selectedState}
              onSelectState={(abbr) => setSelectedState(abbr)}
              height={200}
            />

            {/* STATE SNAPSHOT */}
            {stateData && (
              <View style={{ gap: spacing.md }}>
                {/* 1️⃣ Postpartum Coverage */}
                <Card style={styles.definedCard}>
                  <Text bold style={styles.cardHeader}>
                    Postpartum Coverage
                  </Text>
                  <Text muted style={{ marginTop: spacing.sm }}>
                    {stateData.postpartumCoverage.summary}
                  </Text>
                  {!!stateData.postpartumCoverage.detail && (
                    <Text muted style={{ marginTop: spacing.xs }}>
                      {stateData.postpartumCoverage.detail}
                    </Text>
                  )}
                </Card>

                {/* 2️⃣ Paid Leave */}
                <Card style={styles.definedCard}>
                  <Text bold style={styles.cardHeader}>
                    Paid Family Leave
                  </Text>
                  <Text muted style={{ marginTop: spacing.sm }}>
                    {stateData.paidFamilyLeave.summary}
                  </Text>
                  {!!stateData.paidFamilyLeave.detail && (
                    <Text muted style={{ marginTop: spacing.xs }}>
                      {stateData.paidFamilyLeave.detail}
                    </Text>
                  )}
                  {!!stateData.paidFamilyLeave.officialProgramUrl && (
                    <Text
                      style={{ marginTop: spacing.sm }}
                      onPress={() =>
                        Linking.openURL(stateData.paidFamilyLeave.officialProgramUrl!)
                      }
                    >
                      Official state program
                    </Text>
                  )}
                </Card>

                {/* 3️⃣ Employment Rights */}
                <Card style={styles.definedCard}>
                  <Text bold style={styles.cardHeader}>
                    Your Rights & Protections
                  </Text>
                  <View style={{ marginTop: spacing.sm }}>
                    {stateData.rightsSummary.map((line: string, i: number) => (
                      <Text key={i} muted style={{ marginBottom: 6 }}>
                        • {line}
                      </Text>
                    ))}
                  </View>
                </Card>

                {/* 4️⃣ Trusted Support */}
                <Card style={styles.definedCard}>
                  <Text bold style={styles.cardHeader}>
                    Trusted Support
                  </Text>
                  <View style={{ marginTop: spacing.sm }}>
                    {stateData.trustedSupportLinks.map((link, i) => (
                      <Pressable
                        key={i}
                        onPress={() => Linking.openURL(link.url)}
                        style={{ marginBottom: 12 }}
                      >
                        <Text>{link.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Card>

                {/* 5️⃣ Immediate Help */}
                <Card style={styles.definedCard}>
                  <Text bold style={styles.cardHeader}>
                    Immediate Help
                  </Text>
                  <View style={{ marginTop: spacing.sm }}>
                    {stateData.immediateHelp.map((item, i) => (
                      <View key={i} style={{ marginBottom: 8 }}>
                        <Text bold>{item.label}</Text>

                        {!!item.contact && (
                          <Text
                            muted
                            onPress={() =>
                              Linking.openURL(`tel:${item.contact}`)
                            }
                          >
                            {item.contact}
                          </Text>
                        )}

                        {!!item.url && (
                          <Text
                            muted
                            onPress={() => Linking.openURL(item.url!)}
                          >
                            Open resource
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </Card>

                <View style={styles.sourcesBlock}>
                  <Text muted style={styles.sourcesText}>
                    Sources: U.S. Department of Labor Women&apos;s Bureau state
                    protections data, CMS Medicaid state directory, USDA WIC
                    program contacts, USAGov state health departments, and
                    official state paid leave program sites where applicable.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* =========================
          BABY + TRIMESTER (Animated)
         ========================= */}
      {mode === "trimester" && (
        <Card style={[styles.definedCard, styles.cardGap]}>
          <View
            style={styles.pillRow}
            onLayout={(e) => setTrimesterRowWidth(e.nativeEvent.layout.width)}
          >
            {trimesterRowWidth > 0 && (
              <Animated.View
                style={[
                  styles.pillSlider,
                  {
                    width: (trimesterRowWidth - 8) / 3,
                    transform: [
                      {
                        translateX: trimesterSliderAnim.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [
                            0,
                            (trimesterRowWidth - 8) / 3,
                            ((trimesterRowWidth - 8) / 3) * 2,
                          ],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
            {(["1st", "2nd", "3rd"] as Trimester[]).map((t) => {
              const isActive = selectedTrimester === t;
              return (
                <Pressable
                  key={t}
                  style={styles.segmentPill}
                  onPress={() => setSelectedTrimester(t)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isActive && styles.segmentTextActive,
                    ]}
                  >
                    {t} Trimester
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: spacing.md }}>
            <BabySizeCard trimester={selectedTrimester} />
          </View>

          {/* PREPARATION CARD */}
          <Card style={[styles.definedCard, { marginTop: spacing.md }]}>
            <Text bold style={styles.prepTitle}>
              {getTrimesterPrep(selectedTrimester).title}
            </Text>

            <Text muted style={styles.prepDescription}>
              {getTrimesterPrep(selectedTrimester).description}
            </Text>

            <View style={styles.prepChips}>
              {getTrimesterPrep(selectedTrimester).items.map((item) => (
                <View key={item} style={styles.prepChip}>
                  <Text style={styles.prepChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  welcome: {
    marginBottom: spacing.md,
  },
  welcomeHeading: {
    fontSize: 18,
    color: colors.charcoal,
    textAlign: "center",
    lineHeight: 26,
    fontFamily: fonts.bold,
  },
  welcomeSubtitle: {
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  sourcesBlock: {
    marginTop: spacing.xs,
  },
  sourcesText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  sectionTop: { gap: spacing.md },
  stack: { gap: spacing.md },
  cardGap: { marginTop: spacing.md },

  definedCard: {
    backgroundColor: colors.cream,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardHeader: {
    color: colors.coral,
    fontFamily: fonts.bold,
  },

  dropdownWrap: {
    marginTop: spacing.sm,
    height: Platform.OS === "ios" ? 170 : 52,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 170 : 52,
    color: colors.charcoal,
  },
  pickerItem: {
    fontSize: 17,
    color: colors.charcoal,
  },

  pillRow: {
    flexDirection: "row",
    backgroundColor: neumorph.bg,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
    shadowColor: "#888888",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 7,
    elevation: 6,
  },

  segmentPill: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 1,
  },
  pillSlider: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.sm,
    backgroundColor: neumorph.bg,
    boxShadow:
      "inset 3px 3px 5px rgba(0,0,0,0.18), inset -3px -3px 5px rgba(255,255,255,0.7)",
    elevation: 0,
    shadowOpacity: 0,
  } as any,
  segmentText: {
    color: colors.warmGray,
    fontWeight: "500",
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  segmentTextActive: {
    color: colors.coral,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },

  prepTitle: {
    fontSize: 15,
    color: colors.charcoal,
    fontFamily: fonts.bold,
  },
  prepDescription: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  prepChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  prepChip: {
    backgroundColor: colors.cream,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 120, 86, 0.15)",
  },
  prepChipText: {
    fontSize: 12,
    color: colors.charcoal,
    fontWeight: "500",
    fontFamily: fonts.medium,
  },
});
