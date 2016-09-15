import test from 'tape';
import React from 'react';
import sd from 'skin-deep';
import Album from './../../src/js/react/Album';
import FakeRequest from './FakeRequest';

function fakeImages(name){
  return [
    {
      name: name,
      bucket: "shoebox",
      metadata: {
        'sf-original-size': '3888x2592',
      },
    }
  ];
}

function fakeResponses(responses) {
  const image = "79debdf7795045d8aa75dec706462ef0.jpg";
  const defaultRes = {
    'GET /api/venue/1': { name: 'venue-1', id: 1 },
    'GET /api/album/1': fakeImages(image),
  };

  return Object.assign({}, defaultRes, responses || {});
};

test('sets venue name state', t => {
  t.plan(1);

  const fakeRequest = FakeRequest({}, fakeResponses());
  const tree = sd.shallowRender(
    <Album request={ fakeRequest.request } id='1' />
  )
  const album = tree.getMountedInstance();
  album.componentDidMount();

  t.equal(album.state.name, 'venue-1');

  t.end()
});

test('sets images state', t => {
  t.plan(1);

  const fakeRequest = FakeRequest({}, fakeResponses());
  const tree = sd.shallowRender(
    <Album request={ fakeRequest.request } id='1' />
  )
  const album = tree.getMountedInstance();
  album.componentDidMount();

  t.deepEqual(
    album.state.images,
    [
      {
        bucket: 'shoebox',
        original_size: '3888x2592',
        id: '79debdf7795045d8aa75dec706462ef0',
      }
    ],
    'image has id, bucket name, width and height'
  );

  t.end()
});

test('Album#renderImages returns Image component instances', t => {
  t.plan(5);

  const fakeRequest = FakeRequest({}, fakeResponses());
  const tree = sd.shallowRender(
    <Album request={ fakeRequest.request } id='1' />
  )
  const album = tree.getMountedInstance();
  album.componentDidMount();

  const image = album.renderImages().map((r) => r.props)[0];

  // Just test the static props that Album passes in
  t.equal(image.id, '79debdf7795045d8aa75dec706462ef0', 'has image id');
  t.equal(image.bucket, 'shoebox', 'has bucket name');
  t.equal(image.original_size, '3888x2592', 'has original size');
  t.equal(image.total, 1, 'has total number of images in album');
  t.equal(image.index, 0, 'has image index in album');

  t.end()
});

function setup() {
  const responses = fakeResponses({
    'POST /api/album/1/image/79debdf7795045d8aa75dec706462ef0/move/3': fakeImages('new-name'),
    'DELETE /api/album/1/image/79debdf7795045d8aa75dec706462ef0': fakeImages('new-name'),
    'DELETE /api/album/1': fakeImages('new-name'),
    'POST /api/album/1/image/add': fakeImages('new-name'),
  });

  const fakeRequest = FakeRequest({}, responses);
  const tree = sd.shallowRender(
    <Album request={ fakeRequest.request } id='1' />
  )

  const album = tree.getMountedInstance();
  album.componentDidMount();
  const image = album.renderImages().map((r) => r.props)[0];
  const form = album.renderFileForm().props;

  return {
    tree,
    album,
    apiCalls: fakeRequest.calls,
    // test the methods as they're called in the implementation
    moveImage: image.move,
    deleteImage: image.delete,
    addImage: form.addImage,
  }
}

test('Album#moveImage', t => {
  t.plan(2);
  const s = setup();
  const id = '79debdf7795045d8aa75dec706462ef0';
  s.moveImage(id, 3);
  const apiCall = s.apiCalls[`POST /api/album/1/image/${id}/move/3`];

  t.equal(apiCall.data, null, 'sends new index as data body');

  t.equal(
    s.album.state.images[0].id,
    'new-name',
    'album state is reset by POST response'
  );

  t.end();
});

test('Album#deleteImage', t => {
  t.plan(2);
  const s = setup();
  const id = '79debdf7795045d8aa75dec706462ef0';
  s.deleteImage(id);
  const apiCall = s.apiCalls[`DELETE /api/album/1/image/${id}`];
  t.ok(apiCall, 'api is called with DELETE /api/album/1/image/id');
  t.equal(
    s.album.state.images[0].id,
    'new-name',
    'album state is reset by DELETE response'
    // This would be an empty array if we'd deleted the only image - but we just care that the image state is updated with the DELETE response data. The fixtures don't need to mimic the server-side behaviour, which is tested separately.
  );

  t.end();
});

test('delete all button', t => {
  t.plan(2)
  const s = setup();

  const del = s.tree.subTree('input');
  del.props.onClick();

  const apiCall = s.apiCalls[`DELETE /api/album/1`];
  t.ok(apiCall, 'api is called with DELETE /api/album/1');
  t.equal(
    s.album.state.images[0].id,
    'new-name',
    'album state is reset by DELETE response'
  );

  t.end();
});

test('Album#addImage', t => {
  t.plan(3);

  const s = setup();
  s.addImage('fakeImageData', () => {});
  const apiCall = s.apiCalls['POST /api/album/1/image/add'];
  t.ok(apiCall, 'api is called with ADD /api/album/1/image/add');
  t.equal(apiCall.data, 'fakeImageData', 'POST body has fake image data');
  t.equal(
    s.album.state.images[0].id,
    'new-name',
    'album state is reset by POST response'
  );

  t.end();
})
