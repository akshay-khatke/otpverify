import { useWindowDimensions, Dimensions, Platform, PixelRatio } from 'react-native';

// Base guideline metrics based on standard modern smartphone (iPhone 11/12/13/14 base width: 375 x 812)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

const { width: initialWidth, height: initialHeight } = Dimensions.get('window');

/**
 * Linear horizontal scale based on guideline width
 */
export const scale = (size: number, currentWidth: number = Dimensions.get('window').width): number => {
  return (currentWidth / GUIDELINE_BASE_WIDTH) * size;
};

/**
 * Linear vertical scale based on guideline height
 */
export const verticalScale = (size: number, currentHeight: number = Dimensions.get('window').height): number => {
  return (currentHeight / GUIDELINE_BASE_HEIGHT) * size;
};

/**
 * Moderate scale with resizing factor (default 0.5)
 * Prevents sizes from becoming too large on tablets or too small on small devices
 */
export const moderateScale = (
  size: number,
  factor: number = 0.5,
  currentWidth: number = Dimensions.get('window').width
): number => {
  const scaled = size + (scale(size, currentWidth) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

/**
 * Moderate vertical scale with resizing factor
 */
export const moderateVerticalScale = (
  size: number,
  factor: number = 0.5,
  currentHeight: number = Dimensions.get('window').height
): number => {
  const scaled = size + (verticalScale(size, currentHeight) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

/**
 * Determines if device is a tablet based on screen dimensions
 */
export const checkIsTablet = (width: number, height: number): boolean => {
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);
  // Aspect ratio check and minimum smallest dimension >= 600dp
  return minDim >= 600 && maxDim / minDim < 2.0;
};

/**
 * Custom React Hook that dynamically calculates responsive dimensions and helpers
 * Automatically updates on screen rotation, tablet split-screen, and foldable fold/unfold
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isTablet = checkIsTablet(width, height);
  const isSmallDevice = width < 360;
  const isLargePhone = width >= 410 && !isTablet;

  // Max width for forms and cards on tablets or wide foldables
  const contentMaxWidth = isTablet ? 500 : isLandscape ? 460 : '100%';

  // Dynamic horizontal padding based on screen size
  const horizontalPadding = isTablet ? 36 : isSmallDevice ? 16 : 24;

  const responsiveScale = (size: number) => scale(size, width);
  const responsiveVerticalScale = (size: number) => verticalScale(size, height);
  const responsiveModerateScale = (size: number, factor: number = 0.5) =>
    moderateScale(size, factor, width);

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isSmallDevice,
    isLargePhone,
    contentMaxWidth,
    horizontalPadding,
    scale: responsiveScale,
    verticalScale: responsiveVerticalScale,
    moderateScale: responsiveModerateScale,
  };
};

