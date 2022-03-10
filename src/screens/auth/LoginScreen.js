// @flow
import { autobind } from 'core-decorators';
import React, { Component } from 'react';
import { ScrollView, KeyboardAvoidingView, View, Platform, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import styled from '@emotion/native';
import emailValidator from 'email-validator';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Navigation } from 'react-native-navigation';

import { MiniNavbar, NavbarIcon, NavbarTitle, MINI_NAVBAR_HEIGHT } from 'components/Navbar';
import { RoundButton } from 'components/Buttons';
import { startTrips } from 'index';
import { InputLabel, Input } from 'components/FormElements';
import ErrorMessage from 'components/ErrorMessage';
import { colors } from 'config/styles';

type Props = {
  componentId: string,
  login: ({ variables: { email: string, password: string } }) => Promise<{
    data: { token: string },
  }>,
};

type State = {
  loading: boolean,
  error: 'USER_OR_EMAIL_WRONG' | 'UNKNOWN_ERROR' | null,
  email: string,
  password: string,
};

@autobind
class LoginScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  static options() {
    return {
      statusBar: {
        style: 'light',
        drawBehind: true,
      },
    };
  }

  state = {
    loading: false,
    error: null,
    email: '',
    password: '',
  };

  inputs = {};

  componentDidAppear() {
    setTimeout(this.inputs.email.focus, 500);
  }

  onChangeEmail = (text: string) => {
    this.setState({
      email: text.toLowerCase(),
      error: null,
    });
  };

  onSubmitEmail = () => {
    this.inputs.password.focus();
  };

  onChangePassword = (text: string) => {
    this.setState({
      password: text,
      error: null,
    });
  };

  onSubmitPassword = async () => {
    if (this.validate().all) this.login();
  };

  login = async () => {
    try {
      this.setState({ loading: true });

      const response = await this.props.login({
        variables: {
          email: this.state.email,
          password: this.state.password,
        },
      });

      if (response.data.token) {
        await AsyncStorage.setItem('jwtToken', response.data.token);
        startTrips();
      } else {
        this.setState({ loading: false });
      }
    } catch (error) {
      const gqlError = error.graphQLErrors && error.graphQLErrors[0];
      if (gqlError) {
        switch (gqlError.message) {
          case 'USER_OR_EMAIL_WRONG': {
            this.setState({ error: 'USER_OR_EMAIL_WRONG' });
            break;
          }
          default:
            this.setState({ error: 'UNKNOWN_ERROR' });
        }
      }
      this.setState({ loading: false });
    }
  };

  renderErrorMessage = () => {
    if (!this.state.error) return null;

    switch (this.state.error) {
      case 'USER_OR_EMAIL_WRONG':
        return (
          <ErrorMessage color="light" text={'i18n.LoginScreen.email_or_password_wrong_error'} />
        );

      case 'UNKNOWN_ERROR':
        return <ErrorMessage color="light" text={'i18n.LoginScreen.unknown_error'} />;

      default:
        return <ErrorMessage color="light" text={'i18n.LoginScreen.unknown_error'} />;
    }
  };

  validate = () => {
    const emailIsValid = emailValidator.validate(this.state.email);
    const passwordIsValid = this.state.password.length >= 6;

    return {
      email: emailIsValid,
      password: passwordIsValid,
      all: emailIsValid && passwordIsValid && !this.state.error,
    };
  };

  navigateBack = () => {
    Navigation.pop(this.props.componentId);
  };

  navigateToForgottenPasswordScreen = async () => {
    await Keyboard.dismiss();

    setTimeout(() => {
      Navigation.push(this.props.componentId, {
        component: {
          name: 'ForgottenPasswordScreen',
        },
      });
    }, 100);
  };

  render() {
    return (
      <Background>
        <MiniNavbar>
          <NavbarIcon
            icon={require('assets/navbar_icons/back.png')}
            onPress={this.navigateBack}
            tintColor={colors.WHITE}
          />
        </MiniNavbar>

        <ScrollView
          style={{ marginTop: MINI_NAVBAR_HEIGHT }}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingHorizontal: 20, flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={MINI_NAVBAR_HEIGHT}
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1 }}>
              <NavbarTitle title="Login" />

              <InputLabel>Email</InputLabel>
              <View style={{ display: 'flex', justifyContent: 'center' }}>
                <Input
                  ref={input => input && (this.inputs.email = input)}
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  keyboardType="email-address"
                  value={this.state.email}
                  onChangeText={this.onChangeEmail}
                  onSubmitEditing={this.onSubmitEmail}
                />
                {this.validate().email && <CheckIcon source={require('assets/check.png')} />}
              </View>

              <InputLabel>Password</InputLabel>
              <Input
                ref={input => input && (this.inputs.password = input)}
                placeholder="Enter your password"
                placeholderTextColor="rgba(0, 0, 0, 0.5)"
                autoCorrect={false}
                autoCapitalize="none"
                secureTextEntry
                value={this.state.password}
                onChangeText={this.onChangePassword}
                onSubmitEditing={this.onSubmitPassword}
              />

              {this.renderErrorMessage()}

              <View style={{ position: 'absolute', right: 0, bottom: 20 }}>
                <RoundButton
                  enabled={this.validate().all}
                  onPress={this.login}
                  loading={this.state.loading}
                  icon={require('assets/arrow_right.png')}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </Background>
    );
  }
}

const Background = styled.View({
  flex: 1,
  backgroundColor: colors.WHITE,
});

const CheckIcon = styled.Image({
  width: 17,
  height: 17,
  position: 'absolute',
  right: 25,
});

const login = gql`
  mutation login($email: String!, $password: String!) {
    token: login(email: $email, password: $password)
  }
`;

export default graphql(login, { name: 'login' })(LoginScreen);
