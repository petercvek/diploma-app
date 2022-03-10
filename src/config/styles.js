// @flow
import { Platform } from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper';

export const STATUSBAR_HEIGHT = Platform.OS === 'android' ? 25 : isIphoneX() ? 44 : 20;
export const TABBAR_HEIGHT = Platform.OS === 'android' ? 60 : isIphoneX() ? 84 : 40;

// @flow
export const colors = {
  TRUE_BLACK: '#000000',
  BLACK: '#363636',
  GREY: '#999999',
  GREY2: '#727272',
  GREY3: '#808080',
  GREY4: '#A3A3A3',
  GREY5: '#B8B8B8',
  GREY6: '#6D6D6D',
  LIGHT_GREY: '#F3F3F3',
  LIGHT_GREY2: '#E7E7E7',
  LIGHT_GREY3: '#D9D9D9',
  LIGHT_GREY4: '#EDEDED',
  LIGHT_GREY5: '#DBDBDB',
  PURPLE_GREY: '#B5BACA',
  GREEN: '#33F9BC',
  PURPLE: '#7B93FF',
  LIGHT_PURPLE: '#92ABFD',
  RED: '#FF7A86',
  YELLOW: '#FCE352',
  LIGHT_BLUE: '#65D5F8',
  FAILED_GREY: '#D4D4D4',
  HOVER_WHITE: '#FBFBFB',
  WHITE: '#FFFFFF',
};
