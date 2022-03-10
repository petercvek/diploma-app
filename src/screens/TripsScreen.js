// @flow
import { autobind } from 'core-decorators';
import React, { Component } from 'react';
import {
  Animated,
  ScrollView,
  Dimensions,
  RefreshControl,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  View,
  TouchableOpacity,
} from 'react-native';
import { graphql, withApollo } from 'react-apollo';
import AsyncStorage from '@react-native-community/async-storage';

import { compose } from 'recompose';
import gql from 'graphql-tag';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';

import Navbar, { NavbarTitle, NAVBAR_HEIGHT } from 'components/Navbar';
import TripCard from 'components/TripsScreen/TripCard';
import { TABBAR_HEIGHT, colors } from 'config/styles';

const Screen = Dimensions.get('window');
const MULTIPLIER = Screen.width / 375;

type Props = {|
  componentId: string,
  data: {
    loading: boolean,
    trips: Array<Trip>,
    refetch: Function,
  },
|};

type State = {|
  refreshing: boolean,
|};

@autobind
class TripsScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  scrollView: ScrollView;
  cards = {};
  scrollViewY = new Animated.Value(-NAVBAR_HEIGHT);

  state = {
    refreshing: false,
  };

  static options() {
    return {
      bottomTabs: {
        visible: true,
      },
      statusBar: {
        drawBehind: true,
      },
    };
  }

  onRefresh = async () => {
    try {
      this.setState({ refreshing: true });
      LayoutAnimation.easeInEaseOut();
      await this.props.data.refetch();
    } catch (error) {
      console.error(error);
    } finally {
      this.setState({ refreshing: false });
    }
  };

  onCardPress = (trip: Trip) => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'TripScreen',
        passProps: { trip },
      },
    });
  };

  openAddTripOverlay = () => {
    Navigation.showOverlay({
      component: {
        name: 'AddTripOverlay',
        passProps: {
          parentComponentId: this.props.componentId,
          openCreateTripScreen: this.openCreateTripScreen,
        },
      },
    });
  };

  openCreateTripScreen = () => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'CreateTripScreen',
        passProps: {
          onTripCreated: trip => this.onCardPress(trip),
        },
      },
    });
  };

  render() {
    return (
      <Wrapper>
        <Animated.FlatList
          ref={sv => {
            if (sv) this.scrollView = sv;
          }}
          keyExtractor={item => item.id}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={contentContainerStyle}
          scrollEventThrottle={1}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: this.scrollViewY } } }], {
            useNativeDriver: true,
          })}
          scrollsToTop={false}
          contentInset={{ top: NAVBAR_HEIGHT, bottom: TABBAR_HEIGHT }}
          contentOffset={{ y: -NAVBAR_HEIGHT }}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
              progressViewOffset={NAVBAR_HEIGHT}
            />
          }
          data={this.props.data.trips}
          renderItem={({ item }) => <TripCard trip={item} onPress={() => this.onCardPress(item)} />}
          ListEmptyComponent={
            this.props.data.loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={colors.TRUE_BLACK} />
            ) : (
              <View
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}
              >
                <Image resizeMode="contain" source={require('assets/empty_trips.png')} />
                <StateText>
                  You don't have any trips. You can create a new one or join existing one by
                  clicking + in upper right corner or button bellow.
                </StateText>
                <TouchableOpacity onPress={this.openAddTripOverlay}>
                  <ClickHere>Create or Join Trip</ClickHere>
                </TouchableOpacity>
              </View>
            )
          }
        />

        <Navbar scrollViewY={this.scrollViewY}>
          <View
            style={{
              width: Screen.width - 40,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <NavbarTitle title="Trips" />
            <TouchableOpacity onPress={this.openAddTripOverlay}>
              <AddIcon resizeMode="contain" source={require('assets/add.png')} />
            </TouchableOpacity>
          </View>
        </Navbar>
      </Wrapper>
    );
  }
}

const ClickHere = styled.Text({
  marginTop: 10,
  fontFamily: 'Montserrat-ExtraBold',
  fontSize: 18,
  textAlign: 'center',
  color: colors.BLACK,
});

const StateText = styled.Text({
  fontFamily: 'Montserrat-Medium',
  fontSize: 14,
  textAlign: 'center',
  color: colors.TRUE_BLACK,
});

const Image = styled.Image({
  width: 300 * MULTIPLIER,
  height: 200 * MULTIPLIER,
  marginBottom: 20,
});

const Wrapper = styled.View({
  height: Screen.height,
  backgroundColor: colors.WHITE,
});

const contentContainerStyle = {
  paddingHorizontal: 20,
  paddingTop: Platform.OS === 'android' ? NAVBAR_HEIGHT + 15 : 15,
  paddingBottom: Platform.OS === 'android' ? TABBAR_HEIGHT : 0,
};

const AddIcon = styled.Image({
  width: 28,
  height: 28,
});

const tripsQuery = gql`
  {
    trips {
      id
      name
      startAt
      endAt
      coverPhoto
      inviteCode
      participants {
        items {
          id
          account {
            id
          }
        }
      }
    }
  }
`;

export default compose(
  graphql(tripsQuery, {
    fetchPolicy: 'cache-and-network',
  }),
  withApollo,
)(TripsScreen);
