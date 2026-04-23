import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

import { colors, spacing } from "../theme/theme";

// TopoJSON (bundled in app)
// Install:
//   npm i us-atlas topojson-client d3-geo
import us from "us-atlas/states-10m.json";

import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";

import type { StateAbbr } from "../data/state_data";

type Props = {
  selectedState: StateAbbr | null;
  onSelectState?: (abbr: StateAbbr) => void;
  height?: number;
};

type StateShape = {
  abbr: string;
  d: string;
};

/**
 * We map TopoJSON numeric ids (FIPS) -> state abbreviations.
 * states-10m.json uses numeric ids per feature.
 */
const FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};

function padFips(id: unknown): string | null {
  if (id === null || id === undefined) return null;
  const s = String(id);
  // some topojson ids already "06" etc; others "6"
  const n = s.replace(/\D/g, "");
  if (!n) return null;
  return n.length === 1 ? `0${n}` : n.length === 2 ? n : n.slice(-2);
}

export default function UsStateHeroMap({
  selectedState,
  onSelectState,
  height = 170,
}: Props) {
  const shapes = useMemo<StateShape[]>(() => {
    // Convert topojson to geojson

    const fc = feature(us as any, (us as any).objects.states);

    const projection = geoAlbersUsa();
    const path = geoPath(projection);

    // Fit a consistent virtual viewport
    // We'll render in a 1000x600-ish coordinate space by scaling the <Svg>.
    // d3-geo will generate in projection units; we scale via viewBox measured bounds.
    const entries: StateShape[] = [];

    for (const f of (fc as any).features as any[]) {
      const fips = padFips(f.id);
      if (!fips) continue;
      const abbr = FIPS_TO_ABBR[fips];
      if (!abbr) continue;

      const d = path(f);
      if (!d) continue;

      entries.push({ abbr, d });
    }

    // Stable ordering
    entries.sort((a, b) => a.abbr.localeCompare(b.abbr));
    return entries;
  }, []);

  // --- subtle animation (fill opacity) on selection changes ---
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      anim.setValue(0);
    });
  }, [selectedState, anim]);

  // We render paths in a group and rely on Svg scale-to-fit.
  // The projection already positions the US; we wrap in a container.
  return (
    <View style={[styles.wrap, { height }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <G scale={1} transform="translate(0,0)">
          {shapes.map((s) => {
            const selected = !!selectedState && s.abbr === selectedState;
            return (
              <PressablePath
                key={s.abbr}
                d={s.d}
                selected={selected}
                onPress={
                  onSelectState
                    ? () => onSelectState(s.abbr as StateAbbr)
                    : undefined
                }
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function PressablePath({
  d,
  selected,
  onPress,
}: {
  d: string;
  selected: boolean;
  onPress?: () => void;
}) {
  // per-state “pop” feel on select
  const scale = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1 : 0,
      useNativeDriver: false,
      friction: 9,
      tension: 140,
    }).start();
  }, [selected, scale]);

  // RN SVG doesn’t take “transform” style props like Views;
  // Instead we animate opacity + use thicker stroke + fill.
  const fillOpacity = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.0, 0.16],
  });

  const strokeOpacity = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <G>
      <AnimatedPath
        d={d}
        onPress={onPress}
        fill={selected ? colors.accent : "transparent"}
        fillOpacity={fillOpacity as any}
        stroke={selected ? colors.accent : colors.charcoal}
        strokeWidth={selected ? 1.6 : 1.1}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={strokeOpacity as any}
      />
    </G>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: colors.bg,
    padding: spacing.sm,
    overflow: "hidden",
  },
});
