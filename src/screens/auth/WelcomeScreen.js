// @flow
import { autobind } from 'core-decorators';
import React, { Component } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { Navigation } from 'react-native-navigation';
import styled from '@emotion/native';

import { colors } from 'config/styles';
import { Button } from 'components/Buttons';

const Screen = Dimensions.get('window');
const MULTIPLIER = Screen.width / 375;

type Props = {
  componentId: string,
};

@autobind
class WelcomeScreen extends Component<Props> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  static options() {
    return {
      statusBar: {
        style: Platform.OS === 'ios' && 'dark',
        drawBehind: true,
      },
    };
  }

  login = () => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'LoginScreen',
      },
    });
  };

  register = () => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'SignUpScreen',
      },
    });
  };

  render() {
    return (
      <Background resizeMode="cover">
        <Wrapper>
          <HeaderWrapper>
            <Title>Welcome</Title>
            <Subtitle>Plan your trips with ease</Subtitle>
            <Image resizeMode="contain" source={require('assets/welcome_screen.png')} />
          </HeaderWrapper>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: '50%', paddingRight: 10 }}>
              <Button text="Sign Up" onPress={this.register} />
            </View>
            <View style={{ width: '50%', paddingLeft: 10 }}>
              <Button
                text="Login"
                onPress={this.login}
                color={colors.BLACK}
                background={colors.WHITE}
              />
            </View>
          </View>
        </Wrapper>
      </Background>
    );
  }
}

const Wrapper = styled.View({
  paddingHorizontal: 20,
  paddingBottom: isIphoneX() ? 30 : 20,
  paddingTop: isIphoneX() ? Screen.height * 0.2 : Screen.height * 0.1,
  justifyContent: 'space-between',
  flex: 1,
});

const HeaderWrapper = styled.View({
  alignItems: 'center',
});

const Background = styled.ImageBackground({
  flex: 1,
  resizeMode: 'cover',
  backgroundColor: colors.WHITE,
});

const Title = styled.Text({
  fontFamily: 'Montserrat-ExtraBold',
  backgroundColor: 'transparent',
  fontSize: 35,
  lineHeight: 37,
});

const Subtitle = styled.Text({
  fontFamily: 'Montserrat-Medium',
  backgroundColor: 'transparent',
  fontSize: 16,
});

const Image = styled.Image({
  width: 300 * MULTIPLIER,
  height: 200 * MULTIPLIER,
  marginBottom: 20,
});

export default WelcomeScreen;
