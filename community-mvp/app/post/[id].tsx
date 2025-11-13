import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import Loading from '../../components/Loading';
import { useAuth } from '../../hooks/useAuth';
import { deletePost, fetchPostById } from '../../services/posts';
import { addComment, deleteComment, subscribeToComments } from '../../services/comments';
import { Comment } from '../../types/post';

export default function PostDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const postId = params.id;

  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [sending, setSending] = useState(false);
  const [inputHeight, setInputHeight] = useState(48);

  const {
    data: post,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPostById(postId ?? ''),
    enabled: Boolean(postId),
  });

  useEffect(() => {
    if (!postId) {
      return;
    }

    const unsub = subscribeToComments(postId, (rows) => {
      setComments(rows);
    });

    return () => unsub();
  }, [postId]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    return () => {
      queryClient.removeQueries({ queryKey: ['post', postId] });
    };
  }, [postId, queryClient]);

  const createdAtLabel = useMemo(() => {
    if (!post?.createdAt) {
      return '';
    }
    try {
      const formatter = new Intl.DateTimeFormat('ko', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      return formatter.format(post.createdAt);
    } catch {
      return post.createdAt.toLocaleString();
    }
  }, [post?.createdAt]);

  const isOwner = post && profile ? post.authorId === profile.uid : false;

  const handleDelete = async () => {
    if (!postId) {
      return;
    }

    Alert.alert('삭제하시겠어요?', '삭제한 게시글은 복구할 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            router.replace('/');
          } catch (error) {
            console.error(error);
            Alert.alert('삭제 실패', '잠시 후 다시 시도해 주세요.');
          }
        },
      },
    ]);
  };

  const handleSendComment = async () => {
    if (!postId || !profile) {
      return;
    }

    if (comment.trim().length === 0) {
      Alert.alert('댓글 내용 없음', '댓글 내용을 입력해 주세요.');
      return;
    }

    setSending(true);

    try {
      await addComment(postId, profile, { content: comment.trim() });
      setComment('');
      await refetch();
    } catch (error) {
      console.error(error);
      Alert.alert('댓글 작성 실패', '잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (target: Comment) => {
    Alert.alert('댓글을 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(target.postId, target.id);
          } catch (error) {
            console.error(error);
            Alert.alert('삭제 실패', '댓글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (isPending) {
    return <Loading fullScreen />;
  }

  if (!post) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>게시글을 찾을 수 없습니다.</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.linkText}>목록으로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      >
        <View style={styles.contentWrapper}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.meta}>
                <Text style={styles.author}>{post.authorName}</Text>
                <Text style={styles.date}>{createdAtLabel}</Text>
              </View>
              {isOwner ? (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => router.push({ pathname: '/post/edit', params: { id: postId } })}
                  >
                    <Text style={styles.actionText}>수정</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={handleDelete}>
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>삭제</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>{post.title}</Text>

            {post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={styles.image} contentFit="cover" transition={200} />
            ) : null}

            <Text style={styles.content}>{post.content}</Text>

            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>댓글 {comments.length}</Text>
            </View>

            <View style={styles.commentList}>
              {comments.map((item) => {
                const isMyComment = profile?.uid === item.authorId;
                return (
                  <View key={item.id} style={styles.commentCard}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>{item.authorName}</Text>
                        <Text style={styles.commentDate}>
                          {item.createdAt
                            ? new Intl.DateTimeFormat('ko', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              }).format(item.createdAt)
                            : '방금 전'}
                        </Text>
                      </View>
                      <Text style={styles.commentContent}>{item.content}</Text>
                    </View>
                    {isMyComment ? (
                      <Pressable onPress={() => handleDeleteComment(item)}>
                        <Text style={styles.commentDelete}>삭제</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
              {comments.length === 0 ? (
                <Text style={styles.emptyComment}>가장 먼저 댓글을 남겨 보세요.</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.commentInputBar}>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="댓글을 입력하세요"
              multiline
              numberOfLines={2}
              onContentSizeChange={(event) => {
                const height = Math.min(120, Math.max(44, event.nativeEvent.contentSize.height));
                setInputHeight(height);
              }}
              style={[styles.commentInput, { height: inputHeight }]}
            />
            <Pressable
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSendComment}
              disabled={sending}
            >
              <Text style={styles.sendButtonText}>{sending ? '전송 중' : '등록'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentWrapper: {
    flex: 1,
  },
  container: {
    padding: 24,
    gap: 24,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meta: {
    gap: 4,
  },
  author: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  date: {
    fontSize: 13,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
  commentHeader: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  commentList: {
    gap: 12,
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#1e293b',
  },
  commentDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentContent: {
    marginTop: 6,
    fontSize: 14,
    color: '#334155',
  },
  commentDelete: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  emptyComment: {
    textAlign: 'center',
    color: '#94a3b8',
    paddingVertical: 24,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

