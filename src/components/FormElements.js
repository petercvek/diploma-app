// @flow
import styled from '@emotion/native';
import { Platform } from 'react-native';
import { colors } from 'config/styles';

const InputLabel = styled.Text(({ color = colors.TRUE_BLACK }) => ({
  fontFamily: 'Montserrat-SemiBold',
  fontSize: 14,
  color,
  marginTop: 20,
  marginBottom: 10,
}));

const Input = styled.TextInput(
  ({ color = colors.TRUE_BLACK, borderColor = colors.LIGHT_GREY4 }) => ({
    borderWidth: 1,
    borderColor,
    height: 50,
    borderRadius: 50 / 2,
    color,
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  }),
);

export { InputLabel, Input };
