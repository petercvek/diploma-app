// @flow
import React from 'react';
import { Animated, ActivityIndicator, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { colors } from 'config/styles';

type Props = {
  onPress: Function,
  text: string,
  background?: string,
  color?: string,
  disabled?: boolean,
  disabledBackground?: string | Array<string>,
  disabledColor?: string,
  loading?: boolean,
};

const MiniButton = (props: Props) => (
  <AnimatedTouchableOpacity
    disabled={props.disabled || props.loading}
    onPress={props.onPress}
    activeOpacity={0.7}
  >
    <Background
      background={props.disabled ? props.disabledBackground : props.background}
      shadow={!props.disabled}
    >
      {!props.loading ? (
        <Label style={{ color: props.disabled ? props.disabledColor : props.color }}>
          {props.text}
        </Label>
      ) : (
        <ActivityIndicator color={props.color} />
      )}
    </Background>
  </AnimatedTouchableOpacity>
);

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

MiniButton.defaultProps = {
  disabled: false,
  loading: false,
  disabledBackground: colors.LIGHT_GREY4,
  disabledColor: colors.WHITE,
  background: colors.PURPLE,
  color: colors.WHITE,
};

const Background = styled.View(({ shadow, background }) => ({
  width: '100%',
  height: 45,
  borderRadius: 45 / 2,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: colors.TRUE_BLACK,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowRadius: 4,
  shadowOpacity: shadow ? 0.2 : 0,
  elevation: 4,
  backgroundColor: background,
}));

const Label = styled.Text({
  fontSize: 16,
  color: colors.WHITE,
  backgroundColor: 'transparent',
  fontFamily: 'Montserrat-ExtraBold',
});
Label.propsAreStyleOverrides = true;

export default MiniButton;
