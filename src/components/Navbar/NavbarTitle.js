// @flow
import React from 'react';
import { View } from 'react-native';
import { colors } from 'config/styles';
import { Platform } from 'react-native';
import styled from '@emotion/native';

type Props = {|
  title: string,
  subtitle?: string,
  titleColor?: string,
  subtitleColor?: string,
|};

const NavbarTitle = (props: Props) => (
  <View>
    {!!props.subtitle && (
      <Subtitle numberOfLines={1} style={{ color: props.subtitleColor }}>
        {props.subtitle.toUpperCase()}
      </Subtitle>
    )}
    <Title numberOfLines={1} style={{ color: props.titleColor }}>
      {props.title}
    </Title>
  </View>
);

NavbarTitle.defaultProps = {
  subtitle: '',
  titleColor: colors.TRUE_BLACK,
  subtitleColor: colors.GREY6,
};

const Subtitle = styled.Text({
  fontFamily: 'Montserrat-SemiBold',
  fontSize: 12,
  lineHeight: 15,
  marginBottom: Platform.OS === 'ios' ? -3 : -8,
});
Subtitle.propsAreStyleOverrides = true;

const Title = styled.Text({
  fontFamily: 'Montserrat-ExtraBold',
  fontSize: 30,
  marginBottom: -5,
});
Title.propsAreStyleOverrides = true;

export default NavbarTitle;
