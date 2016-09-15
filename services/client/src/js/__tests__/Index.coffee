jest.autoMockOff()

Index = require("./../Index.react")
React = require "react"

utils  = require("react-addons-test-utils")

class FakeAgent
  constructor: ->
  get: (url) -> @
  timeout: (ms) -> @

  end: (cb) ->
    res = {
      active: [{ id: 1, name: "test-1" }],
      inactive: [{ id: 2, name: "test-2" }],
    }
    cb(null, text: JSON.stringify(res))

describe "Index", ->
  beforeEach ->
    @agent = new FakeAgent()
    @get    = spyOn(@agent, "get").and.callThrough()

    @index = utils.renderIntoDocument(
      <Index  agent={@agent} />
    )

  describe "initial load", ->
    it "sets venue id state", ->
      expect(@get).toHaveBeenCalledWith("/venues")
      expect(@index.state.venues).toEqual(
        {
          active: [{ id: 1, name: "test-1" }],
          inactive: [{ id: 2, name: "test-2" }],
        }
      )

    it "adds venue links", ->
      links = utils.scryRenderedDOMComponentsWithTag(@index, "a")
      expect(links.length).toEqual(1)
      hrefs = links.map (link) -> link.getAttribute("href")
      expected = [
        "/?id=1&name=test-1"
      ]
      expect(hrefs).toEqual(expected)
