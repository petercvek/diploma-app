// @flow
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';

const DotsButton = ({ onPress }: { onPress: Function }) => (
  <TouchableOpacity onPress={onPress}>
    <Dots resizeMode="contain" source={require('assets/navbar_icons/dots.png')} />
  </TouchableOpacity>
);

const Dots = styled.Image({
  height: 4,
  width: 16,
  margin: 5,
  marginTop: 18,
});

export default DotsButton;
