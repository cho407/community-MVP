import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import PostItem from '../../components/PostItem';
import Loading from '../../components/Loading';
import { useAuth } from '../../hooks/useAuth';
import { fetchPosts } from '../../services/posts';
import { Post } from '../../types/post';

export default function BoardTab() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: posts = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['posts', 'all'],
    queryFn: () => fetchPosts(),
  });

  const listData = useMemo<Post[]>(() => posts, [posts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { paddingBottom: bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>게시판</Text>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/post/new')}
            accessibilityLabel="새 글 작성"
          >
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        </View>

        {isFetching && listData.length === 0 ? (
          <Loading fullScreen />
        ) : (
          <>
            <FlatList
              data={listData}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.listContent, { paddingBottom: 48 + bottom }]}
              renderItem={({ item }) => (
                <PostItem post={item} isOwner={item.authorId === profile?.uid} />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563eb" />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>아직 게시글이 없어요.</Text>
                  <Text style={styles.emptyDescription}>첫 번째 글을 작성해 보세요!</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerButton: {
    padding: 4,
    borderRadius: 999,
  },
  listContent: {
    gap: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
  },
});

