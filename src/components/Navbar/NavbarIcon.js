// @flow
import React from 'react';
import { Pressable } from 'react-native';
import { colors } from 'config/styles';
import styled from '@emotion/native';

type Props = {|
  icon: any,
  onPress: Function,
  tintColor?: string,
|};

const NavbarIcon = (props: Props) => (
  <Pressable
    onPress={props.onPress}
    hitSlop={{
      bottom: 10,
      left: 10,
      right: 20,
      top: 10,
    }}
  >
    {({ pressed }) => (
      <Icon source={props.icon} tintColor={props.tintColor} opacity={pressed ? 0.4 : 1} />
    )}
  </Pressable>
);

NavbarIcon.defaultProps = { tintColor: colors.TRUE_BLACK };

const Icon = styled.Image(({ tintColor }) => ({
  height: 25,
  width: 25,
  tintColor,
}));

export default NavbarIcon;
