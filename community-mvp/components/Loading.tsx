import { ActivityIndicator, View, ViewStyle } from 'react-native';

type LoadingProps = {
  size?: number | 'small' | 'large';
  fullScreen?: boolean;
  style?: ViewStyle;
};

export default function Loading({ size = 'large', fullScreen = false, style }: LoadingProps) {
  return (
    <View
      style={[
        {
          flex: fullScreen ? 1 : undefined,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: fullScreen ? 0 : 12,
        },
        fullScreen && { backgroundColor: 'rgba(15, 23, 42, 0.02)' },
        style,
      ]}
    >
      <ActivityIndicator size={size} />
    </View>
  );
}

