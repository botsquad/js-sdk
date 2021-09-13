/**
 * @jest-environment jsdom
 */

import { assert } from 'chai'

import { TextUtil } from '../src'

describe('processText', function() {
  it('works', function(done) {
    var s = TextUtil.processText('https://nl.wikipedia.org/wiki/Ezel_(dier)').__html

    assert.equal(
      '<p><a target="_blank" rel="nofollow" href="https://nl.wikipedia.org/wiki/Ezel_(dier)">https://nl.wikipedia.org/wiki/Ezel_(dier)</a></p>\n',
      s
    )
    assert.equal('<p>hoi<br>hoi</p>\n', TextUtil.processText('hoi\nhoi').__html)

    assert.equal(
      '<p><strong>Click this</strong>: <a target="_blank" rel="nofollow" href="https://nu.nl">link</a>.</p>\n',
      TextUtil.processText('**Click this**: [link](https://nu.nl).').__html
    )

    done()
  })

  it('does not open new window when on same domain', function() {
    let s: string

    s = TextUtil.processText('[klik hier](http://localhost/x.html)').__html
    assert.equal('<p><a target="_top" href="http://localhost/x.html">klik hier</a></p>\n', s)

    s = TextUtil.processText('[klik hier](/x.html)').__html
    assert.equal('<p><a target="_top" href="/x.html">klik hier</a></p>\n', s)
  })
})
