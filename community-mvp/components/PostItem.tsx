import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Post } from '../types/post';

type PostItemProps = {
  post: Post;
  isOwner?: boolean;
};

function PostItemComponent({ post, isOwner = false }: PostItemProps) {
  const createdAtLabel = useMemo(() => {
    if (!post.createdAt) {
      return '방금 전';
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
  }, [post.createdAt]);

  return (
    <Link href={{ pathname: '/post/[id]', params: { id: post.id } }} asChild>
      <Pressable style={styles.container} android_ripple={{ color: 'transparent' }}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          {isOwner && <Text style={styles.badge}>내 글</Text>}
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {post.authorName} · {createdAtLabel}
        </Text>

      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  meta: {
    fontSize: 13,
    color: '#64748b',
  },
});

const PostItem = memo(PostItemComponent);

export default PostItem;

