import { useState } from 'react';
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
import { Redirect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../hooks/useAuth';
import { createPost } from '../../services/posts';

const postSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.'),
  content: z.string().min(1, '내용을 입력해 주세요.'),
});

export default function NewPostScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  if (!user || !profile) {
    return <Redirect href="/login" />;
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
    }
  };

  const handleSubmit = async () => {
    const validation = postSchema.safeParse({ title, content });

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
      await createPost(profile, {
        title: validation.data.title,
        content: validation.data.content,
        imageUri: imageUri ?? undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      Alert.alert('게시글 작성 실패', '잠시 후 다시 시도해 주세요.');
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
        <Text style={styles.title}>새 글 작성</Text>

        <View style={styles.field}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="제목을 입력하세요"
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
          <Text style={styles.label}>이미지 (선택)</Text>
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
              <Pressable style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                <Text style={styles.removeImageText}>이미지 제거</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.imagePicker} onPress={handlePickImage}>
              <Text style={styles.imagePickerText}>이미지 선택</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={[styles.textarea, errors.content && styles.inputError]}
            placeholder="어떤 이야기를 나누고 싶나요?"
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
          <Text style={styles.submitButtonText}>{submitting ? '등록 중...' : '등록하기'}</Text>
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
    opacity: 0.7,
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
});

