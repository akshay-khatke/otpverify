import { useWindowDimensions, Dimensions, Platform, PixelRatio } from 'react-native';

const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

const { width: initialWidth, height: initialHeight } = Dimensions.get('window');

export const scale = (size: number, currentWidth: number = Dimensions.get('window').width): number => {
  return (currentWidth / GUIDELINE_BASE_WIDTH) * size;
};


export const verticalScale = (size: number, currentHeight: number = Dimensions.get('window').height): number => {
  return (currentHeight / GUIDELINE_BASE_HEIGHT) * size;
};


export const moderateScale = (
  size: number,
  factor: number = 0.5,
  currentWidth: number = Dimensions.get('window').width
): number => {
  const scaled = size + (scale(size, currentWidth) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};


export const moderateVerticalScale = (
  size: number,
  factor: number = 0.5,
  currentHeight: number = Dimensions.get('window').height
): number => {
  const scaled = size + (verticalScale(size, currentHeight) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};


export const checkIsTablet = (width: number, height: number): boolean => {
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);
  return minDim >= 600 && maxDim / minDim < 2.0;
};

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isTablet = checkIsTablet(width, height);
  const isSmallDevice = width < 360;
  const isLargePhone = width >= 410 && !isTablet;

  const contentMaxWidth = isTablet ? 500 : isLandscape ? 460 : '100%';

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

