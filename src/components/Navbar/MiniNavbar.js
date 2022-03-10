// @flow
import React from 'react';
import styled from '@emotion/native';

import { STATUSBAR_HEIGHT } from 'config/styles';

const MINI_NAVBAR_HEIGHT = STATUSBAR_HEIGHT + 37;

type Props = {
  children: any,
  background?: string,
};

const MiniNavbar = (props: Props) => (
  <Wrapper background={props.background}>{props.children}</Wrapper>
);

MiniNavbar.defaultProps = {
  background: 'transparent',
};

const Wrapper = styled.View(({ background }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  position: 'absolute',
  top: 0,
  height: MINI_NAVBAR_HEIGHT,
  paddingHorizontal: 16,
  paddingBottom: 10,
  width: '100%',
  zIndex: 1000,
  backgroundColor: background,
}));

export default MiniNavbar;
export { MINI_NAVBAR_HEIGHT };
