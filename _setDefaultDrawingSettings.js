'use strict';

var _copyDrawingSettings = require( './_copyDrawingSettings' ),
    constants            = require( './constants' ),
    Font                 = require( './Font' );

var defaultDrawingSettings = {
  _rectAlignX: constants.LEFT,
  _rectAlignY: constants.TOP,
  _textAlignX: constants.LEFT,
  _textAlineY: constants.TOP,
  _doStroke:   true,
  _doFill:     true,
  _lineH:      14,
  _lineW:      2
};

module.exports = function _setDefaultDrawingSettings ( target, source ) {

  _copyDrawingSettings( target, defaultDrawingSettings );

  target._strokeColor = new source.settings.color();
  target._fillColor   = new source.settings.color();
  target._font        = new Font();

  return target;

};
