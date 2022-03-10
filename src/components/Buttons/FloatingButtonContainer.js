// @flow
import { Dimensions } from 'react-native';
import styled from '@emotion/native';

const Screen = Dimensions.get('window');

const FloatingButtonContainer = styled.View({
  position: 'absolute',
  width: Screen.width - 2 * 20,
  marginHorizontal: 20,
  bottom: 20,
  backgroundColor: 'transparent',
});

export default FloatingButtonContainer;
