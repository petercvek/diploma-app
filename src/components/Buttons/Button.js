// @flow
import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
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
  small?: boolean,
};

const Button = (props: Props) => (
  <TouchableOpacity
    disabled={props.disabled || props.loading}
    onPress={props.onPress}
    activeOpacity={0.7}
  >
    <Background
      background={props.disabled ? props.disabledBackground : props.background}
      shadow={!props.disabled}
      small={props.small}
    >
      <Label
        numberOfLines={1}
        color={props.disabled ? props.disabledColor : props.color}
        style={{ opacity: props.loading ? 0 : 1 }}
        small={props.small}
      >
        {props.text}
      </Label>

      {props.loading && (
        <LoadingWrapper>
          <ActivityIndicator color={props.color} />
        </LoadingWrapper>
      )}
    </Background>
  </TouchableOpacity>
);

Button.defaultProps = {
  disabled: false,
  loading: false,
  disabledBackground: colors.LIGHT_GREY4,
  disabledColor: colors.WHITE,
  background: colors.BLACK,
  color: colors.WHITE,
  small: false,
};

const Background = styled.View(({ shadow, background, small }) => ({
  height: small ? 35 : 50,
  width: '100%',
  borderRadius: small ? 35 / 2 : 50 / 2,
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

const Label = styled.Text(({ color, small }) => ({
  fontSize: small ? 15 : 19,
  color,
  backgroundColor: 'transparent',
  fontFamily: 'Montserrat-ExtraBold',
}));
Label.propsAreStyleOverrides = true;

const LoadingWrapper = styled.View({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  right: 0,
  alignItems: 'center',
  justifyContent: 'center',
});

export default Button;
