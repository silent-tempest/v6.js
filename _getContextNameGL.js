'use strict';

var once = require( './_optional' )( 'peako/once', [ 'peako', 'once' ] );

var _getContextNameGL = once( function () {
  var canvas = document.createElement( 'canvas' );

  var types, i;

  if ( typeof canvas.getContext !== 'function' ) {
    return;
  }

  types = [
    'webkit-3d',
    'moz-webgl',
    'experimental-webgl',
    'webgl'
  ];

  for ( i = types.length - 1; i >= 0; --i ) {
    if ( canvas.getContext( types[ i ] ) ) {
      return types[ i ];
    }
  }
} );

module.exports = _getContextNameGL;
