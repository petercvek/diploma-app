// @flow
import { autobind } from 'core-decorators';
import React, { Component } from 'react';
import { Dimensions, LayoutAnimation, View, TouchableOpacity } from 'react-native';
import { graphql, withApollo } from 'react-apollo';
import { compose } from 'recompose';
import gql from 'graphql-tag';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';
import moment from 'moment';

import TRIP_FIELDS from 'fragments/Trip';

import DaySelector from 'components/TripScreen/DaySelector';
import StayCard from 'components/TripScreen/StayCard';
import ActivityCard from 'components/TripScreen/ActivityCard';
import NavigationCard from 'components/TripScreen/NavigationCard';
import { colors } from 'config/styles';
import MapboxGL from '@react-native-mapbox-gl/maps';
import mapboxgl from 'mapbox-gl';

import stayPinIcon from 'assets/map_icons/stay_pin.png';
import checkInCalloutIcon from 'assets/map_icons/check_in_callout.png';
import checkOutCalloutIcon from 'assets/map_icons/check_out_callout.png';
import stayCalloutIcon from 'assets/map_icons/stay_callout.png';
import activityPinIcon from 'assets/map_icons/activity_pin.png';
import endPointPinIcon from 'assets/map_icons/end_point_pin.png';

import { Button } from 'components/Buttons';

MapboxGL.setAccessToken(
  'pk.eyJ1IjoicGV0ZXJjdmVrIiwiYSI6ImNqeHhsbzg2ZjAwdTMzZ29hMzVqejhxZGkifQ.hBm73-Bw40Ibn3tWNNwjpA',
);

const Screen = Dimensions.get('window');

type Props = {|
  componentId: string,
  trip: Trip,
  data: {
    loading: boolean,
    trip: Array<Trip>,
    refetch: Function,
  },
  addParticipant: Function,
  duplicateTrip: Function,
|};

type State = {|
  refreshing: boolean,
  duplicating: boolean,
  joining: boolean,
  selectedDate: Date,
  selectedPinId: ?number,
|};

@autobind
class TripsScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  state = {
    refreshing: false,
    duplicating: false,
    joining: false,
    selectedDate: this.props.data?.trip?.startAt,
    selectedPinId: null,
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

  async onRefresh() {
    try {
      this.setState({ refreshing: true });
      LayoutAnimation.easeInEaseOut();
      await this.props.data.refetch();
    } catch (error) {
      console.error(error);
    } finally {
      this.setState({ refreshing: false });
    }
  }

  openAddOverlay = async () => {
    const center = await this._map.getCenter();

    Navigation.showOverlay({
      component: {
        name: 'AddOverlay',
        passProps: {
          parentComponentId: this.props.componentId,
          selectedDate: this.state.selectedDate,
          trip: this.props.data.trip,
          defaultCoordinates: center,
        },
      },
    });
  };

  openMoreOverlay = (item: Activity | Stay | Navigation) => {
    Navigation.showOverlay({
      component: {
        name: 'MoreOverlay',
        passProps: {
          parentComponentId: this.props.componentId,
          selected: item,
          trip: this.props.data.trip,
        },
      },
    });
  };

  openEditTripScreen = () => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'EditTripScreen',
        passProps: {
          trip: this.props.data.trip,
        },
      },
    });
  };

  fitBounds = () => {
    this.camera.fitBounds();
  };

  selectPin = (coordinates, selectedPinId) => {
    this.camera.setCamera({ centerCoordinate: coordinates, zoomLevel: 12, animationDuration: 500 });
    this.setState({ selectedPinId });
  };

  selectRoute = (coordinates, selectedRoute) => {
    const bounds = new mapboxgl.LngLatBounds();

    coordinates.forEach(coordinate => bounds.extend(coordinate));

    this.camera.fitBounds(
      [bounds._ne.lng, bounds._ne.lat],
      [bounds._sw.lng, bounds._sw.lat],
      [100, 50, 50, 50],
      500,
    );

    this.setState({ selectedPinId: selectedRoute });
  };

  changeDate = newDate => {
    this.setState({ selectedDate: newDate, selectedPinId: null });

    const activities = this.props.data.trip.activities.items.filter(
      activity =>
        moment(activity.startAt).dayOfYear() <= moment(newDate).dayOfYear() &&
        moment(activity.endAt).dayOfYear() >= moment(newDate).dayOfYear(),
    );
    const stays = this.props.data.trip.stays.items.filter(
      stay =>
        moment(stay.checkIn).dayOfYear() <= moment(newDate).dayOfYear() &&
        moment(stay.checkOut).dayOfYear() >= moment(newDate).dayOfYear(),
    );

    const navigations = this.props.data.trip.navigations.items
      .filter(navigation => moment(navigation.startAt).dayOfYear() === moment(newDate).dayOfYear())
      .map(navigation => ({ ...navigation, route: JSON.parse(navigation.route) }));

    const coordinates = [
      ...stays.map(stay => {
        return [parseFloat(stay.location.longitude), parseFloat(stay.location.latitude)];
      }),
      ...activities.map(activity => {
        return [parseFloat(activity.location.longitude), parseFloat(activity.location.latitude)];
      }),
      ...navigations.map(navigation => {
        return navigation.route.geometry.coordinates;
      }),
    ];

    if (coordinates.length === 0) return;
    if (coordinates.length === 1) {
      this.camera.setCamera({
        centerCoordinate: coordinates[0],
        zoomLevel: 12,
        animationDuration: 500,
      });
    } else {
      let bounds = new mapboxgl.LngLatBounds();

      coordinates.forEach(coordinate => {
        if (coordinate.length > 2) coordinate.forEach(coordinate2 => bounds.extend(coordinate2));
        else bounds.extend(coordinate);
      });

      if (bounds._ne) {
        bounds = [
          [bounds._ne.lng, bounds._ne.lat],
          [bounds._sw.lng, bounds._sw.lat],
        ];

        this.camera.fitBounds(...bounds, [100, 50, 50, 50], 500);
      }
    }
  };

  joinTrip = async () => {
    try {
      this.setState({ joining: true });
      await this.props.addParticipant({
        variables: { tripId: this.props.trip.id },
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ joining: false });
    }
  };

  duplicateTrip = async () => {
    try {
      this.setState({ duplicating: true });
      const result = await this.props.duplicateTrip({
        variables: { tripId: this.props.trip.id },
      });

      await this.props.data.refetch({ tripId: result.data.duplicateTrip.id });
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ duplicating: false });
    }
  };

  render() {
    if (!this.props.data.trip || !this.props.data.trip.activities) return null;

    const activities = this.props.data.trip.activities.items.filter(
      activity =>
        moment(activity.startAt).dayOfYear() <= moment(this.state.selectedDate).dayOfYear() &&
        moment(activity.endAt).dayOfYear() >= moment(this.state.selectedDate).dayOfYear(),
    );

    const navigations = this.props.data.trip.navigations.items
      .filter(
        navigation =>
          moment(navigation.startAt).dayOfYear() === moment(this.state.selectedDate).dayOfYear(),
      )
      .map(navigation => ({ ...navigation, route: JSON.parse(navigation.route) }));

    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        ...this.props.data.trip.stays.items.map(stay => {
          return {
            type: 'Feature',
            properties: {
              id: stay.id,
              title: stay.name,
              poi: 'stay',
              pin: 'stayPin',
              callout: moment(stay.checkIn).isSame(this.state.selectedDate, 'day')
                ? 'checkInCallout'
                : moment(stay.checkOut).isSame(this.state.selectedDate, 'day')
                ? 'checkOutCallout'
                : 'stayCallout',
            },
            geometry: {
              type: 'Point',
              coordinates: [
                parseFloat(stay.location.longitude),
                parseFloat(stay.location.latitude),
              ],
            },
          };
        }),
        ...activities.map(activity => {
          return {
            type: 'Feature',
            properties: {
              id: activity.id,
              title: activity.name,
              poi: 'activity',
              pin: 'activityPin',
            },
            geometry: {
              type: 'Point',
              coordinates: [
                parseFloat(activity.location.longitude),
                parseFloat(activity.location.latitude),
              ],
            },
          };
        }),
        ...navigations.map(navigation => {
          return {
            type: 'Feature',
            properties: {
              id: navigation.id,
              poi: 'route',
            },
            geometry: {
              ...navigation.route.geometry,
              coordinates: navigation.route.geometry.coordinates,
            },
          };
        }),
        ...navigations.map(navigation => {
          return {
            type: 'Feature',
            properties: {
              id: navigation.id,
              poi: 'navigation',
              pin: 'endPointPin',
            },
            geometry: {
              type: 'Point',
              coordinates: [
                parseFloat(navigation.startingLocation.longitude),
                parseFloat(navigation.startingLocation.latitude),
              ],
            },
          };
        }),
        ...navigations.map(navigation => {
          return {
            type: 'Feature',
            properties: {
              id: navigation.id,
              poi: 'navigation',
              pin: 'endPointPin',
            },
            geometry: {
              type: 'Point',
              coordinates: [
                parseFloat(navigation.endingLocation.longitude),
                parseFloat(navigation.endingLocation.latitude),
              ],
            },
          };
        }),
      ],
    };
    let bounds = new mapboxgl.LngLatBounds();
    featureCollection.features.forEach(feature => {
      if (feature.geometry.coordinates.length > 2)
        feature.geometry.coordinates.forEach(coordinate => bounds.extend(coordinate));
      else bounds.extend(feature.geometry.coordinates);
    });
    if (!bounds._ne) {
      bounds = [
        [0, 0],
        [0, 0],
      ];
    } else {
      bounds = [
        [bounds._ne.lng, bounds._ne.lat],
        [bounds._sw.lng, bounds._sw.lat],
      ];
    }

    const items = [...this.props.data.trip.stays.items, ...activities, ...navigations].sort(
      (a, b) => {
        return moment(a.startAt || a.checkIn).diff(moment(b.startAt || b.checkIn));
      },
    );

    const preview = !this.props.data.trip.participants.items
      .map(participant => participant.account.id)
      .includes(this.props.data.viewer.account.id);

    return (
      <Wrapper>
        <MapWrapper>
          <MapboxGL.MapView
            ref={c => (this._map = c)}
            style={{ flex: 1 }}
            styleURL="mapbox://styles/petercvek/ckyfsy2eo1ceb14pf7rd7kdw1"
            pitchEnabled={false}
            rotateEnabled={false}
            compassEnabled={false}
          >
            <MapboxGL.Images
              images={{
                stayPin: stayPinIcon,
                checkInCallout: checkInCalloutIcon,
                checkOutCallout: checkOutCalloutIcon,
                stayCallout: stayCalloutIcon,
                activityPin: activityPinIcon,
                endPointPin: endPointPinIcon,
              }}
            />
            <MapboxGL.Camera
              ref={c => (this.camera = c)}
              defaultSettings={
                featureCollection.features.length > 1
                  ? {
                      bounds: {
                        ne: bounds[0],
                        sw: bounds[1],
                      },
                      padding: {
                        paddingTop: 100,
                        paddingRight: 50,
                        paddingBottom: 50,
                        paddingLeft: 50,
                      },
                    }
                  : featureCollection.features.length === 1
                  ? {
                      centerCoordinate: featureCollection.features[0].geometry.coordinates,
                      zoomLevel: 12,
                    }
                  : {}
              }
            />

            <MapboxGL.ShapeSource
              id="mapPinsSource"
              shape={featureCollection}
              onPress={e =>
                this.selectPin(e.features[0].geometry.coordinates, e.features[0].properties.id)
              }
            >
              <MapboxGL.SymbolLayer
                id="callout"
                style={{
                  iconAllowOverlap: true,
                  iconSize: 0.1,
                  iconImage: ['get', 'callout'],
                  iconOffset: [0, -70],
                  iconAnchor: 'bottom',
                }}
              />

              <MapboxGL.SymbolLayer
                id="mapPinsLayer"
                style={{
                  iconAllowOverlap: true,
                  iconAnchor: 'center',
                  iconSize: 0.1,
                  iconImage: ['get', 'pin'],
                }}
              />

              <MapboxGL.LineLayer
                belowLayerID="mapPinsLayer"
                id="mapRouteLine"
                style={{
                  lineWidth: 6,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          </MapboxGL.MapView>
        </MapWrapper>

        <ScrollViewWrapper
          contentContainerStyle={{
            alignItems: 'center',
            width: Screen.width,
            paddingBottom: 30,
          }}
        >
          <HeaderWrapper>
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <Row>
                  <OverviewText>
                    {moment(this.props.data.trip.endAt).dayOfYear() +
                      moment(this.props.data.trip.endAt).year() * 365 -
                      (moment(this.props.data.trip.startAt).dayOfYear() +
                        moment(this.props.data.trip.startAt).year() * 365) +
                      1}{' '}
                    DAYS
                  </OverviewText>
                  <OverviewText>{this.props.data.trip.activities.count} ACTIVITIES</OverviewText>
                </Row>

                <Title>{this.props.data.trip.name}</Title>
                <DateText>
                  {moment(new Date(this.props.data.trip.startAt)).format('D MMM')} -{' '}
                  {moment(new Date(this.props.data.trip.endAt)).format('D MMM')}
                </DateText>
              </View>
              {!preview && (
                <TouchableOpacity onPress={this.openEditTripScreen} activeOpacity={0.7}>
                  <EditIcon source={require('assets/edit.png')} />
                </TouchableOpacity>
              )}
            </Row>
          </HeaderWrapper>

          <DaySelector
            startingDate={this.props.data.trip.startAt}
            endingDate={this.props.data.trip.endAt}
            selectedDate={this.state.selectedDate}
            onChange={this.changeDate}
          />

          <TimelineWrapper>
            {items.map(item => {
              switch (item.__typename) {
                case 'Stay': {
                  return (
                    <StayCard
                      selected={this.state.selectedPinId === item.id}
                      selectedDate={this.state.selectedDate}
                      key={item.id}
                      stay={item}
                      onPress={() =>
                        this.selectPin(
                          [parseFloat(item.location.longitude), parseFloat(item.location.latitude)],
                          item.id,
                        )
                      }
                      onLongPress={() => {
                        this.selectPin(
                          [parseFloat(item.location.longitude), parseFloat(item.location.latitude)],
                          item.id,
                        );
                        this.openMoreOverlay(item);
                      }}
                    />
                  );
                }
                case 'Activity': {
                  return (
                    <ActivityCard
                      selected={this.state.selectedPinId === item.id}
                      key={item.id}
                      activity={item}
                      onPress={() =>
                        this.selectPin(
                          [parseFloat(item.location.longitude), parseFloat(item.location.latitude)],
                          item.id,
                        )
                      }
                      onLongPress={() => {
                        this.selectPin(
                          [parseFloat(item.location.longitude), parseFloat(item.location.latitude)],
                          item.id,
                        );
                        this.openMoreOverlay(item);
                      }}
                    />
                  );
                }

                case 'Navigation': {
                  return (
                    <NavigationCard
                      selected={this.state.selectedPinId === item.id}
                      key={item.id}
                      navigation={item}
                      onPress={() => this.selectRoute(item.route.geometry.coordinates, item.id)}
                      onLongPress={() => {
                        this.selectRoute(item.route.geometry.coordinates, item.id);
                        this.openMoreOverlay(item);
                      }}
                    />
                  );
                }
                default:
                  return null;
              }
            })}
          </TimelineWrapper>
        </ScrollViewWrapper>
        <BottomDock>
          <ButtonWrapper>
            {preview ? (
              <View style={{ flexDirection: 'row', width: '100%', paddingHorizontal: 20 }}>
                <View style={{ width: '50%', paddingRight: 10 }}>
                  <Button
                    text="Duplicate Trip"
                    background={colors.WHITE}
                    color={colors.BLACK}
                    onPress={this.duplicateTrip}
                    loading={this.state.duplicating}
                  />
                </View>
                <View style={{ width: '50%', paddingLeft: 10 }}>
                  <Button text="Join Trip" onPress={this.joinTrip} loading={this.state.joining} />
                </View>
              </View>
            ) : (
              <View style={{ width: 150 }}>
                <Button
                  text="Add"
                  background={colors.BLACK}
                  color={colors.WHITE}
                  onPress={this.openAddOverlay}
                />
              </View>
            )}
          </ButtonWrapper>
        </BottomDock>
      </Wrapper>
    );
  }
}

const Wrapper = styled.View({
  height: Screen.height,
  backgroundColor: colors.WHITE,
});

const MapWrapper = styled.View({
  height: 350,
});

const ScrollViewWrapper = styled.ScrollView({});

const TimelineWrapper = styled.View({
  marginVertical: 10,
});

const BottomDock = styled.View({
  position: 'absolute',
  width: Screen.width,
  alignItems: 'center',
  bottom: 25,
});

const ButtonWrapper = styled.View({
  flex: 1,
  height: '100%',
});

const Title = styled.Text({
  fontFamily: 'Montserrat-ExtraBold',
  color: colors.TRUE_BLACK,
  fontSize: 20,
});

const DateText = styled.Text({
  fontFamily: 'Montserrat-Bold',
  color: colors.GREY2,
  fontSize: 13,
  paddingVertical: 3,
});

const HeaderWrapper = styled.View({
  paddingVertical: 10,
  width: Screen.width - 30,
});

const Row = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const OverviewText = styled.Text({
  fontSize: 12,
  color: colors.GREY,
  fontFamily: 'Montserrat-SemiBold',
  marginRight: 10,
});

const EditIcon = styled.Image({
  width: 24,
  height: 24,
});

const tripQuery = gql`
  ${TRIP_FIELDS}

  query trip($tripId: ID, $inviteCode: String) {
    trip(tripId: $tripId, inviteCode: $inviteCode) {
      ...TripFields
    }
    viewer {
      account {
        id
      }
    }
  }
`;

const addParticipantMutation = gql`
  ${TRIP_FIELDS}

  mutation addParticipant($tripId: ID!) {
    trip: addParticipant(tripId: $tripId) {
      ...TripFields
    }
  }
`;

const duplicateTripMutation = gql`
  ${TRIP_FIELDS}

  mutation duplicateTrip($tripId: ID!) {
    duplicateTrip(tripId: $tripId) {
      ...TripFields
    }
  }
`;

const enhance = {
  options: (props: Props) => ({
    variables: { tripId: props.trip?.id },
    fetchPolicy: 'cache-and-network',
  }),
};

export default compose(
  graphql(tripQuery, enhance),
  graphql(addParticipantMutation, { name: 'addParticipant' }),
  graphql(duplicateTripMutation, { name: 'duplicateTrip' }),

  withApollo,
)(TripsScreen);
export { tripQuery };
