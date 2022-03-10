// @flow
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { colors } from 'config/styles';
import styled from '@emotion/native';

type Props = {
  enabled: boolean,
  onPress: Function,
  loading: boolean,
  icon: any,
};

const RoundButton = (props: Props) => (
  <Wrapper
    disabled={!props.enabled}
    enabled={props.enabled}
    onPress={props.onPress}
    activeOpacity={0.7}
  >
    {props.loading ? (
      <ActivityIndicator color={colors.BLACK} />
    ) : (
      <Icon enabled={props.enabled} source={props.icon} />
    )}
  </Wrapper>
);

const Wrapper = styled.TouchableOpacity(({ enabled }) => ({
  height: 50,
  width: 50,
  borderRadius: 50 / 2,
  backgroundColor: enabled ? colors.WHITE : colors.BLACK,
  alignItems: 'center',
  justifyContent: 'center',
  shadowOffset: {
    height: 2,
  },
  shadowRadius: 8,
  shadowOpacity: enabled ? 0.1 : 0,
}));

const Icon = styled.Image(({ enabled }) => ({
  width: 40,
  height: 40,
  tintColor: enabled ? colors.BLACK : colors.WHITE,
}));

export default RoundButton;
