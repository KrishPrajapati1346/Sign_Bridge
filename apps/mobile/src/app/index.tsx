import { useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [webViewRef, setWebViewRef] = useState<WebView | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Hide splash screen immediately when ready
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    // Handle Android hardware back button
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (canGoBack && webViewRef) {
          webViewRef.goBack();
          return true; // Prevent default behavior
        }
        return false; // Let default behavior happen (exit app)
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [canGoBack, webViewRef]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <WebView
        ref={(ref) => setWebViewRef(ref)}
        source={{ uri: 'https://sign-bridge-web.vercel.app' }}
        style={styles.webview}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onPermissionRequest={(event) => event.request.grant()}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a', // Dark canvas background
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
