import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";
import { colors, spacing } from "../theme/theme";

import ForumCreatePost from "../screens/forum/ForumCreatePost";
import ForumHome from "../screens/forum/ForumHome";
import ForumPostDetail from "../screens/forum/ForumPostDetail";

export type ForumStackParamList = {
  ForumHome: undefined;
  ForumCreatePost: undefined;
  ForumPostDetail: {
    postId: string;
    title: string;
    commentId?: string;
  };
};

const Stack = createNativeStackNavigator<ForumStackParamList>();

export default function ForumStack({
  showHamburger = true,
  headerTitle = "Community",
}: {
  showHamburger?: boolean;
  headerTitle?: string;
}) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen
        name="ForumHome"
        component={ForumHome}
        options={({ navigation }) => ({
          title: headerTitle,
          headerLeft: () =>
            showHamburger ? (
              <Pressable
                onPress={() =>
                  navigation.getParent()?.dispatch(DrawerActions.toggleDrawer())
                }
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }}
                hitSlop={10}
              >
                <Ionicons name="menu" size={22} color={colors.charcoal} />
              </Pressable>
            ) : undefined,
        })}
      />

      <Stack.Screen
        name="ForumCreatePost"
        component={ForumCreatePost}
        options={{ title: "New Post", headerBackTitle: "Back" }}
      />

      <Stack.Screen name="ForumPostDetail" component={ForumPostDetail} />
    </Stack.Navigator>
  );
}
