import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { Button, Card, NeuInput, Text } from "../../components/Ui";
import { useForum } from "../../context/ForumContext";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radius, spacing } from "../../theme/theme";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ForumPost } from "../../context/ForumContext";
import type { ForumStackParamList } from "../../navigation/ForumStack";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;

type Nav = NativeStackNavigationProp<ForumStackParamList, "ForumHome">;

export default function ForumHome() {
  const navigation = useNavigation<Nav>();
  const { posts, toggleLike, refreshPosts, deletePost } = useForum();

  const [q, setQ] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editKeepPaths, setEditKeepPaths] = useState<string[]>([]);
  const [editNewImages, setEditNewImages] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }, [refreshPosts]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    if (!query.length) return posts;

    return posts.filter((p) => {
      const title = p.title?.toLowerCase() ?? "";
      const body = p.body?.toLowerCase() ?? "";
      const author = p.authorName?.toLowerCase() ?? "";

      return (
        title.includes(query) || body.includes(query) || author.includes(query)
      );
    });
  }, [posts, q]);

  const [activeImages, setActiveImages] = useState<Record<string, number>>({});

  const firstFocusRef = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return;
      }
      refreshPosts();
    }, [refreshPosts]),
  );

  React.useEffect(() => {
    let alive = true;
    const loadMe = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setMyUserId(data.user?.id ?? null);
    };
    loadMe();
    return () => {
      alive = false;
    };
  }, []);

  const compressEditImage = async (uri: string) => {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    return compressed.uri;
  };

  const uploadEditImages = async (userId: string) => {
    const paths: string[] = [];
    for (const uri of editNewImages) {
      const compressedUri = await compressEditImage(uri);
      const arrayBuffer = await new File(compressedUri).arrayBuffer();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error } = await supabase.storage
        .from("forum-images")
        .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      paths.push(path);
    }
    return paths;
  };

  const pickEditImage = async () => {
    const total = editKeepPaths.length + editNewImages.length;
    if (total >= 4) {
      Alert.alert("Max 4 images per post.");
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 4 - total,
      });
      if (!result.canceled) {
        const uris = result.assets.map((a) => a.uri);
        setEditNewImages((prev) => [...prev, ...uris].slice(0, 4 - editKeepPaths.length));
      }
    } catch (e) {
      console.error("[ForumHome] pickEditImage error", e);
    }
  };

  const savePostEdit = async () => {
    if (!editingPost || !myUserId) return;
    const nextTitle = editTitle.trim();
    const nextBody = editBody.trim();
    if (!nextTitle || !nextBody) {
      Alert.alert("Missing fields", "Title and body are required.");
      return;
    }

    setSavingEdit(true);
    try {
      const newPaths = editNewImages.length ? await uploadEditImages(myUserId) : [];
      const finalPaths = [...editKeepPaths, ...newPaths];

      const { error } = await supabase
        .from("forum_posts")
        .update({ title: nextTitle, body: nextBody, image_paths: finalPaths })
        .eq("id", editingPost.id)
        .eq("author_id", myUserId);

      if (error) {
        Alert.alert("Unable to edit post", error.message);
        return;
      }
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong.");
      return;
    } finally {
      setSavingEdit(false);
    }

    setEditingPost(null);
    setEditTitle("");
    setEditBody("");
    setEditKeepPaths([]);
    setEditNewImages([]);
  };

  const openPostMenu = (item: ForumPost) => {
    const isOwner = item.authorId === myUserId;
    const notAllowed = () =>
      Alert.alert("Unavailable", "You can only edit or delete your own posts.");

    Alert.alert("Post options", "", [
      {
        text: "Edit",
        onPress: () => {
          if (!isOwner) return notAllowed();
          setEditingPost(item);
          setEditTitle(item.title);
          setEditBody(item.body);
          setEditKeepPaths(item.imagePaths ?? []);
          setEditNewImages([]);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!isOwner) return notAllowed();
          await deletePost(item.id);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderPost = ({ item }: { item: ForumPost }) => {
    return (
      <View style={{ marginTop: spacing.md }}>
        <Card style={styles.card}>
          <Pressable
            style={styles.menuBtn}
            onPress={(e) => {
              e.stopPropagation();
              openPostMenu(item);
            }}
            hitSlop={10}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.warmGray} />
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate("ForumPostDetail", {
                postId: item.id,
                title: item.title,
              })
            }
          >
            <Text bold style={styles.title}>
              {item.title}
            </Text>

            <Text muted style={{ marginTop: spacing.xs }}>
              {item.authorName ?? "User"}
            </Text>

            <Text style={{ marginTop: spacing.sm }} numberOfLines={5}>
              {item.body}
            </Text>
          </Pressable>

          {item.imageUrls && item.imageUrls.length > 0 && (
            <View style={styles.imageContainer}>
              <FlatList
                data={item.imageUrls}
                horizontal
                pagingEnabled
                contentContainerStyle={{ alignItems: "center" }}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                keyExtractor={(uri) => uri}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                disableIntervalMomentum
                style={styles.imageCarousel}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / CARD_WIDTH,
                  );

                  setActiveImages((prev) => ({
                    ...prev,
                    [item.id]: index,
                  }));
                }}
                renderItem={({ item: uri }) => (
                  <Image
                    source={{ uri }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                )}
              />
            </View>
          )}

          {item.imageUrls && item.imageUrls.length > 1 && (
            <View style={styles.dotRow}>
              {item.imageUrls.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activeImages[item.id] === i && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}

          <View style={styles.metaRow}>
            {/* LIKE */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(item.id);
              }}
              hitSlop={10}
              style={styles.metaBtn}
            >
              <Ionicons
                name={item.likedByMe ? "heart" : "heart-outline"}
                size={16}
                color={item.likedByMe ? "#EF4444" : colors.charcoal}
              />
              <Text style={styles.metaText}>{item.likeCount}</Text>
            </Pressable>

            {/* COMMENTS */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate("ForumPostDetail", {
                  postId: item.id,
                  title: item.title,
                });
              }}
              hitSlop={10}
              style={styles.metaBtn}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color={colors.charcoal}
              />
              <Text style={styles.metaText}>{item.commentCount}</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    );
  };

  const listHeader = (
    <>
      <View style={styles.introBlock}>
        <Text bold style={styles.introHeading}>
          A space to connect
        </Text>
        <Text muted style={styles.introCopy}>
          Join the conversation, hear from others, and share what&apos;s helped
          you along the way.
        </Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={18}
          color={colors.gray400}
          style={styles.searchIcon}
        />
        <NeuInput
          value={q}
          onChangeText={setQ}
          placeholder="Search posts"
          placeholderTextColor={colors.gray400}
          style={styles.searchInput}
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ("")} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.gray400} />
          </Pressable>
        )}
      </View>

      {/* CREATE */}
      <Button
        onPress={() => navigation.navigate("ForumCreatePost")}
        label="Create Post"
        variant="outline"
        style={styles.newPostBtn}
        labelStyle={{ color: colors.coral }}
      />
    </>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: 100,
        }}
        ListEmptyComponent={
          <Card style={{ marginTop: spacing.md }}>
            <Text bold>No posts yet.</Text>
            <Text muted style={{ marginTop: spacing.sm }}>
              Be the first to start the conversation.
            </Text>
          </Card>
        }
      />

      <Modal
        visible={!!editingPost}
        transparent
        animationType="fade"
        onRequestClose={() => { setEditingPost(null); setEditKeepPaths([]); setEditNewImages([]); }}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => { setEditingPost(null); setEditKeepPaths([]); setEditNewImages([]); }}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text bold>Edit Post</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Title"
                style={styles.modalInput}
              />
              <TextInput
                value={editBody}
                onChangeText={setEditBody}
                placeholder="Body"
                style={[styles.modalInput, styles.modalTextArea]}
                multiline
              />

              {/* Images */}
              {(editKeepPaths.length > 0 || editNewImages.length > 0) && (
                <View style={styles.editImgRow}>
                  {editKeepPaths.map((path) => {
                    const { data } = supabase.storage.from("forum-images").getPublicUrl(path);
                    return (
                      <View key={path} style={styles.editImgWrap}>
                        <Image source={{ uri: data.publicUrl }} style={styles.editImgThumb} />
                        <Pressable
                          style={styles.editImgRemove}
                          onPress={() => setEditKeepPaths((prev) => prev.filter((p) => p !== path))}
                          hitSlop={6}
                        >
                          <Ionicons name="close-circle" size={18} color={colors.charcoal} />
                        </Pressable>
                      </View>
                    );
                  })}
                  {editNewImages.map((uri) => (
                    <View key={uri} style={styles.editImgWrap}>
                      <Image source={{ uri }} style={styles.editImgThumb} />
                      <Pressable
                        style={styles.editImgRemove}
                        onPress={() => setEditNewImages((prev) => prev.filter((u) => u !== uri))}
                        hitSlop={6}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.charcoal} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {editKeepPaths.length + editNewImages.length < 4 && (
                <Pressable style={styles.addPhotoBtn} onPress={pickEditImage}>
                  <Ionicons name="image-outline" size={16} color={colors.charcoal} />
                  <Text style={{ marginLeft: 6 }}>Add Photo</Text>
                </Pressable>
              )}

              <View style={styles.modalActions}>
                <Pressable onPress={() => { setEditingPost(null); setEditKeepPaths([]); setEditNewImages([]); }} style={styles.modalCancelBtn}>
                  <Text>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={savePostEdit}
                  style={[styles.modalSaveBtn, savingEdit && { opacity: 0.6 }]}
                  disabled={savingEdit}
                >
                  <Text bold style={{ color: colors.white }}>
                    {savingEdit ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  imageCarousel: {
    marginTop: spacing.md,
  },
  postImage: {
    width: CARD_WIDTH,
    height: 360,
    borderRadius: radius.md,
  },
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
  },

  activeDot: {
    backgroundColor: "#000",
  },
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: spacing.md,
  },
  introBlock: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  introHeading: {
    color: colors.charcoal,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    fontFamily: fonts.bold,
  },
  introCopy: {
    textAlign: "center",
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  searchWrap: {
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: spacing.md,
    top: 13,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 38,
    paddingRight: 38,
    color: colors.charcoal,
  },
  clearBtn: {
    position: "absolute",
    right: spacing.md,
    top: 13,
    zIndex: 1,
  },
  newPostBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  menuBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
  },
  title: { color: colors.charcoal, fontFamily: fonts.bold },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    borderRadius: radius.md,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  metaBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  metaText: { color: colors.charcoal, fontFamily: fonts.regular },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
  },
  modalInput: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.charcoal,
  },
  modalTextArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  modalActions: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  editImgRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editImgWrap: {
    position: "relative",
  },
  editImgThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
  },
  editImgRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.cream,
    borderRadius: 999,
  },
  addPhotoBtn: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
  },
  modalCancelBtn: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    justifyContent: "center",
  },
  modalSaveBtn: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.charcoal,
    justifyContent: "center",
  },
});
