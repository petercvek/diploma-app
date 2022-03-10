// @flow
import { autobind } from 'core-decorators';
import React, { Component, Fragment } from 'react';
import { Animated, ScrollView, Dimensions, View, TouchableOpacity } from 'react-native';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import gql from 'graphql-tag';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import MapboxGL from '@react-native-mapbox-gl/maps';
import mapboxgl from 'mapbox-gl';

import Navbar, { NavbarTitle, NAVBAR_HEIGHT } from 'components/Navbar';
import { Button } from 'components/Buttons';
import ProgressBar from 'components/ProgressBar';

import { colors } from 'config/styles';

const Screen = Dimensions.get('window');

type Props = {|
  componentId: string,
  trip: Trip,
  editTrip: Function,
|};

type State = {|
  loading: boolean,
  startAt: Date,
  endAt: Date,
  showStartAtDatePicker: boolean,
  showEndAtDatePicker: boolean,
  name: string,
  coverPhoto: string,

  offlineMapBounds: ?Array<Array<number, number>, Array<number, number>>,
  progress: 0,
  downloading: boolean,
  removing: boolean,
|};

@autobind
class EditTripScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  scrollView: ScrollView;
  cards = {};
  scrollViewY = new Animated.Value(-NAVBAR_HEIGHT);

  state = {
    loading: false,
    startAt: new Date(this.props.trip.startAt),
    endAt: new Date(this.props.trip.endAt),
    showStartAtDatePicker: false,
    showEndAtDatePicker: false,
    name: this.props.trip.name,
    coverPhoto: this.props.trip.coverPhoto,

    offlineMapBounds: null,
    progress: 0,
    downloading: false,
    removing: false,
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

  async componentDidMount() {
    const offlinePack = await this.getOfflineMap();
    if (offlinePack) this.setState({ offlineMapBounds: offlinePack.pack.bounds });
  }

  getOfflineMap = async () => {
    try {
      const offlinePack = await MapboxGL.offlineManager.getPack(this.props.trip.id);
      return offlinePack;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  downloadOfflineMap = async bounds => {
    this.setState({ downloading: true, progress: 0 });
    const progressListener = (offlineRegion, status) => {
      this.setState({ progress: status.percentage / 100 });

      if (status.percentage === 100) {
        setTimeout(
          () => this.setState({ downloading: false, offlineMapBounds: offlineRegion.pack.bounds }),
          500,
        );
      }
    };

    const errorListener = (offlineRegion, err) => console.log(offlineRegion, err);

    await MapboxGL.offlineManager.deletePack(this.props.trip.id);

    await MapboxGL.offlineManager.createPack(
      {
        name: this.props.trip.id,
        styleURL: 'mapbox://styles/petercvek/ckyfsy2eo1ceb14pf7rd7kdw1',
        minZoom: 14,
        maxZoom: 20,
        bounds: bounds,
      },
      progressListener,
      errorListener,
    );
  };

  removeOfflineMap = async () => {
    this.setState({
      removing: true,
    });
    await MapboxGL.offlineManager.deletePack(this.props.trip.id);
    this.setState({
      removing: false,
      offlineMapBounds: null,
    });
  };

  openLocationPicker = () => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'LocationPickerScreen',
        passProps: {
          onComplete: location => {
            this.setState({ location });
          },
        },
      },
    });
  };

  editTrip = async () => {
    try {
      this.setState({ loading: true });
      await this.props.editTrip({
        variables: {
          tripId: this.props.trip.id,
          startAt: this.state.startAt,
          endAt: this.state.endAt,
          name: this.state.name || null,
          coverPhoto: this.state.coverPhoto,
        },
        optimisticResponse: {
          __typename: 'Mutation',
          editTrip: {
            ...this.props.trip,
            id: this.props.trip.id,
            startAt: this.state.startAt,
            endAt: this.state.endAt,
            name: this.state.name || null,
            coverPhoto: this.state.coverPhoto,
          },
        },
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ loading: false });
    }
  };

  navigateBack() {
    Navigation.pop(this.props.componentId);
  }

  hasChanges = () =>
    this.props.data.trip.name !== this.state.name ||
    this.props.data.trip.coverPhoto !== this.state.coverPhoto ||
    new Date(this.props.data.trip.startAt).getTime() !== new Date(this.state.startAt).getTime() ||
    new Date(this.props.data.trip.endAt).getTime() !== new Date(this.state.endAt).getTime();

  render() {
    const coordinates = [
      ...this.props.trip.stays.items.map(stay => {
        return [parseFloat(stay.location.longitude), parseFloat(stay.location.latitude)];
      }),
      ...this.props.trip.activities.items.map(activity => {
        return [parseFloat(activity.location.longitude), parseFloat(activity.location.latitude)];
      }),
    ];

    let bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coordinate => bounds.extend(coordinate));

    if (!bounds._ne) {
      bounds = null;
    } else {
      bounds = [
        [bounds._ne.lng, bounds._ne.lat],
        [bounds._sw.lng, bounds._sw.lat],
      ];
    }

    return (
      <Wrapper>
        <Navbar scrollViewY={this.scrollViewY}>
          <View
            style={{
              width: Screen.width - 40,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <NavbarTitle title="Edit Trip" />
            </View>
          </View>
        </Navbar>
        <ScrollViewWrapper
          contentContainerStyle={{ alignItems: 'center' }}
          keyboardDismissMode="on-drag"
        >
          <Labels
            style={{
              textAlign: 'left',
              width: '100%',
              marginLeft: 40,
              marginBottom: 10,
              marginTop: 3,
            }}
          >
            Invite code: {this.props.trip.inviteCode}
          </Labels>

          <Card>
            <Labels>Name</Labels>
            <Input
              placeholder="Enter name of the trip"
              onChangeText={text => this.setState({ name: text })}
              placeholderTextColor={colors.GREY5}
              value={this.state.name}
              autoCorrect={false}
              blurOnSubmit
              returnKeyType="next"
            />
          </Card>
          <Card>
            <Labels>Cover Photo Url</Labels>
            <Input
              placeholder="Enter photo url (optional)"
              onChangeText={text => this.setState({ coverPhoto: text })}
              placeholderTextColor={colors.GREY5}
              value={this.state.coverPhoto}
              autoCorrect={false}
              blurOnSubmit
              returnKeyType="next"
            />
          </Card>
          <Card>
            <Section>
              <TouchableOpacity
                onPress={() =>
                  this.setState({ showStartAtDatePicker: !this.state.showStartAtDatePicker })
                }
                activeOpacity={0.7}
              >
                <Labels>Check in</Labels>
                <Text>{moment(this.state.startAt).format('H:mm - D MMM')}</Text>
              </TouchableOpacity>
              {this.state.showStartAtDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  textColor={colors.BLACK}
                  value={this.state.startAt}
                  mode="datetime"
                  is24Hour={true}
                  display="spinner"
                  onChange={(_, date) => this.setState({ startAt: date })}
                />
              )}
            </Section>
            <TouchableOpacity
              onPress={() =>
                this.setState({ showEndAtDatePicker: !this.state.showEndAtDatePicker })
              }
              activeOpacity={0.7}
            >
              <Labels>Check out</Labels>
              <Row>
                <Text>{moment(this.state.endAt).format('H:mm - D MMM')}</Text>
                <Text>
                  {moment(this.state.endAt).dayOfYear() +
                    moment(this.state.endAt).year() * 365 -
                    (moment(this.state.startAt).dayOfYear() +
                      moment(this.state.startAt).year() * 365) +
                    1}{' '}
                  days
                </Text>
              </Row>
            </TouchableOpacity>
            {this.state.showEndAtDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                textColor={colors.BLACK}
                value={this.state.endAt}
                mode="datetime"
                is24Hour={true}
                display="spinner"
                onChange={(_, date) => this.setState({ endAt: date })}
              />
            )}
          </Card>
          {bounds && (
            <Card>
              <Labels>Offline map</Labels>
              {(() => {
                if (this.state.downloading) {
                  return (
                    <Fragment>
                      <Section>
                        <Text>Downloading</Text>
                      </Section>
                      <ProgressBar mainLine={this.state.progress} background={colors.WHITE} />
                      <Labels style={{ marginTop: 5, textAlign: 'right' }}>
                        {this.state.progress * 100}%
                      </Labels>
                    </Fragment>
                  );
                } else if (!this.state.offlineMapBounds) {
                  return (
                    <Fragment>
                      <Section>
                        <Text>Not Downloaded</Text>
                      </Section>
                      <Button
                        text={'Download offline map'}
                        onPress={() => this.downloadOfflineMap(bounds)}
                        small
                      />
                    </Fragment>
                  );
                } else if (JSON.stringify(this.state.offlineMapBounds) === JSON.stringify(bounds)) {
                  return (
                    <Fragment>
                      <Section>
                        <Text>Offline map is up to date</Text>
                      </Section>
                      <Button
                        text={'Delete offline map'}
                        loading={this.state.removing}
                        onPress={this.removeOfflineMap}
                        color={colors.WHITE}
                        background={colors.RED}
                        small
                      />
                    </Fragment>
                  );
                } else {
                  return (
                    <Fragment>
                      <Section>
                        <Text>There are some missing parts of offline map</Text>
                      </Section>
                      <Button
                        text={'Download missing parts'}
                        onPress={() => this.downloadOfflineMap(bounds)}
                        small
                      />
                    </Fragment>
                  );
                }
              })()}
            </Card>
          )}

          {this.hasChanges() && (
            <View style={{ width: '100%', paddingHorizontal: 20 }}>
              <Button text="Edit Trip" loading={this.state.loading} onPress={this.editTrip} />
            </View>
          )}
        </ScrollViewWrapper>
      </Wrapper>
    );
  }
}

const ScrollViewWrapper = styled.ScrollView({
  marginTop: NAVBAR_HEIGHT,
});

const Wrapper = styled.View({
  height: Screen.height,
  backgroundColor: colors.WHITE,
});

const Card = styled.View({
  backgroundColor: colors.LIGHT_GREY,
  width: Screen.width - 40,
  padding: 12,
  borderRadius: 10,
  marginBottom: 10,
});

const Section = styled.View({
  paddingBottom: 8,
});

const Row = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
});

const Labels = styled.Text({
  fontSize: 12,
  color: colors.GREY4,
  fontFamily: 'Montserrat-Bold',
});

const Text = styled.Text({
  fontSize: 17,
  color: colors.BLACK,
  fontFamily: 'Montserrat-Medium',
});

const Input = styled.TextInput(({ color = colors.TRUE_BLACK }) => ({
  color,
  fontSize: 17,
  fontFamily: 'Montserrat-Medium',
  paddingTop: 1,
}));

const tripQuery = gql`
  query trip($tripId: ID!) {
    trip(tripId: $tripId) {
      id
      name
      startAt
      endAt
      coverPhoto
      inviteCode
    }
  }
`;

const enhance = {
  options: (props: Props) => ({
    variables: { tripId: props.trip.id },
    fetchPolicy: 'cache-and-network',
  }),
};

const editTripMutation = gql`
  mutation editTrip(
    $tripId: ID!
    $name: String!
    $startAt: String!
    $endAt: String!
    $coverPhoto: String
  ) {
    editTrip(
      tripId: $tripId
      name: $name
      startAt: $startAt
      endAt: $endAt
      coverPhoto: $coverPhoto
    ) {
      id
      name
      startAt
      endAt
      coverPhoto
      inviteCode
    }
  }
`;

export default compose(
  graphql(tripQuery, enhance),
  graphql(editTripMutation, {
    name: 'editTrip',
  }),
)(EditTripScreen);
