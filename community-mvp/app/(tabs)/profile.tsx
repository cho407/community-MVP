import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../hooks/useAuth';
import { fetchPostsByAuthor } from '../../services/posts';
import PostItem from '../../components/PostItem';
import Loading from '../../components/Loading';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, deleteAccount, refreshProfile } = useAuth();
  const { bottom } = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: myPosts = [], refetch, isFetching } = useQuery({
    queryKey: ['posts', 'byAuthor', profile?.uid],
    queryFn: () =>
      profile?.uid ? fetchPostsByAuthor(profile.uid) : Promise.resolve([]),
    enabled: Boolean(profile?.uid),
  });

  useEffect(() => {
    if (profile?.uid) {
      void refetch();
    }
  }, [profile?.uid, refetch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '정말 탈퇴하시겠어요?',
      '작성한 게시글과 댓글은 유지되며, 계정 정보만 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error(error);
              Alert.alert('탈퇴 실패', '재로그인 후 다시 시도해 주세요.');
            }
          },
        },
      ],
    );
  };

  if (!profile) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { paddingBottom: bottom + 16 }]}>
        <Text style={styles.headerTitle}>내 정보</Text>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {profile.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>
        </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => router.push('/post/new')}>
          <Text style={styles.actionLabel}>새 글 작성</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
        >
          <Text style={styles.actionLabel}>로그아웃</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.actionButtonDanger]} onPress={handleDeleteAccount}>
          <Text style={[styles.actionLabel, styles.actionLabelDanger]}>회원 탈퇴</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>내가 작성한 글</Text>

      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 48 + bottom }]}
        renderItem={({ item }) => <PostItem post={item} isOwner />}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing || isFetching} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>작성한 게시글이 없습니다.</Text>
            <Text style={styles.emptyDescription}>첫 글을 작성해 보세요!</Text>
          </View>
        }
      />
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionLabel: {
    color: '#2563eb',
    fontWeight: '600',
  },
  actionButtonDanger: {
    backgroundColor: '#fee2e2',
  },
  actionLabelDanger: {
    color: '#dc2626',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 80,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
  },
});

