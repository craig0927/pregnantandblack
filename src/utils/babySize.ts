import type { ImageSourcePropType } from "react-native";

export type BabySizeKey =
  | "seed"
  | "blueberry"
  | "grape"
  | "strawberry"
  | "lime"
  | "lemon"
  | "peach"
  | "apple"
  | "avocado"
  | "banana"
  | "mango"
  | "cabbage"
  | "coconut"
  | "pineapple"
  | "watermelon";

export type BabyWeekSize = {
  week: number; // 1..40
  fruit: string;

  imageKey: BabySizeKey;
  blurb: string;
};

export type BabySizeResult = BabyWeekSize & {
  imageSource: ImageSourcePropType;
};

const WEEKLY: Record<number, BabyWeekSize> = {
  // Weeks 1–4: seed
  1: {
    week: 1,
    fruit: "Sesame seed",

    imageKey: "seed",
    blurb: "Just getting started",
  },
  2: {
    week: 2,
    fruit: "Sesame seed",

    imageKey: "seed",
    blurb: "Just getting started",
  },
  3: {
    week: 3,
    fruit: "Sesame seed",

    imageKey: "seed",
    blurb: "Just getting started",
  },
  4: {
    week: 4,
    fruit: "Sesame seed",

    imageKey: "seed",
    blurb: "Just getting started",
  },

  // 5–7: blueberry
  5: {
    week: 5,
    fruit: "Blueberry",

    imageKey: "blueberry",
    blurb: "Tiny but growing fast",
  },
  6: {
    week: 6,
    fruit: "Blueberry",

    imageKey: "blueberry",
    blurb: "Tiny but growing fast",
  },
  7: {
    week: 7,
    fruit: "Blueberry",

    imageKey: "blueberry",
    blurb: "Tiny but growing fast",
  },

  // 8–9: grape
  8: {
    week: 8,
    fruit: "Grape",

    imageKey: "grape",
    blurb: "Starting to look more baby-like",
  },
  9: {
    week: 9,
    fruit: "Grape",

    imageKey: "grape",
    blurb: "Starting to look more baby-like",
  },

  // 10–11: fig
  10: {
    week: 10,
    fruit: "Strawberry",

    imageKey: "strawberry",
    blurb: "Major development week to week",
  },
  11: {
    week: 11,
    fruit: "Strawberry",

    imageKey: "strawberry",
    blurb: "Major development week to week",
  },

  // 12–13: lime
  12: {
    week: 12,
    fruit: "Lime",

    imageKey: "lime",
    blurb: "Entering a big growth phase",
  },
  13: {
    week: 13,
    fruit: "Lime",

    imageKey: "lime",
    blurb: "Entering a big growth phase",
  },

  // 14–15: lemon
  14: {
    week: 14,
    fruit: "Lemon",

    imageKey: "lemon",
    blurb: "Steady growth + strengthening",
  },
  15: {
    week: 15,
    fruit: "Lemon",

    imageKey: "lemon",
    blurb: "Steady growth + strengthening",
  },

  // 16–17: peach
  16: {
    week: 16,
    fruit: "Peach",

    imageKey: "peach",
    blurb: "Growth spurts are common",
  },
  17: {
    week: 17,
    fruit: "Peach",

    imageKey: "peach",
    blurb: "Growth spurts are common",
  },

  // 18–20: apple
  18: {
    week: 18,
    fruit: "Apple",

    imageKey: "apple",
    blurb: "Halfway point is near",
  },
  19: {
    week: 19,
    fruit: "Apple",

    imageKey: "apple",
    blurb: "Halfway point is near",
  },
  20: {
    week: 20,
    fruit: "Apple",

    imageKey: "apple",
    blurb: "Halfway point is near",
  },

  // 21–22: avocado
  21: {
    week: 21,
    fruit: "Avocado",

    imageKey: "avocado",
    blurb: "More movement + growth",
  },
  22: {
    week: 22,
    fruit: "Avocado",

    imageKey: "avocado",
    blurb: "More movement + growth",
  },

  // 23–25: banana
  23: {
    week: 23,
    fruit: "Banana",

    imageKey: "banana",
    blurb: "Big gains in size and weight",
  },
  24: {
    week: 24,
    fruit: "Banana",

    imageKey: "banana",
    blurb: "Big gains in size and weight",
  },
  25: {
    week: 25,
    fruit: "Banana",

    imageKey: "banana",
    blurb: "Big gains in size and weight",
  },

  // 26–28: mango
  26: {
    week: 26,
    fruit: "Mango",

    imageKey: "mango",
    blurb: "Getting stronger each week",
  },
  27: {
    week: 27,
    fruit: "Mango",

    imageKey: "mango",
    blurb: "Getting stronger each week",
  },
  28: {
    week: 28,
    fruit: "Mango",

    imageKey: "mango",
    blurb: "Getting stronger each week",
  },

  // 29–31: cabbage
  29: {
    week: 29,
    fruit: "Cabbage",

    imageKey: "cabbage",
    blurb: "Rapid weight gain phase",
  },
  30: {
    week: 30,
    fruit: "Cabbage",

    imageKey: "cabbage",
    blurb: "Rapid weight gain phase",
  },
  31: {
    week: 31,
    fruit: "Cabbage",

    imageKey: "cabbage",
    blurb: "Rapid weight gain phase",
  },

  // 32–33: coconut
  32: {
    week: 32,
    fruit: "Coconut",

    imageKey: "coconut",
    blurb: "Body is preparing for delivery",
  },
  33: {
    week: 33,
    fruit: "Coconut",

    imageKey: "coconut",
    blurb: "Body is preparing for delivery",
  },

  // 34–36: pineapple
  34: {
    week: 34,
    fruit: "Pineapple",

    imageKey: "pineapple",
    blurb: "Nearly full-term",
  },
  35: {
    week: 35,
    fruit: "Pineapple",

    imageKey: "pineapple",
    blurb: "Nearly full-term",
  },
  36: {
    week: 36,
    fruit: "Pineapple",

    imageKey: "pineapple",
    blurb: "Nearly full-term",
  },

  // 37–40: melon
  37: {
    week: 37,
    fruit: "Watermelon",

    imageKey: "watermelon",
    blurb: "Full-term range",
  },
  38: {
    week: 38,
    fruit: "Watermelon",

    imageKey: "watermelon",
    blurb: "Full-term range",
  },
  39: {
    week: 39,
    fruit: "Watermelon",

    imageKey: "watermelon",
    blurb: "Full-term range",
  },
  40: {
    week: 40,
    fruit: "Watermelon",

    imageKey: "watermelon",
    blurb: "Full-term range",
  },
};

export function getBabySizeImageSource(key: BabySizeKey): ImageSourcePropType {
  // IMPORTANT: require() paths must be static literals
  switch (key) {
    case "seed":
      return require("../../assets/babySize/sesame-cottonbro.jpg");
    case "blueberry":
      return require("../../assets/babySize/blueberry-fotios.jpg");
    case "grape":
      return require("../../assets/babySize/grape-gilmerdiaz.jpg");
    case "strawberry":
      return require("../../assets/babySize/strawberry-nietjuhart.jpg");
    case "lime":
      return require("../../assets/babySize/lime-farlight.jpg");
    case "lemon":
      return require("../../assets/babySize/lemon-goumbik.jpg");
    case "peach":
      return require("../../assets/babySize/peach-laker.jpg");
    case "apple":
      return require("../../assets/babySize/apple-pixabay.jpg");
    case "avocado":
      return require("../../assets/babySize/avocado-thought-catalog.jpg");
    case "banana":
      return require("../../assets/babySize/banana-shvets.jpg");
    case "mango":
      return require("../../assets/babySize/mango-rcwired.jpg");
    case "cabbage":
      return require("../../assets/babySize/cabbage-ellie-burgin.jpg");
    case "coconut":
      return require("../../assets/babySize/coconut-cottonbro.jpg");
    case "pineapple":
      return require("../../assets/babySize/pineapple-psco.jpg");
    case "watermelon":
      return require("../../assets/babySize/watermelon-pixabay.jpg");
    default:
      return require("../../assets/babySize/sesame-cottonbro.jpg");
  }
}

export function getBabySize(
  weeksInput?: number | string | null
): BabySizeResult {
  const weeks =
    typeof weeksInput === "string"
      ? parseInt(weeksInput, 10)
      : typeof weeksInput === "number"
      ? Math.floor(weeksInput)
      : NaN;

  if (!Number.isFinite(weeks)) {
    const fallback = {
      week: 0,
      fruit: "—",

      imageKey: "seed" as const,
      blurb: "Add weeks pregnant to see baby size",
    };
    return {
      ...fallback,
      imageSource: getBabySizeImageSource(fallback.imageKey),
    };
  }

  // clamp to 1..40
  const w = Math.max(1, Math.min(40, weeks));
  const entry = WEEKLY[w] ?? WEEKLY[40];

  return {
    ...entry,
    imageSource: getBabySizeImageSource(entry.imageKey),
  };
}
