import React from "react";
import { StyleSheet, View } from "react-native";

import ForumStack from "../../navigation/ForumStack";
import { colors } from "../../theme/theme";

export default function Notifications() {
  return (
    <View style={styles.screen}>
      <ForumStack showHamburger={true} headerTitle="Community" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
});
