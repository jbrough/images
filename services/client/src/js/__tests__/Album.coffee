jest.autoMockOff()

Album = require("./../Album.react")
React = require "react"

utils  = require("react-addons-test-utils")

agent = require("superagent")
imageIds = JSON.stringify(["4", "2", "5"])

dataURI = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAtAD8DAREAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAABAUGBwACAwH/xAAvEAACAQMDAgQEBwEBAAAAAAABAgMABBEFEiEGMRMUQVEiYXGhBzKBscHR8EKR/8QAGgEAAwEBAQEAAAAAAAAAAAAAAgMEAQUABv/EACIRAAMAAgICAgMBAAAAAAAAAAABAgMRITESQRNRBBQiQv/aAAwDAQACEQMRAD8A26a1yFlVJIwc8q6sMfQ59a6Ln2mc1V6YJ1D01F1Bdi58xFavnGMFyR8jnH6CqIzeC12Dp72V9q3SOraRM0kkRe3yds6cqR8/aqIyxfCGu0lyA+UG0eJ3PtTNCfk54AZ4AG+EcCvFEX9kk6Y0RtUdytpJcGMBsK4VRz/1n+KzJShcvRNkqm9Ik170sLcq8IZMHLBiMD5A+tJn8la/oRWO/Qr1K5mv51s7SMzuo529uP8Ad6RVfQcRrmmZFbKXEtpKYH9u6/2PvUcZ5fZZeJjOC61SD45C7c8sBvX7fzVM+FE9eSGU1/ealZvax6jYqkvDo42kD9RTcSxTW3vgVkrI1oRv01cJIys0e0Hh1kBBHuKt+XFreybyvetA83S9uwLG8jb6uAP3Jpf7EeyibyekOOmYV0S9doJTc7k2mG2Rm3e3P80nPmjJPjKNnz8vKh9Nomsa0c3RTTbQ8kM26Qj6elSeUyO066DrSy0LQIvDhIdj+Zwcsx+ZpVZWwphLllTWdvrul2mCsckijhJGVwf17/eplgp9ItrNC7Y+h6h1WDTVlh0BJ7wtgiLdhR7nBNH8OWfQv5cNf6PY+otbtrqHUrnSba4W+VYvIy7m8EqSC2COGIH/AJT1dTM+XHIqox22pfX0crr8S7CG4mibpHTH2OQrgkbh85i/EfpmL1lLrFpHBYaDYWLXTeEtyhIMRHPBI74H3puPKm1sysChNtvgey/iBro1GfSoNJ8CASPGsqAquBnB3be3bnNTvyqihTjS4aI3Pq/V8VkbOJIrqTJHmzPubnnjJAOM/OstU6/lGz8ettkeu7fqkbfN6iiK+SGe8Rcn1HfNA4rYSrH2i7o9HtJIztt1U/MV2lMz6PnbyXa7CTosENhItuBHMWBDD25olTddcC3KUd8iq402d5UgaRVeDBLk/mNNUTS2TVnqK8U+kLLrpeGZ3LTx4IwBuxkZr3wz9G/vWvYKNDSySPw3QiJi+0ep7ftRLDO96PfvVS02HyaXeebnnjuA8JZhszwAfYUhytJMtm9t0hRd+ZewDRQRiRZSxYxgnG0DGfbiseLVBznTgRXc9y6oGtoiyk5YxKSc+mcULxcjIyrXZa5uhESD2FPUbOXeXRsLwv8ACoY+lGo0T1lb6BLhtx3HOTzmnStEltt7Yvfbk0YC2DyMMEVg2UcTdSrlQx5oXKZRNUlwwd74rEY2UEZzS3C3soi6S0C3TW8kh8LIHpupen7HeS3wSbe5G4sMnbnj6/1TEiKm+z2FyWVc47/77UQvvg3eVnj59Dz861dgPoAmbuaMBLkCkckVg+UcHYg1gaQJM2c0LHygCZyuce9LY+Vs/9k="

dataURItoBlob = (dataURI) ->
  arr = dataURI.split(',')
  mime = arr[0].match(/:(.*?);/)[1]
  new Blob([atob(arr[1])], {type:mime})

class FakeAgent
  constructor: ->
    @_action = null

  post: (url) ->
    @_action = if url.match(/move/)
      "move"
    else
      "add"
    @

  delete: (url) ->
    @_action = "delete"
    @

  send: (data) -> @
  get: (url) -> @
  timeout: (ms) -> @

  end: (cb) ->
    imageIds = if @_action == "delete"
      ["2", "5"]
    else if @_action == "move"
      ["2", "4", "5"]
    else
      ["4", "2", "5"]

    cb(null, text: JSON.stringify(imageIds))

describe "CourseList", ->
  beforeEach ->
    @agent = new FakeAgent()
    @post   = spyOn(@agent, "post").and.callThrough()
    @get    = spyOn(@agent, "get").and.callThrough()
    @delete = spyOn(@agent, "delete").and.callThrough()
    @send   = spyOn(@agent, "send").and.callThrough()

    @index = utils.renderIntoDocument(
      <Album  agent={@agent}
              id="1"
      />
    )

  describe "initial load", ->
    it "sets image id state", ->
      expect(@get).toHaveBeenCalledWith("/1")
      expect(@index.state.ids).toEqual(["4", "2", "5"])

    it "adds images", ->
      imgs = utils.scryRenderedDOMComponentsWithTag(@index, "img")
      expect(imgs.length).toEqual(3)
      srcs = imgs.map (img) -> img.getAttribute("src").replace(/\?.*/, "")
      expected = [
        "https://storage.googleapis.com/shoebox/list_4.jpg"
        "https://storage.googleapis.com/shoebox/list_2.jpg"
        "https://storage.googleapis.com/shoebox/list_5.jpg"
      ]
      expect(srcs).toEqual(expected)

  describe "deleting an image", ->
    beforeEach ->
      del = utils.scryRenderedDOMComponentsWithClass(@index, "del")[0]
      utils.Simulate.click(del)

    it "sends delete request", ->
      expect(@delete).toHaveBeenCalledWith("/1/4")

    it "sets state", ->
      expect(@index.state.ids).toEqual(["2", "5"])

  describe "moving an image", ->
    beforeEach ->
      mv = utils.scryRenderedDOMComponentsWithClass(@index, "move")[0]
      utils.Simulate.change(mv, target: value: 1)

    it "sends post request with new index in body", ->
      expect(@post).toHaveBeenCalledWith("/1/move/4")
      expect(@send).toHaveBeenCalledWith(data: 1)

    it "sets state", ->
      expect(@index.state.images).toEqual(["2", "4", "5"])

  describe "adding an image", ->
    beforeEach ->
      dataFiles = [dataURItoBlob(dataURI)]
      upload = utils.findRenderedDOMComponentWithClass(@index, "upload")
      utils.Simulate.change(upload, target: files: dataFiles)

    it "sends post request with image data", (done) ->
      setImmediate =>
        expect(@post).toHaveBeenCalledWith("/1/add")
        expect(@send.calls.argsFor(0)[0].data).toMatch("data:image/jpeg;base64")
        done()
