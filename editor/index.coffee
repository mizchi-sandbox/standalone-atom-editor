# # stub model
class Config
  constructor: ->
    @_props = {}
  get: (key)-> @_props[key]
  set: (key, val)-> @_props[key] = val
  onDidChange: ->
  observe: ->


window.atom = config: new Config
React = require 'react-atom-fork'
# TextEditor = require './text-editor'
TextEditorComponent = require './components/text-editor-component'

class Editor
  getLineCount: -> 1

window.addEventListener 'load', ->
  # editor = new TextEditor {}

  root = document.body
  el = document.createElement 'div'
  root.appendChild el

  componentDescriptor = TextEditorComponent(
    hostElement: el
    rootElement: root
    # stylesElement: @stylesElement
    editor: new Editor
    mini: true
    # lineOverdrawMargin: @lineOverdrawMargin
    # useShadowDOM: true
  )

  component = React.renderComponent(componentDescriptor, root)
