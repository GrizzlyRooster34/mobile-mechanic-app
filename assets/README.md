# Assets Directory

This directory contains all the static assets for the mobile app including icons, splash screens, and other images.

## Required Assets

For Expo Go and app store deployment, you'll need to provide the following assets:

### App Icon
- **icon.png** (1024x1024px) - Main app icon
- **adaptive-icon.png** (1024x1024px) - Android adaptive icon foreground

### Splash Screen
- **splash.png** (1284x2778px) - iOS splash screen
- **splash.png** can be smaller (e.g., 512x512px) and will be centered

### Web Assets
- **favicon.png** (48x48px) - Web favicon

## Asset Guidelines

### App Icon Requirements
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Design**: Should work well at small sizes (down to 16x16px)
- **Content**: Avoid text, keep design simple and recognizable
- **Background**: Transparent or solid color

### Splash Screen Requirements
- **Size**: 1284x2778 pixels (iPhone 12 Pro Max resolution)
- **Format**: PNG
- **Design**: Will be displayed while app loads
- **Background**: Should match your app's theme
- **Content**: Logo or branding, keep it simple

### Adaptive Icon (Android)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Safe Area**: Keep important content within 66% of the image (center circle)
- **Background**: Will be masked to various shapes by Android

## Placeholder Assets

Until you provide custom assets, you can use these placeholder URLs:

```javascript
// In app.config.js, you can reference online images:
icon: "https://via.placeholder.com/1024x1024/2563eb/ffffff?text=H",
splash: {
  image: "https://via.placeholder.com/1284x2778/1f2937/ffffff?text=Heinicus",
  resizeMode: "contain",
  backgroundColor: "#1f2937"
},
```

## Asset Optimization

### Tools for Optimization
- **TinyPNG** - Compress PNG images
- **ImageOptim** - Mac app for image optimization
- **Squoosh** - Web-based image optimizer

### Best Practices
1. **Compress images** to reduce app size
2. **Use appropriate formats** (PNG for icons, JPG for photos)
3. **Provide @2x and @3x versions** for different screen densities
4. **Test on different devices** to ensure quality

## Generating Assets

### From a Single Source
You can generate all required assets from a single high-resolution source image:

1. **Create a 1024x1024px source image**
2. **Use online generators**:
   - [App Icon Generator](https://appicon.co/)
   - [Expo Asset Generator](https://github.com/expo/expo-cli)

3. **Use Expo CLI**:
   ```bash
   npx expo install expo-asset
   ```

### Manual Creation
Create each asset manually using design tools:
- **Figma** - Free design tool
- **Sketch** - Mac design tool
- **Adobe Illustrator** - Professional design tool
- **Canva** - Online design tool

## Asset Structure

```
assets/
├── icon.png              # Main app icon (1024x1024)
├── adaptive-icon.png     # Android adaptive icon (1024x1024)
├── splash.png            # Splash screen (1284x2778)
├── favicon.png           # Web favicon (48x48)
└── images/
    ├── logo.png          # App logo for use in UI
    ├── placeholder.png   # Placeholder images
    └── onboarding/       # Onboarding screen images
        ├── step1.png
        ├── step2.png
        └── step3.png
```

## Usage in Code

### Expo Router
```javascript
import { Image } from 'expo-image';

// Local assets
<Image source={require('../assets/logo.png')} />

// Remote assets
<Image source={{ uri: 'https://example.com/image.png' }} />
```

### React Native
```javascript
import { Image } from 'react-native';

<Image source={require('../assets/logo.png')} style={{ width: 100, height: 100 }} />
```

## Testing Assets

### In Development
- Assets are loaded from your local file system
- Changes require restarting the development server
- Test on multiple devices and screen sizes

### In Production
- Assets are bundled with your app
- Optimized and compressed automatically
- Cached for better performance

## Troubleshooting

### Common Issues
1. **Asset not found**: Check file path and name
2. **Poor quality**: Ensure high-resolution source images
3. **Large app size**: Optimize and compress images
4. **Slow loading**: Use appropriate image formats and sizes

### Debug Commands
```bash
# Check asset bundle
expo export --dump-assetmap

# Analyze bundle size
npx expo install @expo/bundle-analyzer
npx expo export --dump-sourcemap
```

---

**Need help with assets?** Check the [Expo Assets Documentation](https://docs.expo.dev/guides/assets/) or contact the development team.