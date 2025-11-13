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
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import Loading from '../../components/Loading';
import { useAuth } from '../../hooks/useAuth';
import { fetchPostById, updatePost } from '../../services/posts';

const editSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.'),
  content: z.string().min(1, '내용을 입력해 주세요.'),
});

export default function EditPostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string }>();
  const postId = params.id;
  const { user, profile } = useAuth();

  const { data: post, isPending } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPostById(postId ?? ''),
    enabled: Boolean(postId),
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setImageUri(post.imageUrl ?? null);
      setRemoveImage(false);
    }
  }, [post]);

  const isOwner = useMemo(() => {
    if (!profile || !post) {
      return false;
    }
    return profile.uid === post.authorId;
  }, [post, profile]);

  if (!user || !profile) {
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

  if (!isOwner) {
    return <Redirect href={`/post/${postId}`} />;
  }

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '이미지를 업로드하려면 사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri ?? null);
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    if (!imageUri) {
      return;
    }
    if (post.imageUrl && imageUri === post.imageUrl) {
      setRemoveImage(true);
    }
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!postId) {
      return;
    }

    const validation = editSchema.safeParse({ title, content });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0],
        content: fieldErrors.content?.[0],
      });
      return;
    }

    setSubmitting(true);

    try {
      await updatePost(postId, profile, {
        title: validation.data.title,
        content: validation.data.content,
        imageUri,
        removeImage,
      });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('수정 실패', '잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>게시글 수정</Text>

        <View style={styles.field}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (errors.title) {
                setErrors((prev) => ({ ...prev, title: undefined }));
              }
            }}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>이미지</Text>
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
              <Pressable style={styles.removeImageButton} onPress={handleRemoveImage}>
                <Text style={styles.removeImageText}>이미지 제거</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.imagePicker} onPress={handlePickImage}>
              <Text style={styles.imagePickerText}>이미지 선택</Text>
            </Pressable>
          )}
          {post.imageUrl && removeImage ? (
            <Text style={styles.removeNotice}>기존 이미지가 삭제됩니다.</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={[styles.textarea, errors.content && styles.inputError]}
            value={content}
            onChangeText={(value) => {
              setContent(value);
              if (errors.content) {
                setErrors((prev) => ({ ...prev, content: undefined }));
              }
            }}
            multiline
            textAlignVertical="top"
          />
          {errors.content ? <Text style={styles.errorText}>{errors.content}</Text> : null}
        </View>

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? '저장 중...' : '변경 사항 저장'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  field: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textarea: {
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    padding: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
  },
  imagePickerText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  imagePreview: {
    gap: 12,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  removeImageButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
  },
  removeImageText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 13,
  },
  removeNotice: {
    color: '#ef4444',
    fontSize: 12,
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

