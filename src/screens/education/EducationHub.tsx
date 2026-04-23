import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, View } from "react-native";
import { Card, H2, Screen, Text } from "../../components/Ui";

type Article = {
  id: string;
  title: string;
  subtitle?: string;
};

const ARTICLES: Article[] = [
  {
    id: "1",
    title: "Understanding Prenatal Care",
    subtitle: "What to expect in your first trimester",
  },
  {
    id: "2",
    title: "Preparing for Labor",
    subtitle: "Key exercises and mental prep",
  },
  {
    id: "3",
    title: "Postpartum Mental Health",
    subtitle: "Recognizing the signs of depression and anxiety",
  },
  // …add more articles as needed
];

export default function EducationHub() {
  const navigation = useNavigation<any>();

  return (
    <Screen>
      <H2>Education Hub</H2>
      <View style={{ gap: 12 }}>
        {ARTICLES.map((article) => (
          <Pressable
            key={article.id}
            onPress={() =>
              navigation.navigate("ResourceDetail", {
                resource: article,
              })
            }
          >
            <Card>
              <Text bold>{article.title}</Text>
              {article.subtitle && (
                <Text muted style={{ marginTop: 6 }}>
                  {article.subtitle}
                </Text>
              )}
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
