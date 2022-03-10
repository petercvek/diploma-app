// @flow
import gql from 'graphql-tag';

export default gql`
  fragment TripFields on Trip {
    id
    name
    startAt
    endAt
    coverPhoto
    inviteCode
    stays {
      items {
        id
        name
        checkIn
        checkOut
        price
        notes
        location {
          id
          name
          latitude
          longitude
        }
      }
    }
    activities {
      items {
        id
        name
        startAt
        endAt
        category
        notes
        price
        location {
          id
          name
          latitude
          longitude
        }
      }
      count
    }
    navigations {
      items {
        id
        type
        startAt
        duration
        distance
        startingLocation {
          id
          name
          latitude
          longitude
        }
        endingLocation {
          id
          name
          latitude
          longitude
        }
        route
      }
    }
    participants {
      items {
        account {
          id
        }
      }
    }
  }
`;
