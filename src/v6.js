/*!
 * Copyright (c) 2017-2018 SILENT
 * Released under the MIT License.
 * https://github.com/silent-tempest/v6
 */

'use strict';

var v6 = {
  Camera:        require( './Camera' ),
  HSLA:          require( './colors/HSLA' ),
  RGBA:          require( './colors/RGBA' ),
  Renderer2D:    require( './renderer-2d/Renderer2D' ),
  RendererWebGL: require( './renderer-webgl/RendererWebGL' ),
  Ticker:        require( './Ticker' ),
  Vector2D:      require( './math/Vector2D' ),
  Vector3D:      require( './math/Vector3D' ),
  camera:        require( './camera' ),
  color:         require( './colors/color' ),
  constants:     require( './constants' ),
  hsla:          require( './colors/hsla' ),
  options:       require( './default-options' ),
  platform:      require( './platform' ),
  renderer:      require( './renderer' ),
  rgba:          require( './colors/rgba' ),
  ticker:        require( './ticker' ),
  vec2:          require( './math/vec2' ),
  vec3:          require( './math/vec3' )
};

if ( typeof module !== 'undefined' ) {
  module.exports = v6;
} else if ( typeof window !== 'undefined' ) {
  window.v6 = v6;
}
