import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

function CloseButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      style={styles.headerButton}
      android_ripple={{ color: 'transparent' }}
    >
      <Ionicons name="close" size={24} color="#1e293b" />
    </Pressable>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      style={styles.headerButton}
      android_ripple={{ color: 'transparent' }}
    >
      <Ionicons name="chevron-back" size={24} color="#1e293b" />
    </Pressable>
  );
}

export default function PostStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#f8fafc' },
        headerBackTitleVisible: false,
        headerTintColor: '#1e293b',
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          title: '새 글 작성',
          headerLeft: () => <CloseButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '게시글 상세',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen name="edit" options={{ title: '게시글 수정' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: 4,
  },
});

