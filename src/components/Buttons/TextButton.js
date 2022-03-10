// @flow
import React from 'react';
import { colors } from 'config/styles';
import styled from '@emotion/native';

type Props = {
  onPress: Function,
  text: string,
  color?: string,
  disabled?: boolean,
  disabledColor?: string,
};

const TextButton = (props: Props) => (
  <Wrapper onPress={props.onPress} activeOpacity={0.6} disabled={props.disabled}>
    <Label color={props.color} disabled={props.disabled} disabledColor={props.disabledColor}>
      {props.text}
    </Label>
  </Wrapper>
);
TextButton.defaultProps = {
  color: colors.GREY6,
  disabled: false,
  disabledColor: colors.GREY6,
};

const Wrapper = styled.TouchableOpacity({
  marginTop: 10,
});

const Label = styled.Text(({ disabled, color, disabledColor }) => ({
  fontSize: 13,
  fontFamily: 'Montserrat-Bold',
  backgroundColor: 'transparent',
  textAlign: 'center',
  color: disabled ? disabledColor : color,
}));

export default TextButton;
