import test from 'tape';
import React from 'react';
import sd from 'skin-deep';
import Index from './../../src/js/react/Index';
import FakeRequest from './FakeRequest';

const fakeResponse = {
  'GET /api/venues': {
    active: [
      { name: 'venue-1', id: 1 }, { name: 'venue-2', id: 2 }
    ],
    inactive: [
      { name: 'venue-3', id: 3 }
    ],
  },
};

test('Index sets active venues on state', t => {
  t.plan(1);

  const fakeRequest = FakeRequest({}, fakeResponse);
  const tree = sd.shallowRender(
    <Index request={ fakeRequest.request } />
  )
  const index = tree.getMountedInstance();
  index.componentDidMount();

  t.deepEqual(
    index.state.venues,
    [
      { id: 1, name: 'venue-1' },
      { id: 2, name: 'venue-2' }
    ],
    'venues are active and have a name and an id'
  );
  t.end()
});

test('Index#renderVenues returns Venue component instances', t => {
  // This isn't fool proof, it tests render indirectly via implementation
  // - we could test venues are actually rendered using skin-deep's dive method.

  t.plan(1);

  const tree = sd.shallowRender(
    <Index request={ () => {} } />
  )

  const index = tree.getMountedInstance();
  index.setState({ venues: fakeResponse['GET /api/venues'].active });

  const venueComponents = index.renderVenues();
  t.deepEqual(
    venueComponents.map((c) => c.props),
    [
      { id: 1, name: 'venue-1' },
      { id: 2, name: 'venue-2' }
    ]
  );
  t.end()
});
