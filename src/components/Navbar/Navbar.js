// @flow
import React, { Fragment } from 'react';
import { Animated, Platform, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { isIphoneX } from 'react-native-iphone-x-helper';

import { STATUSBAR_HEIGHT, colors } from 'config/styles';

const NAVBAR_CONTENT_HEIGHT = 72;
const NAVBAR_HEIGHT = STATUSBAR_HEIGHT + NAVBAR_CONTENT_HEIGHT;

type Props = {|
  scrollViewY?: Animated.Value,
  children: React$ElementType,
  onPress: ?Function,
|};

const Navbar = (props: Props) => {
  const offset =
    props.scrollViewY &&
    props.scrollViewY.interpolate({
      inputRange: Platform.OS === 'ios' ? [-NAVBAR_HEIGHT, 0] : [0, NAVBAR_HEIGHT],
      outputRange: Platform.OS === 'ios' ? [0, -NAVBAR_HEIGHT] : [0, -NAVBAR_HEIGHT],
      extrapolate: 'clamp',
    });

  return (
    <Fragment>
      <Wrapper style={{ transform: [{ translateY: offset }] }}>
        <TouchableOpacity onPress={props.onPress} activeOpacity={0.7}>
          {props.children}
        </TouchableOpacity>
      </Wrapper>
      {(Platform.OS === 'android' || !isIphoneX()) && <StatusBarBackground />}
    </Fragment>
  );
};

Navbar.defaultProps = { scrollViewY: new Animated.Value(-NAVBAR_HEIGHT) };

const Wrapper = styled(Animated.View)({
  width: '100%',
  height: NAVBAR_HEIGHT,
  paddingHorizontal: 20,
  paddingBottom: 6,
  flexDirection: 'row',
  alignItems: 'flex-end',
  position: 'absolute',
  justifyContent: 'space-between',
  zIndex: 100,
  backgroundColor: colors.WHITE,
  top: 0,
});
Wrapper.propsAreStyleOverrides = true;

const StatusBarBackground = styled.View({
  backgroundColor: colors.WHITE,
  height: 20,
  width: '100%',
  position: 'absolute',
  top: 0,
  zIndex: 101,
});

export default Navbar;
export { NAVBAR_HEIGHT };
