// @flow
import React from 'react';
import styled from '@emotion/native';

import { colors } from 'config/styles';

type Props = {
  mainLine: number,
  background?: string,
};

const ProgressBar = (props: Props) => (
  <Background background={props.background}>
    {props.mainLine ? <MainLine amount={Math.min(Math.max(props.mainLine, 0.05), 1)} /> : null}
  </Background>
);

ProgressBar.defaultProps = {
  background: colors.LIGHT_GREY,
};

const Background = styled.View(({ background }) => ({
  position: 'relative',
  width: '100%',
  height: 8,
  borderRadius: 8 / 2,
  backgroundColor: background || colors.LIGHT_GREY,
}));

const MainLine = styled.View(({ amount }) => ({
  position: 'absolute',
  height: 8,
  width: `${amount * 100}%`,
  borderRadius: 8 / 2,
  backgroundColor: colors.BLACK,
}));

export default ProgressBar;
