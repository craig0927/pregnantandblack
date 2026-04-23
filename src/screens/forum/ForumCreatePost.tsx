import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { File } from "expo-file-system";
import { Button, Card, NeuInput, Text } from "../../components/Ui";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radius, spacing } from "../../theme/theme";

export default function ForumCreatePost({ navigation }: any) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 4,
      });

      if (!result.canceled) {
        const uris = result.assets.map((a) => a.uri);
        setImages((prev) => [...prev, ...uris]);
      }
    } catch (e) {
      console.error("[ForumCreatePost] pickImage error", e);
    }
  };

  const compressImage = async (uri: string) => {
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );
      return compressed.uri;
    } catch (e) {
      console.error("[ForumCreatePost] compressImage error", e);
      throw e;
    }
  };

  const uploadImages = async (userId: string) => {
    const paths: string[] = [];

    for (const uri of images) {
      const compressedUri = await compressImage(uri);
      const arrayBuffer = await new File(compressedUri).arrayBuffer();

      const path = `${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.jpg`;

      const { error } = await supabase.storage
        .from("forum-images")
        .upload(path, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      paths.push(path);
    }

    return paths;
  };

  const onSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing fields", "Title and body are required.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      let imagePaths: string[] = [];

      if (images.length) {
        imagePaths = await uploadImages(user.id);
      }

      const { error } = await supabase.from("forum_posts").insert({
        author_id: user.id,
        title: title.trim(),
        body: body.trim(),
        image_paths: imagePaths,
      });

      if (error) throw error;

      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ padding: spacing.md }}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <Text bold style={styles.label}>
          Title
        </Text>

        <NeuInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a title"
          style={styles.input}
        />

        <Text bold style={[styles.label, { marginTop: spacing.md }]}>
          Body
        </Text>

        <NeuInput
          value={body}
          onChangeText={setBody}
          placeholder="Write your post..."
          style={[styles.input, styles.textarea]}
          multiline
        />

        <Button
          label="Add Images"
          onPress={pickImage}
          variant="outline"
          style={styles.secondaryBtn}
        />

        {images.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            {images.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.preview} />
            ))}
          </View>
        )}

        <Button
          label={loading ? "Posting..." : "Post"}
          disabled={loading}
          onPress={onSubmit}
          variant="outline"
          style={styles.primaryBtn}
          labelStyle={{ color: colors.coral }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
  },
  label: {
    fontSize: 14,
    color: colors.coral,
    fontFamily: fonts.bold,
  },
  input: {
    marginTop: spacing.sm,
  },

  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  secondaryBtn: {
    marginTop: spacing.md,
  },
  primaryBtn: {
    marginTop: spacing.lg,
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
});
