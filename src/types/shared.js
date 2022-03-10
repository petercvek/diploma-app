// @flow
declare type Trip = {
  id: string,
  coverPhoto: string,
  name: string,
  startAt: string,
  endAt: string,
  activities: { items: Array<Activity>, count: number },
  stays: { items: Array<Stay>, count: number },
  navigations: { items: Array<Navigation>, count: number },
  inviteCode: string,
};

declare type Location = {
  id: string,
  name: string,
  latitude: number,
  longitude: number,
};

declare type Activity = {
  id: string,
  name: string,
  startAt: string,
  endAt: string,
  location: Location,
};

declare type Stay = {
  id: string,
  checkIn: string,
  checkOut: string,
  name: string,
  location: Location,
};

declare type TripNavigation = {
  id: string,
  type: string,
  startAt: string,
  duration: number,
  distance: number,
  route: any,
  startingLocation: Location,
  endingLocation: Location,
};
