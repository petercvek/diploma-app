// @flow
import AsyncStorage from '@react-native-community/async-storage';
import { Navigation } from 'react-native-navigation';

const startLogin = () => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'WelcomeScreen',
            },
          },
        ],
      },
    },
  });
};

const startTrips = () => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'TripsScreen',
            },
          },
        ],
      },
    },
  });
};

const start = async () => {
  await Navigation.setDefaultOptions({
    layout: {
      orientation: ['portrait'],
    },
    popGesture: true,
    modalPresentationStyle: 'fullScreen',
    statusBar: {
      style: 'dark',
      drawBehind: true,
      backgroundColor: 'transparent',
    },
    topBar: {
      visible: false,
      drawBehind: true,
    },

    animations: {
      push: {
        waitForRender: true,
      },
      showModal: {
        waitForRender: true,
      },
    },
  });

  startNavigation();
};

const startNavigation = async () => {
  const token = await AsyncStorage.getItem('jwtToken');
  if (token) startTrips();
  else startLogin();
};

const startTheApp = async () => {
  Navigation.events().registerAppLaunchedListener(() => start());
};

export default startTheApp;
export { startLogin, startTrips };
