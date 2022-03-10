// @flow
import { autobind } from 'core-decorators';
import React, { Component } from 'react';
import { ScrollView, KeyboardAvoidingView, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import styled from '@emotion/native';
import emailValidator from 'email-validator';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { Navigation } from 'react-native-navigation';

import { MiniNavbar, NavbarIcon, NavbarTitle, MINI_NAVBAR_HEIGHT } from 'components/Navbar';
import { RoundButton } from 'components/Buttons';
import { startTrips } from 'index';
import { InputLabel, Input } from 'components/FormElements';
import ErrorMessage from 'components/ErrorMessage';
import { colors } from 'config/styles';

type Props = {
  componentId: string,
  register: ({ variables: { email: string, password: string } }) => {
    data: { token: string },
  },
};

type State = {
  loading: boolean,
  email: string,
  password: string,
  error: 'EMAIL_ALREADY_EXISTS' | 'UNKNOWN_ERROR' | null,
};

@autobind
class SignUpEmailPasswordScreen extends Component<Props, State> {
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
    email: '',
    password: '',
    error: null,
  };

  inputs = {};

  componentDidAppear() {
    setTimeout(this.inputs.email.focus, 500);
  }

  onChangeEmail = (text: string) => {
    this.setState({
      email: text.toLowerCase(),
    });
  };

  onSubmitEmail = () => {
    this.inputs.password.focus();
  };

  onChangePassword = (text: string) => {
    this.setState({ password: text, error: null });
  };

  onSubmitPassword = () => {
    if (this.validate().all) this.signUp();
  };

  signUp = async () => {
    this.setState({ loading: true });

    try {
      const response = await this.props.register({
        variables: {
          email: this.state.email,
          password: this.state.password,
        },
      });

      if (response.data.token) {
        await AsyncStorage.setItem('jwtToken', response.data.token);

        startTrips();
      }
    } catch (error) {
      const gqlError = error.graphQLErrors && error.graphQLErrors[0];
      if (gqlError) {
        switch (gqlError.message) {
          case 'EMAIL_ALREADY_EXISTS': {
            this.setState({ error: 'EMAIL_ALREADY_EXISTS' });
            break;
          }

          default:
            this.setState({ error: 'UNKNOWN_ERROR' });
        }
      } else this.setState({ error: 'UNKNOWN_ERROR' });
    } finally {
      this.setState({ loading: false });
    }
  };

  renderErrorMessage = () => {
    if (!this.state.error) return null;

    switch (this.state.error) {
      case 'EMAIL_ALREADY_EXISTS':
        return (
          <ErrorMessage
            color="light"
            text={'i18n.SignUpEmailPasswordScreen.email_already_exists_error'}
          />
        );
      default:
        return <ErrorMessage color="light" text={'i18n.SignUpEmailPasswordScreen.unknown_error'} />;
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
              <NavbarTitle title="Sign Up" />

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

              <View>
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
              </View>

              {this.renderErrorMessage()}

              <View style={{ position: 'absolute', right: 0, bottom: 20 }}>
                <RoundButton
                  enabled={this.validate().all}
                  onPress={this.onSubmitPassword}
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

const register = gql`
  mutation register($email: String!, $password: String!) {
    token: register(email: $email, password: $password)
  }
`;

export default graphql(register, { name: 'register' })(SignUpEmailPasswordScreen);
