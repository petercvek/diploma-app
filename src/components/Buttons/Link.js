// @flow
import React from 'react';
import { Linking } from 'react-native';
import styled from '@emotion/native';

const Link = (props: { href: string, children: any }) => (
  <Label
    onPress={async () => {
      Linking.openURL(props.href);
    }}
  >
    {props.children}
  </Label>
);

const Label = styled.Text({
  fontFamily: 'Montserrat-Bold',
});

export default Link;
