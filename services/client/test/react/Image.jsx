import test from 'tape';
import React from 'react';
import sd from 'skin-deep';
import Image from './../../src/js/react/Image';

function image() {
  return (
    <Image bucket='shoebox'
           index={0}
           total={1}
           original_size='100x200'
           albumID='1'
           id='image-id'
           delete={() => {}}
           move={() => {}}

    />
  );
}

test('Image renders', t => {
  t.plan(2);

  const tree = sd.shallowRender(image());

  const img = tree.subTree('img');
  const span = tree.subTree('span');

  t.equal(img.props.src.match(/^.*\?/)[0], 'https://storage.googleapis.com/shoebox/list_image-id.jpg?', 'sets src prop on img tag');
  t.equal(span.text(), '100x200', 'has dims');
  t.end();
});
