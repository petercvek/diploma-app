// @flow
import React from 'react';
import { Navigation } from 'react-native-navigation';
import { ApolloProvider } from 'react-apollo';

import { AuthProvider } from 'config/apollo';

import WelcomeScreen from 'screens/auth/WelcomeScreen';
import LoginScreen from 'screens/auth/LoginScreen';
import SignUpScreen from 'screens/auth/SignUpScreen';

import TripsScreen from 'screens/TripsScreen';
import CreateTripScreen from 'screens/CreateTripScreen';
import AddTripOverlay from 'components/TripsScreen/AddTripOverlay';
import TripScreen from 'screens/TripScreen';
import EditTripScreen from 'screens/EditTripScreen';
import LocationPickerScreen from 'screens/LocationPickerScreen';
import RoutePickerScreen from 'screens/RoutePickerScreen';
import NewActivityScreen from 'screens/NewActivityScreen';
import NewStayScreen from 'screens/NewStayScreen';
import NewNavigationScreen from 'screens/NewNavigationScreen';
import AddOverlay from 'components/TripScreen/AddOverlay';
import MoreOverlay from 'components/TripScreen/MoreOverlay';

const registerScreens = client => {
  //
  // Auth
  //
  Navigation.registerComponent('WelcomeScreen', () => WelcomeScreen);
  Navigation.registerComponent(
    'SignUpScreen',
    () => props =>
      (
        <AuthProvider>
          <SignUpScreen {...props} />
        </AuthProvider>
      ),
    () => SignUpScreen,
  );
  Navigation.registerComponent(
    'LoginScreen',
    () => props =>
      (
        <AuthProvider>
          <LoginScreen {...props} />
        </AuthProvider>
      ),
    () => LoginScreen,
  );

  //
  // Main
  //
  Navigation.registerComponent(
    'TripsScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <TripsScreen {...props} />
        </ApolloProvider>
      ),
    () => TripsScreen,
  );
  Navigation.registerComponent(
    'CreateTripScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <CreateTripScreen {...props} />
        </ApolloProvider>
      ),
    () => CreateTripScreen,
  );
  Navigation.registerComponent(
    'AddTripOverlay',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <AddTripOverlay {...props} />
        </ApolloProvider>
      ),
    () => AddTripOverlay,
  );

  Navigation.registerComponent(
    'TripScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <TripScreen {...props} />
        </ApolloProvider>
      ),
    () => TripScreen,
  );
  Navigation.registerComponent(
    'EditTripScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <EditTripScreen {...props} />
        </ApolloProvider>
      ),
    () => EditTripScreen,
  );

  Navigation.registerComponent(
    'NewActivityScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <NewActivityScreen {...props} />
        </ApolloProvider>
      ),
    () => NewActivityScreen,
  );
  Navigation.registerComponent(
    'NewStayScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <NewStayScreen {...props} />
        </ApolloProvider>
      ),
    () => NewStayScreen,
  );
  Navigation.registerComponent(
    'NewNavigationScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <NewNavigationScreen {...props} />
        </ApolloProvider>
      ),
    () => NewNavigationScreen,
  );
  Navigation.registerComponent(
    'LocationPickerScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <LocationPickerScreen {...props} />
        </ApolloProvider>
      ),
    () => LocationPickerScreen,
  );
  Navigation.registerComponent(
    'RoutePickerScreen',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <RoutePickerScreen {...props} />
        </ApolloProvider>
      ),
    () => RoutePickerScreen,
  );
  Navigation.registerComponent(
    'AddOverlay',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <AddOverlay {...props} />
        </ApolloProvider>
      ),
    () => AddOverlay,
  );
  Navigation.registerComponent(
    'MoreOverlay',
    () => props =>
      (
        <ApolloProvider client={client} store={client.store}>
          <MoreOverlay {...props} />
        </ApolloProvider>
      ),
    () => MoreOverlay,
  );
};

export default registerScreens;
