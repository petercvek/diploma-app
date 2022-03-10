// @flow
import React from 'react';
import styled from '@emotion/native';
import { colors } from 'config/styles';

type Props = {
  text: string,
  color: 'dark' | 'light',
};

const ErrorMessage = (props: Props) => (
  <Wrapper>
    <Icon
      source={
        props.color === 'light'
          ? require('assets/error_icon_light.png')
          : require('assets/error_icon_dark.png')
      }
    />
    <Label color={props.color}>{props.text}</Label>
  </Wrapper>
);

const Wrapper = styled.View({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 15,
});

const Icon = styled.Image({
  height: 25,
  width: 25,
  marginRight: 8,
});

const Label = styled.Text(({ color = 'light' }) => ({
  fontSize: 14,
  fontFamily: 'Montserrat-SemiBold',
  color: color === 'light' ? colors.WHITE : colors.TRUE_BLACK,
  flexWrap: 'wrap',
  flex: 1,
}));

export default ErrorMessage;
