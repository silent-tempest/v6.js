(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

/**
 * @interface IShaderAttribute
 * @property {number} location
 * @property {string} name
 * @property {number} size
 * @property {number} type
 * @see [getAttribLocation](https://mdn.io/getAttribLocation)
 * @see [WebGLActiveInfo](https://mdn.io/WebGLActiveInfo)
 */

/**
 * @interface IShaderUniform
 * @property {number} location
 * @property {string} name
 * @property {number} size
 * @property {number} type
 * @see [getActiveUniform](https://mdn.io/getActiveUniform)
 * @see [WebGLActiveInfo](https://mdn.io/WebGLActiveInfo)
 */

var createProgram = require( './internal/create_program' );
var createShader  = require( './internal/create_shader' );

/**
 * Высокоуровневый интерфейс для WebGLProgram.
 * @constructor v6.ShaderProgram
 * @param {IShaderSources}        sources Шейдеры для программы.
 * @param {WebGLRenderingContext} gl      WebGL контекст.
 * @example <caption>Require "v6.ShaderProgram"</caption>
 * var ShaderProgram = require( 'v6.js/ShaderProgram' );
 * @example <caption>Use without renderer</caption>
 * // Require "v6.js" shaders.
 * var shaders = require( 'v6.js/shaders' );
 * // Create a program.
 * var program = new ShaderProgram( shaders.basic, glContext );
 */
function ShaderProgram ( sources, gl )
{
  var vert = createShader( sources.vert, gl.VERTEX_SHADER, gl );
  var frag = createShader( sources.frag, gl.FRAGMENT_SHADER, gl );

  /**
   * WebGL программа созданная с помощью {@link createProgram}.
   * @private
   * @member {WebGLProgram} v6.ShaderProgram#_program
   */
  this._program = createProgram( vert, frag, gl );

  /**
   * WebGL контекст.
   * @private
   * @member {WebGLRenderingContext} v6.ShaderProgram#_gl
   */
  this._gl = gl;

  /**
   * Кешированные атрибуты шейдеров.
   * @private
   * @member {object} v6.ShaderProgram#_attributes
   * @see v6.ShaderProgram#getAttribute
   */
  this._attributes = {};

  /**
   * Кешированные формы (uniforms) шейдеров.
   * @private
   * @member {object} v6.ShaderProgram#_uniforms
   * @see v6.ShaderProgram#getUniform
   */
  this._uniforms = {};

  /**
   * Индекс последнего полученного атрибута.
   * @private
   * @member {number} v6.ShaderProgram#_attributeIndex
   * @see v6.ShaderProgram#getAttribute
   */
  this._attributeIndex = gl.getProgramParameter( this._program, gl.ACTIVE_ATTRIBUTES );

  /**
   * Индекс последней полученной формы (uniform).
   * @private
   * @member {number} v6.ShaderProgram#_uniformIndex
   * @see v6.ShaderProgram#getUniform
   */
  this._uniformIndex = gl.getProgramParameter( this._program, gl.ACTIVE_UNIFORMS );
}

ShaderProgram.prototype = {
  /**
   * @method v6.ShaderProgram#getAttribute
   * @param  {string}           name Название атрибута.
   * @return {IShaderAttribute}      Возвращает данные о атрибуте.
   * @example
   * var location = program.getAttribute( 'apos' ).location;
   */
  getAttribute: function getAttribute ( name )
  {
    var attr = this._attributes[ name ];
    var info;

    if ( attr ) {
      return attr;
    }

    while ( --this._attributeIndex >= 0 ) {
      info = this._gl.getActiveAttrib( this._program, this._attributeIndex );

      attr = {
        location: this._gl.getAttribLocation( this._program, name ),
        name: info.name,
        size: info.size,
        type: info.type
      };

      this._attributes[ attr.name ] = attr;

      if ( attr.name === name ) {
        return attr;
      }
    }

    throw ReferenceError( 'No "' + name + '" attribute found' );
  },

  /**
   * @method v6.ShaderProgram#getUniform
   * @param  {string}         name Название формы (uniform).
   * @return {IShaderUniform}      Возвращает данные о форме (uniform).
   * @example
   * var location = program.getUniform( 'ucolor' ).location;
   */
  getUniform: function getUniform ( name )
  {
    var uniform = this._uniforms[ name ];
    var index, info;

    if ( uniform ) {
      return uniform;
    }

    while ( --this._uniformIndex >= 0 ) {
      info = this._gl.getActiveUniform( this._program, this._uniformIndex );

      uniform = {
        location: this._gl.getUniformLocation( this._program, info.name ),
        size: info.size,
        type: info.type
      };

      if ( info.size > 1 && ~ ( index = info.name.indexOf( '[' ) ) ) { // eslint-disable-line no-bitwise
        uniform.name = info.name.slice( 0, index );
      } else {
        uniform.name = info.name;
      }

      this._uniforms[ uniform.name ] = uniform;

      if ( uniform.name === name ) {
        return uniform;
      }
    }

    throw ReferenceError( 'No "' + name + '" uniform found' );
  },

  /**
   * @method v6.ShaderProgram#setAttribute
   * @chainable
   * @see [WebGLRenderingContext#enableVertexAttribArray](https://mdn.io/enableVertexAttribArray)
   * @see [WebGLRenderingContext#vertexAttribPointer](https://mdn.io/vertexAttribPointer)
   * @example
   * program.setAttribute( 'apos', 2, gl.FLOAT, false, 0, 0 );
   */
  setAttribute: function setAttribute ( name, size, type, normalized, stride, offset )
  {
    var location = this.getAttribute( name ).location;
    this._gl.enableVertexAttribArray( location );
    this._gl.vertexAttribPointer( location, size, type, normalized, stride, offset );
    return this;
  },

  /**
   * @method v6.ShaderProgram#setUniform
   * @param  {string} name  Название формы (uniform).
   * @param  {any}    value Новое значение формы (uniform).
   * @chainable
   * @example
   * program.setUniform( 'ucolor', [ 255, 0, 0, 1 ] );
   */
  setUniform: function setUniform ( name, value )
  {
    var uniform = this.getUniform( name );
    var _gl     = this._gl;

    switch ( uniform.type ) {
      case _gl.BOOL:
      case _gl.INT:
        if ( uniform.size > 1 ) {
          _gl.uniform1iv( uniform.location, value );
        } else {
          _gl.uniform1i( uniform.location, value );
        }
        break;
      case _gl.FLOAT:
        if ( uniform.size > 1 ) {
          _gl.uniform1fv( uniform.location, value );
        } else {
          _gl.uniform1f( uniform.location, value );
        }
        break;
      case _gl.FLOAT_MAT2:
        _gl.uniformMatrix2fv( uniform.location, false, value );
        break;
      case _gl.FLOAT_MAT3:
        _gl.uniformMatrix3fv( uniform.location, false, value );
        break;
      case _gl.FLOAT_MAT4:
        _gl.uniformMatrix4fv( uniform.location, false, value );
        break;
      case _gl.FLOAT_VEC2:
        if ( uniform.size > 1 ) {
          _gl.uniform2fv( uniform.location, value );
        } else {
          _gl.uniform2f( uniform.location, value[ 0 ], value[ 1 ] );
        }
        break;
      case _gl.FLOAT_VEC3:
        if ( uniform.size > 1 ) {
          _gl.uniform3fv( uniform.location, value );
        } else {
          _gl.uniform3f( uniform.location, value[ 0 ], value[ 1 ], value[ 2 ] );
        }
        break;
      case _gl.FLOAT_VEC4:
        if ( uniform.size > 1 ) {
          _gl.uniform4fv( uniform.location, value );
        } else {
          _gl.uniform4f( uniform.location, value[ 0 ], value[ 1 ], value[ 2 ], value[ 3 ] );
        }
        break;
      default:
        throw TypeError( 'The uniform type is not supported ("' + name + '")' );
    }

    return this;
  },

  /**
   * @method v6.ShaderProgram#use
   * @chainable
   * @see [WebGLRenderingContext#useProgram](https://mdn.io/useProgram)
   * @example
   * program.use();
   */
  use: function use ()
  {
    this._gl.useProgram( this._program );
    return this;
  },

  constructor: ShaderProgram
};

module.exports = ShaderProgram;

},{"./internal/create_program":17,"./internal/create_shader":18}],2:[function(require,module,exports){
'use strict';
var LightEmitter = require( 'light_emitter' );
var timestamp = require( 'peako/timestamp' );
var timer = require( 'peako/timer' );
/**
 * Этот класс используется для зацикливания анимации вместо `requestAnimationFrame`.
 * @constructor v6.Ticker
 * @extends {LightEmitter}
 * @fires update
 * @fires render
 * @example
 * var Ticker = require( 'v6.js/Ticker' );
 * var ticker = new Ticker();
 * @example <caption>"update" event.</caption>
 * // Fires everytime an application should be updated.
 * // Depends on maximum FPS.
 * ticker.on( 'update', function ( elapsedTime ) {
 *   shape.rotation += 10 * elapsedTime;
 * } );
 * @example <caption>"render" event.</caption>
 * // Fires everytime an application should be rendered.
 * // Unlike "update", independent from maximum FPS.
 * ticker.on( 'render', function () {
 *   renderer.rotate( shape.rotation );
 * } );
 */
function Ticker ()
{
  var self = this;
  LightEmitter.call( this );
  this.lastRequestAnimationFrameID = 0;
  this.lastRequestTime = 0;
  this.skippedTime = 0;
  this.totalTime = 0;
  this.running = false;
  this.settings = {};
  /**
   * Запускает цикл анимации.
   * @method v6.Ticker#start
   * @chainable
   * @example
   * ticker.start();
   */
  function start ( _now )
  {
    var elapsedTime, frameTime;
    if ( ! self.running ) {
      if ( ! _now ) {
        self.lastRequestAnimationFrameID = timer.request( start );
        self.lastRequestTime = timestamp();
        self.running = true;
      }
      return this; // eslint-disable-line no-invalid-this
    }
    if ( ! _now ) {
      return this; // eslint-disable-line no-invalid-this
    }
    elapsedTime = Math.min( 1, ( _now - self.lastRequestTime ) * 0.001 );
    self.skippedTime += elapsedTime;
    self.totalTime += elapsedTime;
    frameTime = self.settings[ 'frame time' ];
    while ( self.skippedTime >= frameTime && self.running ) {
      self.skippedTime -= frameTime;
      self.emit( 'update', frameTime, _now );
    }
    self.emit( 'render', elapsedTime, _now );
    self.lastRequestTime = _now;
    self.lastRequestAnimationFrameID = timer.request( start );
    return this; // eslint-disable-line no-invalid-this
  }
  this.start = start;
  this.set( 'FPS', 60 );
}
Ticker.prototype = Object.create( LightEmitter.prototype );
Ticker.prototype.constructor = Ticker;
/**
 * Set new value of a setting.
 * @method v6.Ticker#set
 * @param  {string} setting The setting`s key, e.g.: "FPS", "frame time".
 * @param  {any}    value   New setting`s value.
 * @return {void}           Returns nothing.
 * @example
 * ticker.set( 'FPS', 120 );
 */
Ticker.prototype.set = function set ( setting, value )
{
  if ( isInvalidSetting( setting ) ) { throw Error( 'Got unknown setting key: ' + setting ); } /* eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len*/
  if ( setting === 'FPS' ) {
    this.settings[ 'frame time' ] = 1 / value;
  } else if ( setting === 'frame time' ) {
    this.settings[ 'FPS' ] = 1 / value; // eslint-disable-line dot-notation
  }
  this.settings[ setting ] = value;
};
/**
 * Get current value of a setting.
 * @method v6.Ticker#get
 * @param  {string} setting The setting`s key, e.g.: "FPS", "frame time".
 * @return {any}            The setting`s value.
 * @example
 * var frameTime = ticker.get( 'frame time' );
 */
Ticker.prototype.get = function get ( setting )
{
  if ( isInvalidSetting( setting ) ) { throw Error( 'Got unknown setting key: ' + setting ); } /* eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len*/
  return this.settings[ setting ];
};
/**
 * @method v6.Ticker#clear
 * @chainable
 */
Ticker.prototype.clear = function clear ()
{
  this.skippedTime = 0;
  return this;
};
/**
 * Останавливает анимацию.
 * @method v6.Ticker#stop
 * @chainable
 * @example
 * ticker.on( 'render', function () {
 *   // Stop the ticker after five seconds.
 *   if ( this.totalTime >= 5 ) {
 *     ticker.stop();
 *   }
 * } );
 */
Ticker.prototype.stop = function stop ()
{
  this.running = false;
  return this;
};
function isInvalidSetting ( setting )
{
  return setting !== 'frame time' && setting !== 'FPS';
}
module.exports = Ticker;

},{"light_emitter":43,"peako/timer":96,"peako/timestamp":97}],3:[function(require,module,exports){
'use strict';

var mat3 = require( './math/mat3' );

function Transform ()
{
  this.matrix = mat3.identity();
  this._index = -1;
  this._stack = [];
}

Transform.prototype = {
  save: function save ()
  {
    if ( ++this._index < this._stack.length ) {
      mat3.copy( this._stack[ this._index ], this.matrix );
    } else {
      this._stack.push( mat3.clone( this.matrix ) );
    }
  },

  restore: function restore ()
  {
    if ( this._index >= 0 ) {
      mat3.copy( this.matrix, this._stack[ this._index-- ] );
    } else {
      mat3.setIdentity( this.matrix );
    }
  },

  setTransform: function setTransform ( m11, m12, m21, m22, dx, dy )
  {
    mat3.setTransform( this.matrix, m11, m12, m21, m22, dx, dy );
  },

  translate: function translate ( x, y )
  {
    mat3.translate( this.matrix, x, y );
  },

  rotate: function rotate ( angle )
  {
    mat3.rotate( this.matrix, angle );
  },

  scale: function scale ( x, y )
  {
    mat3.scale( this.matrix, x, y );
  },

  /**
   * Применяет "transformation matrix" из соответствующих параметров на текущий "transformation matrix".
   * @method v6.Transform#transform
   * @param  {number}  m11 X scale.
   * @param  {number}  m12 X skew.
   * @param  {number}  m21 Y skew.
   * @param  {number}  m22 Y scale.
   * @param  {number}  dx  X translate.
   * @param  {number}  dy  Y translate.
   * @return {void}        Ничего не возвращает.
   * @example
   * // Apply scaled twice "transformation matrix".
   * transform.transform( 2, 0, 0, 2, 0, 0 );
   */
  transform: function transform ( m11, m12, m21, m22, dx, dy )
  {
    mat3.transform( this.matrix, m11, m12, m21, m22, dx, dy );
  },

  constructor: Transform
};

module.exports = Transform;

},{"./math/mat3":24}],4:[function(require,module,exports){
'use strict';
var defaults = require( 'peako/defaults' );
var settings = require( './settings' );
/**
 * Класс камеры. Этот класс удобен для создания камеры, которая должна быть
 * направленна на определенный объект в приложении, например: на машину в
 * гоночной игре. Камера будет сама плавно и с анимацией направляться на нужный
 * объект. Есть возможность анимированного отдаления или приближения камеры.
 * @constructor v6.Camera
 * @param {object} [options] Параметры для создания камеры, смотрите {@link v6.settings.camera}.
 * @example <caption>Require "v6.Camera"</caption>
 * var Camera = require( 'v6.js/core/camera/Camera' );
 * @example <caption>Create an instance</caption>
 * var camera = new Camera();
 * @example <caption>Create an instance with options</caption>
 * var camera = new Camera( {
 *   settings: {
 *     speed: {
 *       x: 0.15,
 *       y: 0.15
 *     }
 *   }
 * } );
 * @example <caption>Create an instance with renderer</caption>
 * var camera = new Camera( {
 *   renderer: renderer
 * } );
 */
function Camera ( options )
{
  var x, y;
  options = defaults( settings, options );
  /**
   * Настройки камеры, такие как скорость анимации или масштаб.
   * @member {object} v6.Camera#settings
   * @see v6.settings.camera.settings
   */
  this.settings = options.settings;
  if ( options.renderer ) {
    /**
     * Рендерер.
     * @member {v6.AbstractRenderer|void} v6.Camera#renderer
     */
    this.renderer = options.renderer;
  }
  if ( ! this.settings.offset ) {
    if ( this.renderer ) {
      x = this.renderer.w * 0.5;
      y = this.renderer.h * 0.5;
    } else {
      x = 0;
      y = 0;
    }
    this.settings.offset = {
      x: x,
      y: y
    };
  }
  /**
   * Объект, на который направлена камера.
   * @private
   * @member {object?} v6.Camera#_destination
   * @see v6.Camera#lookAt
   */
  this._destination = null;
  /**
   * Свойство, которое надо брать из {@link v6.Camera#_destination}.
   * @private
   * @member {string?} v6.Camera#_destinationKey
   * @see v6.Camera#lookAt
   */
  this._destinationKey = null;
  /**
   * Текущяя позиция камеры (сюда направлена камера).
   * @private
   * @member {IVector2D} v6.Camera#_currentPosition
   */
  this._currentPosition = {
    x: 0,
    y: 0
  };
}
Camera.prototype = {
  /**
   * Возвращает объект, на который камера должна быть направлена.
   * @private
   * @method v6.Camera#_getDestination
   * @return {IVector2D?} Объект или "null".
   */
  _getDestination: function _getDestination ()
  {
    var _destinationKey = this._destinationKey;
    if ( _destinationKey === null ) {
      return this._destination;
    }
    return this._destination[ _destinationKey ];
  },
  /**
   * Устанавливает настройки.
   * @method v6.Camera#set
   * @param  {string} setting Имя настройки: "zoom-out speed", "zoom-in speed", "offset", "speed", "zoom".
   * @param  {any}    value   Новое значение настройки.
   * @return {void}           Ничего не возращает.
   * @example
   * // Set zoom-in speed setting to 0.0025 with linear flag (default: true).
   * camera.set( 'zoom-in speed', { value: 0.0025, linear: true } );
   * // Turn off linear flag.
   * camera.set( 'zoom-in speed', { linear: false } );
   * // Set zoom setting to 1 with range [ 0.75 .. 1.125 ].
   * camera.set( 'zoom', { value: 1, min: 0.75, max: 1.125 } );
   * // Set camera speed.
   * camera.set( 'speed', { x: 0.1, y: 0.1 } );
   */
  set: function set ( setting, value )
  {
    var setting_ = this.get( setting );
    for ( var _keys = Object.keys( value ), _i = 0, _l = _keys.length; _i < _l; ++_i ) {
      setting_[ _keys[ _i ] ] = value[ _keys[ _i ] ];
    }
  },
  /**
   * Возвращает значение настройки.
   * @method v6.Camera#get
   * @param  {string} setting Имя настройки: "zoom-out speed", "zoom-in speed", "offset", "speed", "zoom".
   * @return {any}            Значение настройки.
   * @example
   * // Get current camera zoom.
   * var zoom = camera.get( 'zoom' ).value;
   */
  get: function get ( setting )
  {
    CHECK( setting );
    return this.settings[ setting ];
  },
  /**
   * Направляет камеру на определенную позицию (`"destination"`).
   * @method v6.Camera#lookAt
   * @param  {IVector2D} destination Позиция, в которую должна смотреть камера.
   * @param  {string}   [key]        Свойство, которое надо брать из `"destination"`.
   * @return {void}                  Ничего не возращает.
   * @example
   * var car = {
   *   position: {
   *     x: 4,
   *     y: 2
   *   }
   * };
   * // Direct a camera on the car.
   * camera.lookAt( car, 'position' );
   * // This way works too but if the 'position' will be replaced it would not work.
   * camera.lookAt( car.position );
   */
  lookAt: function lookAt ( destination, key )
  {
    this._destination = destination;
    if ( typeof key === 'undefined' ) {
      this._destinationKey = null;
    } else {
      this._destinationKey = key;
    }
  },
  /**
   * Возвращает позицию, на которую камера должна быть направлена.
   * @method v6.Camera#shouldLookAt
   * @return {IVector2D} Позиция.
   * @example
   * var object = {
   *   position: { x: 4, y: 2 }
   * };
   *
   * camera.shouldLookAt(); // -> { x: 0, y: 0 }.
   * camera.lookAt( object, 'position' );
   * camera.shouldLookAt(); // -> { x: 4, y: 2 } (clone).
   */
  shouldLookAt: function shouldLookAt ()
  {
    var _destination = this._getDestination();
    var x, y;
    if ( _destination === null ) {
      x = 0;
      y = 0;
    } else {
      x = _destination.x;
      y = _destination.y;
    }
    return {
      x: x,
      y: y
    };
  },
  /**
   * Обновляет позицию, на которую направлена камера.
   * @method v6.Camera#update
   * @return {void} Ничего не возвращает.
   * @example
   * ticker.on( 'update', function ()
   * {
   *   // Update a camera on each frame.
   *   camera.update();
   * } );
   */
  update: function update ()
  {
    var _destination = this._getDestination();
    if ( _destination !== null ) {
      translate( this, _destination, 'x' );
      translate( this, _destination, 'y' );
    }
  },
  /**
   * Возвращает позицию, на которую камера направлена сейчас.
   * @method v6.Camera#looksAt
   * @return {IVector2D} Текущее направление камеры.
   * @example
   * // A camera looks at [ x, y ] from looksAt now.
   * var looksAt = camera.looksAt();
   */
  looksAt: function looksAt ()
  {
    return {
      x: this._currentPosition.x,
      y: this._currentPosition.y
    };
  },
  /**
   * Применяет камеру на матрицу или рендерер.
   * @method v6.Camera#apply
   * @param  {v6.Transform|v6.AbstractRenderer} [matrix] Матрица или рендерер.
   * @return {void}                                      Ничего не возвращает.
   * @example <caption>Apply on a renderer</caption>
   * var renderer = v6.createRenderer();
   * camera.apply( renderer );
   * @example <caption>Apply on a transform</caption>
   * var matrix = new v6.Transform();
   * camera.apply( matrix );
   * @example <caption>Apply on a camera's renderer</caption>
   * var camera = new v6.Camera( {
   *   renderer: renderer
   * } );
   *
   * camera.apply();
   */
  apply: function apply ( matrix )
  {
    var zoom = this.settings.zoom.value;
    var x = transform( this, this._currentPosition, 'x' );
    var y = transform( this, this._currentPosition, 'y' );
    ( matrix || this.renderer ).setTransform( zoom, 0, 0, zoom, zoom * x, zoom * y );
  },
  /**
   * Определяет, видит ли камера объект из соответсвующих параветров (x, y, w, h) сейчас,
   * если нет, то этот объект можно не отрисовывать.
   * @method v6.Camera#sees
   * @param  {number}              x          X координата объекта.
   * @param  {number}              y          Y координата объекта.
   * @param  {number}              w          Ширина объекта.
   * @param  {number}              h          Высота объекта.
   * @param  {v6.AbstractRenderer} [renderer] Рендерер.
   * @return {boolean}                        `true`, если объект должен быть отрисован.
   * @example
   * if ( camera.sees( object.x, object.y, object.w, object.h ) ) {
   *   object.show();
   * }
   */
  sees: function sees ( x, y, w, h, renderer )
  {
    var zoom = this.settings.zoom.value;
    var offset = this.settings.offset;
    var _currentPosition = this._currentPosition;
    if ( ! renderer ) {
      renderer = this.renderer;
    }
    if ( ! renderer ) {
      throw Error( 'No renderer (camera.sees)' );
    }
    return x + w > _currentPosition.x - offset.x / zoom &&
           x < _currentPosition.x + ( renderer.w - offset.x ) / zoom &&
           y + h > _currentPosition.y - offset.y / zoom &&
           y < _currentPosition.y + ( renderer.h - offset.y ) / zoom;
  },
  /**
   * Отдаляет камеру. Анимация может быть линейной (по умолчанию) если это включено:
   * ```javascript
   * camera.set( 'zoom-out speed', {
   *   // Enables linear animation (enabled by default but you can disable).
   *   linear: true
   * } );
   * ```
   * Скорость анимации изменяется через `value`:
   * ```javascript
   * camera.set( 'zoom-out speed', {
   *   // Set slow zoom-out speed (1 by default).
   *   value: 0.1
   * } );
   * ```
   * @method v6.Camera#zoomOut
   * @return {void} Ничего не возвращает.
   * @example
   * ticker.on( 'update', function ()
   * {
   *   camera.zoomOut();
   * } );
   */
  zoomOut: function zoomOut () { var zoomSpeed = this.settings[ 'zoom-out speed' ]; var zoom = this.settings.zoom; var change; if ( zoom.value !== zoom.min ) { if ( zoomSpeed.linear ) { change = zoomSpeed.value * zoom.value; } else { change = zoomSpeed.value; } zoom.value = Math.max( zoom.value - change, zoom.min ); } }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Приближает камеру. Анимация может быть линейной (по умолчанию) если это включено:
   * ```javascript
   * camera.set( 'zoom-in speed', {
   *   // Enables linear animation (enabled by default but you can disable).
   *   linear: true
   * } );
   * ```
   * Скорость анимации изменяется через `value`:
   * ```javascript
   * camera.set( 'zoom-in speed', {
   *   // Set slow zoom-in speed (1 by default).
   *   value: 0.1
   * } );
   * ```
   * @method v6.Camera#zoomIn
   * @return {void} Ничего не возвращает.
   * @example
   * ticker.on( 'update', function ()
   * {
   *   camera.zoomIn();
   * } );
   */
  zoomIn: function zoomIn () { var zoomSpeed = this.settings[ 'zoom-in speed' ]; var zoom = this.settings.zoom; var change; if ( zoom.value !== zoom.max ) { if ( zoomSpeed.linear ) { change = zoomSpeed.value * zoom.value; } else { change = zoomSpeed.value; } zoom.value = Math.min( zoom.value + change, zoom.max ); } }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  constructor: Camera
};
function transform ( camera, position, axis )
{
  return camera.settings.offset[ axis ] / camera.settings.zoom.value - position[ axis ];
}
function translate ( camera, destination, axis )
{
  var transformedDestination = transform( camera, destination, axis );
  var transformedCurrentPosition = transform( camera, camera._currentPosition, axis );
  camera._currentPosition[ axis ] += ( transformedCurrentPosition - transformedDestination ) * camera.settings.speed[ axis ];
}
function CHECK ( setting )
{
  switch ( setting ) {
    case 'zoom-out speed':
    case 'zoom-in speed':
    case 'offset':
    case 'speed':
    case 'zoom':
      return;
  }
  throw Error( 'Got unknown setting key: ' + setting );
}
module.exports = Camera;

},{"./settings":5,"peako/defaults":67}],5:[function(require,module,exports){
'use strict';

/**
 * Стандартные настройки камеры.
 * @namespace v6.settings.camera
 * @example
 * var settings = require( 'v6.js/core/camera/settings' );
 */

/**
 * Рендерер.
 * @member {v6.AbstractRenderer} v6.settings.camera.renderer
 */

/**
 * Стандартные настройки камеры.
 * @member {object} v6.settings.camera.settings
 * @property {object}    ['zoom-out speed']
 * @property {number}    ['zoom-out speed'.value=1]     Скорость уменьшения масштаба (отдаления) камеры.
 * @property {boolean}   ['zoom-out speed'.linear=true] Делать анимацию линейной.
 * @property {object}    ['zoom-in speed']
 * @property {number}    ['zoom-in speed'.value=1]      Скорость увеличения масштаба (приближения) камеры.
 * @property {boolean}   ['zoom-in speed'.linear=true]  Делать анимацию линейной.
 * @property {object}    ['zoom']
 * @property {number}    ['zoom'.value=1]               Текущий масштаб камеры.
 * @property {number}    ['zoom'.min=1]                 Минимальный масштаб камеры.
 * @property {number}    ['zoom'.max=1]                 Максимальный масштаб камеры.
 * @property {object}    ['speed']                      Скорость направления камеры на объект.
 * @property {number}    ['speed'.x=1]                  1 - моментальное перемещение по X, 0.1 - медленное.
 * @property {number}    ['speed'.y=1]                  1 - моментальное перемещение по Y, 0.1 - медленное.
 * @property {IVector2D} ['offset']
 */
exports.settings = {
  'zoom-out speed': {
    value:  1,
    linear: true
  },

  'zoom-in speed': {
    value:  1,
    linear: true
  },

  'zoom': {
    value: 1,
    min:   1,
    max:   1
  },

  'speed': {
    x: 1,
    y: 1
  }
};

},{}],6:[function(require,module,exports){
'use strict';

module.exports = HSLA;

var clamp = require( 'peako/clamp' );      // eslint-disable-line vars-on-top

var parse = require( './internal/parse' ); // eslint-disable-line vars-on-top

var RGBA  = require( './RGBA' );           // eslint-disable-line vars-on-top

/**
 * HSLA цвет.
 * @constructor v6.HSLA
 * @param {number|TColor} [h] Hue value.
 * @param {number}        [s] Saturation value.
 * @param {number}        [l] Lightness value.
 * @param {number}        [a] Alpha value.
 * @see v6.HSLA#set
 * @example
 * var HSLA = require( 'v6.js/core/color/HSLA' );
 *
 * var transparent = new HSLA( 'transparent' );
 * var magenta     = new HSLA( 'magenta' );
 * var fuchsia     = new HSLA( 300, 100, 50 );
 * var ghost       = new HSLA( 100, 0.1 );
 * var white       = new HSLA( 100 );
 * var black       = new HSLA();
 */
function HSLA ( h, s, l, a )
{
  /**
   * @member {number} v6.HSLA#0 "hue" value.
   */

  /**
   * @member {number} v6.HSLA#1 "saturation" value.
   */

  /**
   * @member {number} v6.HSLA#2 "lightness" value.
   */

  /**
   * @member {number} v6.HSLA#3 "alpha" value.
   */

  this.set( h, s, l, a );
}

HSLA.prototype = {
  /**
   * Возвращает воспринимаемую яркость (perceived brightness) цвета.
   * @method v6.HSLA#perceivedBrightness
   * @return {number}
   * @example
   * new HSLA( 'magenta' ).perceivedBrightness(); // -> 163.8759439332082
   */
  perceivedBrightness: function perceivedBrightness ()
  {
    return this.rgba().perceivedBrightness();
  },

  /**
   * Возвращает относительную яркость цвета.
   * @method v6.HSLA#luminance
   * @return {number}
   * @see https://en.wikipedia.org/wiki/Relative_luminance
   * @example
   * new HSLA( 'magenta' ).luminance(); // -> 72.624
   */
  luminance: function luminance ()
  {
    return this.rgba().luminance();
  },

  /**
   * Возвращает яркость цвета.
   * @method v6.HSLA#brightness
   * @return {number}
   * @see https://www.w3.org/TR/AERT/#color-contrast
   * @example
   * new HSLA( 'magenta' ).brightness(); // -> 105.315
   */
  brightness: function brightness ()
  {
    return this.rgba().brightness();
  },

  /**
   * Возвращает CSS-color строку.
   * @method v6.HSLA#toString
   * @return {string}
   * @example
   * '' + new HSLA( 'red' ); // -> "hsla(0, 100%, 50%, 1)"
   */
  toString: function toString ()
  {
    return 'hsla(' + this[ 0 ] + ', ' + this[ 1 ] + '\u0025, ' + this[ 2 ] + '\u0025, ' + this[ 3 ] + ')';
  },

  /**
   * Устанавливает H, S, L, A значения.
   * @method v6.HSLA#set
   * @param {number|TColor} [h] Hue value.
   * @param {number}        [s] Saturation value.
   * @param {number}        [l] Lightness value.
   * @param {number}        [a] Alpha value.
   * @chainable
   * @see v6.HSLA
   * @example
   * new HSLA().set( 100, 0.5 ); // -> 0, 0, 100, 0.5
   */
  set: function set ( h, s, l, a )
  {
    switch ( true ) {
      case typeof h === 'string':
        h = parse( h );
        // falls through
      case typeof h === 'object' && h !== null:
        if ( h.type !== this.type ) {
          h = h[ this.type ]();
        }

        this[ 0 ] = h[ 0 ];
        this[ 1 ] = h[ 1 ];
        this[ 2 ] = h[ 2 ];
        this[ 3 ] = h[ 3 ];
        break;
      default:
        switch ( void 0 ) {
          case h:
            a = 1;
            l = s = h = 0; // eslint-disable-line no-multi-assign
            break;
          case s:
            a = 1;
            l = Math.floor( h );
            s = h = 0; // eslint-disable-line no-multi-assign
            break;
          case l:
            a = s;
            l = Math.floor( h );
            s = h = 0; // eslint-disable-line no-multi-assign
            break;
          case a:
            a = 1;
            // falls through
          default:
            h = Math.floor( h );
            s = Math.floor( s );
            l = Math.floor( l );
        }

        this[ 0 ] = h;
        this[ 1 ] = s;
        this[ 2 ] = l;
        this[ 3 ] = a;
    }

    return this;
  },

  /**
   * Конвертирует в {@link v6.RGBA}.
   * @method v6.HSLA#rgba
   * @return {v6.RGBA}
   * @example
   * new HSLA( 'magenta' ).rgba(); // -> new RGBA( 255, 0, 255, 1 )
   */
  rgba: function rgba ()
  {
    var rgba = new RGBA();

    var h = this[ 0 ] % 360 / 360;
    var s = this[ 1 ] * 0.01;
    var l = this[ 2 ] * 0.01;

    var tr = h + 1 / 3;
    var tg = h;
    var tb = h - 1 / 3;

    var q;

    if ( l < 0.5 ) {
      q = l * ( 1 + s );
    } else {
      q = l + s - l * s;
    }

    var p = 2 * l - q; // eslint-disable-line vars-on-top

    if ( tr < 0 ) {
      ++tr;
    }

    if ( tg < 0 ) {
      ++tg;
    }

    if ( tb < 0 ) {
      ++tb;
    }

    if ( tr > 1 ) {
      --tr;
    }

    if ( tg > 1 ) {
      --tg;
    }

    if ( tb > 1 ) {
      --tb;
    }

    rgba[ 0 ] = foo( tr, p, q );
    rgba[ 1 ] = foo( tg, p, q );
    rgba[ 2 ] = foo( tb, p, q );
    rgba[ 3 ] = this[ 3 ];

    return rgba;
  },

  /**
   * Создает новый {@link v6.HSLA} - интерполированный между соответствующими параметрами.
   * @method v6.HSLA#lerp
   * @param  {number}  h
   * @param  {number}  s
   * @param  {number}  l
   * @param  {number}  value
   * @return {v6.HSLA}
   * @see v6.HSLA#lerpColor
   * @example
   * new HSLA( 50, 0.25 ).lerp( 0, 0, 100, 0.5 ); // -> new HSLA( 0, 0, 75, 0.25 )
   */
  lerp: function lerp ( h, s, l, value )
  {
    var color = new HSLA();
    color[ 0 ] = h;
    color[ 1 ] = s;
    color[ 2 ] = l;
    return this.lerpColor( color, value );
  },

  /**
   * Создает новый {@link v6.HSLA} - интерполированный между `color`.
   * @method v6.HSLA#lerpColor
   * @param  {TColor}  color
   * @param  {number}  value
   * @return {v6.HSLA}
   * @see v6.HSLA#lerp
   * @example
   * var a = new HSLA( 50, 0.25 );
   * var b = new HSLA( 100, 0 );
   * var c = a.lerpColor( b, 0.5 ); // -> new HSLA( 0, 0, 75, 0.25 )
   */
  lerpColor: function lerpColor ( color, value )
  {
    return this.rgba().lerpColor( color, value ).hsla();
  },

  /**
   * Создает новый {@link v6.HSLA} - затемненный или засветленный на `percentage` процентов.
   * @method v6.HSLA#shade
   * @param  {number}  percentage
   * @return {v6.HSLA}
   * @example
   * new HSLA( 0, 100, 75, 1 ).shade( -10 ); // -> new HSLA( 0, 100, 65, 1 )
   */
  shade: function shade ( percentage )
  {
    var hsla = new HSLA();
    hsla[ 0 ] = this[ 0 ];
    hsla[ 1 ] = this[ 1 ];
    hsla[ 2 ] = clamp( this[ 2 ] + percentage, 0, 100 );
    hsla[ 3 ] = this[ 3 ];
    return hsla;
  },

  constructor: HSLA
};

/**
 * @member {string} v6.HSLA#type `"hsla"`. Это свойство используется для конвертирования между {@link v6.RGBA} и {@link v6.HSLA}.
 */
HSLA.prototype.type = 'hsla';

function foo ( t, p, q )
{
  if ( t < 1 / 6 ) {
    return Math.round( ( p + ( q - p ) * 6 * t ) * 255 );
  }

  if ( t < 0.5 ) {
    return Math.round( q * 255 );
  }

  if ( t < 2 / 3 ) {
    return Math.round( ( p + ( q - p ) * ( 2 / 3 - t ) * 6 ) * 255 );
  }

  return Math.round( p * 255 );
}

},{"./RGBA":7,"./internal/parse":9,"peako/clamp":59}],7:[function(require,module,exports){
'use strict';

module.exports = RGBA;

var parse = require( './internal/parse' ); // eslint-disable-line vars-on-top

var HSLA  = require( './HSLA' );           // eslint-disable-line vars-on-top

/**
 * RGBA цвет.
 * @constructor v6.RGBA
 * @param {number|TColor} [r] Red channel value.
 * @param {number}        [g] Green channel value.
 * @param {number}        [b] Blue channel value.
 * @param {number}        [a] Alpha channel value.
 * @see v6.RGBA#set
 * @example
 * var RGBA = require( 'v6.js/core/color/RGBA' );
 *
 * var transparent = new RGBA( 'transparent' );
 * var magenta     = new RGBA( 'magenta' );
 * var fuchsia     = new RGBA( 255, 0, 255 );
 * var ghost       = new RGBA( 255, 0.1 );
 * var white       = new RGBA( 255 );
 * var black       = new RGBA();
 */
function RGBA ( r, g, b, a )
{
  /**
   * @member {number} v6.RGBA#0 "red" channel value.
   */

  /**
   * @member {number} v6.RGBA#1 "green" channel value.
   */

  /**
   * @member {number} v6.RGBA#2 "blue" channel value.
   */

  /**
   * @member {number} v6.RGBA#3 "alpha" channel value.
   */

  this.set( r, g, b, a );
}

RGBA.prototype = {
  /**
   * Возвращает воспринимаемую яркость (perceived brightness) цвета.
   * @method v6.RGBA#perceivedBrightness
   * @return {number}
   * @see https://stackoverflow.com/a/596243
   * @see http://alienryderflex.com/hsp.html
   * @example
   * new RGBA( 'magenta' ).perceivedBrightness(); // -> 163.8759439332082
   */
  perceivedBrightness: function perceivedBrightness ()
  {
    var r = this[ 0 ];
    var g = this[ 1 ];
    var b = this[ 2 ];
    return Math.sqrt( 0.299 * r * r + 0.587 * g * g + 0.114 * b * b );
  },

  /**
   * Возвращает относительную яркость цвета.
   * @method v6.RGBA#luminance
   * @return {number}
   * @see https://en.wikipedia.org/wiki/Relative_luminance
   * @example
   * new RGBA( 'magenta' ).luminance(); // -> 72.624
   */
  luminance: function luminance ()
  {
    return this[ 0 ] * 0.2126 + this[ 1 ] * 0.7152 + this[ 2 ] * 0.0722;
  },

  /**
   * Возвращает яркость цвета.
   * @method v6.RGBA#brightness
   * @return {number}
   * @see https://www.w3.org/TR/AERT/#color-contrast
   * @example
   * new RGBA( 'magenta' ).brightness(); // -> 105.315
   */
  brightness: function brightness ()
  {
    return 0.299 * this[ 0 ] + 0.587 * this[ 1 ] + 0.114 * this[ 2 ];
  },

  /**
   * Возвращает CSS-color строку.
   * @method v6.RGBA#toString
   * @return {string}
   * @example
   * '' + new RGBA( 'magenta' ); // -> "rgba(255, 0, 255, 1)"
   */
  toString: function toString ()
  {
    return 'rgba(' + this[ 0 ] + ', ' + this[ 1 ] + ', ' + this[ 2 ] + ', ' + this[ 3 ] + ')';
  },

  /**
   * Устанавливает R, G, B, A значения.
   * @method v6.RGBA#set
   * @param {number|TColor} [r] Red channel value.
   * @param {number}        [g] Green channel value.
   * @param {number}        [b] Blue channel value.
   * @param {number}        [a] Alpha channel value.
   * @chainable
   * @see v6.RGBA
   * @example
   * new RGBA()
   *   .set( 'magenta' )                    // -> 255, 0, 255, 1
   *   .set( '#ff00ffff' )                  // -> 255, 0, 255, 1
   *   .set( '#ff00ff' )                    // -> 255, 0, 255, 1
   *   .set( '#f007' )                      // -> 255, 0, 0, 0.47
   *   .set( '#f00' )                       // -> 255, 0, 0, 1
   *   .set( 'hsla( 0, 100%, 50%, 0.47 )' ) // -> 255, 0, 0, 0.47
   *   .set( 'rgb( 0, 0, 0 )' )             // -> 0, 0, 0, 1
   *   .set( 0 )                            // -> 0, 0, 0, 1
   *   .set( 0, 0, 0 )                      // -> 0, 0, 0, 1
   *   .set( 0, 0 )                         // -> 0, 0, 0, 0
   *   .set( 0, 0, 0, 0 );                  // -> 0, 0, 0, 0
   */
  set: function set ( r, g, b, a )
  {
    switch ( true ) {
      case typeof r === 'string':
        r = parse( r );
        // falls through
      case typeof r === 'object' && r !== null:
        if ( r.type !== this.type ) {
          r = r[ this.type ]();
        }

        this[ 0 ] = r[ 0 ];
        this[ 1 ] = r[ 1 ];
        this[ 2 ] = r[ 2 ];
        this[ 3 ] = r[ 3 ];
        break;
      default:
        switch ( void 0 ) {
          case r:
            a = 1;
            b = g = r = 0;               // eslint-disable-line no-multi-assign
            break;
          case g:
            a = 1;
            b = g = r = Math.floor( r ); // eslint-disable-line no-multi-assign
            break;
          case b:
            a = g;
            b = g = r = Math.floor( r ); // eslint-disable-line no-multi-assign
            break;
          case a:
            a = 1;
            // falls through
          default:
            r = Math.floor( r );
            g = Math.floor( g );
            b = Math.floor( b );
        }

        this[ 0 ] = r;
        this[ 1 ] = g;
        this[ 2 ] = b;
        this[ 3 ] = a;
    }

    return this;
  },

  /**
   * Конвертирует в {@link v6.HSLA}.
   * @method v6.RGBA#hsla
   * @return {v6.HSLA}
   * @example
   * new RGBA( 255, 0, 0, 1 ).hsla(); // -> new HSLA( 0, 100, 50, 1 )
   */
  hsla: function hsla ()
  {
    var hsla = new HSLA();

    var r = this[ 0 ] / 255;
    var g = this[ 1 ] / 255;
    var b = this[ 2 ] / 255;

    var max = Math.max( r, g, b );
    var min = Math.min( r, g, b );

    var l = ( max + min ) * 50;
    var h, s;

    var diff = max - min;

    if ( diff ) {
      if ( l > 50 ) {
        s = diff / ( 2 - max - min );
      } else {
        s = diff / ( max + min );
      }

      switch ( max ) {
        case r:
          if ( g < b ) {
            h = 1.0472 * ( g - b ) / diff + 6.2832;
          } else {
            h = 1.0472 * ( g - b ) / diff;
          }

          break;
        case g:
          h = 1.0472 * ( b - r ) / diff + 2.0944;
          break;
        default:
          h = 1.0472 * ( r - g ) / diff + 4.1888;
      }

      h = Math.round( h * 360 / 6.2832 );
      s = Math.round( s * 100 );
    } else {
      h = s = 0; // eslint-disable-line no-multi-assign
    }

    hsla[ 0 ] = h;
    hsla[ 1 ] = s;
    hsla[ 2 ] = Math.round( l );
    hsla[ 3 ] = this[ 3 ];

    return hsla;
  },

  /**
   * @private
   * @method v6.RGBA#rgba
   * @see v6.RendererGL#vertices
   * @chainable
   */
  rgba: function rgba ()
  {
    return this;
  },

  /**
   * Создает новый {@link v6.RGBA} - интерполированный между соответствующими параметрами.
   * @method v6.RGBA#lerp
   * @param  {number}  r
   * @param  {number}  g
   * @param  {number}  b
   * @param  {number}  value
   * @return {v6.RGBA}
   * @see v6.RGBA#lerpColor
   * @example
   * new RGBA( 100, 0.25 ).lerp( 200, 200, 200, 0.5 ); // -> new RGBA( 150, 150, 150, 0.25 )
   */
  lerp: function lerp ( r, g, b, value )
  {
    r = this[ 0 ] + ( r - this[ 0 ] ) * value;
    g = this[ 1 ] + ( g - this[ 1 ] ) * value;
    b = this[ 2 ] + ( b - this[ 2 ] ) * value;
    return new RGBA( r, g, b, this[ 3 ] );
  },

  /**
   * Создает новый {@link v6.RGBA} - интерполированный между `color`.
   * @method v6.RGBA#lerpColor
   * @param  {TColor}  color
   * @param  {number}  value
   * @return {v6.RGBA}
   * @see v6.RGBA#lerp
   * @example
   * var a = new RGBA( 100, 0.25 );
   * var b = new RGBA( 200, 0 );
   * var c = a.lerpColor( b, 0.5 ); // -> new RGBA( 150, 150, 150, 0.25 )
   */
  lerpColor: function lerpColor ( color, value )
  {
    var r, g, b;

    if ( typeof color !== 'object' ) {
      color = parse( color );
    }

    if ( color.type !== 'rgba' ) {
      color = color.rgba();
    }

    r = color[ 0 ];
    g = color[ 1 ];
    b = color[ 2 ];

    return this.lerp( r, g, b, value );
  },

  /**
   * Создает новый {@link v6.RGBA} - затемненный или засветленный на `percentages` процентов.
   * @method v6.RGBA#shade
   * @param  {number}  percentage
   * @return {v6.RGBA}
   * @see v6.HSLA#shade
   * @example
   * new RGBA().shade( 50 ); // -> new RGBA( 128 )
   */
  shade: function shade ( percentages )
  {
    return this.hsla().shade( percentages ).rgba();
  },

  constructor: RGBA
};

/**
 * @member {string} v6.RGBA#type `"rgba"`. Это свойство используется для конвертирования между {@link v6.HSLA} и {@link v6.RGBA}.
 */
RGBA.prototype.type = 'rgba';

},{"./HSLA":6,"./internal/parse":9}],8:[function(require,module,exports){
'use strict';

/* eslint key-spacing: [ "error", { "align": { "beforeColon": false, "afterColon": true, "on": "value" } } ] */

var colors = {
  aliceblue:            'f0f8ffff', antiquewhite:         'faebd7ff',
  aqua:                 '00ffffff', aquamarine:           '7fffd4ff',
  azure:                'f0ffffff', beige:                'f5f5dcff',
  bisque:               'ffe4c4ff', black:                '000000ff',
  blanchedalmond:       'ffebcdff', blue:                 '0000ffff',
  blueviolet:           '8a2be2ff', brown:                'a52a2aff',
  burlywood:            'deb887ff', cadetblue:            '5f9ea0ff',
  chartreuse:           '7fff00ff', chocolate:            'd2691eff',
  coral:                'ff7f50ff', cornflowerblue:       '6495edff',
  cornsilk:             'fff8dcff', crimson:              'dc143cff',
  cyan:                 '00ffffff', darkblue:             '00008bff',
  darkcyan:             '008b8bff', darkgoldenrod:        'b8860bff',
  darkgray:             'a9a9a9ff', darkgreen:            '006400ff',
  darkkhaki:            'bdb76bff', darkmagenta:          '8b008bff',
  darkolivegreen:       '556b2fff', darkorange:           'ff8c00ff',
  darkorchid:           '9932ccff', darkred:              '8b0000ff',
  darksalmon:           'e9967aff', darkseagreen:         '8fbc8fff',
  darkslateblue:        '483d8bff', darkslategray:        '2f4f4fff',
  darkturquoise:        '00ced1ff', darkviolet:           '9400d3ff',
  deeppink:             'ff1493ff', deepskyblue:          '00bfffff',
  dimgray:              '696969ff', dodgerblue:           '1e90ffff',
  feldspar:             'd19275ff', firebrick:            'b22222ff',
  floralwhite:          'fffaf0ff', forestgreen:          '228b22ff',
  fuchsia:              'ff00ffff', gainsboro:            'dcdcdcff',
  ghostwhite:           'f8f8ffff', gold:                 'ffd700ff',
  goldenrod:            'daa520ff', gray:                 '808080ff',
  green:                '008000ff', greenyellow:          'adff2fff',
  honeydew:             'f0fff0ff', hotpink:              'ff69b4ff',
  indianred:            'cd5c5cff', indigo:               '4b0082ff',
  ivory:                'fffff0ff', khaki:                'f0e68cff',
  lavender:             'e6e6faff', lavenderblush:        'fff0f5ff',
  lawngreen:            '7cfc00ff', lemonchiffon:         'fffacdff',
  lightblue:            'add8e6ff', lightcoral:           'f08080ff',
  lightcyan:            'e0ffffff', lightgoldenrodyellow: 'fafad2ff',
  lightgrey:            'd3d3d3ff', lightgreen:           '90ee90ff',
  lightpink:            'ffb6c1ff', lightsalmon:          'ffa07aff',
  lightseagreen:        '20b2aaff', lightskyblue:         '87cefaff',
  lightslateblue:       '8470ffff', lightslategray:       '778899ff',
  lightsteelblue:       'b0c4deff', lightyellow:          'ffffe0ff',
  lime:                 '00ff00ff', limegreen:            '32cd32ff',
  linen:                'faf0e6ff', magenta:              'ff00ffff',
  maroon:               '800000ff', mediumaquamarine:     '66cdaaff',
  mediumblue:           '0000cdff', mediumorchid:         'ba55d3ff',
  mediumpurple:         '9370d8ff', mediumseagreen:       '3cb371ff',
  mediumslateblue:      '7b68eeff', mediumspringgreen:    '00fa9aff',
  mediumturquoise:      '48d1ccff', mediumvioletred:      'c71585ff',
  midnightblue:         '191970ff', mintcream:            'f5fffaff',
  mistyrose:            'ffe4e1ff', moccasin:             'ffe4b5ff',
  navajowhite:          'ffdeadff', navy:                 '000080ff',
  oldlace:              'fdf5e6ff', olive:                '808000ff',
  olivedrab:            '6b8e23ff', orange:               'ffa500ff',
  orangered:            'ff4500ff', orchid:               'da70d6ff',
  palegoldenrod:        'eee8aaff', palegreen:            '98fb98ff',
  paleturquoise:        'afeeeeff', palevioletred:        'd87093ff',
  papayawhip:           'ffefd5ff', peachpuff:            'ffdab9ff',
  peru:                 'cd853fff', pink:                 'ffc0cbff',
  plum:                 'dda0ddff', powderblue:           'b0e0e6ff',
  purple:               '800080ff', red:                  'ff0000ff',
  rosybrown:            'bc8f8fff', royalblue:            '4169e1ff',
  saddlebrown:          '8b4513ff', salmon:               'fa8072ff',
  sandybrown:           'f4a460ff', seagreen:             '2e8b57ff',
  seashell:             'fff5eeff', sienna:               'a0522dff',
  silver:               'c0c0c0ff', skyblue:              '87ceebff',
  slateblue:            '6a5acdff', slategray:            '708090ff',
  snow:                 'fffafaff', springgreen:          '00ff7fff',
  steelblue:            '4682b4ff', tan:                  'd2b48cff',
  teal:                 '008080ff', thistle:              'd8bfd8ff',
  tomato:               'ff6347ff', turquoise:            '40e0d0ff',
  violet:               'ee82eeff', violetred:            'd02090ff',
  wheat:                'f5deb3ff', white:                'ffffffff',
  whitesmoke:           'f5f5f5ff', yellow:               'ffff00ff',
  yellowgreen:          '9acd32ff', transparent:          '00000000'
};

module.exports = colors;

},{}],9:[function(require,module,exports){
'use strict';

module.exports = parse;

var RGBA   = require( '../RGBA' );
var HSLA   = require( '../HSLA' );
var colors = require( './colors' );

var parsed = Object.create( null );

var TRANSPARENT = [
  0, 0, 0, 0
];

var regexps = {
  hex3: /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/,
  hex:  /^#([0-9a-f]{6})([0-9a-f]{2})?$/,
  rgb:  /^rgb\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$|^\s*rgba\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$/,
  hsl:  /^hsl\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\u0025\s*\)$|^\s*hsla\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\s*\)$/
};

/**
 * @private
 * @method parse
 * @param  {string}                                  string
 * @return {module:"v6.js".RGBA|module:"v6.js".HSLA}
 * @example
 * parse( '#f0f0' );                     // -> new RGBA( 255, 0, 255, 0 )
 * parse( '#000000ff' );                 // -> new RGBA( 0, 0, 0, 1 )
 * parse( 'magenta' );                   // -> new RGBA( 255, 0, 255, 1 )
 * parse( 'transparent' );               // -> new RGBA( 0, 0, 0, 0 )
 * parse( 'hsl( 0, 100%, 50% )' );       // -> new HSLA( 0, 100, 50, 1 )
 * parse( 'hsla( 0, 100%, 50%, 0.5 )' ); // -> new HSLA( 0, 100, 50, 0.5 )
 */
function parse ( string )
{
  var cache = parsed[ string ] || parsed[ string = string.trim().toLowerCase() ];

  if ( ! cache ) {
    if ( ( cache = colors[ string ] ) ) {
      cache = new ColorData( parseHex( cache ), RGBA );
    } else if ( ( cache = regexps.hex.exec( string ) ) || ( cache = regexps.hex3.exec( string ) ) ) {
      cache = new ColorData( parseHex( formatHex( cache ) ), RGBA );
    } else if ( ( cache = regexps.rgb.exec( string ) ) ) {
      cache = new ColorData( compactMatch( cache ), RGBA );
    } else if ( ( cache = regexps.hsl.exec( string ) ) ) {
      cache = new ColorData( compactMatch( cache ), HSLA );
    } else {
      throw SyntaxError( string + ' is not a valid syntax' );
    }

    parsed[ string ] = cache;
  }

  return new cache.color( cache[ 0 ], cache[ 1 ], cache[ 2 ], cache[ 3 ] );
}

/**
 * @private
 * @method formatHex
 * @param  {array<string?>} match
 * @return {string}
 * @example
 * formatHex( [ '#000000ff', '000000', 'ff' ] ); // -> '000000ff'
 * formatHex( [ '#0007', '0', '0', '0', '7' ] ); // -> '00000077'
 * formatHex( [ '#000', '0', '0', '0', null ] ); // -> '000000ff'
 */
function formatHex ( match )
{
  var r, g, b, a;

  if ( match.length === 3 ) {
    return match[ 1 ] + ( match[ 2 ] || 'ff' );
  }

  r = match[ 1 ];
  g = match[ 2 ];
  b = match[ 3 ];
  a = match[ 4 ] || 'f';

  return r + r + g + g + b + b + a + a;
}

/**
 * @private
 * @method parseHex
 * @param  {string}        hex
 * @return {array<number>}
 * @example
 * parseHex( '00000000' ); // -> [ 0, 0, 0, 0 ]
 * parseHex( 'ff00ffff' ); // -> [ 255, 0, 255, 1 ]
 */
function parseHex ( hex )
{
  if ( hex == 0 ) { // eslint-disable-line eqeqeq
    return TRANSPARENT;
  }

  hex = parseInt( hex, 16 );

  return [
    // R
    hex >> 24 & 255,    // eslint-disable-line no-bitwise
    // G
    hex >> 16 & 255,    // eslint-disable-line no-bitwise
    // B
    hex >> 8  & 255,    // eslint-disable-line no-bitwise
    // A
    ( hex & 255 ) / 255 // eslint-disable-line no-bitwise
  ];
}

/**
 * @private
 * @method compactMatch
 * @param  {array<string?>} match
 * @return {array<number>}
 */
function compactMatch ( match )
{
  if ( match[ 7 ] ) {
    return [
      Number( match[ 4 ] ),
      Number( match[ 5 ] ),
      Number( match[ 6 ] ),
      Number( match[ 7 ] )
    ];
  }

  return [
    Number( match[ 1 ] ),
    Number( match[ 2 ] ),
    Number( match[ 3 ] )
  ];
}

/**
 * @private
 * @constructor ColorData
 * @param {array<number>} match
 * @param {function}      color
 */
function ColorData ( match, color )
{
  this[ 0 ] = match[ 0 ];
  this[ 1 ] = match[ 1 ];
  this[ 2 ] = match[ 2 ];
  this[ 3 ] = match[ 3 ];
  this.color = color;
}

},{"../HSLA":6,"../RGBA":7,"./colors":8}],10:[function(require,module,exports){
'use strict';

/**
 * Константы.
 * @namespace {object} v6.constants
 * @example
 * var constants = require( 'v6.js/core/constants' );
 */

var _constants = {};
var _counter   = 0;

/**
 * Добавляет константу.
 * @method v6.constants.add
 * @param  {string} key Имя константы.
 * @return {void}       Ничего не возвращает.
 * @example
 * constants.add( 'CUSTOM_CONSTANT' );
 */
function add ( key )
{
  if ( typeof _constants[ key ] !== 'undefined' ) {
    throw Error( 'Cannot re-set (add) existing constant: ' + key );
  }

  _constants[ key ] = ++_counter;
}

/**
 * Возвращает константу.
 * @method v6.constants.get
 * @param  {string}   key Имя константы.
 * @return {constant}     Возвращает константу.
 * @example
 * constants.get( 'CUSTOM_CONSTANT' );
 */
function get ( key )
{
  if ( typeof _constants[ key ] === 'undefined' ) {
    throw ReferenceError( 'Cannot get unknown constant: ' + key );
  }

  return _constants[ key ];
}

[
  'AUTO',
  'GL',
  '2D',
  'LEFT',
  'TOP',
  'CENTER',
  'MIDDLE',
  'RIGHT',
  'BOTTOM',
  'PERCENT'
].forEach( add );

exports.add = add;
exports.get = get;

},{}],11:[function(require,module,exports){
'use strict';

var LightEmitter = require( 'light_emitter' );

/**
 * @abstract
 * @constructor v6.AbstractImage
 * @extends LightEmitter
 * @see v6.CompoundedImage
 * @see v6.Image
 */
function AbstractImage ()
{
  /**
   * @member {number} v6.Image#sx "Source X".
   */

  /**
   * @member {number} v6.Image#sy "Source Y".
   */

  /**
   * @member {number} v6.Image#sw "Source Width".
   */

  /**
   * @member {number} v6.Image#sh "Source Height".
   */

  /**
   * @member {number} v6.Image#dw "Destination Width".
   */

  /**
   * @member {number} v6.Image#dh "Destination Height".
   */

  throw Error( 'Cannot create an instance of the abstract class (new v6.AbstractImage)' );
}

AbstractImage.prototype = Object.create( LightEmitter.prototype );
AbstractImage.prototype.constructor = AbstractImage;

/**
 * @virtual
 * @method v6.AbstractImage#get
 * @return {v6.Image}
 */

module.exports = AbstractImage;

},{"light_emitter":43}],12:[function(require,module,exports){
'use strict';

var AbstractImage = require( './AbstractImage' );

/**
 * @constructor v6.CompoundedImage
 * @extends v6.AbstractImage
 * @param {v6.AbstractImage} image
 * @param {nubmer}           sx
 * @param {nubmer}           sy
 * @param {nubmer}           sw
 * @param {nubmer}           sh
 * @param {nubmer}           dw
 * @param {nubmer}           dh
 */
function CompoundedImage ( image, sx, sy, sw, sh, dw, dh )
{
  this.image = image;
  this.sx    = sx;
  this.sy    = sy;
  this.sw    = sw;
  this.sh    = sh;
  this.dw    = dw;
  this.dh    = dh;
}

CompoundedImage.prototype = Object.create( AbstractImage.prototype );
CompoundedImage.prototype.constructor = CompoundedImage;

/**
 * @override
 * @method v6.CompoundedImage#get
 */
CompoundedImage.prototype.get = function get ()
{
  return this.image.get();
};

module.exports = CompoundedImage;

},{"./AbstractImage":11}],13:[function(require,module,exports){
'use strict';

var CompoundedImage = require( './CompoundedImage' );
var AbstractImage   = require( './AbstractImage' );

/**
 * Класс картинки.
 * @constructor v6.Image
 * @extends v6.AbstractImage
 * @param {HTMLImageElement} image DOM элемент картинки (IMG).
 * @fires complete
 * @see v6.Image.fromURL
 * @see v6.AbstractRenderer#backgroundImage
 * @see v6.AbstractRenderer#image
 * @example
 * var Image = require( 'v6.js/core/image/Image' );
 * @example <caption>Creating an image with an DOM image</caption>
 * // HTML: <img src="image.png" id="image" />
 * var image = new Image( document.getElementById( 'image' ) );
 * @example <caption>Creating an image with a URL</caption>
 * var image = Image.fromURL( 'image.png' );
 * @example <caption>Fires "complete" event</caption>
 * image.once( 'complete', function ()
 * {
 *   console.log( 'The image is loaded!' );
 * } );
 */
function Image ( image )
{
  var self = this;

  if ( ! image.src ) {
    throw Error( 'Cannot create v6.Image from HTMLImageElement with no "src" attribute (new v6.Image)' );
  }

  /**
   * @member {HTMLImageElement} v6.Image#image DOM эелемент картинки.
   */
  this.image = image;

  if ( this.image.complete ) {
    this._init();
  } else {
    this.image.addEventListener( 'load', function onload ()
    {
      self.image.removeEventListener( 'load', onload );
      self._init();
    }, false );
  }
}

Image.prototype = Object.create( AbstractImage.prototype );
Image.prototype.constructor = Image;

/**
 * Инициализирует картинку после ее загрузки.
 * @private
 * @method v6.Image#_init
 * @return {void} Ничего не возвращает.
 */
Image.prototype._init = function _init ()
{
  this.sx = 0;
  this.sy = 0;
  this.sw = this.dw = this.image.width;  // eslint-disable-line no-multi-assign
  this.sh = this.dh = this.image.height; // eslint-disable-line no-multi-assign
  this.emit( 'complete' );
};

/**
 * @override
 * @method v6.Image#get
 */
Image.prototype.get = function get ()
{
  return this;
};

/**
 * Определяет, загружена ли картинка.
 * @method v6.Image#complete
 * @return {boolean} `true`, если загружена.
 * @example
 * var image = Image.fromURL( 'image.png' );
 *
 * if ( ! image.complete() ) {
 *   image.once( 'complete', function ()
 *   {
 *     console.log( 'The image is loaded!', image.complete() );
 *   } );
 * }
 */
Image.prototype.complete = function complete ()
{
  return Boolean( this.image.src ) && this.image.complete;
};

/**
 * Возвращает URL картинки.
 * @method v6.Image#src
 * @return {string} URL картинки.
 * @example
 * Image.fromURL( 'image.png' ).src(); // -> "image.png"
 */
Image.prototype.src = function src ()
{
  return this.image.src;
};

/**
 * Создает новую {@link v6.Image} из URL.
 * @method v6.Image.fromURL
 * @param  {string}   src URL картинки.
 * @return {v6.Image}     Новая {@link v6.Image}.
 * @example
 * var image = Image.fromURL( 'image.png' );
 */
Image.fromURL = function fromURL ( src )
{
  var image = document.createElement( 'img' );
  image.src = src;
  return new Image( image );
};

/**
 * Пропорционально растягивает или сжимает картинку.
 * @method v6.Image.stretch
 * @param  {v6.AbstractImage}   image Картинка.
 * @param  {number}             dw    Новый "Destination Width".
 * @param  {number}             dh    Новый "Destination Height".
 * @return {v6.CompoundedImage}       Новая картинка.
 * @example
 * Image.stretch( image, 600, 400 );
 */
Image.stretch = function stretch ( image, dw, dh )
{
  var value = dh / image.dh * image.dw;

  // Stretch DW.
  if ( value < dw ) {
    dh = dw / image.dw * image.dh;

  // Stretch DH.
  } else {
    dw = value;
  }

  return new CompoundedImage( image.get(), image.sx, image.sy, image.sw, image.sh, dw, dh );
};

/**
 * Обрезает картинку.
 * @method v6.Image.cut
 * @param  {v6.AbstractImage}   image Картинка, которую надо обрезать.
 * @param  {number}             sx    X координата, откуда надо обрезать.
 * @param  {number}             sy    Y координата, откуда надо обрезать.
 * @param  {number}             sw    Новая ширина.
 * @param  {number}             sh    Новая высота.
 * @return {v6.CompoundedImage}       Обрезанная картинка.
 * @example
 * Image.cut( image, 10, 20, 30, 40 );
 */
Image.cut = function cut ( image, sx, sy, dw, dh )
{
  var sw = image.sw / image.dw * dw;
  var sh = image.sh / image.dh * dh;

  sx += image.sx;

  if ( sx + sw > image.sx + image.sw ) {
    throw Error( 'Cannot cut the image because the new image X or W is out of bounds (v6.Image.cut)' );
  }

  sy += image.sy;

  if ( sy + sh > image.sy + image.sh ) {
    throw Error( 'Cannot cut the image because the new image Y or H is out of bounds (v6.Image.cut)' );
  }

  return new CompoundedImage( image.get(), sx, sy, sw, sh, dw, dh );
};

module.exports = Image;

},{"./AbstractImage":11,"./CompoundedImage":12}],14:[function(require,module,exports){
'use strict';

if ( typeof Float32Array === 'function' ) {
  module.exports = Float32Array; // eslint-disable-line no-undef
} else {
  module.exports = Array;
}

},{}],15:[function(require,module,exports){
'use strict';

/**
 * @private
 * @method createArray
 * @param  {Array.<any>}                    array
 * @return {Array.<any>|Float32Array.<any>}
 */

if ( typeof Float32Array === 'function' ) {
  module.exports = function createArray ( array )
  {
    return new Float32Array( array ); // eslint-disable-line no-undef
  };
} else {
  module.exports = function createArray ( array )
  {
    return array;
  };
}

},{}],16:[function(require,module,exports){
'use strict';

var _Float32Array = require( './_Float32Array' );

/**
 * Создает массив с координатами всех точек нужного полигона.
 * @private
 * @method createPolygon
 * @param  {number}       sides Количество сторон полигона.
 * @return {Float32Array}       Возвращает массив (Float32Array) который выглядит так: `[ x1, y1, x2, y2 ]`.
 *                              Все значения которого нормализованны.
 */
function createPolygon ( sides )
{
  var i        = Math.floor( sides );
  var step     = Math.PI * 2 / sides;
  var vertices = new _Float32Array( i * 2 + 2 );

  for ( ; i >= 0; --i ) {
    vertices[     i * 2 ] = Math.cos( step * i );
    vertices[ 1 + i * 2 ] = Math.sin( step * i );
  }

  return vertices;
}

module.exports = createPolygon;

},{"./_Float32Array":14}],17:[function(require,module,exports){
'use strict';

/**
 * Создает и инициализирует новую WebGL программу.
 * @private
 * @method createProgram
 * @param  {WebGLShader}           vert Вершинный шейдер (созданный с помощью `{@link createShader}`).
 * @param  {WebGLShader}           frag Фрагментный шейдер (созданный с помощью `{@link createShader}`).
 * @param  {WebGLRenderingContext} gl   WebGL контекст.
 * @return {WebGLProgram}
 */
function createProgram ( vert, frag, gl )
{
  var program = gl.createProgram();

  gl.attachShader( program, vert );
  gl.attachShader( program, frag );
  gl.linkProgram( program );

  if ( ! gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
    throw Error( 'Unable to initialize the shader program: ' + gl.getProgramInfoLog( program ) );
  }

  gl.validateProgram( program );

  if ( ! gl.getProgramParameter( program, gl.VALIDATE_STATUS ) ) {
    throw Error( 'Unable to validate the shader program: ' + gl.getProgramInfoLog( program ) );
  }

  return program;
}

module.exports = createProgram;

},{}],18:[function(require,module,exports){
'use strict';

/**
 * Создает и инициализирует новый WebGL шейдер.
 * @private
 * @method createShader
 * @param  {string}                source Исходный код шейдера.
 * @param  {constant}              type   Тип шейдера: VERTEX_SHADER или FRAGMENT_SHADER.
 * @param  {WebGLRenderingContext} gl     WebGL контекст.
 * @return {WebGLShader}
 */
function createShader ( source, type, gl )
{
  var shader = gl.createShader( type );

  gl.shaderSource( shader, source );
  gl.compileShader( shader );

  if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
    throw SyntaxError( 'An error occurred compiling the shaders: ' + gl.getShaderInfoLog( shader ) );
  }

  return shader;
}

module.exports = createShader;

},{}],19:[function(require,module,exports){
'use strict';

/**
 * @private
 * @member {object} polygons
 */

},{}],20:[function(require,module,exports){
'use strict';

var noop = require( 'peako/noop' );

var report, reported;

if ( typeof console !== 'undefined' && console.warn ) { // eslint-disable-line no-console
  reported = {};

  report = function report ( message )
  {
    if ( reported[ message ] ) {
      return;
    }

    console.warn( message ); // eslint-disable-line no-console
    reported[ message ] = true;
  };
} else {
  report = noop;
}

module.exports = report;

},{"peako/noop":89}],21:[function(require,module,exports){
'use strict';

var settings = require( '../settings' );

/**
 * Абстрактный класс вектора с базовыми методами.
 *
 * Чтобы использовать грудусы вместо радианов надо написать следующее:
 * ```javascript
 * var settings = require( 'v6.js/core/settings' );
 * settings.degrees = true;
 * ```
 * @abstract
 * @constructor v6.AbstractVector
 * @see v6.Vector2D
 * @see v6.Vector3D
 */
function AbstractVector ()
{
  throw Error( 'Cannot create an instance of the abstract class (new v6.AbstractVector)' );
}

AbstractVector.prototype = {
  /**
   * Нормализует вектор.
   * @method v6.AbstractVector#normalize
   * @chainable
   * @example
   * new Vector2D( 4, 2 ).normalize(); // Vector2D { x: 0.8944271909999159, y: 0.4472135954999579 }
   */
  normalize: function normalize ()
  {
    var mag = this.mag();

    if ( mag && mag !== 1 ) {
      this.div( mag );
    }

    return this;
  },

  /**
   * Изменяет направление вектора на `"angle"` с сохранением длины.
   * @method v6.AbstractVector#setAngle
   * @param {number} angle Новое направление.
   * @chainable
   * @example
   * new Vector2D( 4, 2 ).setAngle( 45 * Math.PI / 180 ); // Vector2D { x: 3.1622776601683795, y: 3.162277660168379 }
   * @example <caption>Используя грудусы</caption>
   * new Vector2D( 4, 2 ).setAngle( 45 ); // Vector2D { x: 3.1622776601683795, y: 3.162277660168379 }
   */
  setAngle: function setAngle ( angle )
  {
    var mag = this.mag();

    if ( settings.degrees ) {
      angle *= Math.PI / 180;
    }

    this.x = mag * Math.cos( angle );
    this.y = mag * Math.sin( angle );

    return this;
  },

  /**
   * Изменяет длину вектора на `"value"` с сохранением направления.
   * @method v6.AbstractVector#setMag
   * @param {number} value Новая длина.
   * @chainable
   * @example
   * new Vector2D( 4, 2 ).setMag( 42 ); // Vector2D { x: 37.56594202199646, y: 18.78297101099823 }
   */
  setMag: function setMag ( value )
  {
    return this.normalize().mul( value );
  },

  /**
   * Поворачивает вектор на `"angle"` угол с сохранением длины.
   * @method v6.AbstractVector#rotate
   * @param {number} angle
   * @chainable
   * @example
   * new Vector2D( 4, 2 ).rotate( 5 * Math.PI / 180 ); // Vector2D { x: 3.810467306871666, y: 2.3410123671741236 }
   * @example <caption>Используя грудусы</caption>
   * new Vector2D( 4, 2 ).rotate( 5 ); // Vector2D { x: 3.810467306871666, y: 2.3410123671741236 }
   */
  rotate: function rotate ( angle )
  {
    var x = this.x;
    var y = this.y;

    var c, s;

    if ( settings.degrees ) {
      angle *= Math.PI / 180;
    }

    c = Math.cos( angle );
    s = Math.sin( angle );

    this.x = ( x * c ) - ( y * s );
    this.y = ( x * s ) + ( y * c );

    return this;
  },

  /**
   * Возвращает текущее направление вектора.
   * @method v6.AbstractVector#getAngle
   * @return {number} Направление (угол) в градусах или радианах.
   * @example
   * new Vector2D( 1, 1 ).getAngle(); // -> 0.7853981633974483
   * @example <caption>Используя грудусы</caption>
   * new Vector2D( 1, 1 ).getAngle(); // -> 45
   */
  getAngle: function getAngle ()
  {
    if ( settings.degrees ) {
      return Math.atan2( this.y, this.x ) * 180 / Math.PI;
    }

    return Math.atan2( this.y, this.x );
  },

  /**
   * Ограничивает длину вектора до `"value"`.
   * @method v6.AbstractVector#limit
   * @param {number} value Максимальная длина вектора.
   * @chainable
   * @example
   * new Vector2D( 1, 1 ).limit( 1 ); // Vector2D { x: 0.7071067811865475, y: 0.7071067811865475 }
   */
  limit: function limit ( value )
  {
    var mag = this.magSq();

    if ( mag > value * value ) {
      this.div( Math.sqrt( mag ) ).mul( value );
    }

    return this;
  },

  /**
   * Возвращает длину вектора.
   * @method v6.AbstractVector#mag
   * @return {number} Длина вектора.
   * @example
   * new Vector2D( 2, 2 ).mag(); // -> 2.8284271247461903
   */
  mag: function mag ()
  {
    return Math.sqrt( this.magSq() );
  },

  /**
   * Возвращает длину вектора в квадрате.
   * @virtual
   * @method v6.AbstractVector#magSq
   * @return {number} Длина вектора в квадрате.
   * @example
   * new Vector2D( 2, 2 ).magSq(); // -> 8
   */

  /**
   * Создает клон вектора.
   * @virtual
   * @method v6.AbstractVector#clone
   * @return {v6.AbstractVector} Клон вектора.
   * @example
   * new Vector2D( 4, 2 ).clone();
   */

  /**
   * Возвращает строковое представление вектора (prettified).
   * @virtual
   * @method v6.AbstractVector#toString
   * @return {string}
   * @example
   * new Vector2D( 4.321, 2.345 ).toString(); // -> "v6.Vector2D { x: 4.32, y: 2.35 }"
   */

  /**
   * Возвращает дистанцию между двумя векторами.
   * @virtual
   * @method v6.AbstractVector#dist
   * @param  {v6.AbstractVector} vector Другой (второй) вектор.
   * @return {number}
   * @example
   * new Vector2D( 3, 3 ).dist( new Vector2D( 1, 1 ) ); // -> 2.8284271247461903
   */

  constructor: AbstractVector
};

/**
 * @private
 * @method v6.AbstractVector._fromAngle
 * @param  {v6.AbstractVector} Vector {@link v6.Vector2D}, {@link v6.Vector3D}.
 * @param  {number}            angle
 * @return {v6.AbstractVector}
 * @see v6.AbstractVector.fromAngle
 */
AbstractVector._fromAngle = function _fromAngle ( Vector, angle )
{
  if ( settings.degrees ) {
    angle *= Math.PI / 180;
  }

  return new Vector( Math.cos( angle ), Math.sin( angle ) );
};

/**
 * Создает рандомный вектор.
 * @virtual
 * @static
 * @method v6.AbstractVector.random
 * @return {v6.AbstractVector} Возвращает нормализованный вектор с рандомным направлением.
 */

/**
 * Создает вектор с направлением равным `"angle"`.
 * @virtual
 * @static
 * @method v6.AbstractVector.fromAngle
 * @param  {number}            angle Направление вектора.
 * @return {v6.AbstractVector}       Возвращает нормализованный вектор.
 */

module.exports = AbstractVector;

},{"../settings":40}],22:[function(require,module,exports){
'use strict';

var settings       = require( '../settings' );
var AbstractVector = require( './AbstractVector' );

/**
 * 2D вектор.
 * @constructor v6.Vector2D
 * @extends v6.AbstractVector
 * @param {number} [x=0] X координата вектора.
 * @param {number} [y=0] Y координата вектора.
 * @example
 * var Vector2D = require( 'v6.js/math/Vector2D' );
 * var position = new Vector2D( 4, 2 ); // Vector2D { x: 4, y: 2 }
 */
function Vector2D ( x, y )
{
  /**
   * X координата вектора.
   * @member {number} v6.Vector2D#x
   * @example
   * var x = new Vector2D( 4, 2 ).x; // -> 4
   */

  /**
   * Y координата вектора.
   * @member {number} v6.Vector2D#y
   * @example
   * var y = new Vector2D( 4, 2 ).y; // -> 2
   */

  this.set( x, y );
}

Vector2D.prototype = Object.create( AbstractVector.prototype );
Vector2D.prototype.constructor = Vector2D;

/**
 * Устанавливает X и Y координаты.
 * @method v6.Vector2D#set
 * @param {number} [x=0] Новая X координата.
 * @param {number} [y=0] Новая Y координата.
 * @chainable
 * @example
 * new Vector2D().set( 4, 2 ); // Vector2D { x: 4, y: 2 }
 */
Vector2D.prototype.set = function set ( x, y )
{
  this.x = x || 0;
  this.y = y || 0;
  return this;
};

/**
 * Добавляет к координатам X и Y соответствующие параметры.
 * @method v6.Vector2D#add
 * @param {number} [x=0] Число, которое должно быть добавлено.
 * @param {number} [y=0] Число, которое должно быть добавлено.
 * @chainable
 * @example
 * new Vector2D().add( 4, 2 ); // Vector2D { x: 4, y: 2 }
 */
Vector2D.prototype.add = function add ( x, y )
{
  this.x += x || 0;
  this.y += y || 0;
  return this;
};

/**
 * Вычитает из координат X и Y соответствующие параметры.
 * @method v6.Vector2D#sub
 * @param {number} [x=0] Число, которое должно быть вычтено.
 * @param {number} [y=0] Число, которое должно быть вычтено.
 * @chainable
 * @example
 * new Vector2D().sub( 4, 2 ); // Vector2D { x: -4, y: -2 }
 */
Vector2D.prototype.sub = function sub ( x, y )
{
  this.x -= x || 0;
  this.y -= y || 0;
  return this;
};

/**
 * Умножает X и Y координаты на `value`.
 * @method v6.Vector2D#mul
 * @param {number} value Число, на которое надо умножить.
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).mul( 2 ); // Vector2D { x: 8, y: 4 }
 */
Vector2D.prototype.mul = function mul ( value )
{
  this.x *= value;
  this.y *= value;
  return this;
};

/**
 * Делит X и Y координаты на `value`.
 * @method v6.Vector2D#div
 * @param {number} value Число, на которое надо разделить.
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).div( 2 ); // Vector2D { x: 2, y: 1 }
 */
Vector2D.prototype.div = function div ( value )
{
  this.x /= value;
  this.y /= value;
  return this;
};

/**
 * @method v6.Vector2D#dot
 * @param  {number} [x=0]
 * @param  {number} [y=0]
 * @return {number}
 * @example
 * new Vector2D( 4, 2 ).div( 2, 3 ); // 14, потому что: "(4 * 2) + (2 * 3) = 8 + 6 = 14"
 */
Vector2D.prototype.dot = function dot ( x, y )
{
  return ( this.x * ( x || 0 ) ) +
         ( this.y * ( y || 0 ) );
};

/**
 * Интерполирует X и Y координаты между соответствующими параметрами.
 * @method v6.Vector2D#lerp
 * @param {number} x
 * @param {number} y
 * @param {number} value
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).lerp( 8, 4, 0.5 ); // Vector2D { x: 6, y: 3 }
 */
Vector2D.prototype.lerp = function ( x, y, value )
{
  this.x += ( x - this.x ) * value || 0;
  this.y += ( y - this.y ) * value || 0;
  return this;
};

/**
 * Копирует другой вектор.
 * @method v6.Vector2D#setVector
 * @param {v6.AbstractVector} vector Вектор, который надо скопировать.
 * @chainable
 * @example
 * new Vector2D().setVector( new Vector2D( 4, 2 ) ); // Vector2D { x: 4, y: 2 }
 */
Vector2D.prototype.setVector = function setVector ( vector )
{
  return this.set( vector.x, vector.y );
};

/**
 * Добавляет другой вектор.
 * @method v6.Vector2D#addVector
 * @param {v6.AbstractVector} vector Вектор, который надо добавить.
 * @chainable
 * @example
 * new Vector2D().addVector( new Vector2D( 4, 2 ) ); // Vector2D { x: 4, y: 2 }
 */
Vector2D.prototype.addVector = function addVector ( vector )
{
  return this.add( vector.x, vector.y );
};

/**
 * Вычитает другой вектор.
 * @method v6.Vector2D#subVector
 * @param {v6.AbstractVector} vector Вектор, который надо вычесть.
 * @chainable
 * @example
 * new Vector2D().subVector( new Vector2D( 4, 2 ) ); // Vector2D { x: -4, y: -2 }
 */
Vector2D.prototype.subVector = function subVector ( vector )
{
  return this.sub( vector.x, vector.y );
};

/**
 * Умножает X и Y координаты на X и Y другого вектора.
 * @method v6.Vector2D#mulVector
 * @param {v6.AbstractVector} vector Вектор для умножения.
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).mulVector( new Vector2D( 2, 3 ) ); // Vector2D { x: 8, y: 6 }
 */
Vector2D.prototype.mulVector = function mulVector ( vector )
{
  this.x *= vector.x;
  this.y *= vector.y;
  return this;
};

/**
 * Делит X и Y координаты на X и Y другого вектора.
 * @method v6.Vector2D#divVector
 * @param {v6.AbstractVector} vector Вектор, на который надо делить.
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).divVector( new Vector2D( 2, 0.5 ) ); // Vector2D { x: 2, y: 4 }
 */
Vector2D.prototype.divVector = function divVector ( vector )
{
  this.x /= vector.x;
  this.y /= vector.y;
  return this;
};

/**
 * @method v6.Vector2D#dotVector
 * @param  {v6.AbstractVector} vector
 * @return {number}
 * @example
 * new Vector2D( 4, 2 ).dotVector( new Vector2D( 3, 5 ) ); // -> 22
 */
Vector2D.prototype.dotVector = function dotVector ( vector )
{
  return this.dot( vector.x, vector.y );
};

/**
 * Интерполирует X и Y координаты между другим вектором.
 * @method v6.Vector2D#lerpVector
 * @param {v6.AbstractVector} vector
 * @param {number}            value
 * @chainable
 * @example
 * new Vector2D( 4, 2 ).lerpVector( new Vector2D( 2, 1 ), 0.5 ); // Vector2D { x: 3, y: 1.5 }
 */
Vector2D.prototype.lerpVector = function lerpVector ( vector, value )
{
  return this.lerp( vector.x, vector.y, value );
};

/**
 * @override
 * @method v6.Vector2D#magSq
 */
Vector2D.prototype.magSq = function magSq ()
{
  return ( this.x * this.x ) + ( this.y * this.y );
};

/**
 * @override
 * @method v6.Vector2D#clone
 */
Vector2D.prototype.clone = function clone ()
{
  return new Vector2D( this.x, this.y );
};

/**
 * @override
 * @method v6.Vector2D#dist
 */
Vector2D.prototype.dist = function dist ( vector )
{
  var x = vector.x - this.x;
  var y = vector.y - this.y;
  return Math.sqrt( ( x * x ) + ( y * y ) );
};

/**
 * @override
 * @method v6.Vector2D#toString
 */
Vector2D.prototype.toString = function toString ()
{
  return 'v6.Vector2D { x: ' + this.x.toFixed( 2 ) + ', y: ' + this.y.toFixed( 2 ) + ' }';
};

/**
 * @method v6.Vector2D.random
 * @see v6.AbstractVector.random
 */
Vector2D.random = function random ()
{
  var value;

  if ( settings.degrees ) {
    value = 360;
  } else {
    value = Math.PI * 2;
  }

  return Vector2D.fromAngle( Math.random() * value );
};

/**
 * @method v6.Vector2D.fromAngle
 * @see v6.AbstractVector.fromAngle
 */
Vector2D.fromAngle = function fromAngle ( angle )
{
  return AbstractVector._fromAngle( Vector2D, angle );
};

module.exports = Vector2D;

},{"../settings":40,"./AbstractVector":21}],23:[function(require,module,exports){
'use strict';

var AbstractVector = require( './AbstractVector' );

/**
 * 3D вектор.
 * @constructor v6.Vector3D
 * @extends v6.AbstractVector
 * @param {number} [x=0] X координата вектора.
 * @param {number} [y=0] Y координата вектора.
 * @param {number} [z=0] Z координата вектора.
 * @example
 * var Vector3D = require( 'v6.js/math/Vector3D' );
 * var position = new Vector3D( 4, 2, 3 ); // Vector3D { x: 4, y: 2, z: 3 }
 */
function Vector3D ( x, y, z )
{
  /**
   * X координата вектора.
   * @member {number} v6.Vector3D#x
   * @example
   * var x = new Vector3D( 4, 2, 3 ).x; // -> 4
   */

  /**
   * Y координата вектора.
   * @member {number} v6.Vector3D#y
   * @example
   * var y = new Vector3D( 4, 2, 3 ).y; // -> 2
   */

  /**
   * Z координата вектора.
   * @member {number} v6.Vector3D#z
   * @example
   * var z = new Vector3D( 4, 2, 3 ).z; // -> 3
   */

  this.set( x, y, z );
}

Vector3D.prototype = Object.create( AbstractVector.prototype );
Vector3D.prototype.constructor = Vector3D;

/**
 * Устанавливает X, Y, и Z координаты.
 * @method v6.Vector3D#set
 * @param {number} [x=0] Новая X координата.
 * @param {number} [y=0] Новая Y координата.
 * @param {number} [z=0] Новая Z координата.
 * @chainable
 * @example
 * new Vector3D().set( 4, 2, 6 ); // Vector3D { x: 4, y: 2, z: 6 }
 */
Vector3D.prototype.set = function set ( x, y, z )
{
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  return this;
};

/**
 * Добавляет к координатам X, Y, и Z соответствующие параметры.
 * @method v6.Vector3D#add
 * @param {number} [x=0] Число, которое должно быть добавлено.
 * @param {number} [y=0] Число, которое должно быть добавлено.
 * @param {number} [z=0] Число, которое должно быть добавлено.
 * @chainable
 * @example
 * new Vector3D().add( 4, 2, 6 ); // Vector3D { x: 4, y: 2, z: 6 }
 */
Vector3D.prototype.add = function add ( x, y, z )
{
  this.x += x || 0;
  this.y += y || 0;
  this.z += z || 0;
  return this;
};

/**
 * Вычитает из координат X, Y, и Z соответствующие параметры.
 * @method v6.Vector3D#sub
 * @param {number} [x=0] Число, которое должно быть вычтено.
 * @param {number} [y=0] Число, которое должно быть вычтено.
 * @param {number} [z=0] Число, которое должно быть вычтено.
 * @chainable
 * @example
 * new Vector3D().sub( 4, 2, 6 ); // Vector3D { x: -4, y: -2, z: -6 }
 */
Vector3D.prototype.sub = function sub ( x, y, z )
{
  this.x -= x || 0;
  this.y -= y || 0;
  this.z -= z || 0;
  return this;
};

/**
 * Умножает X, Y, и Z координаты на `value`.
 * @method v6.Vector3D#mul
 * @param {number} value Число, на которое надо умножить.
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).mul( 2 ); // Vector3D { x: 8, y: 4, z: 12 }
 */
Vector3D.prototype.mul = function mul ( value )
{
  this.x *= value;
  this.y *= value;
  this.z *= value;
  return this;
};

/**
 * Делит X, Y, и Z координаты на `value`.
 * @method v6.Vector3D#div
 * @param {number} value Число, на которое надо разделить.
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).div( 2 ); // Vector3D { x: 2, y: 1, z: 3 }
 */
Vector3D.prototype.div = function div ( value )
{
  this.x /= value;
  this.y /= value;
  this.z /= value;
  return this;
};

/**
 * @method v6.Vector3D#dot
 * @param  {number} [x=0]
 * @param  {number} [y=0]
 * @param  {number} [z=0]
 * @return {number}
 * @example
 * new Vector3D( 4, 2, 6 ).dot( 2, 3, 4 ); // -> 38, потому что: "(4 * 2) + (2 * 3) + (6 * 4) = 8 + 6 + 24 = 38"
 */
Vector3D.prototype.dot = function dot ( x, y, z )
{
  return ( this.x * ( x || 0 ) ) +
         ( this.y * ( y || 0 ) ) +
         ( this.z * ( z || 0 ) );
};

/**
 * Интерполирует X, Y, и Z координаты между соответствующими параметрами.
 * @method v6.Vector3D#lerp
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} value
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).lerp( 8, 4, 12, 0.5 ); // Vector3D { x: 6, y: 3, z: 9 }
 */
Vector3D.prototype.lerp = function ( x, y, z, value )
{
  this.x += ( x - this.x ) * value || 0;
  this.y += ( y - this.y ) * value || 0;
  this.z += ( z - this.z ) * value || 0;
  return this;
};

/**
 * Копирует другой вектор.
 * @method v6.Vector3D#setVector
 * @param {v6.AbstractVector} vector Вектор, который надо скопировать.
 * @chainable
 * @example
 * new Vector3D().setVector( new Vector3D( 4, 2, 6 ) ); // Vector3D { x: 4, y: 2, z: 6 }
 */
Vector3D.prototype.setVector = function setVector ( vector )
{
  return this.set( vector.x, vector.y, vector.z );
};

/**
 * Добавляет другой вектор.
 * @method v6.Vector3D#addVector
 * @param {v6.AbstractVector} vector Вектор, который надо добавить.
 * @chainable
 * @example
 * new Vector3D().addVector( new Vector3D( 4, 2, 6 ) ); // Vector3D { x: 4, y: 2, z: 6 }
 */
Vector3D.prototype.addVector = function addVector ( vector )
{
  return this.add( vector.x, vector.y, vector.z );
};

/**
 * Вычитает другой вектор.
 * @method v6.Vector3D#subVector
 * @param {v6.AbstractVector} vector Вектор, который надо вычесть.
 * @chainable
 * @example
 * new Vector3D().subVector( new Vector3D( 4, 2, 6 ) ); // Vector3D { x: -4, y: -2, z: -6 }
 */
Vector3D.prototype.subVector = function subVector ( vector )
{
  return this.sub( vector.x, vector.y, vector.z );
};

/**
 * Умножает X, Y, и Z координаты на X, Y, и Z другого вектора.
 * @method v6.Vector3D#mulVector
 * @param {v6.AbstractVector} vector Вектор для умножения.
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).mulVector( new Vector3D( 2, 3, 4 ) ); // Vector3D { x: 8, y: 6, z: 24 }
 */
Vector3D.prototype.mulVector = function mulVector ( vector )
{
  this.x *= vector.x;
  this.y *= vector.y;
  this.z *= vector.z;
  return this;
};

/**
 * Делит X, Y, и Z координаты на X, Y, и Z другого вектора.
 * @method v6.Vector3D#divVector
 * @param {v6.AbstractVector} vector Вектор, на который надо делить.
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).divVector( new Vector3D( 2, 0.5, 4 ) ); // Vector3D { x: 2, y: 4, z: 1.5 }
 */
Vector3D.prototype.divVector = function divVector ( vector )
{
  this.x /= vector.x;
  this.y /= vector.y;
  this.z /= vector.z;
  return this;
};

/**
 * @method v6.Vector3D#dotVector
 * @param  {v6.AbstractVector} vector
 * @return {number}
 * @example
 * new Vector3D( 4, 2, 6 ).dotVector( new Vector3D( 2, 3, -2 ) ); // -> 2
 */
Vector3D.prototype.dotVector = function dotVector ( vector )
{
  return this.dot( vector.x, vector.y, vector.z );
};

/**
 * Интерполирует X, Y, и Z координаты между другим вектором.
 * @method v6.Vector3D#lerpVector
 * @param {v6.AbstractVector} vector
 * @param {number}            value
 * @chainable
 * @example
 * new Vector3D( 4, 2, 6 ).lerpVector( new Vector3D( 8, 4, 12 ), 0.5 ); // Vector3D { x: 6, y: 3, z: 9 }
 */
Vector3D.prototype.lerpVector = function lerpVector ( vector, value )
{
  return this.lerp( vector.x, vector.y, vector.z, value );
};

/**
 * @override
 * @method v6.Vector3D#magSq
 */
Vector3D.prototype.magSq = function magSq ()
{
  return ( this.x * this.x ) + ( this.y * this.y ) + ( this.z * this.z );
};

/**
 * @override
 * @method v6.Vector3D#clone
 */
Vector3D.prototype.clone = function clone ()
{
  return new Vector3D( this.x, this.y, this.z );
};

/**
 * @override
 * @method v6.Vector3D#dist
 */
Vector3D.prototype.dist = function dist ( vector )
{
  var x = vector.x - this.x;
  var y = vector.y - this.y;
  var z = vector.z - this.z;
  return Math.sqrt( ( x * x ) + ( y * y ) + ( z * z ) );
};

/**
 * @override
 * @method v6.Vector3D#toString
 */
Vector3D.prototype.toString = function toString ()
{
  return 'v6.Vector3D { x: ' + this.x.toFixed( 2 ) + ', y: ' + this.y.toFixed( 2 ) + ', z: ' + this.z.toFixed( 2 ) + ' }';
};

/**
 * @method v6.Vector3D.random
 * @see v6.AbstractVector.random
 */
Vector3D.random = function random ()
{
  // Use the equal-area projection algorithm.
  var theta = Math.random() * Math.PI * 2;
  var z     = ( Math.random() * 2 ) - 1;
  var n     = Math.sqrt( 1 - ( z * z ) );
  return new Vector3D( n * Math.cos( theta ), n * Math.sin( theta ), z );
};

/**
 * @method v6.Vector3D.fromAngle
 * @see v6.AbstractVector.fromAngle
 */
Vector3D.fromAngle = function fromAngle ( angle )
{
  return AbstractVector._fromAngle( Vector3D, angle );
};

module.exports = Vector3D;

},{"./AbstractVector":21}],24:[function(require,module,exports){
'use strict';

/**
 * Это пространство имен (этот namepspace) реализует работу с 2D матрицами 3x3.
 * @namespace v6.mat3
 * @example
 * var mat3 = require( 'v6.js/core/math/mat3' );
 */

/**
 * Создает стандартную (identity) 3x3 матрицу.
 * @method v6.mat3.identity
 * @return {Array.<number>} Новая матрица.
 * @example
 * // Returns the identity.
 * var matrix = mat3.identity();
 */
exports.identity = function identity ()
{
  return [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ];
};

/**
 * Сбрасывает матрицу `"m1"` до стандартных (identity) значений.
 * @method v6.mat3.setIdentity
 * @param  {Array.<number>} m1 Матрица.
 * @return {void}              Ничего не возвращает.
 * @example
 * // Sets the identity.
 * mat3.setIdentity( matrix );
 */
exports.setIdentity = function setIdentity ( m1 )
{
  m1[ 0 ] = 1;
  m1[ 1 ] = 0;
  m1[ 2 ] = 0;
  m1[ 3 ] = 0;
  m1[ 4 ] = 1;
  m1[ 5 ] = 0;
  m1[ 6 ] = 0;
  m1[ 7 ] = 0;
  m1[ 8 ] = 1;
};

/**
 * Копирует значения матрицы `"m2"` на матрицу `"m1"`.
 * @method v6.mat3.copy
 * @param  {Array.<number>} m1 Матрица, в которую надо копировать.
 * @param  {Array.<number>} m2 Матрица, которую надо скопировать.
 * @return {void}              Ничего не возвращает.
 * @example
 * // Copies a matrix.
 * mat3.copy( destinationMatrix, sourceMatrix );
 */
exports.copy = function copy ( m1, m2 )
{
  m1[ 0 ] = m2[ 0 ];
  m1[ 1 ] = m2[ 1 ];
  m1[ 2 ] = m2[ 2 ];
  m1[ 3 ] = m2[ 3 ];
  m1[ 4 ] = m2[ 4 ];
  m1[ 5 ] = m2[ 5 ];
  m1[ 6 ] = m2[ 6 ];
  m1[ 7 ] = m2[ 7 ];
  m1[ 8 ] = m2[ 8 ];
};

/**
 * Возвращает клон матрицы `"m1"`.
 * @method v6.mat3.clone
 * @param  {Array.<number>} m1 Исходная матрица.
 * @return {Array.<number>}    Клон матрицы.
 * @example
 * // Creates a clone.
 * var clone = mat3.clone( matrix );
 */
exports.clone = function clone ( m1 )
{
  return [
    m1[ 0 ],
    m1[ 1 ],
    m1[ 2 ],
    m1[ 3 ],
    m1[ 4 ],
    m1[ 5 ],
    m1[ 6 ],
    m1[ 7 ],
    m1[ 8 ]
  ];
};

/**
 * Перемещает матрицу `"m1"`.
 * @method v6.mat3.translate
 * @param  {Array.<number>} m1 Матрица.
 * @param  {number}         x  X перемещения.
 * @param  {number}         y  Y перемещения.
 * @return {void}              Ничего не возвращает.
 * @example
 * // Translates by [ 4, 2 ].
 * mat3.translate( matrix, 4, 2 );
 */
exports.translate = function translate ( m1, x, y )
{
  m1[ 6 ] = ( x * m1[ 0 ] ) + ( y * m1[ 3 ] ) + m1[ 6 ];
  m1[ 7 ] = ( x * m1[ 1 ] ) + ( y * m1[ 4 ] ) + m1[ 7 ];
  m1[ 8 ] = ( x * m1[ 2 ] ) + ( y * m1[ 5 ] ) + m1[ 8 ];
};

/**
 * Поворачивает матрицу `"m1"` на `"angle"` радианов.
 * @method v6.mat3.rotate
 * @param  {Array.<number>} m1    Матрица.
 * @param  {number}         angle Угол.
 * @return {void}                 Ничего не возвращает.
 * @example
 * // Rotates by 45 degrees.
 * mat3.rotate( matrix, 45 * Math.PI / 180 );
 */
exports.rotate = function rotate ( m1, angle )
{
  var m10 = m1[ 0 ];
  var m11 = m1[ 1 ];
  var m12 = m1[ 2 ];
  var m13 = m1[ 3 ];
  var m14 = m1[ 4 ];
  var m15 = m1[ 5 ];
  var x = Math.cos( angle );
  var y = Math.sin( angle );
  m1[ 0 ] = ( x * m10 ) + ( y * m13 );
  m1[ 1 ] = ( x * m11 ) + ( y * m14 );
  m1[ 2 ] = ( x * m12 ) + ( y * m15 );
  m1[ 3 ] = ( x * m13 ) - ( y * m10 );
  m1[ 4 ] = ( x * m14 ) - ( y * m11 );
  m1[ 5 ] = ( x * m15 ) - ( y * m12 );
};

/**
 * Масштабирует матрицу.
 * @method v6.mat3.scale
 * @param  {Array.<number>} m1 Матрица.
 * @param  {number}         x  X-фактор.
 * @param  {number}         y  Y-фактор.
 * @return {void}              Ничего не возвращает.
 * @example
 * // Scales in [ 2, 2 ] times.
 * mat3.scale( matrix, 2, 2 );
 */
exports.scale = function scale ( m1, x, y )
{
  m1[ 0 ] *= x;
  m1[ 1 ] *= x;
  m1[ 2 ] *= x;
  m1[ 3 ] *= y;
  m1[ 4 ] *= y;
  m1[ 5 ] *= y;
};

/**
 * Применяет матрицу из соответствующих параметров на матрицу `"m1"`.
 * @method v6.mat3.transform
 * @param  {Array.<number>} m1  Матрица.
 * @param  {number}         m11 X масштаб (scale).
 * @param  {number}         m12 X наклон (skew).
 * @param  {number}         m21 Y наклон (skew).
 * @param  {number}         m22 Y масштаб (scale).
 * @param  {number}         dx  X перемещения (translate).
 * @param  {number}         dy  Y перемещения (translate).
 * @return {void}               Ничего не возвращает.
 * @example
 * // Applies a double-scaled matrix.
 * mat3.transform( matrix, 2, 0, 0, 2, 0, 0 );
 */
exports.transform = function transform ( m1, m11, m12, m21, m22, dx, dy )
{
  m1[ 0 ] *= m11;
  m1[ 1 ] *= m21;
  m1[ 2 ] *= dx;
  m1[ 3 ] *= m12;
  m1[ 4 ] *= m22;
  m1[ 5 ] *= dy;
  m1[ 6 ] = 0;
  m1[ 7 ] = 0;
};

/**
 * Сбрасывает матрицу `"m1"` до матрицы из соответствующих параметров.
 * @method v6.mat3.setTransform
 * @param  {Array.<number>} m1  Матрица.
 * @param  {number}         m11 X масштаб (scale).
 * @param  {number}         m12 X наклон (skew).
 * @param  {number}         m21 Y наклон (skew).
 * @param  {number}         m22 Y масштаб (scale).
 * @param  {number}         dx  X перемещения (translate).
 * @param  {number}         dy  Y перемещения (translate).
 * @return {void}               Ничего не возвращает.
 * @example
 * // Sets the identity and then applies a double-scaled matrix.
 * mat3.setTransform( matrix, 2, 0, 0, 2, 0, 0 );
 */
exports.setTransform = function setTransform ( m1, m11, m12, m21, m22, dx, dy )
{
  // X scale
  m1[ 0 ] = m11;
  // X skew
  m1[ 1 ] = m12;
  // Y skew
  m1[ 3 ] = m21;
  // Y scale
  m1[ 4 ] = m22;
  // X translate
  m1[ 6 ] = dx;
  // Y translate
  m1[ 7 ] = dy;
};

},{}],25:[function(require,module,exports){
'use strict';
var getElementW = require( 'peako/get-element-w' );
var getElementH = require( 'peako/get-element-h' );
var constants = require( '../constants' );
var createPolygon = require( '../internal/create_polygon' );
var polygons = require( '../internal/polygons' );
var setDefaultDrawingSettings = require( './internal/set_default_drawing_settings' );
var getWebGL = require( './internal/get_webgl' );
var copyDrawingSettings = require( './internal/copy_drawing_settings' );
var processRectAlignX = require( './internal/process_rect_align' ).processRectAlignX;
var processRectAlignY = require( './internal/process_rect_align' ).processRectAlignY;
var processShape = require( './internal/process_shape' );
var closeShape = require( './internal/close_shape' );
var options = require( './settings' );
/**
 * Абстрактный класс рендерера.
 * @abstract
 * @constructor v6.AbstractRenderer
 * @see v6.RendererGL
 * @see v6.Renderer2D
 * @example
 * var AbstractRenderer = require( 'v6.js/core/renderer/AbstractRenderer' );
 */
function AbstractRenderer ()
{
  throw Error( 'Cannot create an instance of the abstract class (new v6.AbstractRenderer)' );
}
AbstractRenderer.prototype = {
  /**
   * Добавляет `canvas` рендерера в DOM.
   * @method v6.AbstractRenderer#appendTo
   * @param {Element} parent Элемент, в который `canvas` рендерера должен быть добавлен.
   * @chainable
   * @example
   * // Add renderer into DOM.
   * renderer.appendTo( document.body );
   */
  appendTo: function appendTo ( parent )
  {
    parent.appendChild( this.canvas );
    return this;
  },
  /**
   * Удаляет `canvas` рендерера из DOM.
   * @method v6.AbstractRenderer#destroy
   * @chainable
   * @example
   * // Remove renderer from DOM.
   * renderer.destroy();
   */
  destroy: function destroy ()
  {
    this.canvas.parentNode.removeChild( this.canvas );
    return this;
  },
  /**
   * Сохраняет текущие настройки рендеринга.
   * @method v6.AbstractRenderer#push
   * @chainable
   * @example
   * // Save drawing settings (fill, lineWidth...) (push onto stack).
   * renderer.push();
   */
  push: function push ()
  {
    if ( this._stack[ ++this._stackIndex ] ) {
      copyDrawingSettings( this._stack[ this._stackIndex ], this );
    } else {
      this._stack.push( setDefaultDrawingSettings( {}, this ) );
    }
    return this;
  },
  /**
   * Восстанавливает предыдущие настройки рендеринга.
   * @method v6.AbstractRenderer#pop
   * @chainable
   * @example
   * // Restore drawing settings (fill, lineWidth...) (take from stack).
   * renderer.pop();
   */
  pop: function pop ()
  {
    if ( this._stackIndex >= 0 ) {
      copyDrawingSettings( this, this._stack[ this._stackIndex-- ] );
    } else {
      setDefaultDrawingSettings( this, this );
    }
    return this;
  },
  /**
   * Изменяет размер рендерера.
   * @method v6.AbstractRenderer#resize
   * @param {number} w Новая ширина.
   * @param {number} h Новая высота.
   * @chainable
   * @example
   * // Resize renderer to 600x400.
   * renderer.resize( 600, 400 );
   */
  resize: function resize ( w, h )
  {
    var canvas = this.canvas;
    var scale = this.settings.scale;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = this.w = Math.floor( w * scale ); // eslint-disable-line no-multi-assign
    canvas.height = this.h = Math.floor( h * scale ); // eslint-disable-line no-multi-assign
    return this;
  },
  /**
   * Изменяет размер рендерера до размера `element` элемента.
   * @method v6.AbstractRenderer#resizeTo
   * @param {Element} element Элемент, до которого надо растянуть рендерер.
   * @chainable
   * @example
   * // Resize renderer to match <body /> sizes.
   * renderer.resizeTo( document.body );
   */
  resizeTo: function resizeTo ( element )
  {
    return this.resize( getElementW( element ), getElementH( element ) );
  },
  /**
   * Рисует полигон.
   * @method v6.AbstractRenderer#drawPolygon
   * @param  {number}    x             X координата полигона.
   * @param  {number}    y             Y координата полигона.
   * @param  {number}    sides         Количество сторон полигона.
   * @param  {number}    xRadius       X радиус полигона.
   * @param  {number}    yRadius       Y радиус полигона.
   * @param  {number}    rotationAngle Угол поворота полигона
   *                                   (чтобы не использовать {@link v6.Transform#rotate}).
   * @param  {boolean}   degrees       Использовать градусы.
   * @chainable
   * @example
   * // Draw hexagon at [ 4, 2 ] with radius 25.
   * renderer.polygon( 4, 2, 6, 25, 25, 0 );
   */
  drawPolygon: function drawPolygon ( x, y, sides, xRadius, yRadius, rotationAngle, degrees )
  {
    var polygon = polygons[ sides ];
    if ( ! polygon ) {
      polygon = polygons[ sides ] = createPolygon( sides ); // eslint-disable-line no-multi-assign
    }
    if ( degrees ) {
      rotationAngle *= Math.PI / 180;
    }
    this.matrix.save();
    this.matrix.translate( x, y );
    this.matrix.rotate( rotationAngle );
    this.drawArrays( polygon, polygon.length * 0.5, void 0, xRadius, yRadius );
    this.matrix.restore();
    return this;
  },
  /**
   * Рисует полигон.
   * @method v6.AbstractRenderer#polygon
   * @param  {number} x               X координата полигона.
   * @param  {number} y               Y координата полигона.
   * @param  {number} sides           Количество сторон полигона.
   * @param  {number} r               Радиус полигона.
   * @param  {number} [rotationAngle] Угол поворота полигона.
   *                                  (чтобы не использовать {@link v6.Transform#rotate}).
   * @chainable
   * @example
   * // Draw hexagon at [ 4, 2 ] with radius 25.
   * renderer.polygon( 4, 2, 6, 25 );
   */
  polygon: function polygon ( x, y, sides, r, rotationAngle )
  {
    if ( sides % 1 ) {
      sides = Math.floor( sides * 100 ) * 0.01;
    }
    if ( typeof rotationAngle === 'undefined' ) {
      this.drawPolygon( x, y, sides, r, r, -Math.PI * 0.5 );
    } else {
      this.drawPolygon( x, y, sides, r, r, rotationAngle, options.degrees );
    }
    return this;
  },
  /**
   * Рисует картинку.
   * @method v6.AbstractRenderer#image
   * @param {v6.AbstractImage} image Картинка которую надо отрисовать.
   * @param {number}           x     X координата картинки.
   * @param {number}           y     Y координата картинки.
   * @param {number}           [w]   Ширина картинки.
   * @param {number}           [h]   Высота картинки.
   * @chainable
   * @example
   * // Create image.
   * var image = new Image( document.getElementById( 'image' ) );
   * // Draw image at [ 4, 2 ].
   * renderer.image( image, 4, 2 );
   */
  image: function image ( image, x, y, w, h )
  {
    if ( image.get().loaded ) {
      if ( typeof w === 'undefined' ) {
        w = image.dw;
      }
      if ( typeof h === 'undefined' ) {
        h = image.dh;
      }
      x = processRectAlignX( this, x, w );
      x = processRectAlignY( this, y, h );
      this.drawImage( image, x, y, w, h );
    }
    return this;
  },
  /**
   * Метод для начала отрисовки фигуры.
   * @method v6.AbstractRenderer#beginShape
   * @param {object}   [options]              Параметры фигуры.
   * @param {function} [options.drawFunction] Функция, котороя будет отрисовывать все вершины в {@link v6.AbstractRenderer.endShape}. Может быть перезаписана.
   * @chainable
   * @example
   * // Require "v6.shapes" ("v6.js" built-in drawing functions).
   * var shapes = require( 'v6.js/renderer/shapes/points' );
   * // Begin drawing points shape.
   * renderer.beginShape( { drawFunction: shapes.drawPoints } );
   * // Begin drawing shape without drawing function (must be passed later in `endShape`).
   * renderer.beginShape();
   */
  beginShape: function beginShape ( options )
  {
    if ( ! options ) {
      options = {};
    }
    this._vertices.length = 0;
    this._closedShape = null;
    if ( typeof options.drawFunction === 'undefined' ) {
      this._drawFunction = null;
    } else {
      this._drawFunction = options.drawFunction;
    }
    return this;
  },
  /**
   * Создает вершину в координатах из соответсвующих параметров.
   * @method v6.AbstractRenderer#vertex
   * @param {number} x X координата новой вершины.
   * @param {number} y Y координата новой вершины.
   * @chainable
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#endShape
   * @example
   * // Draw rectangle with vertices.
   * renderer.vertex( 0, 0 );
   * renderer.vertex( 1, 0 );
   * renderer.vertex( 1, 1 );
   * renderer.vertex( 0, 1 );
   */
  vertex: function vertex ( x, y )
  {
    this._vertices.push( Math.floor( x ), Math.floor( y ) );
    this._closedShape = null;
    return this;
  },
  /**
   * Рисует фигуру из вершин.
   * @method v6.AbstractRenderer#endShape
   * @param {object}   [options]              Параметры фигуры.
   * @param {boolean}  [options.close]        Соединить последнюю вершину с первой (закрыть фигуру).
   * @param {function} [options.drawFunction] Функция, котороя будет отрисовывать все вершины.
   *                                          Имеет больший приоритет чем в {@link v6.AbstractRenderer#beginShape}.
   * @chainable
   * @example
   * // Require "v6.shapes" ("v6.js" built-in drawing functions).
   * var shapes = require( 'v6.js/renderer/shapes/points' );
   * // Close and draw a shape.
   * renderer.endShape( { close: true } );
   * // Draw with a custom function.
   * renderer.endShape( { drawFunction: shapes.drawLines } );
   */
  endShape: function endShape ( options )
  {
    var drawFunction, vertices;
    if ( ! options ) {
      options = {};
    }
    if ( ! ( drawFunction = options.drawFunction || this._drawFunction ) ) {
      throw Error( 'No "drawFunction" specified for "renderer.endShape"' );
    }
    if ( options.close ) {
      closeShape( this );
      vertices = this._closedShape;
    } else {
      vertices = this._vertices;
    }
    drawFunction( this, processShape( this, vertices ) );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#save
   * @chainable
   * @see v6.Transform#save
   * @example
   * // Save transform.
   * renderer.save();
   */
  save: function save ()
  {
    this.matrix.save();
    return this;
  },
  /**
   * @method v6.AbstractRenderer#restore
   * @chainable
   * @see v6.Transform#restore
   * @example
   * // Restore transform.
   * renderer.restore();
   */
  restore: function restore ()
  {
    this.matrix.restore();
    return this;
  },
  /**
   * @method v6.AbstractRenderer#setTransform
   * @chainable
   * @see v6.Transform#setTransform
   * @example
   * // Set identity transform.
   * renderer.setTransform( 1, 0, 0, 1, 0, 0 );
   */
  setTransform: function setTransform ( m11, m12, m21, m22, dx, dy )
  {
    this.matrix.setTransform( m11, m12, m21, m22, dx, dy );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#translate
   * @chainable
   * @see v6.Transform#translate
   * @example
   * // Translate transform to [ 4, 2 ].
   * renderer.translate( 4, 2 );
   */
  translate: function translate ( x, y )
  {
    this.matrix.translate( x, y );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#rotate
   * @chainable
   * @see v6.Transform#rotate
   * @todo renderer.settings.degrees
   * @example
   * // Rotate transform on 45 degrees.
   * renderer.rotate( 45 * Math.PI / 180 );
   */
  rotate: function rotate ( angle )
  {
    if ( this.settings.degrees ) {
      angle *= Math.PI / 180;
    }
    this.matrix.rotate( angle );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#scale
   * @chainable
   * @see v6.Transform#scale
   * @example
   * // Scale transform twice.
   * renderer.scale( 2, 2 );
   */
  scale: function scale ( x, y )
  {
    this.matrix.scale( x, y );
    return this;
  },
  /**
   * @method v6.AbstractRenderer#transform
   * @chainable
   * @see v6.Transform#transform
   * @example
   * // Apply translated to [ 4, 2 ] "transformation matrix".
   * renderer.transform( 1, 0, 0, 1, 4, 2 );
   */
  transform: function transform ( m11, m12, m21, m22, dx, dy )
  {
    this.matrix.transform( m11, m12, m21, m22, dx, dy );
    return this;
  },
  /**
   * Устанавливает lineWidth (ширину контура).
   * @method v6.AbstractRenderer#lineWidth
   * @param {number} number Новый lineWidth.
   * @chainable
   * @example
   * // Set `lineWidth` to 10px.
   * renderer.lineWidth( 10 );
   */
  lineWidth: function lineWidth ( number )
  {
    this._lineWidth = number;
    return this;
  },
  /**
   * Устанавливает `backgroundPositionX` настройку рендеринга.
   * @method v6.AbstractRenderer#backgroundPositionX
   * @param {number}   value
   * @param {constant} type
   * @chainable
   * @example
   * // Set "backgroundPositionX" drawing setting to CENTER (default: LEFT).
   * renderer.backgroundPositionX( constants.get( 'CENTER' ), constants.get( 'CONSTANT' ) );
   * renderer.backgroundPositionX( 0.5, constants.get( 'PERCENT' ) );
   * renderer.backgroundPositionX( renderer.w / 2 );
   */
  backgroundPositionX: function backgroundPositionX ( value, type ) { if ( typeof type !== 'undefined' && type !== constants.get( 'VALUE' ) ) { if ( type === constants.get( 'CONSTANT' ) ) { type = constants.get( 'PERCENT' ); if ( value === constants.get( "LEFT" ) ) { value = 0; } else if ( value === constants.get( "CENTER" ) ) { value = 0.5; } else if ( value === constants.get( "RIGHT" ) ) { value = 1; } else { throw Error( 'Got unknown value. The known are: ' + "LEFT" + ', ' + "CENTER" + ', ' + "RIGHT" ); } } if ( type === constants.get( 'PERCENT' ) ) { value *= this.w; } else { throw Error( 'Got unknown `value` type. The known are: VALUE, PERCENT, CONSTANT' ); } } this._backgroundPositionX = value; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает `backgroundPositionY` настройку рендеринга.
   * @method v6.AbstractRenderer#backgroundPositionY
   * @param {number}   value
   * @param {constant} type
   * @chainable
   * @example
   * // Set "backgroundPositionY" drawing setting to MIDDLE (default: TOP).
   * renderer.backgroundPositionY( constants.get( 'MIDDLE' ), constants.get( 'CONSTANT' ) );
   * renderer.backgroundPositionY( 0.5, constants.get( 'PERCENT' ) );
   * renderer.backgroundPositionY( renderer.h / 2 );
   */
  backgroundPositionY: function backgroundPositionY ( value, type ) { if ( typeof type !== 'undefined' && type !== constants.get( 'VALUE' ) ) { if ( type === constants.get( 'CONSTANT' ) ) { type = constants.get( 'PERCENT' ); if ( value === constants.get( "TOP" ) ) { value = 0; } else if ( value === constants.get( "MIDDLE" ) ) { value = 0.5; } else if ( value === constants.get( "BOTTOM" ) ) { value = 1; } else { throw Error( 'Got unknown value. The known are: ' + "TOP" + ', ' + "MIDDLE" + ', ' + "BOTTOM" ); } } if ( type === constants.get( 'PERCENT' ) ) { value *= this.h; } else { throw Error( 'Got unknown `value` type. The known are: VALUE, PERCENT, CONSTANT' ); } } this._backgroundPositionY = value; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает `rectAlignX` настройку рендеринга.
   * @method v6.AbstractRenderer#rectAlignX
   * @param {constant} value `LEFT`, `CENTER`, `RIGHT`.
   * @chainable
   * @example
   * // Set "rectAlignX" drawing setting to CENTER (default: LEFT).
   * renderer.rectAlignX( constants.get( 'CENTER' ) );
   */
  rectAlignX: function rectAlignX ( value ) { if ( value === constants.get( 'LEFT' ) || value === constants.get( 'CENTER' ) || value === constants.get( 'RIGHT' ) ) { this._rectAlignX = value; } else { throw Error( 'Got unknown `rectAlign` constant. The known are: ' + "LEFT" + ', ' + "CENTER" + ', ' + "RIGHT" ); } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает `rectAlignY` настройку рендеринга.
   * @method v6.AbstractRenderer#rectAlignY
   * @param {constant} value `TOP`, `MIDDLE`, `BOTTOM`.
   * @chainable
   * @example
   * // Set "rectAlignY" drawing setting to MIDDLE (default: TOP).
   * renderer.rectAlignY( constants.get( 'MIDDLE' ) );
   */
  rectAlignY: function rectAlignY ( value ) { if ( value === constants.get( 'LEFT' ) || value === constants.get( 'CENTER' ) || value === constants.get( 'RIGHT' ) ) { this._rectAlignY = value; } else { throw Error( 'Got unknown `rectAlign` constant. The known are: ' + "TOP" + ', ' + "MIDDLE" + ', ' + "BOTTOM" ); } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает цвет `stroke` при рисовании через {@link v6.AbstractRenderer#rect} и т.п.
   * @method v6.AbstractRenderer#stroke
   * @param {number|boolean|TColor} [r] Если это `boolean`, то это включит или выключит `stroke`
   *                                    (как через {@link v6.AbstractRenderer#noStroke}).
   * @param {number}                [g]
   * @param {number}                [b]
   * @param {number}                [a]
   * @chainable
   * @example
   * // Disable and then enable `stroke`.
   * renderer.stroke( false ).stroke( true );
   * // Set `stroke` to "lightskyblue".
   * renderer.stroke( 'lightskyblue' );
   * // Set `stroke` from `v6.RGBA`.
   * renderer.stroke( new RGBA( 255, 0, 0 ).perceivedBrightness() );
   */
  stroke: function stroke ( r, g, b, a ) { if ( typeof r === 'boolean' ) { this._doStroke = r; } else { if ( typeof r === 'string' || this._strokeColor.type !== this.settings.color.type ) { this._strokeColor = new this.settings.color( r, g, b, a ); } else { this._strokeColor.set( r, g, b, a ); } this._doStroke = true; } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Устанавливает цвет `fill` при рисовании через {@link v6.AbstractRenderer#rect} и т.п.
   * @method v6.AbstractRenderer#fill
   * @param {number|boolean|TColor} [r] Если это `boolean`, то это включит или выключит `fill`
   *                                    (как через {@link v6.AbstractRenderer#noFill}).
   * @param {number}                [g]
   * @param {number}                [b]
   * @param {number}                [a]
   * @chainable
   * @example
   * // Disable and then enable `fill`.
   * renderer.fill( false ).fill( true );
   * // Set `fill` to "lightpink".
   * renderer.fill( 'lightpink' );
   * // Set `fill` from `v6.RGBA`.
   * renderer.fill( new RGBA( 255, 0, 0 ).brightness() );
   */
  fill: function fill ( r, g, b, a ) { if ( typeof r === 'boolean' ) { this._doFill = r; } else { if ( typeof r === 'string' || this._fillColor.type !== this.settings.color.type ) { this._fillColor = new this.settings.color( r, g, b, a ); } else { this._fillColor.set( r, g, b, a ); } this._doFill = true; } return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Выключает рисование контура (stroke).
   * @method v6.AbstractRenderer#noStroke
   * @chainable
   * @example
   * // Disable drawing stroke.
   * renderer.noStroke();
   */
  noStroke: function noStroke () { this._doStroke = false; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Выключает заполнения фона (fill).
   * @method v6.AbstractRenderer#noFill
   * @chainable
   * @example
   * // Disable filling.
   * renderer.noFill();
   */
  noFill: function noFill () { this._doFill = false; return this; }, // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
  /**
   * Заполняет фон рендерера цветом.
   * @virtual
   * @method v6.AbstractRenderer#backgroundColor
   * @param {number|TColor} [r]
   * @param {number}        [g]
   * @param {number}        [b]
   * @param {number}        [a]
   * @chainable
   * @example
   * // Fill renderer with "lightpink" color.
   * renderer.backgroundColor( 'lightpink' );
   */
  /**
   * Заполняет фон рендерера картинкой.
   * @virtual
   * @method v6.AbstractRenderer#backgroundImage
   * @param {v6.AbstractImage} image Картинка, которая должна использоваться для фона.
   * @chainable
   * @example
   * // Create background image.
   * var image = Image.fromURL( 'background.jpg' );
   * // Fill renderer with the image.
   * renderer.backgroundImage( Image.stretch( image, renderer.w, renderer.h ) );
   */
  /**
   * Очищает контекст.
   * @virtual
   * @method v6.AbstractRenderer#clear
   * @chainable
   * @example
   * // Clear renderer's context.
   * renderer.clear();
   */
  /**
   * Отрисовывает переданные вершины.
   * @virtual
   * @method v6.AbstractRenderer#drawArrays
   * @param {Float32Array|Array} verts Вершины, которые надо отрисовать. Если не передано для
   *                                   {@link v6.RendererGL}, то будут использоваться вершины из
   *                                   стандартного буфера ({@link v6.RendererGL#buffers.default}).
   * @param {number}             count Количество вершин, например: 3 для треугольника.
   * @chainable
   * @example
   * // A triangle.
   * var vertices = new Float32Array( [
   *   0,  0,
   *   50, 50,
   *   0,  50
   * ] );
   *
   * // Draw the triangle.
   * renderer.drawArrays( vertices, 3 );
   */
  /**
   * Рисует картинку.
   * @virtual
   * @method v6.AbstractRenderer#drawImage
   * @param {v6.AbstractImage} image Картинка которую надо отрисовать.
   * @param {number}           x     "Destination X". X координата картинки.
   * @param {number}           y     "Destination Y". Y координата картинки.
   * @param {number}           w     "Destination Width". Ширина картинки.
   * @param {number}           h     "Destination Height". Высота картинки.
   * @chainable
   * @example
   * // Create image.
   * var image = Image.fromURL( '300x200.png' );
   * // Draw image at [ 0, 0 ].
   * renderer.drawImage( image, 0, 0, 600, 400 );
   */
  /**
   * Рисует прямоугольник.
   * @virtual
   * @method v6.AbstractRenderer#rect
   * @param {number} x X координата прямоугольника.
   * @param {number} y Y координата прямоугольника.
   * @param {number} w Ширина прямоугольника.
   * @param {number} h Высота прямоугольника.
   * @chainable
   * @example
   * // Draw square at [ 20, 20 ] with size 80.
   * renderer.rect( 20, 20, 80, 80 );
   */
  /**
   * Рисует круг.
   * @virtual
   * @method v6.AbstractRenderer#arc
   * @param {number} x X координата круга.
   * @param {number} y Y координата круга.
   * @param {number} r Радиус круга.
   * @chainable
   * @example
   * // Draw circle at [ 60, 60 ] with radius 40.
   * renderer.arc( 60, 60, 40 );
   */
  /**
   * Рисует линию.
   * @method v6.AbstractRenderer#line
   * @param {number} x1 X начала линии.
   * @param {number} y1 Y начала линии.
   * @param {number} x2 X концы линии.
   * @param {number} y2 Y концы линии.
   * @chainable
   * @example
   * // Draw line from [ 10, 10 ] to [ 20, 20 ].
   * renderer.line( 10, 10, 20, 20 );
   */
  /**
   * Рисует точку.
   * @method v6.AbstractRenderer#point
   * @param {number} x X координата точки.
   * @param {number} y Y координата точки.
   * @chainable
   * @example
   * // Draw point at [ 4, 2 ].
   * renderer.point( 4, 2 );
   */
  constructor: AbstractRenderer
};
/**
 * Initialize renderer on `"self"`.
 * @method v6.AbstractRenderer.create
 * @param  {v6.AbstractRenderer} self    Renderer that should be initialized.
 * @param  {object}              options {@link v6.settings.renderer}
 * @param  {constant}            type    Type of renderer: `2D` or `GL`. Cannot be `AUTO`!.
 * @return {void}                        Returns nothing.
 * @example <caption>Custom Renderer</caption>
 * var AbstractRenderer = require( 'v6.js/core/renderer/AbstractRenderer' );
 * var settings         = require( 'v6.js/core/renderer/settings' );
 * var constants        = require( 'v6.js/core/constants' );
 *
 * function CustomRenderer ( options )
 * {
 *   // Initialize CustomRenderer.
 *   AbstractRenderer.create( this, defaults( settings, options ), constants.get( '2D' ) );
 * }
 */
AbstractRenderer.create = function create ( self, options, type )
{
  var context;
  /**
   * `canvas` рендерера для отрисовки на экране.
   * @member {HTMLCanvasElement} v6.AbstractRenderer#canvas
   */
  if ( options.canvas ) {
    self.canvas = options.canvas;
  } else {
    self.canvas = document.createElement( 'canvas' );
    self.canvas.innerHTML = 'Unable to run this application.';
  }
  if ( type === constants.get( '2D' ) ) {
    context = '2d';
  } else if ( type !== constants.get( 'GL' ) ) {
    throw Error( 'Got unknown renderer type. The known are: 2D and GL' );
  } else if ( ! ( context = getWebGL() ) ) {
    throw Error( 'Cannot get WebGL context. Try to use 2D as the renderer type or v6.Renderer2D instead of v6.RendererGL' );
  }
  /**
   * Контекст холста.
   * @member {object} v6.AbstractRenderer#context
   */
  self.context = self.canvas.getContext( context, {
    alpha: options.alpha
  } );
  /**
   * Настройки рендерера.
   * @member {object} v6.AbstractRenderer#settings
   * @see v6.settings.renderer.settings
   */
  self.settings = options.settings;
  /**
   * Тип рендерера: GL, 2D.
   * @member {constant} v6.AbstractRenderer#type
   */
  self.type = type;
  /**
   * Стэк сохраненных настроек рендеринга.
   * @private
   * @member {Array.<object>} v6.AbstractRenderer#_stack
   * @see v6.AbstractRenderer#push
   * @see v6.AbstractRenderer#pop
   */
  self._stack = [];
  /**
   * Позиция последних сохраненных настроек рендеринга.
   * @private
   * @member {number} v6.AbstractRenderer#_stackIndex
   * @see v6.AbstractRenderer#push
   * @see v6.AbstractRenderer#pop
   */
  self._stackIndex = -1;
  /**
   * Вершины фигуры.
   * @private
   * @member {Array.<number>} v6.AbstractRenderer#_vertices
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#vertex
   * @see v6.AbstractRenderer#endShape
   */
  self._vertices = [];
  /**
   * Закрытая фигура (вершина).
   * @private
   * @member {Array.<number>} v6.AbstractRenderer#_drawFunction
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#vertex
   * @see v6.AbstractRenderer#endShape
   */
  self._closedShape = null;
  /**
   * Функция, котороя будет отрисовывать вершины.
   * @private
   * @member {function} v6.AbstractRenderer#_drawFunction
   * @see v6.AbstractRenderer#beginShape
   * @see v6.AbstractRenderer#vertex
   * @see v6.AbstractRenderer#endShape
   */
  self._drawFunction = null;
  if ( typeof options.appendTo === 'undefined' ) {
    self.appendTo( document.body );
  } else if ( options.appendTo !== null ) {
    self.appendTo( options.appendTo );
  }
  if ( 'w' in options || 'h' in options ) {
    self.resize( options.w || 0, options.h || 0 );
  } else if ( options.appendTo !== null ) {
    self.resizeTo( options.appendTo || document.body );
  } else {
    self.resize( 600, 400 );
  }
  setDefaultDrawingSettings( self, self );
};
module.exports = AbstractRenderer;

},{"../constants":10,"../internal/create_polygon":16,"../internal/polygons":19,"./internal/close_shape":29,"./internal/copy_drawing_settings":30,"./internal/get_webgl":33,"./internal/process_rect_align":34,"./internal/process_shape":35,"./internal/set_default_drawing_settings":36,"./settings":37,"peako/get-element-h":70,"peako/get-element-w":71}],26:[function(require,module,exports){
'use strict';

var defaults          = require( 'peako/defaults' );

var constants         = require( '../constants' );

var processRectAlignX = require( './internal/process_rect_align' ).processRectAlignX;
var processRectAlignY = require( './internal/process_rect_align' ).processRectAlignY;

var AbstractRenderer  = require( './AbstractRenderer' );
var settings          = require( './settings' );

/**
 * 2D рендерер.
 * @constructor v6.Renderer2D
 * @extends v6.AbstractRenderer
 * @param {object} options {@link v6.settings.renderer}
 * @example
 * // Require Renderer2D.
 * var Renderer2D = require( 'v6.js/core/renderer/Renderer2D' );
 * // Create an Renderer2D isntance.
 * var renderer = new Renderer2D();
 */
function Renderer2D ( options )
{
  AbstractRenderer.create( this, ( options = defaults( settings, options ) ), constants.get( '2D' ) );

  /**
   * @member v6.Renderer2D#matrix
   * @alias v6.Renderer2D#context
   */
  this.matrix = this.context;
}

Renderer2D.prototype = Object.create( AbstractRenderer.prototype );
Renderer2D.prototype.constructor = Renderer2D;

/**
 * @override
 * @method v6.Renderer2D#backgroundColor
 */
Renderer2D.prototype.backgroundColor = function backgroundColor ( r, g, b, a )
{
  var settings = this.settings;
  var context  = this.context;

  context.save();
  context.fillStyle = new settings.color( r, g, b, a );
  context.setTransform( 1, 0, 0, 1, 0, 0 );
  context.fillRect( 0, 0, this.w, this.h );
  context.restore();

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#backgroundImage
 */
Renderer2D.prototype.backgroundImage = function backgroundImage ( image )
{
  var _rectAlignX = this._rectAlignX;
  var _rectAlignY = this._rectAlignY;

  this._rectAlignX = constants.get( 'CENTER' );
  this._rectAlignY = constants.get( 'MIDDLE' );

  this.image( image, this.w * 0.5, this.h * 0.5 );

  this._rectAlignX = _rectAlignX;
  this._rectAlignY = _rectAlignY;

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#clear
 */
Renderer2D.prototype.clear = function clear ()
{
  this.context.clear( 0, 0, this.w, this.h );
  return this;
};

/**
 * @override
 * @method v6.Renderer2D#drawArrays
 */
Renderer2D.prototype.drawArrays = function drawArrays ( verts, count, _mode, _sx, _sy )
{
  var context = this.context;
  var i;

  if ( count < 2 ) {
    return this;
  }

  if ( typeof _sx === 'undefined' ) {
    _sx = _sy = 1; // eslint-disable-line no-multi-assign
  }

  context.beginPath();
  context.moveTo( verts[ 0 ] * _sx, verts[ 1 ] * _sy );

  for ( i = 2, count *= 2; i < count; i += 2 ) {
    context.lineTo( verts[ i ] * _sx, verts[ i + 1 ] * _sy );
  }

  if ( this._doFill ) {
    this._fill();
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    this._stroke();
  }

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#drawImage
 */
Renderer2D.prototype.drawImage = function drawImage ( image, x, y, w, h )
{
  this.context.drawImage( image.get().image, image.sx, image.sy, image.sw, image.sh, x, y, w, h );
  return this;
};

/**
 * @override
 * @method v6.Renderer2D#rect
 */
Renderer2D.prototype.rect = function rect ( x, y, w, h )
{
  x = processRectAlignX( this, x, w );
  y = processRectAlignY( this, y, h );

  this.context.beginPath();
  this.context.rect( x, y, w, h );

  if ( this._doFill ) {
    this._fill();
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    this._stroke();
  }

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#arc
 */
Renderer2D.prototype.arc = function arc ( x, y, r )
{
  this.context.beginPath();
  this.context.arc( x, y, r, 0, Math.PI * 2 );

  if ( this._doFill ) {
    this._fill();
  }

  if ( this._doStroke && this._lineWidth > 0 ) {
    this._stroke();
  }

  return this;
};

/**
 * @override
 * @method v6.Renderer2D#line
 */
Renderer2D.prototype.line = function line ( x1, y1, x2, y2 )
{
  this.context.moveTo( x1, y1 );
  this.context.lineTo( x2, y2 );

  if ( this._doStroke && this._lineWidth > 0 ) {
    this._stroke();
  }

  return this;
};

Renderer2D.prototype._fill = function _fill ()
{
  this.context.fillStyle = this._fillColor;
  this.context.fill();
};

Renderer2D.prototype._stroke = function _stroke ()
{
  var context = this.context;

  context.strokeStyle = this._strokeColor;

  if ( ( context.lineWidth = this._lineWidth ) <= 1 ) {
    context.stroke();
  }

  context.stroke();
};

module.exports = Renderer2D;

},{"../constants":10,"./AbstractRenderer":25,"./internal/process_rect_align":34,"./settings":37,"peako/defaults":67}],27:[function(require,module,exports){
'use strict';

var defaults          = require( 'peako/defaults' );

var createArray       = require( '../internal/create_array' );

var ShaderProgram     = require( '../ShaderProgram' );
var Transform         = require( '../Transform' );
var constants         = require( '../constants' );
var shaders           = require( '../shaders' );

var processRectAlignX = require( './internal/process_rect_align' ).processRectAlignX;
var processRectAlignY = require( './internal/process_rect_align' ).processRectAlignY;

var AbstractRenderer  = require( './AbstractRenderer' );
var settings          = require( './settings' );

var rect = createArray( [
  0, 0,
  1, 0,
  1, 1,
  0, 1
] );

/**
 * WebGL рендерер.
 * @constructor v6.RendererGL
 * @extends v6.AbstractRenderer
 * @param {object} options {@link v6.settings.renderer}
 * @example
 * // Require RendererGL.
 * var RendererGL = require( 'v6.js/core/renderer/RendererGL' );
 * // Create an RendererGL isntance.
 * var renderer = new RendererGL();
 */
function RendererGL ( options )
{
  AbstractRenderer.create( this, ( options = defaults( settings, options ) ), constants.get( 'GL' ) );

  /**
   * Эта "transformation matrix" используется для {@link v6.RendererGL#rotate} и т.п.
   * @member {v6.Transform} v6.RendererGL#matrix
   */
  this.matrix = new Transform();

  /**
   * Буферы данных (вершин).
   * @member {object} v6.RendererGL#buffers
   * @property {WebGLBuffer} default Основной буфер.
   * @property {WebGLBuffer} rect    Используется для отрисовки прямоугольника в {@link v6.RendererGL#rect}.
   */
  this.buffers = {
    default: this.context.createBuffer(),
    rect:  this.context.createBuffer()
  };

  this.context.bindBuffer( this.context.ARRAY_BUFFER, this.buffers.rect );
  this.context.bufferData( this.context.ARRAY_BUFFER, rect, this.context.STATIC_DRAW );

  /**
   * Шейдеры (WebGL программы).
   * @member {object} v6.RendererGL#programs
   * @property {v6.ShaderProgram} default
   */
  this.programs = {
    default: new ShaderProgram( shaders.basic, this.context )
  };

  this.blending( options.blending );
}

RendererGL.prototype = Object.create( AbstractRenderer.prototype );
RendererGL.prototype.constructor = RendererGL;

/**
 * @override
 * @method v6.RendererGL#resize
 */
RendererGL.prototype.resize = function resize ( w, h )
{
  AbstractRenderer.prototype.resize.call( this, w, h );
  this.context.viewport( 0, 0, this.w, this.h );
  return this;
};

/**
 * @method v6.RendererGL#blending
 * @param {boolean} blending
 * @chainable
 */
RendererGL.prototype.blending = function blending ( blending )
{
  var gl = this.context;

  if ( blending ) {
    gl.enable( gl.BLEND );
    gl.disable( gl.DEPTH_TEST );
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
    gl.blendEquation( gl.FUNC_ADD );
  } else {
    gl.disable( gl.BLEND );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LEQUAL );
  }

  return this;
};

/**
 * Очищает контекст.
 * @private
 * @method v6.RendererGL#_clear
 * @param  {number} r Нормализованное значение "red channel".
 * @param  {number} g Нормализованное значение "green channel".
 * @param  {number} b Нормализованное значение "blue channel".
 * @param  {number} a Нормализованное значение прозрачности (alpha).
 * @return {void}     Ничего не возвращает.
 * @example
 * renderer._clear( 1, 0, 0, 1 ); // Fill context with red color.
 */
RendererGL.prototype._clear = function _clear ( r, g, b, a )
{
  var gl = this.context;
  gl.clearColor( r, g, b, a );
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT ); // eslint-disable-line no-bitwise
};

/**
 * @override
 * @method v6.RendererGL#backgroundColor
 */
RendererGL.prototype.backgroundColor = function backgroundColor ( r, g, b, a )
{
  var rgba = new this.settings.color( r, g, b, a ).rgba();
  this._clear( rgba[ 0 ] / 255, rgba[ 1 ] / 255, rgba[ 2 ] / 255, rgba[ 3 ] );
  return this;
};

/**
 * @override
 * @method v6.RendererGL#clear
 */
RendererGL.prototype.clear = function clear ()
{
  this._clear( 0, 0, 0, 0 );
  return this;
};

/**
 * @override
 * @method v6.RendererGL#drawArrays
 */
RendererGL.prototype.drawArrays = function drawArrays ( verts, count, mode, _sx, _sy )
{
  var program = this.programs.default;
  var gl      = this.context;

  if ( count < 2 ) {
    return this;
  }

  if ( verts ) {
    if ( typeof mode === 'undefined' ) {
      mode = gl.STATIC_DRAW;
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, this.buffers.default );
    gl.bufferData( gl.ARRAY_BUFFER, verts, mode );
  }

  if ( typeof _sx !== 'undefined' ) {
    this.matrix.scale( _sx, _sy );
  }

  program
    .use()
    .setUniform( 'utransform', this.matrix.matrix )
    .setUniform( 'ures', [ this.w, this.h ] )
    .setAttribute( 'apos', 2, gl.FLOAT, false, 0, 0 );

  this._fill( count );
  this._stroke( count );

  return this;
};

RendererGL.prototype._fill = function _fill ( count )
{
  if ( this._doFill ) {
    this.programs.default.setUniform( 'ucolor', this._fillColor.rgba() );
    this.context.drawArrays( this.context.TRIANGLE_FAN, 0, count );
  }
};

RendererGL.prototype._stroke = function _stroke ( count )
{
  if ( this._doStroke && this._lineWidth > 0 ) {
    this.programs.default.setUniform( 'ucolor', this._strokeColor.rgba() );
    this.context.lineWidth( this._lineWidth );
    this.context.drawArrays( this.context.LINE_LOOP, 0, count );
  }
};

/**
 * @override
 * @method v6.RendererGL#arc
 */
RendererGL.prototype.arc = function arc ( x, y, r )
{
  return this.drawPolygon( x, y, r, r, 24, 0 );
};

/**
 * @override
 * @method v6.RendererGL#line
 */
RendererGL.prototype.line = function line ( x1, y1, x2, y2 )
{
  this.drawArrays( createArray( [
    x1, y1,
    x2, y2
  ] ), 2, this.context.STATIC_DRAW );

  return this;
};

/**
 * @override
 * @method v6.RendererGL#rect
 */
RendererGL.prototype.rect = function rect ( x, y, w, h )
{
  x = processRectAlignX( this, x, w );
  y = processRectAlignY( this, y, h );
  this.matrix.save();
  this.matrix.translate( x, y );
  this.matrix.scale( w, h );
  this.context.bindBuffer( this.context.ARRAY_BUFFER, this.buffers.rect );
  this.drawArrays( null, 4 );
  this.matrix.restore();
  return this;
};

module.exports = RendererGL;

},{"../ShaderProgram":1,"../Transform":3,"../constants":10,"../internal/create_array":15,"../shaders":41,"./AbstractRenderer":25,"./internal/process_rect_align":34,"./settings":37,"peako/defaults":67}],28:[function(require,module,exports){
'use strict';

var constants       = require( '../constants' );

var report          = require( '../internal/report' );

var getRendererType = require( './internal/get_renderer_type' );
var getWebGL        = require( './internal/get_webgl' );

var RendererGL      = require( './RendererGL' );
var Renderer2D      = require( './Renderer2D' );
var type            = require( './settings' ).type;

/**
 * Создает новый рендерер. Если создать WebGL контекст не получится, то будет использован 2D.
 * @method v6.createRenderer
 * @param  {object}              options {@link v6.settings.renderer}.
 * @return {v6.AbstractRenderer}         Новый рендерер (2D, GL).
 * @example
 * var createRenderer = require( 'v6.js/core/renderer/create_renderer' );
 * var constants      = require( 'v6.js/core/constants' );
 * @example <caption>Creating WebGL or 2D renderer based on platform and browser</caption>
 * var renderer = createRenderer( { type: constants.get( 'AUTO' ) } );
 * @example <caption>Creating WebGL renderer</caption>
 * var renderer = createRenderer( { type: constants.get( 'GL' ) } );
 * @example <caption>Creating 2D renderer</caption>
 * var renderer = createRenderer( { type: constants.get( '2D' ) } );
 */
function createRenderer ( options )
{
  var type_ = ( options && options.type ) || type;

  if ( type_ === constants.get( 'AUTO' ) ) {
    type_ = getRendererType();
  }

  if ( type_ === constants.get( 'GL' ) ) {
    if ( getWebGL() ) {
      return new RendererGL( options );
    }

    report( 'Cannot create WebGL context. Falling back to 2D.' );
  }

  if ( type_ === constants.get( '2D' ) || type_ === constants.get( 'GL' ) ) {
    return new Renderer2D( options );
  }

  throw Error( 'Got unknown renderer type. The known are: 2D and GL' );
}

module.exports = createRenderer;

},{"../constants":10,"../internal/report":20,"./Renderer2D":26,"./RendererGL":27,"./internal/get_renderer_type":32,"./internal/get_webgl":33,"./settings":37}],29:[function(require,module,exports){
'use strict';

/**
 * Закрывает фигуру.
 * @private
 * @method closeShape
 * @param  {v6.AbstractRenderer} renderer Рендерер.
 * @return {void}                         Ничего не возвращает.
 */
function closeShape ( renderer )
{
  if ( ! renderer._closedShape ) {
    renderer._closedShape = renderer._vertices.slice();
    renderer._closedShape.push( renderer._closedShape[ 0 ] );
  }
}

module.exports = closeShape;

},{}],30:[function(require,module,exports){
'use strict';

/**
 * Копирует drawing settings (_lineWidth, _rectAlignX, и т.д.) из `source` в `target`.
 * @private
 * @method copyDrawingSettings
 * @param  {object}  target Может быть `AbstractRenderer` или простым объектом с сохраненными через
 *                          эту функцию настройками.
 * @param  {object}  source Описание то же, что и для `target`.
 * @param  {boolean} [deep] Если `true`, то будет также копировать _fillColor, _strokeColor и т.д.
 * @return {object}         Возвращает `target`.
 */
function copyDrawingSettings ( target, source, deep )
{
  if ( deep ) {
    target._fillColor[ 0 ]   = source._fillColor[ 0 ];
    target._fillColor[ 1 ]   = source._fillColor[ 1 ];
    target._fillColor[ 2 ]   = source._fillColor[ 2 ];
    target._fillColor[ 3 ]   = source._fillColor[ 3 ];
    target._strokeColor[ 0 ] = source._strokeColor[ 0 ];
    target._strokeColor[ 1 ] = source._strokeColor[ 1 ];
    target._strokeColor[ 2 ] = source._strokeColor[ 2 ];
    target._strokeColor[ 3 ] = source._strokeColor[ 3 ];
  }

  target._backgroundPositionX = source._backgroundPositionX;
  target._backgroundPositionY = source._backgroundPositionY;
  target._rectAlignX          = source._rectAlignX;
  target._rectAlignY          = source._rectAlignY;
  target._lineWidth           = source._lineWidth;
  target._doStroke            = source._doStroke;
  target._doFill              = source._doFill;

  return target;
}

module.exports = copyDrawingSettings;

},{}],31:[function(require,module,exports){
'use strict';

var constants = require( '../../constants' );

var defaultDrawingSettings = {
  _backgroundPositionX: constants.get( 'LEFT' ),
  _backgroundPositionY: constants.get( 'TOP' ),
  _rectAlignX:          constants.get( 'LEFT' ),
  _rectAlignY:          constants.get( 'TOP' ),
  _lineWidth:           2,
  _doStroke:            true,
  _doFill:              true
};

module.exports = defaultDrawingSettings;

},{"../../constants":10}],32:[function(require,module,exports){
'use strict';

var once      = require( 'peako/once' );

var constants = require( '../../constants' );

// "platform" not included using <script /> tag.
if ( typeof platform === 'undefined' ) { // eslint-disable-line no-use-before-define
  var platform; // eslint-disable-line vars-on-top

  try {
    platform = require( 'platform' ); // eslint-disable-line global-require
  } catch ( error ) {
    // "platform" not installed using NPM.
  }
}

function getRendererType ()
{
  var safari, touchable;

  if ( platform ) {
    safari = platform.os &&
      platform.os.family === 'iOS' &&
      platform.name === 'Safari';
  }

  if ( typeof window !== 'undefined' ) {
    touchable = 'ontouchend' in window;
  }

  if ( touchable && ! safari ) {
    return constants.get( 'GL' );
  }

  return constants.get( '2D' );
}

module.exports = once( getRendererType );

},{"../../constants":10,"peako/once":91,"platform":"platform"}],33:[function(require,module,exports){
'use strict';

var once = require( 'peako/once' );

/**
 * Возвращает имя поддерживаемого WebGL контекста, например: 'experimental-webgl'.
 * @private
 * @method getWebGL
 * @return {string?} В случае неудачи (WebGL не поддерживается) - вернет `null`.
 */
function getWebGL ()
{
  var canvas = document.createElement( 'canvas' );
  var name   = null;

  if ( canvas.getContext( 'webgl' ) ) {
    name = 'webgl';
  } else if ( canvas.getContext( 'experimental-webgl' ) ) {
    name = 'experimental-webgl';
  }

  // Fixing possible memory leak.
  canvas = null;
  return name;
}

module.exports = once( getWebGL );

},{"peako/once":91}],34:[function(require,module,exports){
/* eslint lines-around-directive: off */
/* eslint lines-around-comment: off */
'use strict';
var constants = require( '../../constants' );
/**
 * @private
 * @method processRectAlignX
 * @param  {v6.AbstractRenderer} renderer
 * @param  {number}              x
 * @param  {number}              w
 * @return {number}
 */
exports.processRectAlignX = function processRectAlignX ( renderer, x, w ) { if ( renderer._rectAlignX === constants.get( "CENTER" ) ) { x -= w * 0.5; } else if ( renderer._rectAlignX === constants.get( "RIGHT" ) ) { x -= w; } else if ( renderer._rectAlignX !== constants.get( "LEFT" ) ) { throw Error( 'Unknown " +' + "rectAlignX" + '": ' + renderer._rectAlignX ); } return Math.floor( x ); }; // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len
/**
 * @private
 * @method processRectAlignY
 * @param  {v6.AbstractRenderer} renderer
 * @param  {number}              y
 * @param  {number}              h
 * @return {number}
 */
exports.processRectAlignY = function processRectAlignY ( renderer, x, w ) { if ( renderer._rectAlignY === constants.get( "MIDDLE" ) ) { x -= w * 0.5; } else if ( renderer._rectAlignY === constants.get( "BOTTOM" ) ) { x -= w; } else if ( renderer._rectAlignY !== constants.get( "TOP" ) ) { throw Error( 'Unknown " +' + "rectAlignY" + '": ' + renderer._rectAlignY ); } return Math.floor( x ); }; // eslint-disable-line brace-rules/brace-on-same-line, no-useless-concat, quotes, max-statements-per-line, max-len

},{"../../constants":10}],35:[function(require,module,exports){
'use strict';

var GL = require( '../../constants' ).get( 'GL' );

/**
 * Обрабатывает фигуру.
 * @private
 * @method processShape
 * @param  {v6.AbstractRenderer} renderer Рендерер.
 * @param  {Array|Float32Array}  vertices Вершины.
 * @return {Array|Float32Array}           Обработанные вершины.
 */
function processShape ( renderer, vertices )
{
  if ( renderer.type === GL && typeof Float32Array === 'function' && ! ( vertices instanceof Float32Array ) ) { // eslint-disable-line no-undef
    vertices = new Float32Array( vertices );                                                                    // eslint-disable-line no-undef
  }

  return vertices;
}

module.exports = processShape;

},{"../../constants":10}],36:[function(require,module,exports){
'use strict';

var defaultDrawingSettings = require( './default_drawing_settings' );
var copyDrawingSettings    = require( './copy_drawing_settings' );

/**
 * Устанавливает drawing settings по умолчанию в `target`.
 * @private
 * @method setDefaultDrawingSettings
 * @param  {object}                          target   Может быть `AbstractRenderer` или простым
 *                                                    объектом.
 * @param  {module:"v6.js".AbstractRenderer} renderer `RendererGL` или `Renderer2D` нужны для
 *                                                    установки _strokeColor, _fillColor.
 * @return {object}                                   Возвращает `target`.
 */
function setDefaultDrawingSettings ( target, renderer )
{

  copyDrawingSettings( target, defaultDrawingSettings );

  target._strokeColor = new renderer.settings.color();
  target._fillColor   = new renderer.settings.color();

  return target;

}

module.exports = setDefaultDrawingSettings;

},{"./copy_drawing_settings":30,"./default_drawing_settings":31}],37:[function(require,module,exports){
'use strict';

var color = require( '../color/RGBA' );
var type  = require( '../constants' ).get( '2D' );

/**
 * Настройки для рендереров: {@link v6.Renderer2D}, {@link v6.RendererGL}, {@link v6.AbstractRenderer}, {@link v6.createRenderer}.
 * @namespace v6.settings.renderer
 */

/**
 * @member   {object} [v6.settings.renderer.settings] Настройки рендерера по умолчанию.
 * @property {object} [color={@link v6.RGBA}]         Конструкторы {@link v6.RGBA} или {@link v6.HSLA}.
 * @property {number} [scale=1]                       Плотность пикселей рендерера, например: `devicePixelRatio`.
 */
exports.settings = {
  color: color,
  scale: 1
};

/**
 * Пока не сделано.
 * @member {boolean} [v6.settings.renderer.antialias=true]
 */
exports.antialias = true;

/**
 * Пока не сделано.
 * @member {boolean} [v6.settings.renderer.blending=true]
 */
exports.blending = true;

/**
 * Использовать градусы вместо радианов.
 * @member {boolean} [v6.settings.renderer.degrees=false]
 */
exports.degrees = false;

/**
 * Использовать прозрачный (вместо черного) контекст.
 * @member {boolean} [v6.settings.renderer.alpha=true]
 */
exports.alpha = true;

/**
 * Тип контекста (2D, GL, AUTO).
 * @member {constant} [v6.settings.renderer.type=2D]
 */
exports.type = type;

/**
 * В этот элемент будет добавлен `canvas`.
 * @member {Element?} [v6.settings.renderer.appendTo]
 */

},{"../color/RGBA":7,"../constants":10}],38:[function(require,module,exports){
'use strict';

/**
 * @member v6.shapes.drawLines
 * @example
 * shapes.drawLines( renderer, vertices );
 */
function drawLines ()
{
  throw Error( 'Not implemented' );
}

module.exports = drawLines;

},{}],39:[function(require,module,exports){
'use strict';

/**
 * @member v6.shapes.drawPoints
 * @example
 * shapes.drawPoints( renderer, vertices );
 */
function drawPoints ()
{
  throw Error( 'Not implemented' );
}

module.exports = drawPoints;

},{}],40:[function(require,module,exports){
'use strict';

/**
 * Главные настройки "v6.js".
 * @namespace v6.settings.core
 */

/**
 * Использовать градусы вместо радианов.
 * @member {boolean} v6.settings.core.degrees
 */
exports.degress = false;

},{}],41:[function(require,module,exports){
'use strict';

/**
 * @interface IShaderSources
 * @property {string} vert Исходник вершинного (vertex) шейдера.
 * @property {string} frag Исходник фрагментного (fragment) шейдера.
 */

/**
 * WebGL шейдеры.
 * @member {object} v6.shaders
 * @property {IShaderSources} basic      Стандартные шейдеры.
 * @property {IShaderSources} background Шейдеры для отрисовки фона.
 */
var shaders = {
  basic: {
    vert: 'precision mediump float;attribute vec2 apos;uniform vec2 ures;uniform mat3 utransform;void main(){gl_Position=vec4(((utransform*vec3(apos,1.0)).xy/ures*2.0-1.0)*vec2(1,-1),0,1);}',
    frag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=vec4(ucolor.rgb/255.0,ucolor.a);}'
  },

  background: {
    vert: 'precision mediump float;attribute vec2 apos;void main(){gl_Position = vec4(apos,0,1);}',
    frag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=ucolor;}'
  }
};

module.exports = shaders;

},{}],42:[function(require,module,exports){
/*!
 * Copyright (c) 2017-2018 Vladislav Tikhiy (SILENT)
 * Released under the GPL-3.0 license.
 * https://github.com/tikhiy/v6.js/tree/dev/
 */

'use strict';

/**
 * @namespace v6
 */

exports.AbstractImage    = require( './core/image/AbstractImage' );
exports.AbstractRenderer = require( './core/renderer/AbstractRenderer' );
exports.AbstractVector   = require( './core/math/AbstractVector' );
exports.Camera           = require( './core/camera/Camera' );
exports.CompoundedImage  = require( './core/image/CompoundedImage' );
exports.HSLA             = require( './core/color/HSLA' );
exports.Image            = require( './core/image/Image' );
exports.RGBA             = require( './core/color/RGBA' );
exports.Renderer2D       = require( './core/renderer/Renderer2D' );
exports.RendererGL       = require( './core/renderer/RendererGL' );
exports.ShaderProgram    = require( './core/ShaderProgram' );
exports.Ticker           = require( './core/Ticker' );
exports.Transform        = require( './core/Transform' );
exports.Vector2D         = require( './core/math/Vector2D' );
exports.Vector3D         = require( './core/math/Vector3D' );
exports.constants        = require( './core/constants' );
exports.createRenderer   = require( './core/renderer/create_renderer' );
exports.shaders          = require( './core/shaders' );
exports.mat3             = require( './core/math/mat3' );

/**
 * "v6.js" built-in drawing functions.
 * @namespace v6.shapes
 * @see v6.AbstractRenderer#beginShape
 * @see v6.AbstractRenderer#vertex
 * @see v6.AbstractRenderer#endShape
 * @example
 * var shapes = require( 'v6.js/core/renderer/shapes' );
 * @example
 * renderer.beginShape( {
 *   drawFunction: shapes.drawPoints
 * } );
 */
exports.shapes = {
  drawPoints: require( './core/renderer/shapes/draw_points' ),
  drawLines:  require( './core/renderer/shapes/draw_lines' )
};

/**
 * Настройки "v6.js".
 * @namespace v6.settings
 * @example <caption>Core Settings</caption>
 * var settings = require( 'v6.js/core/settings' );
 * settings.degrees = true;
 * @example <caption>Renderer Settings</caption>
 * // Default renderer settings.
 * var settings = require( 'v6.js/core/renderer/settings' );
 * settings.degrees = true;
 */
exports.settings = {
  renderer: require( './core/renderer/settings' ),
  camera:   require( './core/camera/settings' ),
  core:     require( './core/settings' )
};

if ( typeof self !== 'undefined' ) {
  self.v6 = exports;
}

/**
 * @typedef {string|v6.HSLA|v6.RGBA} TColor
 * @example <caption>A string (CSS color).</caption>
 * var color = 'rgba( 255, 0, 255, 1 )';
 * var color = 'hsl( 360, 100%, 50% )';
 * var color = '#ff00ff';
 * var color = 'lightpink';
 * // "rgba(0, 0, 0, 0)"
 * var color = getComputedStyle( document.body ).getPropertyValue( 'background-color' );
 * // The same as "transparent".
 * // NOTE: CSS does not support this syntax but "v6.js" does.
 * var color = '#00000000';
 * @example <caption>An object (v6.RGBA, v6.HSLA)</caption>
 * var color = new RGBA( 255, 0, 255, 1 );
 * var color = new HSLA( 360, 100, 50 );
 */

/**
 * @typedef {number} constant
 * @see v6.constants
 * @example
 * // This is a constant.
 * var RENDERER_TYPE = constants.get( 'GL' );
 */

/**
 * @interface IVector2D
 * @property {number} x
 * @property {number} y
 */

},{"./core/ShaderProgram":1,"./core/Ticker":2,"./core/Transform":3,"./core/camera/Camera":4,"./core/camera/settings":5,"./core/color/HSLA":6,"./core/color/RGBA":7,"./core/constants":10,"./core/image/AbstractImage":11,"./core/image/CompoundedImage":12,"./core/image/Image":13,"./core/math/AbstractVector":21,"./core/math/Vector2D":22,"./core/math/Vector3D":23,"./core/math/mat3":24,"./core/renderer/AbstractRenderer":25,"./core/renderer/Renderer2D":26,"./core/renderer/RendererGL":27,"./core/renderer/create_renderer":28,"./core/renderer/settings":37,"./core/renderer/shapes/draw_lines":38,"./core/renderer/shapes/draw_points":39,"./core/settings":40,"./core/shaders":41}],43:[function(require,module,exports){
'use strict';

/**
 * A lightweight implementation of Node.js EventEmitter.
 * @constructor LightEmitter
 * @example
 * var LightEmitter = require( 'light_emitter' );
 */
function LightEmitter () {}

LightEmitter.prototype = {
  /**
   * @method LightEmitter#emit
   * @param {string} type
   * @param {...any} [data]
   * @chainable
   */
  emit: function emit ( type ) {
    var list = _getList( this, type );
    var data, i, l;

    if ( ! list ) {
      return this;
    }

    if ( arguments.length > 1 ) {
      data = [].slice.call( arguments, 1 );
    }

    for ( i = 0, l = list.length; i < l; ++i ) {
      if ( ! list[ i ].active ) {
        continue;
      }

      if ( list[ i ].once ) {
        list[ i ].active = false;
      }

      if ( data ) {
        list[ i ].listener.apply( this, data );
      } else {
        list[ i ].listener.call( this );
      }
    }

    return this;
  },

  /**
   * @method LightEmitter#off
   * @param {string}   [type]
   * @param {function} [listener]
   * @chainable
   */
  off: function off ( type, listener ) {
    var list, i;

    if ( ! type ) {
      this._events = null;
    } else if ( ( list = _getList( this, type ) ) ) {
      if ( listener ) {
        for ( i = list.length - 1; i >= 0; --i ) {
          if ( list[ i ].listener === listener && list[ i ].active ) {
            list[ i ].active = false;
          }
        }
      } else {
        list.length = 0;
      }
    }

    return this;
  },

  /**
   * @method LightEmitter#on
   * @param {string}   type
   * @param {function} listener
   * @chainable
   */
  on: function on ( type, listener ) {
    _on( this, type, listener );
    return this;
  },

  /**
   * @method LightEmitter#once
   * @param {string}   type
   * @param {function} listener
   * @chainable
   */
  once: function once ( type, listener ) {
    _on( this, type, listener, true );
    return this;
  },

  constructor: LightEmitter
};

/**
 * @private
 * @method _on
 * @param  {LightEmitter} self
 * @param  {string}       type
 * @param  {function}     listener
 * @param  {boolean}      once
 * @return {void}
 */
function _on ( self, type, listener, once ) {
  var entity = {
    listener: listener,
    active:   true,
    type:     type,
    once:     once
  };

  if ( ! self._events ) {
    self._events = Object.create( null );
  }

  if ( ! self._events[ type ] ) {
    self._events[ type ] = [];
  }

  self._events[ type ].push( entity );
}

/**
 * @private
 * @method _getList
 * @param  {LightEmitter}   self
 * @param  {string}         type
 * @return {array<object>?}
 */
function _getList ( self, type ) {
  return self._events && self._events[ type ];
}

module.exports = LightEmitter;

},{}],44:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString;

module.exports = function _throwArgumentException ( unexpected, expected ) {
  throw Error( '"' + toString.call( unexpected ) + '" is not ' + expected );
};

},{}],45:[function(require,module,exports){
'use strict';

var type = require( './type' );
var lastRes = 'undefined';
var lastVal;

module.exports = function _type ( val ) {
  if ( val === lastVal ) {
    return lastRes;
  }

  return ( lastRes = type( lastVal = val ) );
};

},{"./type":100}],46:[function(require,module,exports){
'use strict';

module.exports = function _unescape ( string ) {
  return string.replace( /\\(\\)?/g, '$1' );
};

},{}],47:[function(require,module,exports){
'use strict';

var isset = require( '../isset' );

var undefined; // jshint ignore: line

var defineGetter = Object.prototype.__defineGetter__,
    defineSetter = Object.prototype.__defineSetter__;

function baseDefineProperty ( object, key, descriptor ) {
  var hasGetter = isset( 'get', descriptor ),
      hasSetter = isset( 'set', descriptor ),
      get, set;

  if ( hasGetter || hasSetter ) {
    if ( hasGetter && typeof ( get = descriptor.get ) !== 'function' ) {
      throw TypeError( 'Getter must be a function: ' + get );
    }

    if ( hasSetter && typeof ( set = descriptor.set ) !== 'function' ) {
      throw TypeError( 'Setter must be a function: ' + set );
    }

    if ( isset( 'writable', descriptor ) ) {
      throw TypeError( 'Invalid property descriptor. Cannot both specify accessors and a value or writable attribute' );
    }

    if ( defineGetter ) {
      if ( hasGetter ) {
        defineGetter.call( object, key, get );
      }

      if ( hasSetter ) {
        defineSetter.call( object, key, set );
      }
    } else {
      throw Error( 'Cannot define getter or setter' );
    }
  } else if ( isset( 'value', descriptor ) ) {
    object[ key ] = descriptor.value;
  } else if ( ! isset( key, object ) ) {
    object[ key ] = undefined;
  }

  return object;
}

module.exports = baseDefineProperty;

},{"../isset":84}],48:[function(require,module,exports){
'use strict';

module.exports = function baseExec ( regexp, string ) {
  var result = [],
      value;

  regexp.lastIndex = 0;

  while ( ( value = regexp.exec( string ) ) ) {
    result.push( value );
  }

  return result;
};

},{}],49:[function(require,module,exports){
'use strict';

var callIteratee = require( '../call-iteratee' ),
    isset        = require( '../isset' );

module.exports = function baseForEach ( arr, fn, ctx, fromRight ) {
  var i, j, idx;

  for ( i = -1, j = arr.length - 1; j >= 0; --j ) {
    if ( fromRight ) {
      idx = j;
    } else {
      idx = ++i;
    }

    if ( isset( idx, arr ) && callIteratee( fn, ctx, arr[ idx ], idx, arr ) === false ) {
      break;
    }
  }

  return arr;
};

},{"../call-iteratee":57,"../isset":84}],50:[function(require,module,exports){
'use strict';

var callIteratee = require( '../call-iteratee' );

module.exports = function baseForIn ( obj, fn, ctx, fromRight, keys ) {
  var i, j, key;

  for ( i = -1, j = keys.length - 1; j >= 0; --j ) {
    if ( fromRight ) {
      key = keys[ j ];
    } else {
      key = keys[ ++i ];
    }

    if ( callIteratee( fn, ctx, obj[ key ], key, obj ) === false ) {
      break;
    }
  }

  return obj;
};

},{"../call-iteratee":57}],51:[function(require,module,exports){
'use strict';

var isset = require( '../isset' );

module.exports = function baseGet ( obj, path, off ) {
  var l = path.length - off,
      i = 0,
      key;

  for ( ; i < l; ++i ) {
    key = path[ i ];

    if ( isset( key, obj ) ) {
      obj = obj[ key ];
    } else {
      return;
    }
  }

  return obj;
};

},{"../isset":84}],52:[function(require,module,exports){
'use strict';

var baseToIndex = require( './base-to-index' );

var indexOf     = Array.prototype.indexOf,
    lastIndexOf = Array.prototype.lastIndexOf;

function baseIndexOf ( arr, search, fromIndex, fromRight ) {
  var l, i, j, idx, val;

  // use the native function if it is supported and the search is not nan.

  if ( search === search && ( idx = fromRight ? lastIndexOf : indexOf ) ) {
    return idx.call( arr, search, fromIndex );
  }

  l = arr.length;

  if ( ! l ) {
    return -1;
  }

  j = l - 1;

  if ( typeof fromIndex !== 'undefined' ) {
    fromIndex = baseToIndex( fromIndex, l );

    if ( fromRight ) {
      j = Math.min( j, fromIndex );
    } else {
      j = Math.max( 0, fromIndex );
    }

    i = j - 1;
  } else {
    i = -1;
  }

  for ( ; j >= 0; --j ) {
    if ( fromRight ) {
      idx = j;
    } else {
      idx = ++i;
    }

    val = arr[ idx ];

    if ( val === search || search !== search && val !== val ) {
      return idx;
    }
  }

  return -1;
}

module.exports = baseIndexOf;

},{"./base-to-index":55}],53:[function(require,module,exports){
'use strict';

var baseIndexOf = require( './base-index-of' );

var support = require( '../support/support-keys' );

var hasOwnProperty = Object.prototype.hasOwnProperty;

var k, fixKeys;

if ( support === 'not-supported' ) {
  k = [
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'constructor'
  ];

  fixKeys = function fixKeys ( keys, object ) {
    var i, key;

    for ( i = k.length - 1; i >= 0; --i ) {
      if ( baseIndexOf( keys, key = k[ i ] ) < 0 && hasOwnProperty.call( object, key ) ) {
        keys.push( key );
      }
    }

    return keys;
  };
}

module.exports = function baseKeys ( object ) {
  var keys = [];

  var key;

  for ( key in object ) {
    if ( hasOwnProperty.call( object, key ) ) {
      keys.push( key );
    }
  }

  if ( support !== 'not-supported' ) {
    return keys;
  }

  return fixKeys( keys, object );
};

},{"../support/support-keys":95,"./base-index-of":52}],54:[function(require,module,exports){
'use strict';

var get = require( './base-get' );

module.exports = function baseProperty ( object, path ) {
  if ( object != null ) {
    if ( path.length > 1 ) {
      return get( object, path, 0 );
    }

    return object[ path[ 0 ] ];
  }
};

},{"./base-get":51}],55:[function(require,module,exports){
'use strict';

module.exports = function baseToIndex ( v, l ) {
  if ( ! l || ! v ) {
    return 0;
  }

  if ( v < 0 ) {
    v += l;
  }

  return v || 0;
};

},{}],56:[function(require,module,exports){
'use strict';

var _throwArgumentException = require( './_throw-argument-exception' );
var defaultTo = require( './default-to' );

module.exports = function before ( n, fn ) {
  var value;

  if ( typeof fn !== 'function' ) {
    _throwArgumentException( fn, 'a function' );
  }

  n = defaultTo( n, 1 );

  return function () {
    if ( --n >= 0 ) {
      value = fn.apply( this, arguments );
    }

    return value;
  };
};

},{"./_throw-argument-exception":44,"./default-to":66}],57:[function(require,module,exports){
'use strict';

module.exports = function callIteratee ( fn, ctx, val, key, obj ) {
  if ( typeof ctx === 'undefined' ) {
    return fn( val, key, obj );
  }

  return fn.call( ctx, val, key, obj );
};

},{}],58:[function(require,module,exports){
'use strict';

var baseExec  = require( './base/base-exec' ),
    _unescape = require( './_unescape' ),
    isKey     = require( './is-key' ),
    toKey     = require( './to-key' ),
    _type     = require( './_type' );

var rProperty = /(^|\.)\s*([_a-z]\w*)\s*|\[\s*((?:-)?(?:\d+|\d*\.\d+)|("|')(([^\\]\\(\\\\)*|[^\4])*)\4)\s*\]/gi;

function stringToPath ( str ) {
  var path = baseExec( rProperty, str ),
      i = path.length - 1,
      val;

  for ( ; i >= 0; --i ) {
    val = path[ i ];

    // .name
    if ( val[ 2 ] ) {
      path[ i ] = val[ 2 ];
    // [ "" ] || [ '' ]
    } else if ( val[ 5 ] != null ) {
      path[ i ] = _unescape( val[ 5 ] );
    // [ 0 ]
    } else {
      path[ i ] = val[ 3 ];
    }
  }

  return path;
}

function castPath ( val ) {
  var path, l, i;

  if ( isKey( val ) ) {
    return [ toKey( val ) ];
  }

  if ( _type( val ) === 'array' ) {
    path = Array( l = val.length );

    for ( i = l - 1; i >= 0; --i ) {
      path[ i ] = toKey( val[ i ] );
    }
  } else {
    path = stringToPath( '' + val );
  }

  return path;
}

module.exports = castPath;

},{"./_type":45,"./_unescape":46,"./base/base-exec":48,"./is-key":76,"./to-key":98}],59:[function(require,module,exports){
'use strict';

module.exports = function clamp ( value, lower, upper ) {
  if ( value >= upper ) {
    return upper;
  }

  if ( value <= lower ) {
    return lower;
  }

  return value;
};

},{}],60:[function(require,module,exports){
'use strict';

var create         = require( './create' ),
    getPrototypeOf = require( './get-prototype-of' ),
    toObject       = require( './to-object' ),
    each           = require( './each' ),
    isObjectLike   = require( './is-object-like' );

module.exports = function clone ( deep, target, guard ) {
  var cln;

  if ( typeof target === 'undefined' || guard ) {
    target = deep;
    deep = true;
  }

  cln = create( getPrototypeOf( target = toObject( target ) ) );

  each( target, function ( value, key, target ) {
    if ( value === target ) {
      this[ key ] = this;
    } else if ( deep && isObjectLike( value ) ) {
      this[ key ] = clone( deep, value );
    } else {
      this[ key ] = value;
    }
  }, cln );

  return cln;
};

},{"./create":62,"./each":69,"./get-prototype-of":72,"./is-object-like":78,"./to-object":99}],61:[function(require,module,exports){
'use strict';

module.exports = {
  ERR: {
    INVALID_ARGS:          'Invalid arguments',
    FUNCTION_EXPECTED:     'Expected a function',
    STRING_EXPECTED:       'Expected a string',
    UNDEFINED_OR_NULL:     'Cannot convert undefined or null to object',
    REDUCE_OF_EMPTY_ARRAY: 'Reduce of empty array with no initial value',
    NO_PATH:               'No path was given'
  },

  MAX_ARRAY_LENGTH: 4294967295,
  MAX_SAFE_INT:     9007199254740991,
  MIN_SAFE_INT:    -9007199254740991,

  DEEP:         1,
  DEEP_KEEP_FN: 2,

  PLACEHOLDER: {}
};

},{}],62:[function(require,module,exports){
'use strict';

var defineProperties = require( './define-properties' );

var setPrototypeOf = require( './set-prototype-of' );

var isPrimitive = require( './is-primitive' );

function C () {}

module.exports = Object.create || function create ( prototype, descriptors ) {
  var object;

  if ( prototype !== null && isPrimitive( prototype ) ) {
    throw TypeError( 'Object prototype may only be an Object or null: ' + prototype );
  }

  C.prototype = prototype;

  object = new C();

  C.prototype = null;

  if ( prototype === null ) {
    setPrototypeOf( object, null );
  }

  if ( arguments.length >= 2 ) {
    defineProperties( object, descriptors );
  }

  return object;
};

},{"./define-properties":68,"./is-primitive":81,"./set-prototype-of":93}],63:[function(require,module,exports){
'use strict';

var baseForEach  = require( '../base/base-for-each' ),
    baseForIn    = require( '../base/base-for-in' ),
    isArrayLike  = require( '../is-array-like' ),
    toObject     = require( '../to-object' ),
    iteratee     = require( '../iteratee' ).iteratee,
    keys         = require( '../keys' );

module.exports = function createEach ( fromRight ) {
  return function each ( obj, fn, ctx ) {

    obj = toObject( obj );

    fn  = iteratee( fn );

    if ( isArrayLike( obj ) ) {
      return baseForEach( obj, fn, ctx, fromRight );
    }

    return baseForIn( obj, fn, ctx, fromRight, keys( obj ) );

  };
};

},{"../base/base-for-each":49,"../base/base-for-in":50,"../is-array-like":74,"../iteratee":85,"../keys":86,"../to-object":99}],64:[function(require,module,exports){
'use strict';

/**
 * @param {string} name Must be 'Width' or 'Height' (capitalized).
 */
module.exports = function createGetElementDimension ( name ) {

  /**
   * @param {Window|Node} e
   */
  return function ( e ) {

    var v, b, d;

    // if the element is a window

    if ( e.window === e ) {

      // innerWidth and innerHeight includes a scrollbar width, but it is not
      // supported by older browsers

      v = Math.max( e[ 'inner' + name ] || 0, e.document.documentElement[ 'client' + name ] );

    // if the elements is a document

    } else if ( e.nodeType === 9 ) {

      b = e.body;
      d = e.documentElement;

      v = Math.max(
        b[ 'scroll' + name ],
        d[ 'scroll' + name ],
        b[ 'offset' + name ],
        d[ 'offset' + name ],
        b[ 'client' + name ],
        d[ 'client' + name ] );

    } else {
      v = e[ 'client' + name ];
    }

    return v;

  };
};

},{}],65:[function(require,module,exports){
'use strict';

var castPath = require( '../cast-path' ),
    noop     = require( '../noop' );

module.exports = function createProperty ( baseProperty, useArgs ) {
  return function ( path ) {
    var args;

    if ( ! ( path = castPath( path ) ).length ) {
      return noop;
    }

    if ( useArgs ) {
      args = Array.prototype.slice.call( arguments, 1 );
    }

    return function ( object ) {
      return baseProperty( object, path, args );
    };
  };
};

},{"../cast-path":58,"../noop":89}],66:[function(require,module,exports){
'use strict';

module.exports = function defaultTo ( value, defaultValue ) {
  if ( value != null && value === value ) {
    return value;
  }

  return defaultValue;
};

},{}],67:[function(require,module,exports){
'use strict';

var mixin = require( './mixin' ),
    clone = require( './clone' );

module.exports = function defaults ( defaults, object ) {
  if ( object == null ) {
    return clone( true, defaults );
  }

  return mixin( true, clone( true, defaults ), object );
};

},{"./clone":60,"./mixin":88}],68:[function(require,module,exports){
'use strict';

var support = require( './support/support-define-property' );

var defineProperties, baseDefineProperty, isPrimitive, each;

if ( support !== 'full' ) {
  isPrimitive        = require( './is-primitive' );
  each               = require( './each' );
  baseDefineProperty = require( './base/base-define-property' );

  defineProperties = function defineProperties ( object, descriptors ) {
    if ( support !== 'not-supported' ) {
      try {
        return Object.defineProperties( object, descriptors );
      } catch ( e ) {}
    }

    if ( isPrimitive( object ) ) {
      throw TypeError( 'defineProperties called on non-object' );
    }

    if ( isPrimitive( descriptors ) ) {
      throw TypeError( 'Property description must be an object: ' + descriptors );
    }

    each( descriptors, function ( descriptor, key ) {
      if ( isPrimitive( descriptor ) ) {
        throw TypeError( 'Property description must be an object: ' + descriptor );
      }

      baseDefineProperty( this, key, descriptor );
    }, object );

    return object;
  };
} else {
  defineProperties = Object.defineProperties;
}

module.exports = defineProperties;

},{"./base/base-define-property":47,"./each":69,"./is-primitive":81,"./support/support-define-property":94}],69:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-each' )();

},{"./create/create-each":63}],70:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Height' );

},{"./create/create-get-element-dimension":64}],71:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-get-element-dimension' )( 'Width' );

},{"./create/create-get-element-dimension":64}],72:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

var toString = Object.prototype.toString;

module.exports = Object.getPrototypeOf || function getPrototypeOf ( obj ) {
  var prototype;

  if ( obj == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  prototype = obj.__proto__; // jshint ignore: line

  if ( typeof prototype !== 'undefined' ) {
    return prototype;
  }

  if ( toString.call( obj.constructor ) === '[object Function]' ) {
    return obj.constructor.prototype;
  }

  return obj;
};

},{"./constants":61}],73:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength     = require( './is-length' ),
    isWindowLike = require( './is-window-like' );

module.exports = function isArrayLikeObject ( value ) {
  return isObjectLike( value ) && isLength( value.length ) && ! isWindowLike( value );
};

},{"./is-length":77,"./is-object-like":78,"./is-window-like":83}],74:[function(require,module,exports){
'use strict';

var isLength     = require( './is-length' ),
    isWindowLike = require( './is-window-like' );

module.exports = function isArrayLike ( value ) {
  if ( value == null ) {
    return false;
  }

  if ( typeof value === 'object' ) {
    return isLength( value.length ) && !isWindowLike( value );
  }

  return typeof value === 'string';
};

},{"./is-length":77,"./is-window-like":83}],75:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength = require( './is-length' );

var toString = {}.toString;

module.exports = Array.isArray || function isArray ( value ) {
  return isObjectLike( value ) &&
    isLength( value.length ) &&
    toString.call( value ) === '[object Array]';
};

},{"./is-length":77,"./is-object-like":78}],76:[function(require,module,exports){
'use strict';

var _type    = require( './_type' );

var rDeepKey = /(^|[^\\])(\\\\)*(\.|\[)/;

function isKey ( val ) {
  var type;

  if ( ! val ) {
    return true;
  }

  if ( _type( val ) === 'array' ) {
    return false;
  }

  type = typeof val;

  if ( type === 'number' || type === 'boolean' || _type( val ) === 'symbol' ) {
    return true;
  }

  return ! rDeepKey.test( val );
}

module.exports = isKey;

},{"./_type":45}],77:[function(require,module,exports){
'use strict';

var MAX_ARRAY_LENGTH = require( './constants' ).MAX_ARRAY_LENGTH;

module.exports = function isLength ( value ) {
  return typeof value === 'number' &&
    value >= 0 &&
    value <= MAX_ARRAY_LENGTH &&
    value % 1 === 0;
};

},{"./constants":61}],78:[function(require,module,exports){
'use strict';

module.exports = function isObjectLike ( value ) {
  return !! value && typeof value === 'object';
};

},{}],79:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

var toString = {}.toString;

module.exports = function isObject ( value ) {
  return isObjectLike( value ) &&
    toString.call( value ) === '[object Object]';
};

},{"./is-object-like":78}],80:[function(require,module,exports){
'use strict';

var getPrototypeOf = require( './get-prototype-of' );

var isObject = require( './is-object' );

var hasOwnProperty = Object.prototype.hasOwnProperty;

var toString = Function.prototype.toString;

var OBJECT = toString.call( Object );

module.exports = function isPlainObject ( v ) {
  var p, c;

  if ( ! isObject( v ) ) {
    return false;
  }

  p = getPrototypeOf( v );

  if ( p === null ) {
    return true;
  }

  if ( ! hasOwnProperty.call( p, 'constructor' ) ) {
    return false;
  }

  c = p.constructor;

  return typeof c === 'function' && toString.call( c ) === OBJECT;
};

},{"./get-prototype-of":72,"./is-object":79}],81:[function(require,module,exports){
'use strict';

module.exports = function isPrimitive ( value ) {
  return ! value ||
    typeof value !== 'object' &&
    typeof value !== 'function';
};

},{}],82:[function(require,module,exports){
'use strict';

var type = require( './type' );

module.exports = function isSymbol ( value ) {
  return type( value ) === 'symbol';
};

},{"./type":100}],83:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

module.exports = function isWindowLike ( value ) {
  return isObjectLike( value ) && value.window === value;
};

},{"./is-object-like":78}],84:[function(require,module,exports){
'use strict';

module.exports = function isset ( key, obj ) {
  if ( obj == null ) {
    return false;
  }

  return typeof obj[ key ] !== 'undefined' || key in obj;
};

},{}],85:[function(require,module,exports){
'use strict';

var isArrayLikeObject = require( './is-array-like-object' ),
    matchesProperty   = require( './matches-property' ),
    property          = require( './property' );

exports.iteratee = function iteratee ( value ) {
  if ( typeof value === 'function' ) {
    return value;
  }

  if ( isArrayLikeObject( value ) ) {
    return matchesProperty( value );
  }

  return property( value );
};

},{"./is-array-like-object":73,"./matches-property":87,"./property":92}],86:[function(require,module,exports){
'use strict';

var baseKeys = require( './base/base-keys' );
var toObject = require( './to-object' );
var support  = require( './support/support-keys' );

if ( support !== 'es2015' ) {
  module.exports = function keys ( v ) {
    var _keys;

    /**
     * + ---------------------------------------------------------------------- +
     * | I tested the functions with string[2048] (an array of strings) and had |
     * | this results in node.js (v8.10.0):                                     |
     * + ---------------------------------------------------------------------- +
     * | baseKeys x 10,674 ops/sec ±0.23% (94 runs sampled)                     |
     * | Object.keys x 22,147 ops/sec ±0.23% (95 runs sampled)                  |
     * | Fastest is "Object.keys"                                               |
     * + ---------------------------------------------------------------------- +
     */

    if ( support === 'es5' ) {
      _keys = Object.keys;
    } else {
      _keys = baseKeys;
    }

    return _keys( toObject( v ) );
  };
} else {
  module.exports = Object.keys;
}

},{"./base/base-keys":53,"./support/support-keys":95,"./to-object":99}],87:[function(require,module,exports){
'use strict';

var castPath = require( './cast-path' ),
    get      = require( './base/base-get' ),
    ERR      = require( './constants' ).ERR;

module.exports = function matchesProperty ( property ) {

  var path  = castPath( property[ 0 ] ),
      value = property[ 1 ];

  if ( ! path.length ) {
    throw Error( ERR.NO_PATH );
  }

  return function ( object ) {

    if ( object == null ) {
      return false;
    }

    if ( path.length > 1 ) {
      return get( object, path, 0 ) === value;
    }

    return object[ path[ 0 ] ] === value;

  };

};

},{"./base/base-get":51,"./cast-path":58,"./constants":61}],88:[function(require,module,exports){
'use strict';

var isPlainObject = require( './is-plain-object' );

var toObject = require( './to-object' );

var isArray = require( './is-array' );

var keys = require( './keys' );

module.exports = function mixin ( deep, object ) {

  var l = arguments.length;

  var i = 2;


  var names, exp, j, k, val, key, nowArray, src;

  //  mixin( {}, {} )

  if ( typeof deep !== 'boolean' ) {
    object = deep;
    deep   = true;
    i      = 1;
  }

  // var extendable = {
  //   extend: require( 'peako/mixin' )
  // };

  // extendable.extend( { name: 'Extendable Object' } );

  if ( i === l ) {

    object = this; // jshint ignore: line

    --i;

  }

  object = toObject( object );

  for ( ; i < l; ++i ) {
    names = keys( exp = toObject( arguments[ i ] ) );

    for ( j = 0, k = names.length; j < k; ++j ) {
      val = exp[ key = names[ j ] ];

      if ( deep && val !== exp && ( isPlainObject( val ) || ( nowArray = isArray( val ) ) ) ) {
        src = object[ key ];

        if ( nowArray ) {
          if ( ! isArray( src ) ) {
            src = [];
          }

          nowArray = false;
        } else if ( ! isPlainObject( src ) ) {
          src = {};
        }

        object[ key ] = mixin( true, src, val );
      } else {
        object[ key ] = val;
      }
    }

  }

  return object;
};

},{"./is-array":75,"./is-plain-object":80,"./keys":86,"./to-object":99}],89:[function(require,module,exports){
'use strict';

module.exports = function noop () {};

},{}],90:[function(require,module,exports){
'use strict';

module.exports = Date.now || function now () {
  return new Date().getTime();
};

},{}],91:[function(require,module,exports){
'use strict';

var before = require( './before' );

module.exports = function once ( target ) {
  return before( 1, target );
};

},{"./before":56}],92:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-property' )( require( './base/base-property' ) );

},{"./base/base-property":54,"./create/create-property":65}],93:[function(require,module,exports){
'use strict';

var isPrimitive = require( './is-primitive' ),
    ERR         = require( './constants' ).ERR;

module.exports = Object.setPrototypeOf || function setPrototypeOf ( target, prototype ) {
  if ( target == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  if ( prototype !== null && isPrimitive( prototype ) ) {
    throw TypeError( 'Object prototype may only be an Object or null: ' + prototype );
  }

  if ( '__proto__' in target ) {
    target.__proto__ = prototype; // jshint ignore: line
  }

  return target;
};

},{"./constants":61,"./is-primitive":81}],94:[function(require,module,exports){
'use strict';

var support;

function test ( target ) {
  try {
    if ( '' in Object.defineProperty( target, '', {} ) ) {
      return true;
    }
  } catch ( e ) {}

  return false;
}

if ( test( {} ) ) {
  support = 'full';
} else if ( typeof document !== 'undefined' && test( document.createElement( 'span' ) ) ) {
  support = 'dom';
} else {
  support = 'not-supported';
}

module.exports = support;

},{}],95:[function(require,module,exports){
'use strict';

var support;

if ( Object.keys ) {
  try {
    support = Object.keys( '' ), 'es2015'; // jshint ignore: line
  } catch ( e ) {
    support = 'es5';
  }
} else if ( { toString: null }.propertyIsEnumerable( 'toString' ) ) {
  support = 'not-supported';
} else {
  support = 'has-a-bug';
}

module.exports = support;

},{}],96:[function(require,module,exports){
/**
 * Based on Erik Möller requestAnimationFrame polyfill:
 *
 * Adapted from https://gist.github.com/paulirish/1579671 which derived from
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 *
 * requestAnimationFrame polyfill by Erik Möller.
 * Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon.
 *
 * MIT license
 */

'use strict';

var timestamp = require( './timestamp' );

var requestAF, cancelAF;

if ( typeof window !== 'undefined' ) {
  cancelAF = window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.mozCancelRequestAnimationFrame;
  requestAF = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame;
}

var noRequestAnimationFrame = ! requestAF || ! cancelAF ||
  typeof navigator !== 'undefined' && /iP(ad|hone|od).*OS\s6/.test( navigator.userAgent );

if ( noRequestAnimationFrame ) {
  var lastRequestTime = 0,
      frameDuration   = 1000 / 60;

  exports.request = function request ( animate ) {
    var now             = timestamp(),
        nextRequestTime = Math.max( lastRequestTime + frameDuration, now );

    return setTimeout( function () {
      lastRequestTime = nextRequestTime;
      animate( now );
    }, nextRequestTime - now );
  };

  exports.cancel = clearTimeout;
} else {
  exports.request = function request ( animate ) {
    return requestAF( animate );
  };

  exports.cancel = function cancel ( id ) {
    return cancelAF( id );
  };
}

},{"./timestamp":97}],97:[function(require,module,exports){
'use strict';

var now = require( './now' );
var navigatorStart;

if ( typeof performance === 'undefined' || ! performance.now ) {
  navigatorStart = now();

  module.exports = function timestamp () {
    return now() - navigatorStart;
  };
} else {
  module.exports = function timestamp () {
    return performance.now();
  };
}

},{"./now":90}],98:[function(require,module,exports){
'use strict';

var _unescape = require( './_unescape' ),
    isSymbol  = require( './is-symbol' );

module.exports = function toKey ( val ) {
  var key;

  if ( typeof val === 'string' ) {
    return _unescape( val );
  }

  if ( isSymbol( val ) ) {
    return val;
  }

  key = '' + val;

  if ( key === '0' && 1 / val === -Infinity ) {
    return '-0';
  }

  return _unescape( key );
};

},{"./_unescape":46,"./is-symbol":82}],99:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

module.exports = function toObject ( value ) {
  if ( value == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  return Object( value );
};

},{"./constants":61}],100:[function(require,module,exports){
'use strict';

var create = require( './create' );

var toString = {}.toString,
    types = create( null );

module.exports = function getType ( value ) {
  var type, tag;

  if ( value === null ) {
    return 'null';
  }

  type = typeof value;

  if ( type !== 'object' && type !== 'function' ) {
    return type;
  }

  type = types[ tag = toString.call( value ) ];

  if ( type ) {
    return type;
  }

  return ( types[ tag ] = tag.slice( 8, -1 ).toLowerCase() );
};

},{"./create":62}]},{},[42])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL1NoYWRlclByb2dyYW0uanMiLCJjb3JlL1RpY2tlci5qcyIsImNvcmUvVHJhbnNmb3JtLmpzIiwiY29yZS9jYW1lcmEvQ2FtZXJhLmpzIiwiY29yZS9jYW1lcmEvc2V0dGluZ3MuanMiLCJjb3JlL2NvbG9yL0hTTEEuanMiLCJjb3JlL2NvbG9yL1JHQkEuanMiLCJjb3JlL2NvbG9yL2ludGVybmFsL2NvbG9ycy5qcyIsImNvcmUvY29sb3IvaW50ZXJuYWwvcGFyc2UuanMiLCJjb3JlL2NvbnN0YW50cy5qcyIsImNvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZS5qcyIsImNvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlLmpzIiwiY29yZS9pbWFnZS9JbWFnZS5qcyIsImNvcmUvaW50ZXJuYWwvX0Zsb2F0MzJBcnJheS5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX2FycmF5LmpzIiwiY29yZS9pbnRlcm5hbC9jcmVhdGVfcG9seWdvbi5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX3Byb2dyYW0uanMiLCJjb3JlL2ludGVybmFsL2NyZWF0ZV9zaGFkZXIuanMiLCJjb3JlL2ludGVybmFsL3BvbHlnb25zLmpzIiwiY29yZS9pbnRlcm5hbC9yZXBvcnQuanMiLCJjb3JlL21hdGgvQWJzdHJhY3RWZWN0b3IuanMiLCJjb3JlL21hdGgvVmVjdG9yMkQuanMiLCJjb3JlL21hdGgvVmVjdG9yM0QuanMiLCJjb3JlL21hdGgvbWF0My5qcyIsImNvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlci5qcyIsImNvcmUvcmVuZGVyZXIvUmVuZGVyZXIyRC5qcyIsImNvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTC5qcyIsImNvcmUvcmVuZGVyZXIvY3JlYXRlX3JlbmRlcmVyLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9jbG9zZV9zaGFwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvY29weV9kcmF3aW5nX3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL2dldF9yZW5kZXJlcl90eXBlLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9nZXRfd2ViZ2wuanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbi5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvcHJvY2Vzc19zaGFwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvc2V0X2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncy5qcyIsImNvcmUvcmVuZGVyZXIvc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL3NoYXBlcy9kcmF3X2xpbmVzLmpzIiwiY29yZS9yZW5kZXJlci9zaGFwZXMvZHJhd19wb2ludHMuanMiLCJjb3JlL3NldHRpbmdzLmpzIiwiY29yZS9zaGFkZXJzLmpzIiwiaW5kZXguanMiLCJub2RlX21vZHVsZXMvbGlnaHRfZW1pdHRlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdGhyb3ctYXJndW1lbnQtZXhjZXB0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL190eXBlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL191bmVzY2FwZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1leGVjLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1mb3ItZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZm9yLWluLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1nZXQuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWluZGV4LW9mLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtdG8taW5kZXguanMiLCJub2RlX21vZHVsZXMvcGVha28vYmVmb3JlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NhbGwtaXRlcmF0ZWUuanMiLCJub2RlX21vZHVsZXMvcGVha28vY2FzdC1wYXRoLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NsYW1wLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Nsb25lLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NvbnN0YW50cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvcGVha28vY3JlYXRlL2NyZWF0ZS1lYWNoLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtZ2V0LWVsZW1lbnQtZGltZW5zaW9uLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmYXVsdC10by5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9kZWZhdWx0cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9kZWZpbmUtcHJvcGVydGllcy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9lYWNoLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2dldC1lbGVtZW50LWguanMiLCJub2RlX21vZHVsZXMvcGVha28vZ2V0LWVsZW1lbnQtdy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9nZXQtcHJvdG90eXBlLW9mLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LWxpa2Utb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtYXJyYXkuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMta2V5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWxlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1vYmplY3QtbGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtcGxhaW4tb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXByaW1pdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtd2luZG93LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXNzZXQuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXRlcmF0ZWUuanMiLCJub2RlX21vZHVsZXMvcGVha28va2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9tYXRjaGVzLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL21peGluLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL25vb3AuanMiLCJub2RlX21vZHVsZXMvcGVha28vbm93LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL29uY2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vc2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9zdXBwb3J0L3N1cHBvcnQtZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3N1cHBvcnQvc3VwcG9ydC1rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RpbWVyLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RpbWVzdGFtcC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90by1rZXkuanMiLCJub2RlX21vZHVsZXMvcGVha28vdG8tb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3R5cGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlckF0dHJpYnV0ZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGxvY2F0aW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHNpemVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0eXBlXG4gKiBAc2VlIFtnZXRBdHRyaWJMb2NhdGlvbl0oaHR0cHM6Ly9tZG4uaW8vZ2V0QXR0cmliTG9jYXRpb24pXG4gKiBAc2VlIFtXZWJHTEFjdGl2ZUluZm9dKGh0dHBzOi8vbWRuLmlvL1dlYkdMQWN0aXZlSW5mbylcbiAqL1xuXG4vKipcbiAqIEBpbnRlcmZhY2UgSVNoYWRlclVuaWZvcm1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb2NhdGlvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzaXplXG4gKiBAcHJvcGVydHkge251bWJlcn0gdHlwZVxuICogQHNlZSBbZ2V0QWN0aXZlVW5pZm9ybV0oaHR0cHM6Ly9tZG4uaW8vZ2V0QWN0aXZlVW5pZm9ybSlcbiAqIEBzZWUgW1dlYkdMQWN0aXZlSW5mb10oaHR0cHM6Ly9tZG4uaW8vV2ViR0xBY3RpdmVJbmZvKVxuICovXG5cbnZhciBjcmVhdGVQcm9ncmFtID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY3JlYXRlX3Byb2dyYW0nICk7XG52YXIgY3JlYXRlU2hhZGVyICA9IHJlcXVpcmUoICcuL2ludGVybmFsL2NyZWF0ZV9zaGFkZXInICk7XG5cbi8qKlxuICog0JLRi9GB0L7QutC+0YPRgNC+0LLQvdC10LLRi9C5INC40L3RgtC10YDRhNC10LnRgSDQtNC70Y8gV2ViR0xQcm9ncmFtLlxuICogQGNvbnN0cnVjdG9yIHY2LlNoYWRlclByb2dyYW1cbiAqIEBwYXJhbSB7SVNoYWRlclNvdXJjZXN9ICAgICAgICBzb3VyY2VzINCo0LXQudC00LXRgNGLINC00LvRjyDQv9GA0L7Qs9GA0LDQvNC80YsuXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgICAgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQGV4YW1wbGUgPGNhcHRpb24+UmVxdWlyZSBcInY2LlNoYWRlclByb2dyYW1cIjwvY2FwdGlvbj5cbiAqIHZhciBTaGFkZXJQcm9ncmFtID0gcmVxdWlyZSggJ3Y2LmpzL1NoYWRlclByb2dyYW0nICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5Vc2Ugd2l0aG91dCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIC8vIFJlcXVpcmUgXCJ2Ni5qc1wiIHNoYWRlcnMuXG4gKiB2YXIgc2hhZGVycyA9IHJlcXVpcmUoICd2Ni5qcy9zaGFkZXJzJyApO1xuICogLy8gQ3JlYXRlIGEgcHJvZ3JhbS5cbiAqIHZhciBwcm9ncmFtID0gbmV3IFNoYWRlclByb2dyYW0oIHNoYWRlcnMuYmFzaWMsIGdsQ29udGV4dCApO1xuICovXG5mdW5jdGlvbiBTaGFkZXJQcm9ncmFtICggc291cmNlcywgZ2wgKVxue1xuICB2YXIgdmVydCA9IGNyZWF0ZVNoYWRlciggc291cmNlcy52ZXJ0LCBnbC5WRVJURVhfU0hBREVSLCBnbCApO1xuICB2YXIgZnJhZyA9IGNyZWF0ZVNoYWRlciggc291cmNlcy5mcmFnLCBnbC5GUkFHTUVOVF9TSEFERVIsIGdsICk7XG5cbiAgLyoqXG4gICAqIFdlYkdMINC/0YDQvtCz0YDQsNC80LzQsCDRgdC+0LfQtNCw0L3QvdCw0Y8g0YEg0L/QvtC80L7RidGM0Y4ge0BsaW5rIGNyZWF0ZVByb2dyYW19LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFByb2dyYW19IHY2LlNoYWRlclByb2dyYW0jX3Byb2dyYW1cbiAgICovXG4gIHRoaXMuX3Byb2dyYW0gPSBjcmVhdGVQcm9ncmFtKCB2ZXJ0LCBmcmFnLCBnbCApO1xuXG4gIC8qKlxuICAgKiBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IHY2LlNoYWRlclByb2dyYW0jX2dsXG4gICAqL1xuICB0aGlzLl9nbCA9IGdsO1xuXG4gIC8qKlxuICAgKiDQmtC10YjQuNGA0L7QstCw0L3QvdGL0LUg0LDRgtGA0LjQsdGD0YLRiyDRiNC10LnQtNC10YDQvtCyLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlNoYWRlclByb2dyYW0jX2F0dHJpYnV0ZXNcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKi9cbiAgdGhpcy5fYXR0cmlidXRlcyA9IHt9O1xuXG4gIC8qKlxuICAgKiDQmtC10YjQuNGA0L7QstCw0L3QvdGL0LUg0YTQvtGA0LzRiyAodW5pZm9ybXMpINGI0LXQudC00LXRgNC+0LIuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuU2hhZGVyUHJvZ3JhbSNfdW5pZm9ybXNcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldFVuaWZvcm1cbiAgICovXG4gIHRoaXMuX3VuaWZvcm1zID0ge307XG5cbiAgLyoqXG4gICAqINCY0L3QtNC10LrRgSDQv9C+0YHQu9C10LTQvdC10LPQviDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INCw0YLRgNC40LHRg9GC0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuU2hhZGVyUHJvZ3JhbSNfYXR0cmlidXRlSW5kZXhcbiAgICogQHNlZSB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKi9cbiAgdGhpcy5fYXR0cmlidXRlSW5kZXggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCB0aGlzLl9wcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyApO1xuXG4gIC8qKlxuICAgKiDQmNC90LTQtdC60YEg0L/QvtGB0LvQtdC00L3QtdC5INC/0L7Qu9GD0YfQtdC90L3QvtC5INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlNoYWRlclByb2dyYW0jX3VuaWZvcm1JbmRleFxuICAgKiBAc2VlIHY2LlNoYWRlclByb2dyYW0jZ2V0VW5pZm9ybVxuICAgKi9cbiAgdGhpcy5fdW5pZm9ybUluZGV4ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggdGhpcy5fcHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TICk7XG59XG5cblNoYWRlclByb2dyYW0ucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI2dldEF0dHJpYnV0ZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICBuYW1lINCd0LDQt9Cy0LDQvdC40LUg0LDRgtGA0LjQsdGD0YLQsC5cbiAgICogQHJldHVybiB7SVNoYWRlckF0dHJpYnV0ZX0gICAgICDQktC+0LfQstGA0LDRidCw0LXRgiDQtNCw0L3QvdGL0LUg0L4g0LDRgtGA0LjQsdGD0YLQtS5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGxvY2F0aW9uID0gcHJvZ3JhbS5nZXRBdHRyaWJ1dGUoICdhcG9zJyApLmxvY2F0aW9uO1xuICAgKi9cbiAgZ2V0QXR0cmlidXRlOiBmdW5jdGlvbiBnZXRBdHRyaWJ1dGUgKCBuYW1lIClcbiAge1xuICAgIHZhciBhdHRyID0gdGhpcy5fYXR0cmlidXRlc1sgbmFtZSBdO1xuICAgIHZhciBpbmZvO1xuXG4gICAgaWYgKCBhdHRyICkge1xuICAgICAgcmV0dXJuIGF0dHI7XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX2F0dHJpYnV0ZUluZGV4ID49IDAgKSB7XG4gICAgICBpbmZvID0gdGhpcy5fZ2wuZ2V0QWN0aXZlQXR0cmliKCB0aGlzLl9wcm9ncmFtLCB0aGlzLl9hdHRyaWJ1dGVJbmRleCApO1xuXG4gICAgICBhdHRyID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24oIHRoaXMuX3Byb2dyYW0sIG5hbWUgKSxcbiAgICAgICAgbmFtZTogaW5mby5uYW1lLFxuICAgICAgICBzaXplOiBpbmZvLnNpemUsXG4gICAgICAgIHR5cGU6IGluZm8udHlwZVxuICAgICAgfTtcblxuICAgICAgdGhpcy5fYXR0cmlidXRlc1sgYXR0ci5uYW1lIF0gPSBhdHRyO1xuXG4gICAgICBpZiAoIGF0dHIubmFtZSA9PT0gbmFtZSApIHtcbiAgICAgICAgcmV0dXJuIGF0dHI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoICdObyBcIicgKyBuYW1lICsgJ1wiIGF0dHJpYnV0ZSBmb3VuZCcgKTtcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5TaGFkZXJQcm9ncmFtI2dldFVuaWZvcm1cbiAgICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIG5hbWUg0J3QsNC30LLQsNC90LjQtSDRhNC+0YDQvNGLICh1bmlmb3JtKS5cbiAgICogQHJldHVybiB7SVNoYWRlclVuaWZvcm19ICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQsNC90L3Ri9C1INC+INGE0L7RgNC80LUgKHVuaWZvcm0pLlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgbG9jYXRpb24gPSBwcm9ncmFtLmdldFVuaWZvcm0oICd1Y29sb3InICkubG9jYXRpb247XG4gICAqL1xuICBnZXRVbmlmb3JtOiBmdW5jdGlvbiBnZXRVbmlmb3JtICggbmFtZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuX3VuaWZvcm1zWyBuYW1lIF07XG4gICAgdmFyIGluZGV4LCBpbmZvO1xuXG4gICAgaWYgKCB1bmlmb3JtICkge1xuICAgICAgcmV0dXJuIHVuaWZvcm07XG4gICAgfVxuXG4gICAgd2hpbGUgKCAtLXRoaXMuX3VuaWZvcm1JbmRleCA+PSAwICkge1xuICAgICAgaW5mbyA9IHRoaXMuX2dsLmdldEFjdGl2ZVVuaWZvcm0oIHRoaXMuX3Byb2dyYW0sIHRoaXMuX3VuaWZvcm1JbmRleCApO1xuXG4gICAgICB1bmlmb3JtID0ge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCB0aGlzLl9wcm9ncmFtLCBpbmZvLm5hbWUgKSxcbiAgICAgICAgc2l6ZTogaW5mby5zaXplLFxuICAgICAgICB0eXBlOiBpbmZvLnR5cGVcbiAgICAgIH07XG5cbiAgICAgIGlmICggaW5mby5zaXplID4gMSAmJiB+ICggaW5kZXggPSBpbmZvLm5hbWUuaW5kZXhPZiggJ1snICkgKSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZS5zbGljZSggMCwgaW5kZXggKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaWZvcm0ubmFtZSA9IGluZm8ubmFtZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdW5pZm9ybXNbIHVuaWZvcm0ubmFtZSBdID0gdW5pZm9ybTtcblxuICAgICAgaWYgKCB1bmlmb3JtLm5hbWUgPT09IG5hbWUgKSB7XG4gICAgICAgIHJldHVybiB1bmlmb3JtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IFJlZmVyZW5jZUVycm9yKCAnTm8gXCInICsgbmFtZSArICdcIiB1bmlmb3JtIGZvdW5kJyApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0QXR0cmlidXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I2VuYWJsZVZlcnRleEF0dHJpYkFycmF5XShodHRwczovL21kbi5pby9lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSlcbiAgICogQHNlZSBbV2ViR0xSZW5kZXJpbmdDb250ZXh0I3ZlcnRleEF0dHJpYlBvaW50ZXJdKGh0dHBzOi8vbWRuLmlvL3ZlcnRleEF0dHJpYlBvaW50ZXIpXG4gICAqIEBleGFtcGxlXG4gICAqIHByb2dyYW0uc2V0QXR0cmlidXRlKCAnYXBvcycsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCApO1xuICAgKi9cbiAgc2V0QXR0cmlidXRlOiBmdW5jdGlvbiBzZXRBdHRyaWJ1dGUgKCBuYW1lLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCApXG4gIHtcbiAgICB2YXIgbG9jYXRpb24gPSB0aGlzLmdldEF0dHJpYnV0ZSggbmFtZSApLmxvY2F0aW9uO1xuICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KCBsb2NhdGlvbiApO1xuICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoIGxvY2F0aW9uLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LlNoYWRlclByb2dyYW0jc2V0VW5pZm9ybVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgINCd0LDQt9Cy0LDQvdC40LUg0YTQvtGA0LzRiyAodW5pZm9ybSkuXG4gICAqIEBwYXJhbSAge2FueX0gICAgdmFsdWUg0J3QvtCy0L7QtSDQt9C90LDRh9C10L3QuNC1INGE0L7RgNC80YsgKHVuaWZvcm0pLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIHByb2dyYW0uc2V0VW5pZm9ybSggJ3Vjb2xvcicsIFsgMjU1LCAwLCAwLCAxIF0gKTtcbiAgICovXG4gIHNldFVuaWZvcm06IGZ1bmN0aW9uIHNldFVuaWZvcm0gKCBuYW1lLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgdW5pZm9ybSA9IHRoaXMuZ2V0VW5pZm9ybSggbmFtZSApO1xuICAgIHZhciBfZ2wgICAgID0gdGhpcy5fZ2w7XG5cbiAgICBzd2l0Y2ggKCB1bmlmb3JtLnR5cGUgKSB7XG4gICAgICBjYXNlIF9nbC5CT09MOlxuICAgICAgY2FzZSBfZ2wuSU5UOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xaXYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xaSggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0xZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX01BVDI6XG4gICAgICAgIF9nbC51bmlmb3JtTWF0cml4MmZ2KCB1bmlmb3JtLmxvY2F0aW9uLCBmYWxzZSwgdmFsdWUgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9NQVQzOlxuICAgICAgICBfZ2wudW5pZm9ybU1hdHJpeDNmdiggdW5pZm9ybS5sb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfTUFUNDpcbiAgICAgICAgX2dsLnVuaWZvcm1NYXRyaXg0ZnYoIHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgX2dsLkZMT0FUX1ZFQzI6XG4gICAgICAgIGlmICggdW5pZm9ybS5zaXplID4gMSApIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTJmdiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfZ2wudW5pZm9ybTJmKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZVsgMCBdLCB2YWx1ZVsgMSBdICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIF9nbC5GTE9BVF9WRUMzOlxuICAgICAgICBpZiAoIHVuaWZvcm0uc2l6ZSA+IDEgKSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0zZnYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2dsLnVuaWZvcm0zZiggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbIDAgXSwgdmFsdWVbIDEgXSwgdmFsdWVbIDIgXSApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBfZ2wuRkxPQVRfVkVDNDpcbiAgICAgICAgaWYgKCB1bmlmb3JtLnNpemUgPiAxICkge1xuICAgICAgICAgIF9nbC51bmlmb3JtNGZ2KCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9nbC51bmlmb3JtNGYoIHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlWyAwIF0sIHZhbHVlWyAxIF0sIHZhbHVlWyAyIF0sIHZhbHVlWyAzIF0gKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IFR5cGVFcnJvciggJ1RoZSB1bmlmb3JtIHR5cGUgaXMgbm90IHN1cHBvcnRlZCAoXCInICsgbmFtZSArICdcIiknICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuU2hhZGVyUHJvZ3JhbSN1c2VcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIFtXZWJHTFJlbmRlcmluZ0NvbnRleHQjdXNlUHJvZ3JhbV0oaHR0cHM6Ly9tZG4uaW8vdXNlUHJvZ3JhbSlcbiAgICogQGV4YW1wbGVcbiAgICogcHJvZ3JhbS51c2UoKTtcbiAgICovXG4gIHVzZTogZnVuY3Rpb24gdXNlICgpXG4gIHtcbiAgICB0aGlzLl9nbC51c2VQcm9ncmFtKCB0aGlzLl9wcm9ncmFtICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IFNoYWRlclByb2dyYW1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCAnbGlnaHRfZW1pdHRlcicgKTtcbnZhciB0aW1lc3RhbXAgPSByZXF1aXJlKCAncGVha28vdGltZXN0YW1wJyApO1xudmFyIHRpbWVyID0gcmVxdWlyZSggJ3BlYWtvL3RpbWVyJyApO1xuLyoqXG4gKiDQrdGC0L7RgiDQutC70LDRgdGBINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQtNC70Y8g0LfQsNGG0LjQutC70LjQstCw0L3QuNGPINCw0L3QuNC80LDRhtC40Lgg0LLQvNC10YHRgtC+IGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLlxuICogQGNvbnN0cnVjdG9yIHY2LlRpY2tlclxuICogQGV4dGVuZHMge0xpZ2h0RW1pdHRlcn1cbiAqIEBmaXJlcyB1cGRhdGVcbiAqIEBmaXJlcyByZW5kZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgVGlja2VyID0gcmVxdWlyZSggJ3Y2LmpzL1RpY2tlcicgKTtcbiAqIHZhciB0aWNrZXIgPSBuZXcgVGlja2VyKCk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cInVwZGF0ZVwiIGV2ZW50LjwvY2FwdGlvbj5cbiAqIC8vIEZpcmVzIGV2ZXJ5dGltZSBhbiBhcHBsaWNhdGlvbiBzaG91bGQgYmUgdXBkYXRlZC5cbiAqIC8vIERlcGVuZHMgb24gbWF4aW11bSBGUFMuXG4gKiB0aWNrZXIub24oICd1cGRhdGUnLCBmdW5jdGlvbiAoIGVsYXBzZWRUaW1lICkge1xuICogICBzaGFwZS5yb3RhdGlvbiArPSAxMCAqIGVsYXBzZWRUaW1lO1xuICogfSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+XCJyZW5kZXJcIiBldmVudC48L2NhcHRpb24+XG4gKiAvLyBGaXJlcyBldmVyeXRpbWUgYW4gYXBwbGljYXRpb24gc2hvdWxkIGJlIHJlbmRlcmVkLlxuICogLy8gVW5saWtlIFwidXBkYXRlXCIsIGluZGVwZW5kZW50IGZyb20gbWF4aW11bSBGUFMuXG4gKiB0aWNrZXIub24oICdyZW5kZXInLCBmdW5jdGlvbiAoKSB7XG4gKiAgIHJlbmRlcmVyLnJvdGF0ZSggc2hhcGUucm90YXRpb24gKTtcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gVGlja2VyICgpXG57XG4gIHZhciBzZWxmID0gdGhpcztcbiAgTGlnaHRFbWl0dGVyLmNhbGwoIHRoaXMgKTtcbiAgdGhpcy5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSAwO1xuICB0aGlzLmxhc3RSZXF1ZXN0VGltZSA9IDA7XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICB0aGlzLnRvdGFsVGltZSA9IDA7XG4gIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICB0aGlzLnNldHRpbmdzID0ge307XG4gIC8qKlxuICAgKiDQl9Cw0L/Rg9GB0LrQsNC10YIg0YbQuNC60Lsg0LDQvdC40LzQsNGG0LjQuC5cbiAgICogQG1ldGhvZCB2Ni5UaWNrZXIjc3RhcnRcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIuc3RhcnQoKTtcbiAgICovXG4gIGZ1bmN0aW9uIHN0YXJ0ICggX25vdyApXG4gIHtcbiAgICB2YXIgZWxhcHNlZFRpbWUsIGZyYW1lVGltZTtcbiAgICBpZiAoICEgc2VsZi5ydW5uaW5nICkge1xuICAgICAgaWYgKCAhIF9ub3cgKSB7XG4gICAgICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gdGltZXIucmVxdWVzdCggc3RhcnQgKTtcbiAgICAgICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSB0aW1lc3RhbXAoKTtcbiAgICAgICAgc2VsZi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICAgIH1cbiAgICBpZiAoICEgX25vdyApIHtcbiAgICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICAgIH1cbiAgICBlbGFwc2VkVGltZSA9IE1hdGgubWluKCAxLCAoIF9ub3cgLSBzZWxmLmxhc3RSZXF1ZXN0VGltZSApICogMC4wMDEgKTtcbiAgICBzZWxmLnNraXBwZWRUaW1lICs9IGVsYXBzZWRUaW1lO1xuICAgIHNlbGYudG90YWxUaW1lICs9IGVsYXBzZWRUaW1lO1xuICAgIGZyYW1lVGltZSA9IHNlbGYuc2V0dGluZ3NbICdmcmFtZSB0aW1lJyBdO1xuICAgIHdoaWxlICggc2VsZi5za2lwcGVkVGltZSA+PSBmcmFtZVRpbWUgJiYgc2VsZi5ydW5uaW5nICkge1xuICAgICAgc2VsZi5za2lwcGVkVGltZSAtPSBmcmFtZVRpbWU7XG4gICAgICBzZWxmLmVtaXQoICd1cGRhdGUnLCBmcmFtZVRpbWUsIF9ub3cgKTtcbiAgICB9XG4gICAgc2VsZi5lbWl0KCAncmVuZGVyJywgZWxhcHNlZFRpbWUsIF9ub3cgKTtcbiAgICBzZWxmLmxhc3RSZXF1ZXN0VGltZSA9IF9ub3c7XG4gICAgc2VsZi5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSB0aW1lci5yZXF1ZXN0KCBzdGFydCApO1xuICAgIHJldHVybiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWludmFsaWQtdGhpc1xuICB9XG4gIHRoaXMuc3RhcnQgPSBzdGFydDtcbiAgdGhpcy5zZXQoICdGUFMnLCA2MCApO1xufVxuVGlja2VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIExpZ2h0RW1pdHRlci5wcm90b3R5cGUgKTtcblRpY2tlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUaWNrZXI7XG4vKipcbiAqIFNldCBuZXcgdmFsdWUgb2YgYSBzZXR0aW5nLlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjc2V0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHNldHRpbmcgVGhlIHNldHRpbmdgcyBrZXksIGUuZy46IFwiRlBTXCIsIFwiZnJhbWUgdGltZVwiLlxuICogQHBhcmFtICB7YW55fSAgICB2YWx1ZSAgIE5ldyBzZXR0aW5nYHMgdmFsdWUuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgUmV0dXJucyBub3RoaW5nLlxuICogQGV4YW1wbGVcbiAqIHRpY2tlci5zZXQoICdGUFMnLCAxMjAgKTtcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKCBzZXR0aW5nLCB2YWx1ZSApXG57XG4gIGlmICggaXNJbnZhbGlkU2V0dGluZyggc2V0dGluZyApICkgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHNldHRpbmcga2V5OiAnICsgc2V0dGluZyApOyB9IC8qIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlbiovXG4gIGlmICggc2V0dGluZyA9PT0gJ0ZQUycgKSB7XG4gICAgdGhpcy5zZXR0aW5nc1sgJ2ZyYW1lIHRpbWUnIF0gPSAxIC8gdmFsdWU7XG4gIH0gZWxzZSBpZiAoIHNldHRpbmcgPT09ICdmcmFtZSB0aW1lJyApIHtcbiAgICB0aGlzLnNldHRpbmdzWyAnRlBTJyBdID0gMSAvIHZhbHVlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGRvdC1ub3RhdGlvblxuICB9XG4gIHRoaXMuc2V0dGluZ3NbIHNldHRpbmcgXSA9IHZhbHVlO1xufTtcbi8qKlxuICogR2V0IGN1cnJlbnQgdmFsdWUgb2YgYSBzZXR0aW5nLlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjZ2V0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHNldHRpbmcgVGhlIHNldHRpbmdgcyBrZXksIGUuZy46IFwiRlBTXCIsIFwiZnJhbWUgdGltZVwiLlxuICogQHJldHVybiB7YW55fSAgICAgICAgICAgIFRoZSBzZXR0aW5nYHMgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogdmFyIGZyYW1lVGltZSA9IHRpY2tlci5nZXQoICdmcmFtZSB0aW1lJyApO1xuICovXG5UaWNrZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoIHNldHRpbmcgKVxue1xuICBpZiAoIGlzSW52YWxpZFNldHRpbmcoIHNldHRpbmcgKSApIHsgdGhyb3cgRXJyb3IoICdHb3QgdW5rbm93biBzZXR0aW5nIGtleTogJyArIHNldHRpbmcgKTsgfSAvKiBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW4qL1xuICByZXR1cm4gdGhpcy5zZXR0aW5nc1sgc2V0dGluZyBdO1xufTtcbi8qKlxuICogQG1ldGhvZCB2Ni5UaWNrZXIjY2xlYXJcbiAqIEBjaGFpbmFibGVcbiAqL1xuVGlja2VyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICByZXR1cm4gdGhpcztcbn07XG4vKipcbiAqINCe0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINCw0L3QuNC80LDRhtC40Y4uXG4gKiBAbWV0aG9kIHY2LlRpY2tlciNzdG9wXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogdGlja2VyLm9uKCAncmVuZGVyJywgZnVuY3Rpb24gKCkge1xuICogICAvLyBTdG9wIHRoZSB0aWNrZXIgYWZ0ZXIgZml2ZSBzZWNvbmRzLlxuICogICBpZiAoIHRoaXMudG90YWxUaW1lID49IDUgKSB7XG4gKiAgICAgdGlja2VyLnN0b3AoKTtcbiAqICAgfVxuICogfSApO1xuICovXG5UaWNrZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wICgpXG57XG4gIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICByZXR1cm4gdGhpcztcbn07XG5mdW5jdGlvbiBpc0ludmFsaWRTZXR0aW5nICggc2V0dGluZyApXG57XG4gIHJldHVybiBzZXR0aW5nICE9PSAnZnJhbWUgdGltZScgJiYgc2V0dGluZyAhPT0gJ0ZQUyc7XG59XG5tb2R1bGUuZXhwb3J0cyA9IFRpY2tlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1hdDMgPSByZXF1aXJlKCAnLi9tYXRoL21hdDMnICk7XG5cbmZ1bmN0aW9uIFRyYW5zZm9ybSAoKVxue1xuICB0aGlzLm1hdHJpeCA9IG1hdDMuaWRlbnRpdHkoKTtcbiAgdGhpcy5faW5kZXggPSAtMTtcbiAgdGhpcy5fc3RhY2sgPSBbXTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZSA9IHtcbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSAoKVxuICB7XG4gICAgaWYgKCArK3RoaXMuX2luZGV4IDwgdGhpcy5fc3RhY2subGVuZ3RoICkge1xuICAgICAgbWF0My5jb3B5KCB0aGlzLl9zdGFja1sgdGhpcy5faW5kZXggXSwgdGhpcy5tYXRyaXggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhY2sucHVzaCggbWF0My5jbG9uZSggdGhpcy5tYXRyaXggKSApO1xuICAgIH1cbiAgfSxcblxuICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlICgpXG4gIHtcbiAgICBpZiAoIHRoaXMuX2luZGV4ID49IDAgKSB7XG4gICAgICBtYXQzLmNvcHkoIHRoaXMubWF0cml4LCB0aGlzLl9zdGFja1sgdGhpcy5faW5kZXgtLSBdICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hdDMuc2V0SWRlbnRpdHkoIHRoaXMubWF0cml4ICk7XG4gICAgfVxuICB9LFxuXG4gIHNldFRyYW5zZm9ybTogZnVuY3Rpb24gc2V0VHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgbWF0My5zZXRUcmFuc2Zvcm0oIHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICB9LFxuXG4gIHRyYW5zbGF0ZTogZnVuY3Rpb24gdHJhbnNsYXRlICggeCwgeSApXG4gIHtcbiAgICBtYXQzLnRyYW5zbGF0ZSggdGhpcy5tYXRyaXgsIHgsIHkgKTtcbiAgfSxcblxuICByb3RhdGU6IGZ1bmN0aW9uIHJvdGF0ZSAoIGFuZ2xlIClcbiAge1xuICAgIG1hdDMucm90YXRlKCB0aGlzLm1hdHJpeCwgYW5nbGUgKTtcbiAgfSxcblxuICBzY2FsZTogZnVuY3Rpb24gc2NhbGUgKCB4LCB5IClcbiAge1xuICAgIG1hdDMuc2NhbGUoIHRoaXMubWF0cml4LCB4LCB5ICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCf0YDQuNC80LXQvdGP0LXRgiBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiINC40Lcg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyINC90LAg0YLQtdC60YPRidC40LkgXCJ0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcIi5cbiAgICogQG1ldGhvZCB2Ni5UcmFuc2Zvcm0jdHJhbnNmb3JtXG4gICAqIEBwYXJhbSAge251bWJlcn0gIG0xMSBYIHNjYWxlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMTIgWCBza2V3LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMjEgWSBza2V3LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtMjIgWSBzY2FsZS5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgZHggIFggdHJhbnNsYXRlLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBkeSAgWSB0cmFuc2xhdGUuXG4gICAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gQXBwbHkgc2NhbGVkIHR3aWNlIFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIuXG4gICAqIHRyYW5zZm9ybS50cmFuc2Zvcm0oIDIsIDAsIDAsIDIsIDAsIDAgKTtcbiAgICovXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gdHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgbWF0My50cmFuc2Zvcm0oIHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICB9LFxuXG4gIGNvbnN0cnVjdG9yOiBUcmFuc2Zvcm1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSggJ3BlYWtvL2RlZmF1bHRzJyApO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICk7XG4vKipcbiAqINCa0LvQsNGB0YEg0LrQsNC80LXRgNGLLiDQrdGC0L7RgiDQutC70LDRgdGBINGD0LTQvtCx0LXQvSDQtNC70Y8g0YHQvtC30LTQsNC90LjRjyDQutCw0LzQtdGA0YssINC60L7RgtC+0YDQsNGPINC00L7Qu9C20L3QsCDQsdGL0YLRjFxuICog0L3QsNC/0YDQsNCy0LvQtdC90L3QsCDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90YvQuSDQvtCx0YrQtdC60YIg0LIg0L/RgNC40LvQvtC20LXQvdC40LgsINC90LDQv9GA0LjQvNC10YA6INC90LAg0LzQsNGI0LjQvdGDINCyXG4gKiDQs9C+0L3QvtGH0L3QvtC5INC40LPRgNC1LiDQmtCw0LzQtdGA0LAg0LHRg9C00LXRgiDRgdCw0LzQsCDQv9C70LDQstC90L4g0Lgg0YEg0LDQvdC40LzQsNGG0LjQtdC5INC90LDQv9GA0LDQstC70Y/RgtGM0YHRjyDQvdCwINC90YPQttC90YvQuVxuICog0L7QsdGK0LXQutGCLiDQldGB0YLRjCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINCw0L3QuNC80LjRgNC+0LLQsNC90L3QvtCz0L4g0L7RgtC00LDQu9C10L3QuNGPINC40LvQuCDQv9GA0LjQsdC70LjQttC10L3QuNGPINC60LDQvNC10YDRiy5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5DYW1lcmFcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10g0J/QsNGA0LDQvNC10YLRgNGLINC00LvRjyDRgdC+0LfQtNCw0L3QuNGPINC60LDQvNC10YDRiywg0YHQvNC+0YLRgNC40YLQtSB7QGxpbmsgdjYuc2V0dGluZ3MuY2FtZXJhfS5cbiAqIEBleGFtcGxlIDxjYXB0aW9uPlJlcXVpcmUgXCJ2Ni5DYW1lcmFcIjwvY2FwdGlvbj5cbiAqIHZhciBDYW1lcmEgPSByZXF1aXJlKCAndjYuanMvY29yZS9jYW1lcmEvQ2FtZXJhJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGFuIGluc3RhbmNlPC9jYXB0aW9uPlxuICogdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhbiBpbnN0YW5jZSB3aXRoIG9wdGlvbnM8L2NhcHRpb24+XG4gKiB2YXIgY2FtZXJhID0gbmV3IENhbWVyYSgge1xuICogICBzZXR0aW5nczoge1xuICogICAgIHNwZWVkOiB7XG4gKiAgICAgICB4OiAwLjE1LFxuICogICAgICAgeTogMC4xNVxuICogICAgIH1cbiAqICAgfVxuICogfSApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGFuIGluc3RhbmNlIHdpdGggcmVuZGVyZXI8L2NhcHRpb24+XG4gKiB2YXIgY2FtZXJhID0gbmV3IENhbWVyYSgge1xuICogICByZW5kZXJlcjogcmVuZGVyZXJcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gQ2FtZXJhICggb3B0aW9ucyApXG57XG4gIHZhciB4LCB5O1xuICBvcHRpb25zID0gZGVmYXVsdHMoIHNldHRpbmdzLCBvcHRpb25zICk7XG4gIC8qKlxuICAgKiDQndCw0YHRgtGA0L7QudC60Lgg0LrQsNC80LXRgNGLLCDRgtCw0LrQuNC1INC60LDQuiDRgdC60L7RgNC+0YHRgtGMINCw0L3QuNC80LDRhtC40Lgg0LjQu9C4INC80LDRgdGI0YLQsNCxLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LkNhbWVyYSNzZXR0aW5nc1xuICAgKiBAc2VlIHY2LnNldHRpbmdzLmNhbWVyYS5zZXR0aW5nc1xuICAgKi9cbiAgdGhpcy5zZXR0aW5ncyA9IG9wdGlvbnMuc2V0dGluZ3M7XG4gIGlmICggb3B0aW9ucy5yZW5kZXJlciApIHtcbiAgICAvKipcbiAgICAgKiDQoNC10L3QtNC10YDQtdGALlxuICAgICAqIEBtZW1iZXIge3Y2LkFic3RyYWN0UmVuZGVyZXJ8dm9pZH0gdjYuQ2FtZXJhI3JlbmRlcmVyXG4gICAgICovXG4gICAgdGhpcy5yZW5kZXJlciA9IG9wdGlvbnMucmVuZGVyZXI7XG4gIH1cbiAgaWYgKCAhIHRoaXMuc2V0dGluZ3Mub2Zmc2V0ICkge1xuICAgIGlmICggdGhpcy5yZW5kZXJlciApIHtcbiAgICAgIHggPSB0aGlzLnJlbmRlcmVyLncgKiAwLjU7XG4gICAgICB5ID0gdGhpcy5yZW5kZXJlci5oICogMC41O1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gMDtcbiAgICAgIHkgPSAwO1xuICAgIH1cbiAgICB0aGlzLnNldHRpbmdzLm9mZnNldCA9IHtcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5XG4gICAgfTtcbiAgfVxuICAvKipcbiAgICog0J7QsdGK0LXQutGCLCDQvdCwINC60L7RgtC+0YDRi9C5INC90LDQv9GA0LDQstC70LXQvdCwINC60LDQvNC10YDQsC5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7b2JqZWN0P30gdjYuQ2FtZXJhI19kZXN0aW5hdGlvblxuICAgKiBAc2VlIHY2LkNhbWVyYSNsb29rQXRcbiAgICovXG4gIHRoaXMuX2Rlc3RpbmF0aW9uID0gbnVsbDtcbiAgLyoqXG4gICAqINCh0LLQvtC50YHRgtCy0L4sINC60L7RgtC+0YDQvtC1INC90LDQtNC+INCx0YDQsNGC0Ywg0LjQtyB7QGxpbmsgdjYuQ2FtZXJhI19kZXN0aW5hdGlvbn0uXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge3N0cmluZz99IHY2LkNhbWVyYSNfZGVzdGluYXRpb25LZXlcbiAgICogQHNlZSB2Ni5DYW1lcmEjbG9va0F0XG4gICAqL1xuICB0aGlzLl9kZXN0aW5hdGlvbktleSA9IG51bGw7XG4gIC8qKlxuICAgKiDQotC10LrRg9GJ0Y/RjyDQv9C+0LfQuNGG0LjRjyDQutCw0LzQtdGA0YsgKNGB0Y7QtNCwINC90LDQv9GA0LDQstC70LXQvdCwINC60LDQvNC10YDQsCkuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge0lWZWN0b3IyRH0gdjYuQ2FtZXJhI19jdXJyZW50UG9zaXRpb25cbiAgICovXG4gIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiA9IHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfTtcbn1cbkNhbWVyYS5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQvtCx0YrQtdC60YIsINC90LAg0LrQvtGC0L7RgNGL0Lkg0LrQsNC80LXRgNCwINC00L7Qu9C20L3QsCDQsdGL0YLRjCDQvdCw0L/RgNCw0LLQu9C10L3QsC5cbiAgICogQHByaXZhdGVcbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjX2dldERlc3RpbmF0aW9uXG4gICAqIEByZXR1cm4ge0lWZWN0b3IyRD99INCe0LHRitC10LrRgiDQuNC70LggXCJudWxsXCIuXG4gICAqL1xuICBfZ2V0RGVzdGluYXRpb246IGZ1bmN0aW9uIF9nZXREZXN0aW5hdGlvbiAoKVxuICB7XG4gICAgdmFyIF9kZXN0aW5hdGlvbktleSA9IHRoaXMuX2Rlc3RpbmF0aW9uS2V5O1xuICAgIGlmICggX2Rlc3RpbmF0aW9uS2V5ID09PSBudWxsICkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Rlc3RpbmF0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZGVzdGluYXRpb25bIF9kZXN0aW5hdGlvbktleSBdO1xuICB9LFxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIg0L3QsNGB0YLRgNC+0LnQutC4LlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNzZXRcbiAgICogQHBhcmFtICB7c3RyaW5nfSBzZXR0aW5nINCY0LzRjyDQvdCw0YHRgtGA0L7QudC60Lg6IFwiem9vbS1vdXQgc3BlZWRcIiwgXCJ6b29tLWluIHNwZWVkXCIsIFwib2Zmc2V0XCIsIFwic3BlZWRcIiwgXCJ6b29tXCIuXG4gICAqIEBwYXJhbSAge2FueX0gICAgdmFsdWUgICDQndC+0LLQvtC1INC30L3QsNGH0LXQvdC40LUg0L3QsNGB0YLRgNC+0LnQutC4LlxuICAgKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgem9vbS1pbiBzcGVlZCBzZXR0aW5nIHRvIDAuMDAyNSB3aXRoIGxpbmVhciBmbGFnIChkZWZhdWx0OiB0cnVlKS5cbiAgICogY2FtZXJhLnNldCggJ3pvb20taW4gc3BlZWQnLCB7IHZhbHVlOiAwLjAwMjUsIGxpbmVhcjogdHJ1ZSB9ICk7XG4gICAqIC8vIFR1cm4gb2ZmIGxpbmVhciBmbGFnLlxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1pbiBzcGVlZCcsIHsgbGluZWFyOiBmYWxzZSB9ICk7XG4gICAqIC8vIFNldCB6b29tIHNldHRpbmcgdG8gMSB3aXRoIHJhbmdlIFsgMC43NSAuLiAxLjEyNSBdLlxuICAgKiBjYW1lcmEuc2V0KCAnem9vbScsIHsgdmFsdWU6IDEsIG1pbjogMC43NSwgbWF4OiAxLjEyNSB9ICk7XG4gICAqIC8vIFNldCBjYW1lcmEgc3BlZWQuXG4gICAqIGNhbWVyYS5zZXQoICdzcGVlZCcsIHsgeDogMC4xLCB5OiAwLjEgfSApO1xuICAgKi9cbiAgc2V0OiBmdW5jdGlvbiBzZXQgKCBzZXR0aW5nLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgc2V0dGluZ18gPSB0aGlzLmdldCggc2V0dGluZyApO1xuICAgIGZvciAoIHZhciBfa2V5cyA9IE9iamVjdC5rZXlzKCB2YWx1ZSApLCBfaSA9IDAsIF9sID0gX2tleXMubGVuZ3RoOyBfaSA8IF9sOyArK19pICkge1xuICAgICAgc2V0dGluZ19bIF9rZXlzWyBfaSBdIF0gPSB2YWx1ZVsgX2tleXNbIF9pIF0gXTtcbiAgICB9XG4gIH0sXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQt9C90LDRh9C10L3QuNC1INC90LDRgdGC0YDQvtC50LrQuC5cbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjZ2V0XG4gICAqIEBwYXJhbSAge3N0cmluZ30gc2V0dGluZyDQmNC80Y8g0L3QsNGB0YLRgNC+0LnQutC4OiBcInpvb20tb3V0IHNwZWVkXCIsIFwiem9vbS1pbiBzcGVlZFwiLCBcIm9mZnNldFwiLCBcInNwZWVkXCIsIFwiem9vbVwiLlxuICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgICAg0JfQvdCw0YfQtdC90LjQtSDQvdCw0YHRgtGA0L7QudC60LguXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEdldCBjdXJyZW50IGNhbWVyYSB6b29tLlxuICAgKiB2YXIgem9vbSA9IGNhbWVyYS5nZXQoICd6b29tJyApLnZhbHVlO1xuICAgKi9cbiAgZ2V0OiBmdW5jdGlvbiBnZXQgKCBzZXR0aW5nIClcbiAge1xuICAgIENIRUNLKCBzZXR0aW5nICk7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3NbIHNldHRpbmcgXTtcbiAgfSxcbiAgLyoqXG4gICAqINCd0LDQv9GA0LDQstC70Y/QtdGCINC60LDQvNC10YDRgyDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90YPRjiDQv9C+0LfQuNGG0LjRjiAoYFwiZGVzdGluYXRpb25cImApLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNsb29rQXRcbiAgICogQHBhcmFtICB7SVZlY3RvcjJEfSBkZXN0aW5hdGlvbiDQn9C+0LfQuNGG0LjRjywg0LIg0LrQvtGC0L7RgNGD0Y4g0LTQvtC70LbQvdCwINGB0LzQvtGC0YDQtdGC0Ywg0LrQsNC80LXRgNCwLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgW2tleV0gICAgICAgINCh0LLQvtC50YHRgtCy0L4sINC60L7RgtC+0YDQvtC1INC90LDQtNC+INCx0YDQsNGC0Ywg0LjQtyBgXCJkZXN0aW5hdGlvblwiYC5cbiAgICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBjYXIgPSB7XG4gICAqICAgcG9zaXRpb246IHtcbiAgICogICAgIHg6IDQsXG4gICAqICAgICB5OiAyXG4gICAqICAgfVxuICAgKiB9O1xuICAgKiAvLyBEaXJlY3QgYSBjYW1lcmEgb24gdGhlIGNhci5cbiAgICogY2FtZXJhLmxvb2tBdCggY2FyLCAncG9zaXRpb24nICk7XG4gICAqIC8vIFRoaXMgd2F5IHdvcmtzIHRvbyBidXQgaWYgdGhlICdwb3NpdGlvbicgd2lsbCBiZSByZXBsYWNlZCBpdCB3b3VsZCBub3Qgd29yay5cbiAgICogY2FtZXJhLmxvb2tBdCggY2FyLnBvc2l0aW9uICk7XG4gICAqL1xuICBsb29rQXQ6IGZ1bmN0aW9uIGxvb2tBdCAoIGRlc3RpbmF0aW9uLCBrZXkgKVxuICB7XG4gICAgdGhpcy5fZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbjtcbiAgICBpZiAoIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgdGhpcy5fZGVzdGluYXRpb25LZXkgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kZXN0aW5hdGlvbktleSA9IGtleTtcbiAgICB9XG4gIH0sXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQutCw0LzQtdGA0LAg0LTQvtC70LbQvdCwINCx0YvRgtGMINC90LDQv9GA0LDQstC70LXQvdCwLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNzaG91bGRMb29rQXRcbiAgICogQHJldHVybiB7SVZlY3RvcjJEfSDQn9C+0LfQuNGG0LjRjy5cbiAgICogQGV4YW1wbGVcbiAgICogdmFyIG9iamVjdCA9IHtcbiAgICogICBwb3NpdGlvbjogeyB4OiA0LCB5OiAyIH1cbiAgICogfTtcbiAgICpcbiAgICogY2FtZXJhLnNob3VsZExvb2tBdCgpOyAvLyAtPiB7IHg6IDAsIHk6IDAgfS5cbiAgICogY2FtZXJhLmxvb2tBdCggb2JqZWN0LCAncG9zaXRpb24nICk7XG4gICAqIGNhbWVyYS5zaG91bGRMb29rQXQoKTsgLy8gLT4geyB4OiA0LCB5OiAyIH0gKGNsb25lKS5cbiAgICovXG4gIHNob3VsZExvb2tBdDogZnVuY3Rpb24gc2hvdWxkTG9va0F0ICgpXG4gIHtcbiAgICB2YXIgX2Rlc3RpbmF0aW9uID0gdGhpcy5fZ2V0RGVzdGluYXRpb24oKTtcbiAgICB2YXIgeCwgeTtcbiAgICBpZiAoIF9kZXN0aW5hdGlvbiA9PT0gbnVsbCApIHtcbiAgICAgIHggPSAwO1xuICAgICAgeSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSBfZGVzdGluYXRpb24ueDtcbiAgICAgIHkgPSBfZGVzdGluYXRpb24ueTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5XG4gICAgfTtcbiAgfSxcbiAgLyoqXG4gICAqINCe0LHQvdC+0LLQu9GP0LXRgiDQv9C+0LfQuNGG0LjRjiwg0L3QsCDQutC+0YLQvtGA0YPRjiDQvdCw0L/RgNCw0LLQu9C10L3QsCDQutCw0LzQtdGA0LAuXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI3VwZGF0ZVxuICAgKiBAcmV0dXJuIHt2b2lkfSDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGVcbiAgICogdGlja2VyLm9uKCAndXBkYXRlJywgZnVuY3Rpb24gKClcbiAgICoge1xuICAgKiAgIC8vIFVwZGF0ZSBhIGNhbWVyYSBvbiBlYWNoIGZyYW1lLlxuICAgKiAgIGNhbWVyYS51cGRhdGUoKTtcbiAgICogfSApO1xuICAgKi9cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUgKClcbiAge1xuICAgIHZhciBfZGVzdGluYXRpb24gPSB0aGlzLl9nZXREZXN0aW5hdGlvbigpO1xuICAgIGlmICggX2Rlc3RpbmF0aW9uICE9PSBudWxsICkge1xuICAgICAgdHJhbnNsYXRlKCB0aGlzLCBfZGVzdGluYXRpb24sICd4JyApO1xuICAgICAgdHJhbnNsYXRlKCB0aGlzLCBfZGVzdGluYXRpb24sICd5JyApO1xuICAgIH1cbiAgfSxcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC/0L7Qt9C40YbQuNGOLCDQvdCwINC60L7RgtC+0YDRg9GOINC60LDQvNC10YDQsCDQvdCw0L/RgNCw0LLQu9C10L3QsCDRgdC10LnRh9Cw0YEuXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI2xvb2tzQXRcbiAgICogQHJldHVybiB7SVZlY3RvcjJEfSDQotC10LrRg9GJ0LXQtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1INC60LDQvNC10YDRiy5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gQSBjYW1lcmEgbG9va3MgYXQgWyB4LCB5IF0gZnJvbSBsb29rc0F0IG5vdy5cbiAgICogdmFyIGxvb2tzQXQgPSBjYW1lcmEubG9va3NBdCgpO1xuICAgKi9cbiAgbG9va3NBdDogZnVuY3Rpb24gbG9va3NBdCAoKVxuICB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHRoaXMuX2N1cnJlbnRQb3NpdGlvbi54LFxuICAgICAgeTogdGhpcy5fY3VycmVudFBvc2l0aW9uLnlcbiAgICB9O1xuICB9LFxuICAvKipcbiAgICog0J/RgNC40LzQtdC90Y/QtdGCINC60LDQvNC10YDRgyDQvdCwINC80LDRgtGA0LjRhtGDINC40LvQuCDRgNC10L3QtNC10YDQtdGALlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNhcHBseVxuICAgKiBAcGFyYW0gIHt2Ni5UcmFuc2Zvcm18djYuQWJzdHJhY3RSZW5kZXJlcn0gW21hdHJpeF0g0JzQsNGC0YDQuNGG0LAg0LjQu9C4INGA0LXQvdC00LXRgNC10YAuXG4gICAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAgICogQGV4YW1wbGUgPGNhcHRpb24+QXBwbHkgb24gYSByZW5kZXJlcjwvY2FwdGlvbj5cbiAgICogdmFyIHJlbmRlcmVyID0gdjYuY3JlYXRlUmVuZGVyZXIoKTtcbiAgICogY2FtZXJhLmFwcGx5KCByZW5kZXJlciApO1xuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5BcHBseSBvbiBhIHRyYW5zZm9ybTwvY2FwdGlvbj5cbiAgICogdmFyIG1hdHJpeCA9IG5ldyB2Ni5UcmFuc2Zvcm0oKTtcbiAgICogY2FtZXJhLmFwcGx5KCBtYXRyaXggKTtcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+QXBwbHkgb24gYSBjYW1lcmEncyByZW5kZXJlcjwvY2FwdGlvbj5cbiAgICogdmFyIGNhbWVyYSA9IG5ldyB2Ni5DYW1lcmEoIHtcbiAgICogICByZW5kZXJlcjogcmVuZGVyZXJcbiAgICogfSApO1xuICAgKlxuICAgKiBjYW1lcmEuYXBwbHkoKTtcbiAgICovXG4gIGFwcGx5OiBmdW5jdGlvbiBhcHBseSAoIG1hdHJpeCApXG4gIHtcbiAgICB2YXIgem9vbSA9IHRoaXMuc2V0dGluZ3Muem9vbS52YWx1ZTtcbiAgICB2YXIgeCA9IHRyYW5zZm9ybSggdGhpcywgdGhpcy5fY3VycmVudFBvc2l0aW9uLCAneCcgKTtcbiAgICB2YXIgeSA9IHRyYW5zZm9ybSggdGhpcywgdGhpcy5fY3VycmVudFBvc2l0aW9uLCAneScgKTtcbiAgICAoIG1hdHJpeCB8fCB0aGlzLnJlbmRlcmVyICkuc2V0VHJhbnNmb3JtKCB6b29tLCAwLCAwLCB6b29tLCB6b29tICogeCwgem9vbSAqIHkgKTtcbiAgfSxcbiAgLyoqXG4gICAqINCe0L/RgNC10LTQtdC70Y/QtdGCLCDQstC40LTQuNGCINC70Lgg0LrQsNC80LXRgNCwINC+0LHRitC10LrRgiDQuNC3INGB0L7QvtGC0LLQtdGC0YHQstGD0Y7RidC40YUg0L/QsNGA0LDQstC10YLRgNC+0LIgKHgsIHksIHcsIGgpINGB0LXQudGH0LDRgSxcbiAgICog0LXRgdC70Lgg0L3QtdGCLCDRgtC+INGN0YLQvtGCINC+0LHRitC10LrRgiDQvNC+0LbQvdC+INC90LUg0L7RgtGA0LjRgdC+0LLRi9Cy0LDRgtGMLlxuICAgKiBAbWV0aG9kIHY2LkNhbWVyYSNzZWVzXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHggICAgICAgICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQvtCx0YrQtdC60YLQsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgeSAgICAgICAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwINC+0LHRitC10LrRgtCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICB3ICAgICAgICAgINCo0LjRgNC40L3QsCDQvtCx0YrQtdC60YLQsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgaCAgICAgICAgICDQktGL0YHQvtGC0LAg0L7QsdGK0LXQutGC0LAuXG4gICAqIEBwYXJhbSAge3Y2LkFic3RyYWN0UmVuZGVyZXJ9IFtyZW5kZXJlcl0g0KDQtdC90LTQtdGA0LXRgC5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICBgdHJ1ZWAsINC10YHQu9C4INC+0LHRitC10LrRgiDQtNC+0LvQttC10L0g0LHRi9GC0Ywg0L7RgtGA0LjRgdC+0LLQsNC9LlxuICAgKiBAZXhhbXBsZVxuICAgKiBpZiAoIGNhbWVyYS5zZWVzKCBvYmplY3QueCwgb2JqZWN0LnksIG9iamVjdC53LCBvYmplY3QuaCApICkge1xuICAgKiAgIG9iamVjdC5zaG93KCk7XG4gICAqIH1cbiAgICovXG4gIHNlZXM6IGZ1bmN0aW9uIHNlZXMgKCB4LCB5LCB3LCBoLCByZW5kZXJlciApXG4gIHtcbiAgICB2YXIgem9vbSA9IHRoaXMuc2V0dGluZ3Muem9vbS52YWx1ZTtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5zZXR0aW5ncy5vZmZzZXQ7XG4gICAgdmFyIF9jdXJyZW50UG9zaXRpb24gPSB0aGlzLl9jdXJyZW50UG9zaXRpb247XG4gICAgaWYgKCAhIHJlbmRlcmVyICkge1xuICAgICAgcmVuZGVyZXIgPSB0aGlzLnJlbmRlcmVyO1xuICAgIH1cbiAgICBpZiAoICEgcmVuZGVyZXIgKSB7XG4gICAgICB0aHJvdyBFcnJvciggJ05vIHJlbmRlcmVyIChjYW1lcmEuc2VlcyknICk7XG4gICAgfVxuICAgIHJldHVybiB4ICsgdyA+IF9jdXJyZW50UG9zaXRpb24ueCAtIG9mZnNldC54IC8gem9vbSAmJlxuICAgICAgICAgICB4IDwgX2N1cnJlbnRQb3NpdGlvbi54ICsgKCByZW5kZXJlci53IC0gb2Zmc2V0LnggKSAvIHpvb20gJiZcbiAgICAgICAgICAgeSArIGggPiBfY3VycmVudFBvc2l0aW9uLnkgLSBvZmZzZXQueSAvIHpvb20gJiZcbiAgICAgICAgICAgeSA8IF9jdXJyZW50UG9zaXRpb24ueSArICggcmVuZGVyZXIuaCAtIG9mZnNldC55ICkgLyB6b29tO1xuICB9LFxuICAvKipcbiAgICog0J7RgtC00LDQu9GP0LXRgiDQutCw0LzQtdGA0YMuINCQ0L3QuNC80LDRhtC40Y8g0LzQvtC20LXRgiDQsdGL0YLRjCDQu9C40L3QtdC50L3QvtC5ICjQv9C+INGD0LzQvtC70YfQsNC90LjRjikg0LXRgdC70Lgg0Y3RgtC+INCy0LrQu9GO0YfQtdC90L46XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogY2FtZXJhLnNldCggJ3pvb20tb3V0IHNwZWVkJywge1xuICAgKiAgIC8vIEVuYWJsZXMgbGluZWFyIGFuaW1hdGlvbiAoZW5hYmxlZCBieSBkZWZhdWx0IGJ1dCB5b3UgY2FuIGRpc2FibGUpLlxuICAgKiAgIGxpbmVhcjogdHJ1ZVxuICAgKiB9ICk7XG4gICAqIGBgYFxuICAgKiDQodC60L7RgNC+0YHRgtGMINCw0L3QuNC80LDRhtC40Lgg0LjQt9C80LXQvdGP0LXRgtGB0Y8g0YfQtdGA0LXQtyBgdmFsdWVgOlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIGNhbWVyYS5zZXQoICd6b29tLW91dCBzcGVlZCcsIHtcbiAgICogICAvLyBTZXQgc2xvdyB6b29tLW91dCBzcGVlZCAoMSBieSBkZWZhdWx0KS5cbiAgICogICB2YWx1ZTogMC4xXG4gICAqIH0gKTtcbiAgICogYGBgXG4gICAqIEBtZXRob2QgdjYuQ2FtZXJhI3pvb21PdXRcbiAgICogQHJldHVybiB7dm9pZH0g0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gICAqIEBleGFtcGxlXG4gICAqIHRpY2tlci5vbiggJ3VwZGF0ZScsIGZ1bmN0aW9uICgpXG4gICAqIHtcbiAgICogICBjYW1lcmEuem9vbU91dCgpO1xuICAgKiB9ICk7XG4gICAqL1xuICB6b29tT3V0OiBmdW5jdGlvbiB6b29tT3V0ICgpIHsgdmFyIHpvb21TcGVlZCA9IHRoaXMuc2V0dGluZ3NbICd6b29tLW91dCBzcGVlZCcgXTsgdmFyIHpvb20gPSB0aGlzLnNldHRpbmdzLnpvb207IHZhciBjaGFuZ2U7IGlmICggem9vbS52YWx1ZSAhPT0gem9vbS5taW4gKSB7IGlmICggem9vbVNwZWVkLmxpbmVhciApIHsgY2hhbmdlID0gem9vbVNwZWVkLnZhbHVlICogem9vbS52YWx1ZTsgfSBlbHNlIHsgY2hhbmdlID0gem9vbVNwZWVkLnZhbHVlOyB9IHpvb20udmFsdWUgPSBNYXRoLm1heCggem9vbS52YWx1ZSAtIGNoYW5nZSwgem9vbS5taW4gKTsgfSB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCf0YDQuNCx0LvQuNC20LDQtdGCINC60LDQvNC10YDRgy4g0JDQvdC40LzQsNGG0LjRjyDQvNC+0LbQtdGCINCx0YvRgtGMINC70LjQvdC10LnQvdC+0LkgKNC/0L4g0YPQvNC+0LvRh9Cw0L3QuNGOKSDQtdGB0LvQuCDRjdGC0L4g0LLQutC70Y7Rh9C10L3QvjpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1pbiBzcGVlZCcsIHtcbiAgICogICAvLyBFbmFibGVzIGxpbmVhciBhbmltYXRpb24gKGVuYWJsZWQgYnkgZGVmYXVsdCBidXQgeW91IGNhbiBkaXNhYmxlKS5cbiAgICogICBsaW5lYXI6IHRydWVcbiAgICogfSApO1xuICAgKiBgYGBcbiAgICog0KHQutC+0YDQvtGB0YLRjCDQsNC90LjQvNCw0YbQuNC4INC40LfQvNC10L3Rj9C10YLRgdGPINGH0LXRgNC10LcgYHZhbHVlYDpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBjYW1lcmEuc2V0KCAnem9vbS1pbiBzcGVlZCcsIHtcbiAgICogICAvLyBTZXQgc2xvdyB6b29tLWluIHNwZWVkICgxIGJ5IGRlZmF1bHQpLlxuICAgKiAgIHZhbHVlOiAwLjFcbiAgICogfSApO1xuICAgKiBgYGBcbiAgICogQG1ldGhvZCB2Ni5DYW1lcmEjem9vbUluXG4gICAqIEByZXR1cm4ge3ZvaWR9INCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICAgKiBAZXhhbXBsZVxuICAgKiB0aWNrZXIub24oICd1cGRhdGUnLCBmdW5jdGlvbiAoKVxuICAgKiB7XG4gICAqICAgY2FtZXJhLnpvb21JbigpO1xuICAgKiB9ICk7XG4gICAqL1xuICB6b29tSW46IGZ1bmN0aW9uIHpvb21JbiAoKSB7IHZhciB6b29tU3BlZWQgPSB0aGlzLnNldHRpbmdzWyAnem9vbS1pbiBzcGVlZCcgXTsgdmFyIHpvb20gPSB0aGlzLnNldHRpbmdzLnpvb207IHZhciBjaGFuZ2U7IGlmICggem9vbS52YWx1ZSAhPT0gem9vbS5tYXggKSB7IGlmICggem9vbVNwZWVkLmxpbmVhciApIHsgY2hhbmdlID0gem9vbVNwZWVkLnZhbHVlICogem9vbS52YWx1ZTsgfSBlbHNlIHsgY2hhbmdlID0gem9vbVNwZWVkLnZhbHVlOyB9IHpvb20udmFsdWUgPSBNYXRoLm1pbiggem9vbS52YWx1ZSArIGNoYW5nZSwgem9vbS5tYXggKTsgfSB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgY29uc3RydWN0b3I6IENhbWVyYVxufTtcbmZ1bmN0aW9uIHRyYW5zZm9ybSAoIGNhbWVyYSwgcG9zaXRpb24sIGF4aXMgKVxue1xuICByZXR1cm4gY2FtZXJhLnNldHRpbmdzLm9mZnNldFsgYXhpcyBdIC8gY2FtZXJhLnNldHRpbmdzLnpvb20udmFsdWUgLSBwb3NpdGlvblsgYXhpcyBdO1xufVxuZnVuY3Rpb24gdHJhbnNsYXRlICggY2FtZXJhLCBkZXN0aW5hdGlvbiwgYXhpcyApXG57XG4gIHZhciB0cmFuc2Zvcm1lZERlc3RpbmF0aW9uID0gdHJhbnNmb3JtKCBjYW1lcmEsIGRlc3RpbmF0aW9uLCBheGlzICk7XG4gIHZhciB0cmFuc2Zvcm1lZEN1cnJlbnRQb3NpdGlvbiA9IHRyYW5zZm9ybSggY2FtZXJhLCBjYW1lcmEuX2N1cnJlbnRQb3NpdGlvbiwgYXhpcyApO1xuICBjYW1lcmEuX2N1cnJlbnRQb3NpdGlvblsgYXhpcyBdICs9ICggdHJhbnNmb3JtZWRDdXJyZW50UG9zaXRpb24gLSB0cmFuc2Zvcm1lZERlc3RpbmF0aW9uICkgKiBjYW1lcmEuc2V0dGluZ3Muc3BlZWRbIGF4aXMgXTtcbn1cbmZ1bmN0aW9uIENIRUNLICggc2V0dGluZyApXG57XG4gIHN3aXRjaCAoIHNldHRpbmcgKSB7XG4gICAgY2FzZSAnem9vbS1vdXQgc3BlZWQnOlxuICAgIGNhc2UgJ3pvb20taW4gc3BlZWQnOlxuICAgIGNhc2UgJ29mZnNldCc6XG4gICAgY2FzZSAnc3BlZWQnOlxuICAgIGNhc2UgJ3pvb20nOlxuICAgICAgcmV0dXJuO1xuICB9XG4gIHRocm93IEVycm9yKCAnR290IHVua25vd24gc2V0dGluZyBrZXk6ICcgKyBzZXR0aW5nICk7XG59XG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodGC0LDQvdC00LDRgNGC0L3Ri9C1INC90LDRgdGC0YDQvtC50LrQuCDQutCw0LzQtdGA0YsuXG4gKiBAbmFtZXNwYWNlIHY2LnNldHRpbmdzLmNhbWVyYVxuICogQGV4YW1wbGVcbiAqIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NhbWVyYS9zZXR0aW5ncycgKTtcbiAqL1xuXG4vKipcbiAqINCg0LXQvdC00LXRgNC10YAuXG4gKiBAbWVtYmVyIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSB2Ni5zZXR0aW5ncy5jYW1lcmEucmVuZGVyZXJcbiAqL1xuXG4vKipcbiAqINCh0YLQsNC90LTQsNGA0YLQvdGL0LUg0L3QsNGB0YLRgNC+0LnQutC4INC60LDQvNC10YDRiy5cbiAqIEBtZW1iZXIge29iamVjdH0gdjYuc2V0dGluZ3MuY2FtZXJhLnNldHRpbmdzXG4gKiBAcHJvcGVydHkge29iamVjdH0gICAgWyd6b29tLW91dCBzcGVlZCddXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgWyd6b29tLW91dCBzcGVlZCcudmFsdWU9MV0gICAgINCh0LrQvtGA0L7RgdGC0Ywg0YPQvNC10L3RjNGI0LXQvdC40Y8g0LzQsNGB0YjRgtCw0LHQsCAo0L7RgtC00LDQu9C10L3QuNGPKSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59ICAgWyd6b29tLW91dCBzcGVlZCcubGluZWFyPXRydWVdINCU0LXQu9Cw0YLRjCDQsNC90LjQvNCw0YbQuNGOINC70LjQvdC10LnQvdC+0LkuXG4gKiBAcHJvcGVydHkge29iamVjdH0gICAgWyd6b29tLWluIHNwZWVkJ11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20taW4gc3BlZWQnLnZhbHVlPTFdICAgICAg0KHQutC+0YDQvtGB0YLRjCDRg9Cy0LXQu9C40YfQtdC90LjRjyDQvNCw0YHRiNGC0LDQsdCwICjQv9GA0LjQsdC70LjQttC10L3QuNGPKSDQutCw0LzQtdGA0YsuXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59ICAgWyd6b29tLWluIHNwZWVkJy5saW5lYXI9dHJ1ZV0gINCU0LXQu9Cw0YLRjCDQsNC90LjQvNCw0YbQuNGOINC70LjQvdC10LnQvdC+0LkuXG4gKiBAcHJvcGVydHkge29iamVjdH0gICAgWyd6b29tJ11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20nLnZhbHVlPTFdICAgICAgICAgICAgICAg0KLQtdC60YPRidC40Lkg0LzQsNGB0YjRgtCw0LEg0LrQsNC80LXRgNGLLlxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnem9vbScubWluPTFdICAgICAgICAgICAgICAgICDQnNC40L3QuNC80LDQu9GM0L3Ri9C5INC80LDRgdGI0YLQsNCxINC60LDQvNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3pvb20nLm1heD0xXSAgICAgICAgICAgICAgICAg0JzQsNC60YHQuNC80LDQu9GM0L3Ri9C5INC80LDRgdGI0YLQsNCxINC60LDQvNC10YDRiy5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAgICBbJ3NwZWVkJ10gICAgICAgICAgICAgICAgICAgICAg0KHQutC+0YDQvtGB0YLRjCDQvdCw0L/RgNCw0LLQu9C10L3QuNGPINC60LDQvNC10YDRiyDQvdCwINC+0LHRitC10LrRgi5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSAgICBbJ3NwZWVkJy54PTFdICAgICAgICAgICAgICAgICAgMSAtINC80L7QvNC10L3RgtCw0LvRjNC90L7QtSDQv9C10YDQtdC80LXRidC10L3QuNC1INC/0L4gWCwgMC4xIC0g0LzQtdC00LvQtdC90L3QvtC1LlxuICogQHByb3BlcnR5IHtudW1iZXJ9ICAgIFsnc3BlZWQnLnk9MV0gICAgICAgICAgICAgICAgICAxIC0g0LzQvtC80LXQvdGC0LDQu9GM0L3QvtC1INC/0LXRgNC10LzQtdGJ0LXQvdC40LUg0L/QviBZLCAwLjEgLSDQvNC10LTQu9C10L3QvdC+0LUuXG4gKiBAcHJvcGVydHkge0lWZWN0b3IyRH0gWydvZmZzZXQnXVxuICovXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICAnem9vbS1vdXQgc3BlZWQnOiB7XG4gICAgdmFsdWU6ICAxLFxuICAgIGxpbmVhcjogdHJ1ZVxuICB9LFxuXG4gICd6b29tLWluIHNwZWVkJzoge1xuICAgIHZhbHVlOiAgMSxcbiAgICBsaW5lYXI6IHRydWVcbiAgfSxcblxuICAnem9vbSc6IHtcbiAgICB2YWx1ZTogMSxcbiAgICBtaW46ICAgMSxcbiAgICBtYXg6ICAgMVxuICB9LFxuXG4gICdzcGVlZCc6IHtcbiAgICB4OiAxLFxuICAgIHk6IDFcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBIU0xBO1xuXG52YXIgY2xhbXAgPSByZXF1aXJlKCAncGVha28vY2xhbXAnICk7ICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG52YXIgcGFyc2UgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wYXJzZScgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG52YXIgUkdCQSAgPSByZXF1aXJlKCAnLi9SR0JBJyApOyAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG4vKipcbiAqIEhTTEEg0YbQstC10YIuXG4gKiBAY29uc3RydWN0b3IgdjYuSFNMQVxuICogQHBhcmFtIHtudW1iZXJ8VENvbG9yfSBbaF0gSHVlIHZhbHVlLlxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbc10gU2F0dXJhdGlvbiB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2xdIExpZ2h0bmVzcyB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdIEFscGhhIHZhbHVlLlxuICogQHNlZSB2Ni5IU0xBI3NldFxuICogQGV4YW1wbGVcbiAqIHZhciBIU0xBID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29sb3IvSFNMQScgKTtcbiAqXG4gKiB2YXIgdHJhbnNwYXJlbnQgPSBuZXcgSFNMQSggJ3RyYW5zcGFyZW50JyApO1xuICogdmFyIG1hZ2VudGEgICAgID0gbmV3IEhTTEEoICdtYWdlbnRhJyApO1xuICogdmFyIGZ1Y2hzaWEgICAgID0gbmV3IEhTTEEoIDMwMCwgMTAwLCA1MCApO1xuICogdmFyIGdob3N0ICAgICAgID0gbmV3IEhTTEEoIDEwMCwgMC4xICk7XG4gKiB2YXIgd2hpdGUgICAgICAgPSBuZXcgSFNMQSggMTAwICk7XG4gKiB2YXIgYmxhY2sgICAgICAgPSBuZXcgSFNMQSgpO1xuICovXG5mdW5jdGlvbiBIU0xBICggaCwgcywgbCwgYSApXG57XG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkhTTEEjMCBcImh1ZVwiIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzEgXCJzYXR1cmF0aW9uXCIgdmFsdWUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkhTTEEjMiBcImxpZ2h0bmVzc1wiIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5IU0xBIzMgXCJhbHBoYVwiIHZhbHVlLlxuICAgKi9cblxuICB0aGlzLnNldCggaCwgcywgbCwgYSApO1xufVxuXG5IU0xBLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINCy0L7RgdC/0YDQuNC90LjQvNCw0LXQvNGD0Y4g0Y/RgNC60L7RgdGC0YwgKHBlcmNlaXZlZCBicmlnaHRuZXNzKSDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjcGVyY2VpdmVkQnJpZ2h0bmVzc1xuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAnbWFnZW50YScgKS5wZXJjZWl2ZWRCcmlnaHRuZXNzKCk7IC8vIC0+IDE2My44NzU5NDM5MzMyMDgyXG4gICAqL1xuICBwZXJjZWl2ZWRCcmlnaHRuZXNzOiBmdW5jdGlvbiBwZXJjZWl2ZWRCcmlnaHRuZXNzICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZ2JhKCkucGVyY2VpdmVkQnJpZ2h0bmVzcygpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQvtGC0L3QvtGB0LjRgtC10LvRjNC90YPRjiDRj9GA0LrQvtGB0YLRjCDRhtCy0LXRgtCwLlxuICAgKiBAbWV0aG9kIHY2LkhTTEEjbHVtaW5hbmNlXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZWxhdGl2ZV9sdW1pbmFuY2VcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoICdtYWdlbnRhJyApLmx1bWluYW5jZSgpOyAvLyAtPiA3Mi42MjRcbiAgICovXG4gIGx1bWluYW5jZTogZnVuY3Rpb24gbHVtaW5hbmNlICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5yZ2JhKCkubHVtaW5hbmNlKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINGP0YDQutC+0YHRgtGMINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuSFNMQSNicmlnaHRuZXNzXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvQUVSVC8jY29sb3ItY29udHJhc3RcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoICdtYWdlbnRhJyApLmJyaWdodG5lc3MoKTsgLy8gLT4gMTA1LjMxNVxuICAgKi9cbiAgYnJpZ2h0bmVzczogZnVuY3Rpb24gYnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLmJyaWdodG5lc3MoKTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIgQ1NTLWNvbG9yINGB0YLRgNC+0LrRgy5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3RvU3RyaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQGV4YW1wbGVcbiAgICogJycgKyBuZXcgSFNMQSggJ3JlZCcgKTsgLy8gLT4gXCJoc2xhKDAsIDEwMCUsIDUwJSwgMSlcIlxuICAgKi9cbiAgdG9TdHJpbmc6IGZ1bmN0aW9uIHRvU3RyaW5nICgpXG4gIHtcbiAgICByZXR1cm4gJ2hzbGEoJyArIHRoaXNbIDAgXSArICcsICcgKyB0aGlzWyAxIF0gKyAnXFx1MDAyNSwgJyArIHRoaXNbIDIgXSArICdcXHUwMDI1LCAnICsgdGhpc1sgMyBdICsgJyknO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBILCBTLCBMLCBBINC30L3QsNGH0LXQvdC40Y8uXG4gICAqIEBtZXRob2QgdjYuSFNMQSNzZXRcbiAgICogQHBhcmFtIHtudW1iZXJ8VENvbG9yfSBbaF0gSHVlIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtzXSBTYXR1cmF0aW9uIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtsXSBMaWdodG5lc3MgdmFsdWUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdIEFscGhhIHZhbHVlLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuSFNMQVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgSFNMQSgpLnNldCggMTAwLCAwLjUgKTsgLy8gLT4gMCwgMCwgMTAwLCAwLjVcbiAgICovXG4gIHNldDogZnVuY3Rpb24gc2V0ICggaCwgcywgbCwgYSApXG4gIHtcbiAgICBzd2l0Y2ggKCB0cnVlICkge1xuICAgICAgY2FzZSB0eXBlb2YgaCA9PT0gJ3N0cmluZyc6XG4gICAgICAgIGggPSBwYXJzZSggaCApO1xuICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICBjYXNlIHR5cGVvZiBoID09PSAnb2JqZWN0JyAmJiBoICE9PSBudWxsOlxuICAgICAgICBpZiAoIGgudHlwZSAhPT0gdGhpcy50eXBlICkge1xuICAgICAgICAgIGggPSBoWyB0aGlzLnR5cGUgXSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpc1sgMCBdID0gaFsgMCBdO1xuICAgICAgICB0aGlzWyAxIF0gPSBoWyAxIF07XG4gICAgICAgIHRoaXNbIDIgXSA9IGhbIDIgXTtcbiAgICAgICAgdGhpc1sgMyBdID0gaFsgMyBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHN3aXRjaCAoIHZvaWQgMCApIHtcbiAgICAgICAgICBjYXNlIGg6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIGwgPSBzID0gaCA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIHM6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIGwgPSBNYXRoLmZsb29yKCBoICk7XG4gICAgICAgICAgICBzID0gaCA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGw6XG4gICAgICAgICAgICBhID0gcztcbiAgICAgICAgICAgIGwgPSBNYXRoLmZsb29yKCBoICk7XG4gICAgICAgICAgICBzID0gaCA9IDA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGE6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaCA9IE1hdGguZmxvb3IoIGggKTtcbiAgICAgICAgICAgIHMgPSBNYXRoLmZsb29yKCBzICk7XG4gICAgICAgICAgICBsID0gTWF0aC5mbG9vciggbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpc1sgMCBdID0gaDtcbiAgICAgICAgdGhpc1sgMSBdID0gcztcbiAgICAgICAgdGhpc1sgMiBdID0gbDtcbiAgICAgICAgdGhpc1sgMyBdID0gYTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICog0JrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINCyIHtAbGluayB2Ni5SR0JBfS5cbiAgICogQG1ldGhvZCB2Ni5IU0xBI3JnYmFcbiAgICogQHJldHVybiB7djYuUkdCQX1cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoICdtYWdlbnRhJyApLnJnYmEoKTsgLy8gLT4gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAxIClcbiAgICovXG4gIHJnYmE6IGZ1bmN0aW9uIHJnYmEgKClcbiAge1xuICAgIHZhciByZ2JhID0gbmV3IFJHQkEoKTtcblxuICAgIHZhciBoID0gdGhpc1sgMCBdICUgMzYwIC8gMzYwO1xuICAgIHZhciBzID0gdGhpc1sgMSBdICogMC4wMTtcbiAgICB2YXIgbCA9IHRoaXNbIDIgXSAqIDAuMDE7XG5cbiAgICB2YXIgdHIgPSBoICsgMSAvIDM7XG4gICAgdmFyIHRnID0gaDtcbiAgICB2YXIgdGIgPSBoIC0gMSAvIDM7XG5cbiAgICB2YXIgcTtcblxuICAgIGlmICggbCA8IDAuNSApIHtcbiAgICAgIHEgPSBsICogKCAxICsgcyApO1xuICAgIH0gZWxzZSB7XG4gICAgICBxID0gbCArIHMgLSBsICogcztcbiAgICB9XG5cbiAgICB2YXIgcCA9IDIgKiBsIC0gcTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB2YXJzLW9uLXRvcFxuXG4gICAgaWYgKCB0ciA8IDAgKSB7XG4gICAgICArK3RyO1xuICAgIH1cblxuICAgIGlmICggdGcgPCAwICkge1xuICAgICAgKyt0ZztcbiAgICB9XG5cbiAgICBpZiAoIHRiIDwgMCApIHtcbiAgICAgICsrdGI7XG4gICAgfVxuXG4gICAgaWYgKCB0ciA+IDEgKSB7XG4gICAgICAtLXRyO1xuICAgIH1cblxuICAgIGlmICggdGcgPiAxICkge1xuICAgICAgLS10ZztcbiAgICB9XG5cbiAgICBpZiAoIHRiID4gMSApIHtcbiAgICAgIC0tdGI7XG4gICAgfVxuXG4gICAgcmdiYVsgMCBdID0gZm9vKCB0ciwgcCwgcSApO1xuICAgIHJnYmFbIDEgXSA9IGZvbyggdGcsIHAsIHEgKTtcbiAgICByZ2JhWyAyIF0gPSBmb28oIHRiLCBwLCBxICk7XG4gICAgcmdiYVsgMyBdID0gdGhpc1sgMyBdO1xuXG4gICAgcmV0dXJuIHJnYmE7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LkhTTEF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQvNC4INC/0LDRgNCw0LzQtdGC0YDQsNC80LguXG4gICAqIEBtZXRob2QgdjYuSFNMQSNsZXJwXG4gICAqIEBwYXJhbSAge251bWJlcn0gIGhcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgc1xuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBsXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBzZWUgdjYuSFNMQSNsZXJwQ29sb3JcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IEhTTEEoIDUwLCAwLjI1ICkubGVycCggMCwgMCwgMTAwLCAwLjUgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDAsIDc1LCAwLjI1IClcbiAgICovXG4gIGxlcnA6IGZ1bmN0aW9uIGxlcnAgKCBoLCBzLCBsLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgY29sb3IgPSBuZXcgSFNMQSgpO1xuICAgIGNvbG9yWyAwIF0gPSBoO1xuICAgIGNvbG9yWyAxIF0gPSBzO1xuICAgIGNvbG9yWyAyIF0gPSBsO1xuICAgIHJldHVybiB0aGlzLmxlcnBDb2xvciggY29sb3IsIHZhbHVlICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LkhTTEF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDIGBjb2xvcmAuXG4gICAqIEBtZXRob2QgdjYuSFNMQSNsZXJwQ29sb3JcbiAgICogQHBhcmFtICB7VENvbG9yfSAgY29sb3JcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgdmFsdWVcbiAgICogQHJldHVybiB7djYuSFNMQX1cbiAgICogQHNlZSB2Ni5IU0xBI2xlcnBcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIGEgPSBuZXcgSFNMQSggNTAsIDAuMjUgKTtcbiAgICogdmFyIGIgPSBuZXcgSFNMQSggMTAwLCAwICk7XG4gICAqIHZhciBjID0gYS5sZXJwQ29sb3IoIGIsIDAuNSApOyAvLyAtPiBuZXcgSFNMQSggMCwgMCwgNzUsIDAuMjUgKVxuICAgKi9cbiAgbGVycENvbG9yOiBmdW5jdGlvbiBsZXJwQ29sb3IgKCBjb2xvciwgdmFsdWUgKVxuICB7XG4gICAgcmV0dXJuIHRoaXMucmdiYSgpLmxlcnBDb2xvciggY29sb3IsIHZhbHVlICkuaHNsYSgpO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5IHtAbGluayB2Ni5IU0xBfSAtINC30LDRgtC10LzQvdC10L3QvdGL0Lkg0LjQu9C4INC30LDRgdCy0LXRgtC70LXQvdC90YvQuSDQvdCwIGBwZXJjZW50YWdlYCDQv9GA0L7RhtC10L3RgtC+0LIuXG4gICAqIEBtZXRob2QgdjYuSFNMQSNzaGFkZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBwZXJjZW50YWdlXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBIU0xBKCAwLCAxMDAsIDc1LCAxICkuc2hhZGUoIC0xMCApOyAvLyAtPiBuZXcgSFNMQSggMCwgMTAwLCA2NSwgMSApXG4gICAqL1xuICBzaGFkZTogZnVuY3Rpb24gc2hhZGUgKCBwZXJjZW50YWdlIClcbiAge1xuICAgIHZhciBoc2xhID0gbmV3IEhTTEEoKTtcbiAgICBoc2xhWyAwIF0gPSB0aGlzWyAwIF07XG4gICAgaHNsYVsgMSBdID0gdGhpc1sgMSBdO1xuICAgIGhzbGFbIDIgXSA9IGNsYW1wKCB0aGlzWyAyIF0gKyBwZXJjZW50YWdlLCAwLCAxMDAgKTtcbiAgICBoc2xhWyAzIF0gPSB0aGlzWyAzIF07XG4gICAgcmV0dXJuIGhzbGE7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IEhTTEFcbn07XG5cbi8qKlxuICogQG1lbWJlciB7c3RyaW5nfSB2Ni5IU0xBI3R5cGUgYFwiaHNsYVwiYC4g0K3RgtC+INGB0LLQvtC50YHRgtCy0L4g0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQutC+0L3QstC10YDRgtC40YDQvtCy0LDQvdC40Y8g0LzQtdC20LTRgyB7QGxpbmsgdjYuUkdCQX0g0Lgge0BsaW5rIHY2LkhTTEF9LlxuICovXG5IU0xBLnByb3RvdHlwZS50eXBlID0gJ2hzbGEnO1xuXG5mdW5jdGlvbiBmb28gKCB0LCBwLCBxIClcbntcbiAgaWYgKCB0IDwgMSAvIDYgKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoICggcCArICggcSAtIHAgKSAqIDYgKiB0ICkgKiAyNTUgKTtcbiAgfVxuXG4gIGlmICggdCA8IDAuNSApIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCggcSAqIDI1NSApO1xuICB9XG5cbiAgaWYgKCB0IDwgMiAvIDMgKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoICggcCArICggcSAtIHAgKSAqICggMiAvIDMgLSB0ICkgKiA2ICkgKiAyNTUgKTtcbiAgfVxuXG4gIHJldHVybiBNYXRoLnJvdW5kKCBwICogMjU1ICk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gUkdCQTtcblxudmFyIHBhcnNlID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcGFyc2UnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxudmFyIEhTTEEgID0gcmVxdWlyZSggJy4vSFNMQScgKTsgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuLyoqXG4gKiBSR0JBINGG0LLQtdGCLlxuICogQGNvbnN0cnVjdG9yIHY2LlJHQkFcbiAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW3JdIFJlZCBjaGFubmVsIHZhbHVlLlxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbZ10gR3JlZW4gY2hhbm5lbCB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2JdIEJsdWUgY2hhbm5lbCB2YWx1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdIEFscGhhIGNoYW5uZWwgdmFsdWUuXG4gKiBAc2VlIHY2LlJHQkEjc2V0XG4gKiBAZXhhbXBsZVxuICogdmFyIFJHQkEgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb2xvci9SR0JBJyApO1xuICpcbiAqIHZhciB0cmFuc3BhcmVudCA9IG5ldyBSR0JBKCAndHJhbnNwYXJlbnQnICk7XG4gKiB2YXIgbWFnZW50YSAgICAgPSBuZXcgUkdCQSggJ21hZ2VudGEnICk7XG4gKiB2YXIgZnVjaHNpYSAgICAgPSBuZXcgUkdCQSggMjU1LCAwLCAyNTUgKTtcbiAqIHZhciBnaG9zdCAgICAgICA9IG5ldyBSR0JBKCAyNTUsIDAuMSApO1xuICogdmFyIHdoaXRlICAgICAgID0gbmV3IFJHQkEoIDI1NSApO1xuICogdmFyIGJsYWNrICAgICAgID0gbmV3IFJHQkEoKTtcbiAqL1xuZnVuY3Rpb24gUkdCQSAoIHIsIGcsIGIsIGEgKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzAgXCJyZWRcIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzEgXCJncmVlblwiIGNoYW5uZWwgdmFsdWUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlJHQkEjMiBcImJsdWVcIiBjaGFubmVsIHZhbHVlLlxuICAgKi9cblxuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5SR0JBIzMgXCJhbHBoYVwiIGNoYW5uZWwgdmFsdWUuXG4gICAqL1xuXG4gIHRoaXMuc2V0KCByLCBnLCBiLCBhICk7XG59XG5cblJHQkEucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LLQvtGB0L/RgNC40L3QuNC80LDQtdC80YPRjiDRj9GA0LrQvtGB0YLRjCAocGVyY2VpdmVkIGJyaWdodG5lc3MpINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNwZXJjZWl2ZWRCcmlnaHRuZXNzXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNTk2MjQzXG4gICAqIEBzZWUgaHR0cDovL2FsaWVucnlkZXJmbGV4LmNvbS9oc3AuaHRtbFxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggJ21hZ2VudGEnICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpOyAvLyAtPiAxNjMuODc1OTQzOTMzMjA4MlxuICAgKi9cbiAgcGVyY2VpdmVkQnJpZ2h0bmVzczogZnVuY3Rpb24gcGVyY2VpdmVkQnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgdmFyIHIgPSB0aGlzWyAwIF07XG4gICAgdmFyIGcgPSB0aGlzWyAxIF07XG4gICAgdmFyIGIgPSB0aGlzWyAyIF07XG4gICAgcmV0dXJuIE1hdGguc3FydCggMC4yOTkgKiByICogciArIDAuNTg3ICogZyAqIGcgKyAwLjExNCAqIGIgKiBiICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC+0YLQvdC+0YHQuNGC0LXQu9GM0L3Rg9GOINGP0YDQutC+0YHRgtGMINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNsdW1pbmFuY2VcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1JlbGF0aXZlX2x1bWluYW5jZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSggJ21hZ2VudGEnICkubHVtaW5hbmNlKCk7IC8vIC0+IDcyLjYyNFxuICAgKi9cbiAgbHVtaW5hbmNlOiBmdW5jdGlvbiBsdW1pbmFuY2UgKClcbiAge1xuICAgIHJldHVybiB0aGlzWyAwIF0gKiAwLjIxMjYgKyB0aGlzWyAxIF0gKiAwLjcxNTIgKyB0aGlzWyAyIF0gKiAwLjA3MjI7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINGP0YDQutC+0YHRgtGMINGG0LLQtdGC0LAuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNicmlnaHRuZXNzXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvQUVSVC8jY29sb3ItY29udHJhc3RcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoICdtYWdlbnRhJyApLmJyaWdodG5lc3MoKTsgLy8gLT4gMTA1LjMxNVxuICAgKi9cbiAgYnJpZ2h0bmVzczogZnVuY3Rpb24gYnJpZ2h0bmVzcyAoKVxuICB7XG4gICAgcmV0dXJuIDAuMjk5ICogdGhpc1sgMCBdICsgMC41ODcgKiB0aGlzWyAxIF0gKyAwLjExNCAqIHRoaXNbIDIgXTtcbiAgfSxcblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIgQ1NTLWNvbG9yINGB0YLRgNC+0LrRgy5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI3RvU3RyaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQGV4YW1wbGVcbiAgICogJycgKyBuZXcgUkdCQSggJ21hZ2VudGEnICk7IC8vIC0+IFwicmdiYSgyNTUsIDAsIDI1NSwgMSlcIlxuICAgKi9cbiAgdG9TdHJpbmc6IGZ1bmN0aW9uIHRvU3RyaW5nICgpXG4gIHtcbiAgICByZXR1cm4gJ3JnYmEoJyArIHRoaXNbIDAgXSArICcsICcgKyB0aGlzWyAxIF0gKyAnLCAnICsgdGhpc1sgMiBdICsgJywgJyArIHRoaXNbIDMgXSArICcpJztcbiAgfSxcblxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgUiwgRywgQiwgQSDQt9C90LDRh9C10L3QuNGPLlxuICAgKiBAbWV0aG9kIHY2LlJHQkEjc2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW3JdIFJlZCBjaGFubmVsIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtnXSBHcmVlbiBjaGFubmVsIHZhbHVlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgIFtiXSBCbHVlIGNoYW5uZWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdIEFscGhhIGNoYW5uZWwgdmFsdWUuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5SR0JBXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKClcbiAgICogICAuc2V0KCAnbWFnZW50YScgKSAgICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAyNTUsIDFcbiAgICogICAuc2V0KCAnI2ZmMDBmZmZmJyApICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAyNTUsIDFcbiAgICogICAuc2V0KCAnI2ZmMDBmZicgKSAgICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAyNTUsIDFcbiAgICogICAuc2V0KCAnI2YwMDcnICkgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMjU1LCAwLCAwLCAwLjQ3XG4gICAqICAgLnNldCggJyNmMDAnICkgICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDI1NSwgMCwgMCwgMVxuICAgKiAgIC5zZXQoICdoc2xhKCAwLCAxMDAlLCA1MCUsIDAuNDcgKScgKSAvLyAtPiAyNTUsIDAsIDAsIDAuNDdcbiAgICogICAuc2V0KCAncmdiKCAwLCAwLCAwICknICkgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMVxuICAgKiAgIC5zZXQoIDAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAxXG4gICAqICAgLnNldCggMCwgMCwgMCApICAgICAgICAgICAgICAgICAgICAgIC8vIC0+IDAsIDAsIDAsIDFcbiAgICogICAuc2V0KCAwLCAwICkgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLT4gMCwgMCwgMCwgMFxuICAgKiAgIC5zZXQoIDAsIDAsIDAsIDAgKTsgICAgICAgICAgICAgICAgICAvLyAtPiAwLCAwLCAwLCAwXG4gICAqL1xuICBzZXQ6IGZ1bmN0aW9uIHNldCAoIHIsIGcsIGIsIGEgKVxuICB7XG4gICAgc3dpdGNoICggdHJ1ZSApIHtcbiAgICAgIGNhc2UgdHlwZW9mIHIgPT09ICdzdHJpbmcnOlxuICAgICAgICByID0gcGFyc2UoIHIgKTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSB0eXBlb2YgciA9PT0gJ29iamVjdCcgJiYgciAhPT0gbnVsbDpcbiAgICAgICAgaWYgKCByLnR5cGUgIT09IHRoaXMudHlwZSApIHtcbiAgICAgICAgICByID0gclsgdGhpcy50eXBlIF0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IHJbIDAgXTtcbiAgICAgICAgdGhpc1sgMSBdID0gclsgMSBdO1xuICAgICAgICB0aGlzWyAyIF0gPSByWyAyIF07XG4gICAgICAgIHRoaXNbIDMgXSA9IHJbIDMgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzd2l0Y2ggKCB2b2lkIDAgKSB7XG4gICAgICAgICAgY2FzZSByOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBiID0gZyA9IHIgPSAwOyAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgIGIgPSBnID0gciA9IE1hdGguZmxvb3IoIHIgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgYjpcbiAgICAgICAgICAgIGEgPSBnO1xuICAgICAgICAgICAgYiA9IGcgPSByID0gTWF0aC5mbG9vciggciApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBhOlxuICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHIgPSBNYXRoLmZsb29yKCByICk7XG4gICAgICAgICAgICBnID0gTWF0aC5mbG9vciggZyApO1xuICAgICAgICAgICAgYiA9IE1hdGguZmxvb3IoIGIgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbIDAgXSA9IHI7XG4gICAgICAgIHRoaXNbIDEgXSA9IGc7XG4gICAgICAgIHRoaXNbIDIgXSA9IGI7XG4gICAgICAgIHRoaXNbIDMgXSA9IGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCa0L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQsiB7QGxpbmsgdjYuSFNMQX0uXG4gICAqIEBtZXRob2QgdjYuUkdCQSNoc2xhXG4gICAqIEByZXR1cm4ge3Y2LkhTTEF9XG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBSR0JBKCAyNTUsIDAsIDAsIDEgKS5oc2xhKCk7IC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDUwLCAxIClcbiAgICovXG4gIGhzbGE6IGZ1bmN0aW9uIGhzbGEgKClcbiAge1xuICAgIHZhciBoc2xhID0gbmV3IEhTTEEoKTtcblxuICAgIHZhciByID0gdGhpc1sgMCBdIC8gMjU1O1xuICAgIHZhciBnID0gdGhpc1sgMSBdIC8gMjU1O1xuICAgIHZhciBiID0gdGhpc1sgMiBdIC8gMjU1O1xuXG4gICAgdmFyIG1heCA9IE1hdGgubWF4KCByLCBnLCBiICk7XG4gICAgdmFyIG1pbiA9IE1hdGgubWluKCByLCBnLCBiICk7XG5cbiAgICB2YXIgbCA9ICggbWF4ICsgbWluICkgKiA1MDtcbiAgICB2YXIgaCwgcztcblxuICAgIHZhciBkaWZmID0gbWF4IC0gbWluO1xuXG4gICAgaWYgKCBkaWZmICkge1xuICAgICAgaWYgKCBsID4gNTAgKSB7XG4gICAgICAgIHMgPSBkaWZmIC8gKCAyIC0gbWF4IC0gbWluICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzID0gZGlmZiAvICggbWF4ICsgbWluICk7XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAoIG1heCApIHtcbiAgICAgICAgY2FzZSByOlxuICAgICAgICAgIGlmICggZyA8IGIgKSB7XG4gICAgICAgICAgICBoID0gMS4wNDcyICogKCBnIC0gYiApIC8gZGlmZiArIDYuMjgzMjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaCA9IDEuMDQ3MiAqICggZyAtIGIgKSAvIGRpZmY7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgZzpcbiAgICAgICAgICBoID0gMS4wNDcyICogKCBiIC0gciApIC8gZGlmZiArIDIuMDk0NDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBoID0gMS4wNDcyICogKCByIC0gZyApIC8gZGlmZiArIDQuMTg4ODtcbiAgICAgIH1cblxuICAgICAgaCA9IE1hdGgucm91bmQoIGggKiAzNjAgLyA2LjI4MzIgKTtcbiAgICAgIHMgPSBNYXRoLnJvdW5kKCBzICogMTAwICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGggPSBzID0gMDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgICB9XG5cbiAgICBoc2xhWyAwIF0gPSBoO1xuICAgIGhzbGFbIDEgXSA9IHM7XG4gICAgaHNsYVsgMiBdID0gTWF0aC5yb3VuZCggbCApO1xuICAgIGhzbGFbIDMgXSA9IHRoaXNbIDMgXTtcblxuICAgIHJldHVybiBoc2xhO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWV0aG9kIHY2LlJHQkEjcmdiYVxuICAgKiBAc2VlIHY2LlJlbmRlcmVyR0wjdmVydGljZXNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgcmdiYTogZnVuY3Rpb24gcmdiYSAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LlJHQkF9IC0g0LjQvdGC0LXRgNC/0L7Qu9C40YDQvtCy0LDQvdC90YvQuSDQvNC10LbQtNGDINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQvNC4INC/0LDRgNCw0LzQtdGC0YDQsNC80LguXG4gICAqIEBtZXRob2QgdjYuUkdCQSNsZXJwXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHJcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgZ1xuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBiXG4gICAqIEBwYXJhbSAge251bWJlcn0gIHZhbHVlXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBzZWUgdjYuUkdCQSNsZXJwQ29sb3JcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFJHQkEoIDEwMCwgMC4yNSApLmxlcnAoIDIwMCwgMjAwLCAyMDAsIDAuNSApOyAvLyAtPiBuZXcgUkdCQSggMTUwLCAxNTAsIDE1MCwgMC4yNSApXG4gICAqL1xuICBsZXJwOiBmdW5jdGlvbiBsZXJwICggciwgZywgYiwgdmFsdWUgKVxuICB7XG4gICAgciA9IHRoaXNbIDAgXSArICggciAtIHRoaXNbIDAgXSApICogdmFsdWU7XG4gICAgZyA9IHRoaXNbIDEgXSArICggZyAtIHRoaXNbIDEgXSApICogdmFsdWU7XG4gICAgYiA9IHRoaXNbIDIgXSArICggYiAtIHRoaXNbIDIgXSApICogdmFsdWU7XG4gICAgcmV0dXJuIG5ldyBSR0JBKCByLCBnLCBiLCB0aGlzWyAzIF0gKTtcbiAgfSxcblxuICAvKipcbiAgICog0KHQvtC30LTQsNC10YIg0L3QvtCy0YvQuSB7QGxpbmsgdjYuUkdCQX0gLSDQuNC90YLQtdGA0L/QvtC70LjRgNC+0LLQsNC90L3Ri9C5INC80LXQttC00YMgYGNvbG9yYC5cbiAgICogQG1ldGhvZCB2Ni5SR0JBI2xlcnBDb2xvclxuICAgKiBAcGFyYW0gIHtUQ29sb3J9ICBjb2xvclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICB2YWx1ZVxuICAgKiBAcmV0dXJuIHt2Ni5SR0JBfVxuICAgKiBAc2VlIHY2LlJHQkEjbGVycFxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgYSA9IG5ldyBSR0JBKCAxMDAsIDAuMjUgKTtcbiAgICogdmFyIGIgPSBuZXcgUkdCQSggMjAwLCAwICk7XG4gICAqIHZhciBjID0gYS5sZXJwQ29sb3IoIGIsIDAuNSApOyAvLyAtPiBuZXcgUkdCQSggMTUwLCAxNTAsIDE1MCwgMC4yNSApXG4gICAqL1xuICBsZXJwQ29sb3I6IGZ1bmN0aW9uIGxlcnBDb2xvciAoIGNvbG9yLCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgciwgZywgYjtcblxuICAgIGlmICggdHlwZW9mIGNvbG9yICE9PSAnb2JqZWN0JyApIHtcbiAgICAgIGNvbG9yID0gcGFyc2UoIGNvbG9yICk7XG4gICAgfVxuXG4gICAgaWYgKCBjb2xvci50eXBlICE9PSAncmdiYScgKSB7XG4gICAgICBjb2xvciA9IGNvbG9yLnJnYmEoKTtcbiAgICB9XG5cbiAgICByID0gY29sb3JbIDAgXTtcbiAgICBnID0gY29sb3JbIDEgXTtcbiAgICBiID0gY29sb3JbIDIgXTtcblxuICAgIHJldHVybiB0aGlzLmxlcnAoIHIsIGcsIGIsIHZhbHVlICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC90L7QstGL0Lkge0BsaW5rIHY2LlJHQkF9IC0g0LfQsNGC0LXQvNC90LXQvdC90YvQuSDQuNC70Lgg0LfQsNGB0LLQtdGC0LvQtdC90L3Ri9C5INC90LAgYHBlcmNlbnRhZ2VzYCDQv9GA0L7RhtC10L3RgtC+0LIuXG4gICAqIEBtZXRob2QgdjYuUkdCQSNzaGFkZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBwZXJjZW50YWdlXG4gICAqIEByZXR1cm4ge3Y2LlJHQkF9XG4gICAqIEBzZWUgdjYuSFNMQSNzaGFkZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgUkdCQSgpLnNoYWRlKCA1MCApOyAvLyAtPiBuZXcgUkdCQSggMTI4IClcbiAgICovXG4gIHNoYWRlOiBmdW5jdGlvbiBzaGFkZSAoIHBlcmNlbnRhZ2VzIClcbiAge1xuICAgIHJldHVybiB0aGlzLmhzbGEoKS5zaGFkZSggcGVyY2VudGFnZXMgKS5yZ2JhKCk7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IFJHQkFcbn07XG5cbi8qKlxuICogQG1lbWJlciB7c3RyaW5nfSB2Ni5SR0JBI3R5cGUgYFwicmdiYVwiYC4g0K3RgtC+INGB0LLQvtC50YHRgtCy0L4g0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQutC+0L3QstC10YDRgtC40YDQvtCy0LDQvdC40Y8g0LzQtdC20LTRgyB7QGxpbmsgdjYuSFNMQX0g0Lgge0BsaW5rIHY2LlJHQkF9LlxuICovXG5SR0JBLnByb3RvdHlwZS50eXBlID0gJ3JnYmEnO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQga2V5LXNwYWNpbmc6IFsgXCJlcnJvclwiLCB7IFwiYWxpZ25cIjogeyBcImJlZm9yZUNvbG9uXCI6IGZhbHNlLCBcImFmdGVyQ29sb25cIjogdHJ1ZSwgXCJvblwiOiBcInZhbHVlXCIgfSB9IF0gKi9cblxudmFyIGNvbG9ycyA9IHtcbiAgYWxpY2VibHVlOiAgICAgICAgICAgICdmMGY4ZmZmZicsIGFudGlxdWV3aGl0ZTogICAgICAgICAnZmFlYmQ3ZmYnLFxuICBhcXVhOiAgICAgICAgICAgICAgICAgJzAwZmZmZmZmJywgYXF1YW1hcmluZTogICAgICAgICAgICc3ZmZmZDRmZicsXG4gIGF6dXJlOiAgICAgICAgICAgICAgICAnZjBmZmZmZmYnLCBiZWlnZTogICAgICAgICAgICAgICAgJ2Y1ZjVkY2ZmJyxcbiAgYmlzcXVlOiAgICAgICAgICAgICAgICdmZmU0YzRmZicsIGJsYWNrOiAgICAgICAgICAgICAgICAnMDAwMDAwZmYnLFxuICBibGFuY2hlZGFsbW9uZDogICAgICAgJ2ZmZWJjZGZmJywgYmx1ZTogICAgICAgICAgICAgICAgICcwMDAwZmZmZicsXG4gIGJsdWV2aW9sZXQ6ICAgICAgICAgICAnOGEyYmUyZmYnLCBicm93bjogICAgICAgICAgICAgICAgJ2E1MmEyYWZmJyxcbiAgYnVybHl3b29kOiAgICAgICAgICAgICdkZWI4ODdmZicsIGNhZGV0Ymx1ZTogICAgICAgICAgICAnNWY5ZWEwZmYnLFxuICBjaGFydHJldXNlOiAgICAgICAgICAgJzdmZmYwMGZmJywgY2hvY29sYXRlOiAgICAgICAgICAgICdkMjY5MWVmZicsXG4gIGNvcmFsOiAgICAgICAgICAgICAgICAnZmY3ZjUwZmYnLCBjb3JuZmxvd2VyYmx1ZTogICAgICAgJzY0OTVlZGZmJyxcbiAgY29ybnNpbGs6ICAgICAgICAgICAgICdmZmY4ZGNmZicsIGNyaW1zb246ICAgICAgICAgICAgICAnZGMxNDNjZmYnLFxuICBjeWFuOiAgICAgICAgICAgICAgICAgJzAwZmZmZmZmJywgZGFya2JsdWU6ICAgICAgICAgICAgICcwMDAwOGJmZicsXG4gIGRhcmtjeWFuOiAgICAgICAgICAgICAnMDA4YjhiZmYnLCBkYXJrZ29sZGVucm9kOiAgICAgICAgJ2I4ODYwYmZmJyxcbiAgZGFya2dyYXk6ICAgICAgICAgICAgICdhOWE5YTlmZicsIGRhcmtncmVlbjogICAgICAgICAgICAnMDA2NDAwZmYnLFxuICBkYXJra2hha2k6ICAgICAgICAgICAgJ2JkYjc2YmZmJywgZGFya21hZ2VudGE6ICAgICAgICAgICc4YjAwOGJmZicsXG4gIGRhcmtvbGl2ZWdyZWVuOiAgICAgICAnNTU2YjJmZmYnLCBkYXJrb3JhbmdlOiAgICAgICAgICAgJ2ZmOGMwMGZmJyxcbiAgZGFya29yY2hpZDogICAgICAgICAgICc5OTMyY2NmZicsIGRhcmtyZWQ6ICAgICAgICAgICAgICAnOGIwMDAwZmYnLFxuICBkYXJrc2FsbW9uOiAgICAgICAgICAgJ2U5OTY3YWZmJywgZGFya3NlYWdyZWVuOiAgICAgICAgICc4ZmJjOGZmZicsXG4gIGRhcmtzbGF0ZWJsdWU6ICAgICAgICAnNDgzZDhiZmYnLCBkYXJrc2xhdGVncmF5OiAgICAgICAgJzJmNGY0ZmZmJyxcbiAgZGFya3R1cnF1b2lzZTogICAgICAgICcwMGNlZDFmZicsIGRhcmt2aW9sZXQ6ICAgICAgICAgICAnOTQwMGQzZmYnLFxuICBkZWVwcGluazogICAgICAgICAgICAgJ2ZmMTQ5M2ZmJywgZGVlcHNreWJsdWU6ICAgICAgICAgICcwMGJmZmZmZicsXG4gIGRpbWdyYXk6ICAgICAgICAgICAgICAnNjk2OTY5ZmYnLCBkb2RnZXJibHVlOiAgICAgICAgICAgJzFlOTBmZmZmJyxcbiAgZmVsZHNwYXI6ICAgICAgICAgICAgICdkMTkyNzVmZicsIGZpcmVicmljazogICAgICAgICAgICAnYjIyMjIyZmYnLFxuICBmbG9yYWx3aGl0ZTogICAgICAgICAgJ2ZmZmFmMGZmJywgZm9yZXN0Z3JlZW46ICAgICAgICAgICcyMjhiMjJmZicsXG4gIGZ1Y2hzaWE6ICAgICAgICAgICAgICAnZmYwMGZmZmYnLCBnYWluc2Jvcm86ICAgICAgICAgICAgJ2RjZGNkY2ZmJyxcbiAgZ2hvc3R3aGl0ZTogICAgICAgICAgICdmOGY4ZmZmZicsIGdvbGQ6ICAgICAgICAgICAgICAgICAnZmZkNzAwZmYnLFxuICBnb2xkZW5yb2Q6ICAgICAgICAgICAgJ2RhYTUyMGZmJywgZ3JheTogICAgICAgICAgICAgICAgICc4MDgwODBmZicsXG4gIGdyZWVuOiAgICAgICAgICAgICAgICAnMDA4MDAwZmYnLCBncmVlbnllbGxvdzogICAgICAgICAgJ2FkZmYyZmZmJyxcbiAgaG9uZXlkZXc6ICAgICAgICAgICAgICdmMGZmZjBmZicsIGhvdHBpbms6ICAgICAgICAgICAgICAnZmY2OWI0ZmYnLFxuICBpbmRpYW5yZWQ6ICAgICAgICAgICAgJ2NkNWM1Y2ZmJywgaW5kaWdvOiAgICAgICAgICAgICAgICc0YjAwODJmZicsXG4gIGl2b3J5OiAgICAgICAgICAgICAgICAnZmZmZmYwZmYnLCBraGFraTogICAgICAgICAgICAgICAgJ2YwZTY4Y2ZmJyxcbiAgbGF2ZW5kZXI6ICAgICAgICAgICAgICdlNmU2ZmFmZicsIGxhdmVuZGVyYmx1c2g6ICAgICAgICAnZmZmMGY1ZmYnLFxuICBsYXduZ3JlZW46ICAgICAgICAgICAgJzdjZmMwMGZmJywgbGVtb25jaGlmZm9uOiAgICAgICAgICdmZmZhY2RmZicsXG4gIGxpZ2h0Ymx1ZTogICAgICAgICAgICAnYWRkOGU2ZmYnLCBsaWdodGNvcmFsOiAgICAgICAgICAgJ2YwODA4MGZmJyxcbiAgbGlnaHRjeWFuOiAgICAgICAgICAgICdlMGZmZmZmZicsIGxpZ2h0Z29sZGVucm9keWVsbG93OiAnZmFmYWQyZmYnLFxuICBsaWdodGdyZXk6ICAgICAgICAgICAgJ2QzZDNkM2ZmJywgbGlnaHRncmVlbjogICAgICAgICAgICc5MGVlOTBmZicsXG4gIGxpZ2h0cGluazogICAgICAgICAgICAnZmZiNmMxZmYnLCBsaWdodHNhbG1vbjogICAgICAgICAgJ2ZmYTA3YWZmJyxcbiAgbGlnaHRzZWFncmVlbjogICAgICAgICcyMGIyYWFmZicsIGxpZ2h0c2t5Ymx1ZTogICAgICAgICAnODdjZWZhZmYnLFxuICBsaWdodHNsYXRlYmx1ZTogICAgICAgJzg0NzBmZmZmJywgbGlnaHRzbGF0ZWdyYXk6ICAgICAgICc3Nzg4OTlmZicsXG4gIGxpZ2h0c3RlZWxibHVlOiAgICAgICAnYjBjNGRlZmYnLCBsaWdodHllbGxvdzogICAgICAgICAgJ2ZmZmZlMGZmJyxcbiAgbGltZTogICAgICAgICAgICAgICAgICcwMGZmMDBmZicsIGxpbWVncmVlbjogICAgICAgICAgICAnMzJjZDMyZmYnLFxuICBsaW5lbjogICAgICAgICAgICAgICAgJ2ZhZjBlNmZmJywgbWFnZW50YTogICAgICAgICAgICAgICdmZjAwZmZmZicsXG4gIG1hcm9vbjogICAgICAgICAgICAgICAnODAwMDAwZmYnLCBtZWRpdW1hcXVhbWFyaW5lOiAgICAgJzY2Y2RhYWZmJyxcbiAgbWVkaXVtYmx1ZTogICAgICAgICAgICcwMDAwY2RmZicsIG1lZGl1bW9yY2hpZDogICAgICAgICAnYmE1NWQzZmYnLFxuICBtZWRpdW1wdXJwbGU6ICAgICAgICAgJzkzNzBkOGZmJywgbWVkaXVtc2VhZ3JlZW46ICAgICAgICczY2IzNzFmZicsXG4gIG1lZGl1bXNsYXRlYmx1ZTogICAgICAnN2I2OGVlZmYnLCBtZWRpdW1zcHJpbmdncmVlbjogICAgJzAwZmE5YWZmJyxcbiAgbWVkaXVtdHVycXVvaXNlOiAgICAgICc0OGQxY2NmZicsIG1lZGl1bXZpb2xldHJlZDogICAgICAnYzcxNTg1ZmYnLFxuICBtaWRuaWdodGJsdWU6ICAgICAgICAgJzE5MTk3MGZmJywgbWludGNyZWFtOiAgICAgICAgICAgICdmNWZmZmFmZicsXG4gIG1pc3R5cm9zZTogICAgICAgICAgICAnZmZlNGUxZmYnLCBtb2NjYXNpbjogICAgICAgICAgICAgJ2ZmZTRiNWZmJyxcbiAgbmF2YWpvd2hpdGU6ICAgICAgICAgICdmZmRlYWRmZicsIG5hdnk6ICAgICAgICAgICAgICAgICAnMDAwMDgwZmYnLFxuICBvbGRsYWNlOiAgICAgICAgICAgICAgJ2ZkZjVlNmZmJywgb2xpdmU6ICAgICAgICAgICAgICAgICc4MDgwMDBmZicsXG4gIG9saXZlZHJhYjogICAgICAgICAgICAnNmI4ZTIzZmYnLCBvcmFuZ2U6ICAgICAgICAgICAgICAgJ2ZmYTUwMGZmJyxcbiAgb3JhbmdlcmVkOiAgICAgICAgICAgICdmZjQ1MDBmZicsIG9yY2hpZDogICAgICAgICAgICAgICAnZGE3MGQ2ZmYnLFxuICBwYWxlZ29sZGVucm9kOiAgICAgICAgJ2VlZThhYWZmJywgcGFsZWdyZWVuOiAgICAgICAgICAgICc5OGZiOThmZicsXG4gIHBhbGV0dXJxdW9pc2U6ICAgICAgICAnYWZlZWVlZmYnLCBwYWxldmlvbGV0cmVkOiAgICAgICAgJ2Q4NzA5M2ZmJyxcbiAgcGFwYXlhd2hpcDogICAgICAgICAgICdmZmVmZDVmZicsIHBlYWNocHVmZjogICAgICAgICAgICAnZmZkYWI5ZmYnLFxuICBwZXJ1OiAgICAgICAgICAgICAgICAgJ2NkODUzZmZmJywgcGluazogICAgICAgICAgICAgICAgICdmZmMwY2JmZicsXG4gIHBsdW06ICAgICAgICAgICAgICAgICAnZGRhMGRkZmYnLCBwb3dkZXJibHVlOiAgICAgICAgICAgJ2IwZTBlNmZmJyxcbiAgcHVycGxlOiAgICAgICAgICAgICAgICc4MDAwODBmZicsIHJlZDogICAgICAgICAgICAgICAgICAnZmYwMDAwZmYnLFxuICByb3N5YnJvd246ICAgICAgICAgICAgJ2JjOGY4ZmZmJywgcm95YWxibHVlOiAgICAgICAgICAgICc0MTY5ZTFmZicsXG4gIHNhZGRsZWJyb3duOiAgICAgICAgICAnOGI0NTEzZmYnLCBzYWxtb246ICAgICAgICAgICAgICAgJ2ZhODA3MmZmJyxcbiAgc2FuZHlicm93bjogICAgICAgICAgICdmNGE0NjBmZicsIHNlYWdyZWVuOiAgICAgICAgICAgICAnMmU4YjU3ZmYnLFxuICBzZWFzaGVsbDogICAgICAgICAgICAgJ2ZmZjVlZWZmJywgc2llbm5hOiAgICAgICAgICAgICAgICdhMDUyMmRmZicsXG4gIHNpbHZlcjogICAgICAgICAgICAgICAnYzBjMGMwZmYnLCBza3libHVlOiAgICAgICAgICAgICAgJzg3Y2VlYmZmJyxcbiAgc2xhdGVibHVlOiAgICAgICAgICAgICc2YTVhY2RmZicsIHNsYXRlZ3JheTogICAgICAgICAgICAnNzA4MDkwZmYnLFxuICBzbm93OiAgICAgICAgICAgICAgICAgJ2ZmZmFmYWZmJywgc3ByaW5nZ3JlZW46ICAgICAgICAgICcwMGZmN2ZmZicsXG4gIHN0ZWVsYmx1ZTogICAgICAgICAgICAnNDY4MmI0ZmYnLCB0YW46ICAgICAgICAgICAgICAgICAgJ2QyYjQ4Y2ZmJyxcbiAgdGVhbDogICAgICAgICAgICAgICAgICcwMDgwODBmZicsIHRoaXN0bGU6ICAgICAgICAgICAgICAnZDhiZmQ4ZmYnLFxuICB0b21hdG86ICAgICAgICAgICAgICAgJ2ZmNjM0N2ZmJywgdHVycXVvaXNlOiAgICAgICAgICAgICc0MGUwZDBmZicsXG4gIHZpb2xldDogICAgICAgICAgICAgICAnZWU4MmVlZmYnLCB2aW9sZXRyZWQ6ICAgICAgICAgICAgJ2QwMjA5MGZmJyxcbiAgd2hlYXQ6ICAgICAgICAgICAgICAgICdmNWRlYjNmZicsIHdoaXRlOiAgICAgICAgICAgICAgICAnZmZmZmZmZmYnLFxuICB3aGl0ZXNtb2tlOiAgICAgICAgICAgJ2Y1ZjVmNWZmJywgeWVsbG93OiAgICAgICAgICAgICAgICdmZmZmMDBmZicsXG4gIHllbGxvd2dyZWVuOiAgICAgICAgICAnOWFjZDMyZmYnLCB0cmFuc3BhcmVudDogICAgICAgICAgJzAwMDAwMDAwJ1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb2xvcnM7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2U7XG5cbnZhciBSR0JBICAgPSByZXF1aXJlKCAnLi4vUkdCQScgKTtcbnZhciBIU0xBICAgPSByZXF1aXJlKCAnLi4vSFNMQScgKTtcbnZhciBjb2xvcnMgPSByZXF1aXJlKCAnLi9jb2xvcnMnICk7XG5cbnZhciBwYXJzZWQgPSBPYmplY3QuY3JlYXRlKCBudWxsICk7XG5cbnZhciBUUkFOU1BBUkVOVCA9IFtcbiAgMCwgMCwgMCwgMFxuXTtcblxudmFyIHJlZ2V4cHMgPSB7XG4gIGhleDM6IC9eIyhbMC05YS1mXSkoWzAtOWEtZl0pKFswLTlhLWZdKShbMC05YS1mXSk/JC8sXG4gIGhleDogIC9eIyhbMC05YS1mXXs2fSkoWzAtOWEtZl17Mn0pPyQvLFxuICByZ2I6ICAvXnJnYlxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSR8XlxccypyZ2JhXFxzKlxcKFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqXFwpJC8sXG4gIGhzbDogIC9eaHNsXFxzKlxcKFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccypcXCkkfF5cXHMqaHNsYVxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqXFwpJC9cbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcGFyc2VcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nXG4gKiBAcmV0dXJuIHttb2R1bGU6XCJ2Ni5qc1wiLlJHQkF8bW9kdWxlOlwidjYuanNcIi5IU0xBfVxuICogQGV4YW1wbGVcbiAqIHBhcnNlKCAnI2YwZjAnICk7ICAgICAgICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDI1NSwgMCwgMjU1LCAwIClcbiAqIHBhcnNlKCAnIzAwMDAwMGZmJyApOyAgICAgICAgICAgICAgICAgLy8gLT4gbmV3IFJHQkEoIDAsIDAsIDAsIDEgKVxuICogcGFyc2UoICdtYWdlbnRhJyApOyAgICAgICAgICAgICAgICAgICAvLyAtPiBuZXcgUkdCQSggMjU1LCAwLCAyNTUsIDEgKVxuICogcGFyc2UoICd0cmFuc3BhcmVudCcgKTsgICAgICAgICAgICAgICAvLyAtPiBuZXcgUkdCQSggMCwgMCwgMCwgMCApXG4gKiBwYXJzZSggJ2hzbCggMCwgMTAwJSwgNTAlICknICk7ICAgICAgIC8vIC0+IG5ldyBIU0xBKCAwLCAxMDAsIDUwLCAxIClcbiAqIHBhcnNlKCAnaHNsYSggMCwgMTAwJSwgNTAlLCAwLjUgKScgKTsgLy8gLT4gbmV3IEhTTEEoIDAsIDEwMCwgNTAsIDAuNSApXG4gKi9cbmZ1bmN0aW9uIHBhcnNlICggc3RyaW5nIClcbntcbiAgdmFyIGNhY2hlID0gcGFyc2VkWyBzdHJpbmcgXSB8fCBwYXJzZWRbIHN0cmluZyA9IHN0cmluZy50cmltKCkudG9Mb3dlckNhc2UoKSBdO1xuXG4gIGlmICggISBjYWNoZSApIHtcbiAgICBpZiAoICggY2FjaGUgPSBjb2xvcnNbIHN0cmluZyBdICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIHBhcnNlSGV4KCBjYWNoZSApLCBSR0JBICk7XG4gICAgfSBlbHNlIGlmICggKCBjYWNoZSA9IHJlZ2V4cHMuaGV4LmV4ZWMoIHN0cmluZyApICkgfHwgKCBjYWNoZSA9IHJlZ2V4cHMuaGV4My5leGVjKCBzdHJpbmcgKSApICkge1xuICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKCBwYXJzZUhleCggZm9ybWF0SGV4KCBjYWNoZSApICksIFJHQkEgKTtcbiAgICB9IGVsc2UgaWYgKCAoIGNhY2hlID0gcmVnZXhwcy5yZ2IuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICAgIGNhY2hlID0gbmV3IENvbG9yRGF0YSggY29tcGFjdE1hdGNoKCBjYWNoZSApLCBSR0JBICk7XG4gICAgfSBlbHNlIGlmICggKCBjYWNoZSA9IHJlZ2V4cHMuaHNsLmV4ZWMoIHN0cmluZyApICkgKSB7XG4gICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoIGNvbXBhY3RNYXRjaCggY2FjaGUgKSwgSFNMQSApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBTeW50YXhFcnJvciggc3RyaW5nICsgJyBpcyBub3QgYSB2YWxpZCBzeW50YXgnICk7XG4gICAgfVxuXG4gICAgcGFyc2VkWyBzdHJpbmcgXSA9IGNhY2hlO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBjYWNoZS5jb2xvciggY2FjaGVbIDAgXSwgY2FjaGVbIDEgXSwgY2FjaGVbIDIgXSwgY2FjaGVbIDMgXSApO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGZvcm1hdEhleFxuICogQHBhcmFtICB7YXJyYXk8c3RyaW5nPz59IG1hdGNoXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAZXhhbXBsZVxuICogZm9ybWF0SGV4KCBbICcjMDAwMDAwZmYnLCAnMDAwMDAwJywgJ2ZmJyBdICk7IC8vIC0+ICcwMDAwMDBmZidcbiAqIGZvcm1hdEhleCggWyAnIzAwMDcnLCAnMCcsICcwJywgJzAnLCAnNycgXSApOyAvLyAtPiAnMDAwMDAwNzcnXG4gKiBmb3JtYXRIZXgoIFsgJyMwMDAnLCAnMCcsICcwJywgJzAnLCBudWxsIF0gKTsgLy8gLT4gJzAwMDAwMGZmJ1xuICovXG5mdW5jdGlvbiBmb3JtYXRIZXggKCBtYXRjaCApXG57XG4gIHZhciByLCBnLCBiLCBhO1xuXG4gIGlmICggbWF0Y2gubGVuZ3RoID09PSAzICkge1xuICAgIHJldHVybiBtYXRjaFsgMSBdICsgKCBtYXRjaFsgMiBdIHx8ICdmZicgKTtcbiAgfVxuXG4gIHIgPSBtYXRjaFsgMSBdO1xuICBnID0gbWF0Y2hbIDIgXTtcbiAgYiA9IG1hdGNoWyAzIF07XG4gIGEgPSBtYXRjaFsgNCBdIHx8ICdmJztcblxuICByZXR1cm4gciArIHIgKyBnICsgZyArIGIgKyBiICsgYSArIGE7XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcGFyc2VIZXhcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgIGhleFxuICogQHJldHVybiB7YXJyYXk8bnVtYmVyPn1cbiAqIEBleGFtcGxlXG4gKiBwYXJzZUhleCggJzAwMDAwMDAwJyApOyAvLyAtPiBbIDAsIDAsIDAsIDAgXVxuICogcGFyc2VIZXgoICdmZjAwZmZmZicgKTsgLy8gLT4gWyAyNTUsIDAsIDI1NSwgMSBdXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSGV4ICggaGV4IClcbntcbiAgaWYgKCBoZXggPT0gMCApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICByZXR1cm4gVFJBTlNQQVJFTlQ7XG4gIH1cblxuICBoZXggPSBwYXJzZUludCggaGV4LCAxNiApO1xuXG4gIHJldHVybiBbXG4gICAgLy8gUlxuICAgIGhleCA+PiAyNCAmIDI1NSwgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgLy8gR1xuICAgIGhleCA+PiAxNiAmIDI1NSwgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgLy8gQlxuICAgIGhleCA+PiA4ICAmIDI1NSwgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gICAgLy8gQVxuICAgICggaGV4ICYgMjU1ICkgLyAyNTUgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1iaXR3aXNlXG4gIF07XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY29tcGFjdE1hdGNoXG4gKiBAcGFyYW0gIHthcnJheTxzdHJpbmc/Pn0gbWF0Y2hcbiAqIEByZXR1cm4ge2FycmF5PG51bWJlcj59XG4gKi9cbmZ1bmN0aW9uIGNvbXBhY3RNYXRjaCAoIG1hdGNoIClcbntcbiAgaWYgKCBtYXRjaFsgNyBdICkge1xuICAgIHJldHVybiBbXG4gICAgICBOdW1iZXIoIG1hdGNoWyA0IF0gKSxcbiAgICAgIE51bWJlciggbWF0Y2hbIDUgXSApLFxuICAgICAgTnVtYmVyKCBtYXRjaFsgNiBdICksXG4gICAgICBOdW1iZXIoIG1hdGNoWyA3IF0gKVxuICAgIF07XG4gIH1cblxuICByZXR1cm4gW1xuICAgIE51bWJlciggbWF0Y2hbIDEgXSApLFxuICAgIE51bWJlciggbWF0Y2hbIDIgXSApLFxuICAgIE51bWJlciggbWF0Y2hbIDMgXSApXG4gIF07XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBjb25zdHJ1Y3RvciBDb2xvckRhdGFcbiAqIEBwYXJhbSB7YXJyYXk8bnVtYmVyPn0gbWF0Y2hcbiAqIEBwYXJhbSB7ZnVuY3Rpb259ICAgICAgY29sb3JcbiAqL1xuZnVuY3Rpb24gQ29sb3JEYXRhICggbWF0Y2gsIGNvbG9yIClcbntcbiAgdGhpc1sgMCBdID0gbWF0Y2hbIDAgXTtcbiAgdGhpc1sgMSBdID0gbWF0Y2hbIDEgXTtcbiAgdGhpc1sgMiBdID0gbWF0Y2hbIDIgXTtcbiAgdGhpc1sgMyBdID0gbWF0Y2hbIDMgXTtcbiAgdGhpcy5jb2xvciA9IGNvbG9yO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCa0L7QvdGB0YLQsNC90YLRiy5cbiAqIEBuYW1lc3BhY2Uge29iamVjdH0gdjYuY29uc3RhbnRzXG4gKiBAZXhhbXBsZVxuICogdmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL2NvbnN0YW50cycgKTtcbiAqL1xuXG52YXIgX2NvbnN0YW50cyA9IHt9O1xudmFyIF9jb3VudGVyICAgPSAwO1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQutC+0L3RgdGC0LDQvdGC0YMuXG4gKiBAbWV0aG9kIHY2LmNvbnN0YW50cy5hZGRcbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5INCY0LzRjyDQutC+0L3RgdGC0LDQvdGC0YsuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiBjb25zdGFudHMuYWRkKCAnQ1VTVE9NX0NPTlNUQU5UJyApO1xuICovXG5mdW5jdGlvbiBhZGQgKCBrZXkgKVxue1xuICBpZiAoIHR5cGVvZiBfY29uc3RhbnRzWyBrZXkgXSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgcmUtc2V0IChhZGQpIGV4aXN0aW5nIGNvbnN0YW50OiAnICsga2V5ICk7XG4gIH1cblxuICBfY29uc3RhbnRzWyBrZXkgXSA9ICsrX2NvdW50ZXI7XG59XG5cbi8qKlxuICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LrQvtC90YHRgtCw0L3RgtGDLlxuICogQG1ldGhvZCB2Ni5jb25zdGFudHMuZ2V0XG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAga2V5INCY0LzRjyDQutC+0L3RgdGC0LDQvdGC0YsuXG4gKiBAcmV0dXJuIHtjb25zdGFudH0gICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC60L7QvdGB0YLQsNC90YLRgy5cbiAqIEBleGFtcGxlXG4gKiBjb25zdGFudHMuZ2V0KCAnQ1VTVE9NX0NPTlNUQU5UJyApO1xuICovXG5mdW5jdGlvbiBnZXQgKCBrZXkgKVxue1xuICBpZiAoIHR5cGVvZiBfY29uc3RhbnRzWyBrZXkgXSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoICdDYW5ub3QgZ2V0IHVua25vd24gY29uc3RhbnQ6ICcgKyBrZXkgKTtcbiAgfVxuXG4gIHJldHVybiBfY29uc3RhbnRzWyBrZXkgXTtcbn1cblxuW1xuICAnQVVUTycsXG4gICdHTCcsXG4gICcyRCcsXG4gICdMRUZUJyxcbiAgJ1RPUCcsXG4gICdDRU5URVInLFxuICAnTUlERExFJyxcbiAgJ1JJR0hUJyxcbiAgJ0JPVFRPTScsXG4gICdQRVJDRU5UJ1xuXS5mb3JFYWNoKCBhZGQgKTtcblxuZXhwb3J0cy5hZGQgPSBhZGQ7XG5leHBvcnRzLmdldCA9IGdldDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIExpZ2h0RW1pdHRlciA9IHJlcXVpcmUoICdsaWdodF9lbWl0dGVyJyApO1xuXG4vKipcbiAqIEBhYnN0cmFjdFxuICogQGNvbnN0cnVjdG9yIHY2LkFic3RyYWN0SW1hZ2VcbiAqIEBleHRlbmRzIExpZ2h0RW1pdHRlclxuICogQHNlZSB2Ni5Db21wb3VuZGVkSW1hZ2VcbiAqIEBzZWUgdjYuSW1hZ2VcbiAqL1xuZnVuY3Rpb24gQWJzdHJhY3RJbWFnZSAoKVxue1xuICAvKipcbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5JbWFnZSNzeCBcIlNvdXJjZSBYXCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI3N5IFwiU291cmNlIFlcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc3cgXCJTb3VyY2UgV2lkdGhcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2Ujc2ggXCJTb3VyY2UgSGVpZ2h0XCIuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LkltYWdlI2R3IFwiRGVzdGluYXRpb24gV2lkdGhcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuSW1hZ2UjZGggXCJEZXN0aW5hdGlvbiBIZWlnaHRcIi5cbiAgICovXG5cbiAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBhYnN0cmFjdCBjbGFzcyAobmV3IHY2LkFic3RyYWN0SW1hZ2UpJyApO1xufVxuXG5BYnN0cmFjdEltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIExpZ2h0RW1pdHRlci5wcm90b3R5cGUgKTtcbkFic3RyYWN0SW1hZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQWJzdHJhY3RJbWFnZTtcblxuLyoqXG4gKiBAdmlydHVhbFxuICogQG1ldGhvZCB2Ni5BYnN0cmFjdEltYWdlI2dldFxuICogQHJldHVybiB7djYuSW1hZ2V9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdEltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWJzdHJhY3RJbWFnZSA9IHJlcXVpcmUoICcuL0Fic3RyYWN0SW1hZ2UnICk7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yIHY2LkNvbXBvdW5kZWRJbWFnZVxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RJbWFnZVxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZVxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzeFxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzeVxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzd1xuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBzaFxuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBkd1xuICogQHBhcmFtIHtudWJtZXJ9ICAgICAgICAgICBkaFxuICovXG5mdW5jdGlvbiBDb21wb3VuZGVkSW1hZ2UgKCBpbWFnZSwgc3gsIHN5LCBzdywgc2gsIGR3LCBkaCApXG57XG4gIHRoaXMuaW1hZ2UgPSBpbWFnZTtcbiAgdGhpcy5zeCAgICA9IHN4O1xuICB0aGlzLnN5ICAgID0gc3k7XG4gIHRoaXMuc3cgICAgPSBzdztcbiAgdGhpcy5zaCAgICA9IHNoO1xuICB0aGlzLmR3ICAgID0gZHc7XG4gIHRoaXMuZGggICAgPSBkaDtcbn1cblxuQ29tcG91bmRlZEltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0SW1hZ2UucHJvdG90eXBlICk7XG5Db21wb3VuZGVkSW1hZ2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29tcG91bmRlZEltYWdlO1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5Db21wb3VuZGVkSW1hZ2UjZ2V0XG4gKi9cbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0ICgpXG57XG4gIHJldHVybiB0aGlzLmltYWdlLmdldCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb3VuZGVkSW1hZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb21wb3VuZGVkSW1hZ2UgPSByZXF1aXJlKCAnLi9Db21wb3VuZGVkSW1hZ2UnICk7XG52YXIgQWJzdHJhY3RJbWFnZSAgID0gcmVxdWlyZSggJy4vQWJzdHJhY3RJbWFnZScgKTtcblxuLyoqXG4gKiDQmtC70LDRgdGBINC60LDRgNGC0LjQvdC60LguXG4gKiBAY29uc3RydWN0b3IgdjYuSW1hZ2VcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0SW1hZ2VcbiAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1hZ2UgRE9NINGN0LvQtdC80LXQvdGCINC60LDRgNGC0LjQvdC60LggKElNRykuXG4gKiBAZmlyZXMgY29tcGxldGVcbiAqIEBzZWUgdjYuSW1hZ2UuZnJvbVVSTFxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JhY2tncm91bmRJbWFnZVxuICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2ltYWdlXG4gKiBAZXhhbXBsZVxuICogdmFyIEltYWdlID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvaW1hZ2UvSW1hZ2UnICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBhbiBpbWFnZSB3aXRoIGFuIERPTSBpbWFnZTwvY2FwdGlvbj5cbiAqIC8vIEhUTUw6IDxpbWcgc3JjPVwiaW1hZ2UucG5nXCIgaWQ9XCJpbWFnZVwiIC8+XG4gKiB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnaW1hZ2UnICkgKTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0aW5nIGFuIGltYWdlIHdpdGggYSBVUkw8L2NhcHRpb24+XG4gKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+RmlyZXMgXCJjb21wbGV0ZVwiIGV2ZW50PC9jYXB0aW9uPlxuICogaW1hZ2Uub25jZSggJ2NvbXBsZXRlJywgZnVuY3Rpb24gKClcbiAqIHtcbiAqICAgY29uc29sZS5sb2coICdUaGUgaW1hZ2UgaXMgbG9hZGVkIScgKTtcbiAqIH0gKTtcbiAqL1xuZnVuY3Rpb24gSW1hZ2UgKCBpbWFnZSApXG57XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoICEgaW1hZ2Uuc3JjICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSB2Ni5JbWFnZSBmcm9tIEhUTUxJbWFnZUVsZW1lbnQgd2l0aCBubyBcInNyY1wiIGF0dHJpYnV0ZSAobmV3IHY2LkltYWdlKScgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyIHtIVE1MSW1hZ2VFbGVtZW50fSB2Ni5JbWFnZSNpbWFnZSBET00g0Y3QtdC70LXQvNC10L3RgiDQutCw0YDRgtC40L3QutC4LlxuICAgKi9cbiAgdGhpcy5pbWFnZSA9IGltYWdlO1xuXG4gIGlmICggdGhpcy5pbWFnZS5jb21wbGV0ZSApIHtcbiAgICB0aGlzLl9pbml0KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5pbWFnZS5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIGZ1bmN0aW9uIG9ubG9hZCAoKVxuICAgIHtcbiAgICAgIHNlbGYuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBvbmxvYWQgKTtcbiAgICAgIHNlbGYuX2luaXQoKTtcbiAgICB9LCBmYWxzZSApO1xuICB9XG59XG5cbkltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0SW1hZ2UucHJvdG90eXBlICk7XG5JbWFnZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbWFnZTtcblxuLyoqXG4gKiDQmNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC60LDRgNGC0LjQvdC60YMg0L/QvtGB0LvQtSDQtdC1INC30LDQs9GA0YPQt9C60LguXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5JbWFnZSNfaW5pdFxuICogQHJldHVybiB7dm9pZH0g0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKi9cbkltYWdlLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uIF9pbml0ICgpXG57XG4gIHRoaXMuc3ggPSAwO1xuICB0aGlzLnN5ID0gMDtcbiAgdGhpcy5zdyA9IHRoaXMuZHcgPSB0aGlzLmltYWdlLndpZHRoOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgdGhpcy5zaCA9IHRoaXMuZGggPSB0aGlzLmltYWdlLmhlaWdodDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgdGhpcy5lbWl0KCAnY29tcGxldGUnICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5JbWFnZSNnZXRcbiAqL1xuSW1hZ2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoKVxue1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0J7Qv9GA0LXQtNC10LvRj9C10YIsINC30LDQs9GA0YPQttC10L3QsCDQu9C4INC60LDRgNGC0LjQvdC60LAuXG4gKiBAbWV0aG9kIHY2LkltYWdlI2NvbXBsZXRlXG4gKiBAcmV0dXJuIHtib29sZWFufSBgdHJ1ZWAsINC10YHQu9C4INC30LDQs9GA0YPQttC10L3QsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgaW1hZ2UgPSBJbWFnZS5mcm9tVVJMKCAnaW1hZ2UucG5nJyApO1xuICpcbiAqIGlmICggISBpbWFnZS5jb21wbGV0ZSgpICkge1xuICogICBpbWFnZS5vbmNlKCAnY29tcGxldGUnLCBmdW5jdGlvbiAoKVxuICogICB7XG4gKiAgICAgY29uc29sZS5sb2coICdUaGUgaW1hZ2UgaXMgbG9hZGVkIScsIGltYWdlLmNvbXBsZXRlKCkgKTtcbiAqICAgfSApO1xuICogfVxuICovXG5JbWFnZS5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZSAoKVxue1xuICByZXR1cm4gQm9vbGVhbiggdGhpcy5pbWFnZS5zcmMgKSAmJiB0aGlzLmltYWdlLmNvbXBsZXRlO1xufTtcblxuLyoqXG4gKiDQktC+0LfQstGA0LDRidCw0LXRgiBVUkwg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEBtZXRob2QgdjYuSW1hZ2Ujc3JjXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFVSTCDQutCw0YDRgtC40L3QutC4LlxuICogQGV4YW1wbGVcbiAqIEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICkuc3JjKCk7IC8vIC0+IFwiaW1hZ2UucG5nXCJcbiAqL1xuSW1hZ2UucHJvdG90eXBlLnNyYyA9IGZ1bmN0aW9uIHNyYyAoKVxue1xuICByZXR1cm4gdGhpcy5pbWFnZS5zcmM7XG59O1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC90L7QstGD0Y4ge0BsaW5rIHY2LkltYWdlfSDQuNC3IFVSTC5cbiAqIEBtZXRob2QgdjYuSW1hZ2UuZnJvbVVSTFxuICogQHBhcmFtICB7c3RyaW5nfSAgIHNyYyBVUkwg0LrQsNGA0YLQuNC90LrQuC5cbiAqIEByZXR1cm4ge3Y2LkltYWdlfSAgICAg0J3QvtCy0LDRjyB7QGxpbmsgdjYuSW1hZ2V9LlxuICogQGV4YW1wbGVcbiAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdpbWFnZS5wbmcnICk7XG4gKi9cbkltYWdlLmZyb21VUkwgPSBmdW5jdGlvbiBmcm9tVVJMICggc3JjIClcbntcbiAgdmFyIGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2ltZycgKTtcbiAgaW1hZ2Uuc3JjID0gc3JjO1xuICByZXR1cm4gbmV3IEltYWdlKCBpbWFnZSApO1xufTtcblxuLyoqXG4gKiDQn9GA0L7Qv9C+0YDRhtC40L7QvdCw0LvRjNC90L4g0YDQsNGB0YLRj9Cz0LjQstCw0LXRgiDQuNC70Lgg0YHQttC40LzQsNC10YIg0LrQsNGA0YLQuNC90LrRgy5cbiAqIEBtZXRob2QgdjYuSW1hZ2Uuc3RyZXRjaFxuICogQHBhcmFtICB7djYuQWJzdHJhY3RJbWFnZX0gICBpbWFnZSDQmtCw0YDRgtC40L3QutCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBkdyAgICDQndC+0LLRi9C5IFwiRGVzdGluYXRpb24gV2lkdGhcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgZGggICAg0J3QvtCy0YvQuSBcIkRlc3RpbmF0aW9uIEhlaWdodFwiLlxuICogQHJldHVybiB7djYuQ29tcG91bmRlZEltYWdlfSAgICAgICDQndC+0LLQsNGPINC60LDRgNGC0LjQvdC60LAuXG4gKiBAZXhhbXBsZVxuICogSW1hZ2Uuc3RyZXRjaCggaW1hZ2UsIDYwMCwgNDAwICk7XG4gKi9cbkltYWdlLnN0cmV0Y2ggPSBmdW5jdGlvbiBzdHJldGNoICggaW1hZ2UsIGR3LCBkaCApXG57XG4gIHZhciB2YWx1ZSA9IGRoIC8gaW1hZ2UuZGggKiBpbWFnZS5kdztcblxuICAvLyBTdHJldGNoIERXLlxuICBpZiAoIHZhbHVlIDwgZHcgKSB7XG4gICAgZGggPSBkdyAvIGltYWdlLmR3ICogaW1hZ2UuZGg7XG5cbiAgLy8gU3RyZXRjaCBESC5cbiAgfSBlbHNlIHtcbiAgICBkdyA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDb21wb3VuZGVkSW1hZ2UoIGltYWdlLmdldCgpLCBpbWFnZS5zeCwgaW1hZ2Uuc3ksIGltYWdlLnN3LCBpbWFnZS5zaCwgZHcsIGRoICk7XG59O1xuXG4vKipcbiAqINCe0LHRgNC10LfQsNC10YIg0LrQsNGA0YLQuNC90LrRgy5cbiAqIEBtZXRob2QgdjYuSW1hZ2UuY3V0XG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdEltYWdlfSAgIGltYWdlINCa0LDRgNGC0LjQvdC60LAsINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0LHRgNC10LfQsNGC0YwuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHN4ICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAsINC+0YLQutGD0LTQsCDQvdCw0LTQviDQvtCx0YDQtdC30LDRgtGMLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICBzeSAgICBZINC60L7QvtGA0LTQuNC90LDRgtCwLCDQvtGC0LrRg9C00LAg0L3QsNC00L4g0L7QsdGA0LXQt9Cw0YLRjC5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgc3cgICAg0J3QvtCy0LDRjyDRiNC40YDQuNC90LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgIHNoICAgINCd0L7QstCw0Y8g0LLRi9GB0L7RgtCwLlxuICogQHJldHVybiB7djYuQ29tcG91bmRlZEltYWdlfSAgICAgICDQntCx0YDQtdC30LDQvdC90LDRjyDQutCw0YDRgtC40L3QutCwLlxuICogQGV4YW1wbGVcbiAqIEltYWdlLmN1dCggaW1hZ2UsIDEwLCAyMCwgMzAsIDQwICk7XG4gKi9cbkltYWdlLmN1dCA9IGZ1bmN0aW9uIGN1dCAoIGltYWdlLCBzeCwgc3ksIGR3LCBkaCApXG57XG4gIHZhciBzdyA9IGltYWdlLnN3IC8gaW1hZ2UuZHcgKiBkdztcbiAgdmFyIHNoID0gaW1hZ2Uuc2ggLyBpbWFnZS5kaCAqIGRoO1xuXG4gIHN4ICs9IGltYWdlLnN4O1xuXG4gIGlmICggc3ggKyBzdyA+IGltYWdlLnN4ICsgaW1hZ2Uuc3cgKSB7XG4gICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgY3V0IHRoZSBpbWFnZSBiZWNhdXNlIHRoZSBuZXcgaW1hZ2UgWCBvciBXIGlzIG91dCBvZiBib3VuZHMgKHY2LkltYWdlLmN1dCknICk7XG4gIH1cblxuICBzeSArPSBpbWFnZS5zeTtcblxuICBpZiAoIHN5ICsgc2ggPiBpbWFnZS5zeSArIGltYWdlLnNoICkge1xuICAgIHRocm93IEVycm9yKCAnQ2Fubm90IGN1dCB0aGUgaW1hZ2UgYmVjYXVzZSB0aGUgbmV3IGltYWdlIFkgb3IgSCBpcyBvdXQgb2YgYm91bmRzICh2Ni5JbWFnZS5jdXQpJyApO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDb21wb3VuZGVkSW1hZ2UoIGltYWdlLmdldCgpLCBzeCwgc3ksIHN3LCBzaCwgZHcsIGRoICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pZiAoIHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicgKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRmxvYXQzMkFycmF5OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IEFycmF5O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNyZWF0ZUFycmF5XG4gKiBAcGFyYW0gIHtBcnJheS48YW55Pn0gICAgICAgICAgICAgICAgICAgIGFycmF5XG4gKiBAcmV0dXJuIHtBcnJheS48YW55PnxGbG9hdDMyQXJyYXkuPGFueT59XG4gKi9cblxuaWYgKCB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAnZnVuY3Rpb24nICkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUFycmF5ICggYXJyYXkgKVxuICB7XG4gICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoIGFycmF5ICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgfTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlQXJyYXkgKCBhcnJheSApXG4gIHtcbiAgICByZXR1cm4gYXJyYXk7XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfRmxvYXQzMkFycmF5ID0gcmVxdWlyZSggJy4vX0Zsb2F0MzJBcnJheScgKTtcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQvNCw0YHRgdC40LIg0YEg0LrQvtC+0YDQtNC40L3QsNGC0LDQvNC4INCy0YHQtdGFINGC0L7Rh9C10Log0L3Rg9C20L3QvtCz0L4g0L/QvtC70LjQs9C+0L3QsC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGNyZWF0ZVBvbHlnb25cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgc2lkZXMg0JrQvtC70LjRh9C10YHRgtCy0L4g0YHRgtC+0YDQvtC9INC/0L7Qu9C40LPQvtC90LAuXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgICAgINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDRgdGB0LjQsiAoRmxvYXQzMkFycmF5KSDQutC+0YLQvtGA0YvQuSDQstGL0LPQu9GP0LTQuNGCINGC0LDQujogYFsgeDEsIHkxLCB4MiwgeTIgXWAuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINCS0YHQtSDQt9C90LDRh9C10L3QuNGPINC60L7RgtC+0YDQvtCz0L4g0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Riy5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUG9seWdvbiAoIHNpZGVzIClcbntcbiAgdmFyIGkgICAgICAgID0gTWF0aC5mbG9vciggc2lkZXMgKTtcbiAgdmFyIHN0ZXAgICAgID0gTWF0aC5QSSAqIDIgLyBzaWRlcztcbiAgdmFyIHZlcnRpY2VzID0gbmV3IF9GbG9hdDMyQXJyYXkoIGkgKiAyICsgMiApO1xuXG4gIGZvciAoIDsgaSA+PSAwOyAtLWkgKSB7XG4gICAgdmVydGljZXNbICAgICBpICogMiBdID0gTWF0aC5jb3MoIHN0ZXAgKiBpICk7XG4gICAgdmVydGljZXNbIDEgKyBpICogMiBdID0gTWF0aC5zaW4oIHN0ZXAgKiBpICk7XG4gIH1cblxuICByZXR1cm4gdmVydGljZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUG9seWdvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQuCDQuNC90LjRhtC40LDQu9C40LfQuNGA0YPQtdGCINC90L7QstGD0Y4gV2ViR0wg0L/RgNC+0LPRgNCw0LzQvNGDLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY3JlYXRlUHJvZ3JhbVxuICogQHBhcmFtICB7V2ViR0xTaGFkZXJ9ICAgICAgICAgICB2ZXJ0INCS0LXRgNGI0LjQvdC90YvQuSDRiNC10LnQtNC10YAgKNGB0L7Qt9C00LDQvdC90YvQuSDRgSDQv9C+0LzQvtGJ0YzRjiBge0BsaW5rIGNyZWF0ZVNoYWRlcn1gKS5cbiAqIEBwYXJhbSAge1dlYkdMU2hhZGVyfSAgICAgICAgICAgZnJhZyDQpNGA0LDQs9C80LXQvdGC0L3Ri9C5INGI0LXQudC00LXRgCAo0YHQvtC30LTQsNC90L3Ri9C5INGBINC/0L7QvNC+0YnRjNGOIGB7QGxpbmsgY3JlYXRlU2hhZGVyfWApLlxuICogQHBhcmFtICB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAgIFdlYkdMINC60L7QvdGC0LXQutGB0YIuXG4gKiBAcmV0dXJuIHtXZWJHTFByb2dyYW19XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVByb2dyYW0gKCB2ZXJ0LCBmcmFnLCBnbCApXG57XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuXG4gIGdsLmF0dGFjaFNoYWRlciggcHJvZ3JhbSwgdmVydCApO1xuICBnbC5hdHRhY2hTaGFkZXIoIHByb2dyYW0sIGZyYWcgKTtcbiAgZ2wubGlua1Byb2dyYW0oIHByb2dyYW0gKTtcblxuICBpZiAoICEgZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggcHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ1VuYWJsZSB0byBpbml0aWFsaXplIHRoZSBzaGFkZXIgcHJvZ3JhbTogJyArIGdsLmdldFByb2dyYW1JbmZvTG9nKCBwcm9ncmFtICkgKTtcbiAgfVxuXG4gIGdsLnZhbGlkYXRlUHJvZ3JhbSggcHJvZ3JhbSApO1xuXG4gIGlmICggISBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCBwcm9ncmFtLCBnbC5WQUxJREFURV9TVEFUVVMgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ1VuYWJsZSB0byB2YWxpZGF0ZSB0aGUgc2hhZGVyIHByb2dyYW06ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyggcHJvZ3JhbSApICk7XG4gIH1cblxuICByZXR1cm4gcHJvZ3JhbTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQcm9ncmFtO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINC4INC40L3QuNGG0LjQsNC70LjQt9C40YDRg9C10YIg0L3QvtCy0YvQuSBXZWJHTCDRiNC10LnQtNC10YAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjcmVhdGVTaGFkZXJcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgc291cmNlINCY0YHRhdC+0LTQvdGL0Lkg0LrQvtC0INGI0LXQudC00LXRgNCwLlxuICogQHBhcmFtICB7Y29uc3RhbnR9ICAgICAgICAgICAgICB0eXBlICAg0KLQuNC/INGI0LXQudC00LXRgNCwOiBWRVJURVhfU0hBREVSINC40LvQuCBGUkFHTUVOVF9TSEFERVIuXG4gKiBAcGFyYW0gIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsICAgICBXZWJHTCDQutC+0L3RgtC10LrRgdGCLlxuICogQHJldHVybiB7V2ViR0xTaGFkZXJ9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVNoYWRlciAoIHNvdXJjZSwgdHlwZSwgZ2wgKVxue1xuICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKCB0eXBlICk7XG5cbiAgZ2wuc2hhZGVyU291cmNlKCBzaGFkZXIsIHNvdXJjZSApO1xuICBnbC5jb21waWxlU2hhZGVyKCBzaGFkZXIgKTtcblxuICBpZiAoICEgZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKCBzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTICkgKSB7XG4gICAgdGhyb3cgU3ludGF4RXJyb3IoICdBbiBlcnJvciBvY2N1cnJlZCBjb21waWxpbmcgdGhlIHNoYWRlcnM6ICcgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKCBzaGFkZXIgKSApO1xuICB9XG5cbiAgcmV0dXJuIHNoYWRlcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVTaGFkZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBtZW1iZXIge29iamVjdH0gcG9seWdvbnNcbiAqL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbm9vcCA9IHJlcXVpcmUoICdwZWFrby9ub29wJyApO1xuXG52YXIgcmVwb3J0LCByZXBvcnRlZDtcblxuaWYgKCB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZS53YXJuICkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgcmVwb3J0ZWQgPSB7fTtcblxuICByZXBvcnQgPSBmdW5jdGlvbiByZXBvcnQgKCBtZXNzYWdlIClcbiAge1xuICAgIGlmICggcmVwb3J0ZWRbIG1lc3NhZ2UgXSApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oIG1lc3NhZ2UgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmVwb3J0ZWRbIG1lc3NhZ2UgXSA9IHRydWU7XG4gIH07XG59IGVsc2Uge1xuICByZXBvcnQgPSBub29wO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcG9ydDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL3NldHRpbmdzJyApO1xuXG4vKipcbiAqINCQ0LHRgdGC0YDQsNC60YLQvdGL0Lkg0LrQu9Cw0YHRgSDQstC10LrRgtC+0YDQsCDRgSDQsdCw0LfQvtCy0YvQvNC4INC80LXRgtC+0LTQsNC80LguXG4gKlxuICog0KfRgtC+0LHRiyDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNGD0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIg0L3QsNC00L4g0L3QsNC/0LjRgdCw0YLRjCDRgdC70LXQtNGD0Y7RidC10LU6XG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9zZXR0aW5ncycgKTtcbiAqIHNldHRpbmdzLmRlZ3JlZXMgPSB0cnVlO1xuICogYGBgXG4gKiBAYWJzdHJhY3RcbiAqIEBjb25zdHJ1Y3RvciB2Ni5BYnN0cmFjdFZlY3RvclxuICogQHNlZSB2Ni5WZWN0b3IyRFxuICogQHNlZSB2Ni5WZWN0b3IzRFxuICovXG5mdW5jdGlvbiBBYnN0cmFjdFZlY3RvciAoKVxue1xuICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RWZWN0b3IpJyApO1xufVxuXG5BYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiDQndC+0YDQvNCw0LvQuNC30YPQtdGCINCy0LXQutGC0L7RgC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNub3JtYWxpemVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5ub3JtYWxpemUoKTsgLy8gVmVjdG9yMkQgeyB4OiAwLjg5NDQyNzE5MDk5OTkxNTksIHk6IDAuNDQ3MjEzNTk1NDk5OTU3OSB9XG4gICAqL1xuICBub3JtYWxpemU6IGZ1bmN0aW9uIG5vcm1hbGl6ZSAoKVxuICB7XG4gICAgdmFyIG1hZyA9IHRoaXMubWFnKCk7XG5cbiAgICBpZiAoIG1hZyAmJiBtYWcgIT09IDEgKSB7XG4gICAgICB0aGlzLmRpdiggbWFnICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0L3QsNC/0YDQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsCDQvdCwIGBcImFuZ2xlXCJgINGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0LTQu9C40L3Riy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNzZXRBbmdsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUg0J3QvtCy0L7QtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnNldEFuZ2xlKCA0NSAqIE1hdGguUEkgLyAxODAgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjE2MjI3NzY2MDE2ODM3OTUsIHk6IDMuMTYyMjc3NjYwMTY4Mzc5IH1cbiAgICogQGV4YW1wbGUgPGNhcHRpb24+0JjRgdC/0L7Qu9GM0LfRg9GPINCz0YDRg9C00YPRgdGLPC9jYXB0aW9uPlxuICAgKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5zZXRBbmdsZSggNDUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLjE2MjI3NzY2MDE2ODM3OTUsIHk6IDMuMTYyMjc3NjYwMTY4Mzc5IH1cbiAgICovXG4gIHNldEFuZ2xlOiBmdW5jdGlvbiBzZXRBbmdsZSAoIGFuZ2xlIClcbiAge1xuICAgIHZhciBtYWcgPSB0aGlzLm1hZygpO1xuXG4gICAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG5cbiAgICB0aGlzLnggPSBtYWcgKiBNYXRoLmNvcyggYW5nbGUgKTtcbiAgICB0aGlzLnkgPSBtYWcgKiBNYXRoLnNpbiggYW5nbGUgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQmNC30LzQtdC90Y/QtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAg0L3QsCBgXCJ2YWx1ZVwiYCDRgSDRgdC+0YXRgNCw0L3QtdC90LjQtdC8INC90LDQv9GA0LDQstC70LXQvdC40Y8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3Ijc2V0TWFnXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQndC+0LLQsNGPINC00LvQuNC90LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuc2V0TWFnKCA0MiApOyAvLyBWZWN0b3IyRCB7IHg6IDM3LjU2NTk0MjAyMTk5NjQ2LCB5OiAxOC43ODI5NzEwMTA5OTgyMyB9XG4gICAqL1xuICBzZXRNYWc6IGZ1bmN0aW9uIHNldE1hZyAoIHZhbHVlIClcbiAge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZSgpLm11bCggdmFsdWUgKTtcbiAgfSxcblxuICAvKipcbiAgICog0J/QvtCy0L7RgNCw0YfQuNCy0LDQtdGCINCy0LXQutGC0L7RgCDQvdCwIGBcImFuZ2xlXCJgINGD0LPQvtC7INGBINGB0L7RhdGA0LDQvdC10L3QuNC10Lwg0LTQu9C40L3Riy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNyb3RhdGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkucm90YXRlKCA1ICogTWF0aC5QSSAvIDE4MCApOyAvLyBWZWN0b3IyRCB7IHg6IDMuODEwNDY3MzA2ODcxNjY2LCB5OiAyLjM0MTAxMjM2NzE3NDEyMzYgfVxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj7QmNGB0L/QvtC70YzQt9GD0Y8g0LPRgNGD0LTRg9GB0Ys8L2NhcHRpb24+XG4gICAqIG5ldyBWZWN0b3IyRCggNCwgMiApLnJvdGF0ZSggNSApOyAvLyBWZWN0b3IyRCB7IHg6IDMuODEwNDY3MzA2ODcxNjY2LCB5OiAyLjM0MTAxMjM2NzE3NDEyMzYgfVxuICAgKi9cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcblxuICAgIHZhciBjLCBzO1xuXG4gICAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG5cbiAgICBjID0gTWF0aC5jb3MoIGFuZ2xlICk7XG4gICAgcyA9IE1hdGguc2luKCBhbmdsZSApO1xuXG4gICAgdGhpcy54ID0gKCB4ICogYyApIC0gKCB5ICogcyApO1xuICAgIHRoaXMueSA9ICggeCAqIHMgKSArICggeSAqIGMgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDRgtC10LrRg9GJ0LXQtSDQvdCw0L/RgNCw0LLQu9C10L3QuNC1INCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2dldEFuZ2xlXG4gICAqIEByZXR1cm4ge251bWJlcn0g0J3QsNC/0YDQsNCy0LvQtdC90LjQtSAo0YPQs9C+0LspINCyINCz0YDQsNC00YPRgdCw0YUg0LjQu9C4INGA0LDQtNC40LDQvdCw0YUuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmdldEFuZ2xlKCk7IC8vIC0+IDAuNzg1Mzk4MTYzMzk3NDQ4M1xuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj7QmNGB0L/QvtC70YzQt9GD0Y8g0LPRgNGD0LTRg9GB0Ys8L2NhcHRpb24+XG4gICAqIG5ldyBWZWN0b3IyRCggMSwgMSApLmdldEFuZ2xlKCk7IC8vIC0+IDQ1XG4gICAqL1xuICBnZXRBbmdsZTogZnVuY3Rpb24gZ2V0QW5nbGUgKClcbiAge1xuICAgIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIHJldHVybiBNYXRoLmF0YW4yKCB0aGlzLnksIHRoaXMueCApICogMTgwIC8gTWF0aC5QSTtcbiAgICB9XG5cbiAgICByZXR1cm4gTWF0aC5hdGFuMiggdGhpcy55LCB0aGlzLnggKTtcbiAgfSxcblxuICAvKipcbiAgICog0J7Qs9GA0LDQvdC40YfQuNCy0LDQtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAg0LTQviBgXCJ2YWx1ZVwiYC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3RvciNsaW1pdFxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUg0JzQsNC60YHQuNC80LDQu9GM0L3QsNGPINC00LvQuNC90LAg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAxLCAxICkubGltaXQoIDEgKTsgLy8gVmVjdG9yMkQgeyB4OiAwLjcwNzEwNjc4MTE4NjU0NzUsIHk6IDAuNzA3MTA2NzgxMTg2NTQ3NSB9XG4gICAqL1xuICBsaW1pdDogZnVuY3Rpb24gbGltaXQgKCB2YWx1ZSApXG4gIHtcbiAgICB2YXIgbWFnID0gdGhpcy5tYWdTcSgpO1xuXG4gICAgaWYgKCBtYWcgPiB2YWx1ZSAqIHZhbHVlICkge1xuICAgICAgdGhpcy5kaXYoIE1hdGguc3FydCggbWFnICkgKS5tdWwoIHZhbHVlICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC00LvQuNC90YMg0LLQtdC60YLQvtGA0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbWFnXG4gICAqIEByZXR1cm4ge251bWJlcn0g0JTQu9C40L3QsCDQstC10LrRgtC+0YDQsC5cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAyLCAyICkubWFnKCk7IC8vIC0+IDIuODI4NDI3MTI0NzQ2MTkwM1xuICAgKi9cbiAgbWFnOiBmdW5jdGlvbiBtYWcgKClcbiAge1xuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMubWFnU3EoKSApO1xuICB9LFxuXG4gIC8qKlxuICAgKiDQktC+0LfQstGA0LDRidCw0LXRgiDQtNC70LjQvdGDINCy0LXQutGC0L7RgNCwINCyINC60LLQsNC00YDQsNGC0LUuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjbWFnU3FcbiAgICogQHJldHVybiB7bnVtYmVyfSDQlNC70LjQvdCwINCy0LXQutGC0L7RgNCwINCyINC60LLQsNC00YDQsNGC0LUuXG4gICAqIEBleGFtcGxlXG4gICAqIG5ldyBWZWN0b3IyRCggMiwgMiApLm1hZ1NxKCk7IC8vIC0+IDhcbiAgICovXG5cbiAgLyoqXG4gICAqINCh0L7Qt9C00LDQtdGCINC60LvQvtC9INCy0LXQutGC0L7RgNCwLlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yI2Nsb25lXG4gICAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfSDQmtC70L7QvSDQstC10LrRgtC+0YDQsC5cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCA0LCAyICkuY2xvbmUoKTtcbiAgICovXG5cbiAgLyoqXG4gICAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstC10LrRgtC+0YDQsCAocHJldHRpZmllZCkuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjdG9TdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgVmVjdG9yMkQoIDQuMzIxLCAyLjM0NSApLnRvU3RyaW5nKCk7IC8vIC0+IFwidjYuVmVjdG9yMkQgeyB4OiA0LjMyLCB5OiAyLjM1IH1cIlxuICAgKi9cblxuICAvKipcbiAgICog0JLQvtC30LLRgNCw0YnQsNC10YIg0LTQuNGB0YLQsNC90YbQuNGOINC80LXQttC00YMg0LTQstGD0LzRjyDQstC10LrRgtC+0YDQsNC80LguXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RWZWN0b3IjZGlzdFxuICAgKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCU0YDRg9Cz0L7QuSAo0LLRgtC+0YDQvtC5KSDQstC10LrRgtC+0YAuXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICogQGV4YW1wbGVcbiAgICogbmV3IFZlY3RvcjJEKCAzLCAzICkuZGlzdCggbmV3IFZlY3RvcjJEKCAxLCAxICkgKTsgLy8gLT4gMi44Mjg0MjcxMjQ3NDYxOTAzXG4gICAqL1xuXG4gIGNvbnN0cnVjdG9yOiBBYnN0cmFjdFZlY3RvclxufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gVmVjdG9yIHtAbGluayB2Ni5WZWN0b3IyRH0sIHtAbGluayB2Ni5WZWN0b3IzRH0uXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgYW5nbGVcbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5mcm9tQW5nbGVcbiAqL1xuQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZSA9IGZ1bmN0aW9uIF9mcm9tQW5nbGUgKCBWZWN0b3IsIGFuZ2xlIClcbntcbiAgaWYgKCBzZXR0aW5ncy5kZWdyZWVzICkge1xuICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gIH1cblxuICByZXR1cm4gbmV3IFZlY3RvciggTWF0aC5jb3MoIGFuZ2xlICksIE1hdGguc2luKCBhbmdsZSApICk7XG59O1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINGA0LDQvdC00L7QvNC90YvQuSDQstC10LrRgtC+0YAuXG4gKiBAdmlydHVhbFxuICogQHN0YXRpY1xuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqIEByZXR1cm4ge3Y2LkFic3RyYWN0VmVjdG9yfSDQktC+0LfQstGA0LDRidCw0LXRgiDQvdC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdGL0Lkg0LLQtdC60YLQvtGAINGBINGA0LDQvdC00L7QvNC90YvQvCDQvdCw0L/RgNCw0LLQu9C10L3QuNC10LwuXG4gKi9cblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQstC10LrRgtC+0YAg0YEg0L3QsNC/0YDQsNCy0LvQtdC90LjQtdC8INGA0LDQstC90YvQvCBgXCJhbmdsZVwiYC5cbiAqIEB2aXJ0dWFsXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgIGFuZ2xlINCd0LDQv9GA0LDQstC70LXQvdC40LUg0LLQtdC60YLQvtGA0LAuXG4gKiBAcmV0dXJuIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gICAgICAg0JLQvtC30LLRgNCw0YnQsNC10YIg0L3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3Ri9C5INCy0LXQutGC0L7RgC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0VmVjdG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2V0dGluZ3MgICAgICAgPSByZXF1aXJlKCAnLi4vc2V0dGluZ3MnICk7XG52YXIgQWJzdHJhY3RWZWN0b3IgPSByZXF1aXJlKCAnLi9BYnN0cmFjdFZlY3RvcicgKTtcblxuLyoqXG4gKiAyRCDQstC10LrRgtC+0YAuXG4gKiBAY29uc3RydWN0b3IgdjYuVmVjdG9yMkRcbiAqIEBleHRlbmRzIHY2LkFic3RyYWN0VmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0gWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQGV4YW1wbGVcbiAqIHZhciBWZWN0b3IyRCA9IHJlcXVpcmUoICd2Ni5qcy9tYXRoL1ZlY3RvcjJEJyApO1xuICogdmFyIHBvc2l0aW9uID0gbmV3IFZlY3RvcjJEKCA0LCAyICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cbmZ1bmN0aW9uIFZlY3RvcjJEICggeCwgeSApXG57XG4gIC8qKlxuICAgKiBYINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjJEI3hcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHggPSBuZXcgVmVjdG9yMkQoIDQsIDIgKS54OyAvLyAtPiA0XG4gICAqL1xuXG4gIC8qKlxuICAgKiBZINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICAgKiBAbWVtYmVyIHtudW1iZXJ9IHY2LlZlY3RvcjJEI3lcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHkgPSBuZXcgVmVjdG9yMkQoIDQsIDIgKS55OyAvLyAtPiAyXG4gICAqL1xuXG4gIHRoaXMuc2V0KCB4LCB5ICk7XG59XG5cblZlY3RvcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0VmVjdG9yLnByb3RvdHlwZSApO1xuVmVjdG9yMkQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVmVjdG9yMkQ7XG5cbi8qKlxuICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgWCDQuCBZINC60L7QvtGA0LTQuNC90LDRgtGLLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzZXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSDQndC+0LLQsNGPIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0J3QvtCy0LDRjyBZINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCgpLnNldCggNCwgMiApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICggeCwgeSApXG57XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC6INC60L7QvtGA0LTQuNC90LDRgtCw0LwgWCDQuCBZINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2FkZFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5hZGQoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA0LCB5OiAyIH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCAoIHgsIHkgKVxue1xuICB0aGlzLnggKz0geCB8fCAwO1xuICB0aGlzLnkgKz0geSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JLRi9GH0LjRgtCw0LXRgiDQuNC3INC60L7QvtGA0LTQuNC90LDRgiBYINC4IFkg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC1INC/0LDRgNCw0LzQtdGC0YDRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjc3ViXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5zdWIoIDQsIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiAtNCwgeTogLTIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViICggeCwgeSApXG57XG4gIHRoaXMueCAtPSB4IHx8IDA7XG4gIHRoaXMueSAtPSB5IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI211bFxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YPQvNC90L7QttC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5tdWwoIDIgKTsgLy8gVmVjdG9yMkQgeyB4OiA4LCB5OiA0IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm11bCA9IGZ1bmN0aW9uIG11bCAoIHZhbHVlIClcbntcbiAgdGhpcy54ICo9IHZhbHVlO1xuICB0aGlzLnkgKj0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2RpdlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YDQsNC30LTQtdC70LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmRpdiggMiApOyAvLyBWZWN0b3IyRCB7IHg6IDIsIHk6IDEgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuZGl2ID0gZnVuY3Rpb24gZGl2ICggdmFsdWUgKVxue1xuICB0aGlzLnggLz0gdmFsdWU7XG4gIHRoaXMueSAvPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZG90XG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt4PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt5PTBdXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkuZGl2KCAyLCAzICk7IC8vIDE0LCDQv9C+0YLQvtC80YMg0YfRgtC+OiBcIig0ICogMikgKyAoMiAqIDMpID0gOCArIDYgPSAxNFwiXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QgKCB4LCB5IClcbntcbiAgcmV0dXJuICggdGhpcy54ICogKCB4IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy55ICogKCB5IHx8IDAgKSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0Y7RidC40LzQuCDQv9Cw0YDQsNC80LXRgtGA0LDQvNC4LlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNsZXJwXG4gKiBAcGFyYW0ge251bWJlcn0geFxuICogQHBhcmFtIHtudW1iZXJ9IHlcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmxlcnAoIDgsIDQsIDAuNSApOyAvLyBWZWN0b3IyRCB7IHg6IDYsIHk6IDMgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uICggeCwgeSwgdmFsdWUgKVxue1xuICB0aGlzLnggKz0gKCB4IC0gdGhpcy54ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnkgKz0gKCB5IC0gdGhpcy55ICkgKiB2YWx1ZSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNzZXRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INGB0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc2V0VmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDQsIHk6IDIgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUuc2V0VmVjdG9yID0gZnVuY3Rpb24gc2V0VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc2V0KCB2ZWN0b3IueCwgdmVjdG9yLnkgKTtcbn07XG5cbi8qKlxuICog0JTQvtCx0LDQstC70Y/QtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2FkZFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LTQvtCx0LDQstC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoKS5hZGRWZWN0b3IoIG5ldyBWZWN0b3IyRCggNCwgMiApICk7IC8vIFZlY3RvcjJEIHsgeDogNCwgeTogMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5hZGRWZWN0b3IgPSBmdW5jdGlvbiBhZGRWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5hZGQoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC00YDRg9Cz0L7QuSDQstC10LrRgtC+0YAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI3N1YlZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yINCS0LXQutGC0L7RgCwg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LLRi9GH0LXRgdGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCkuc3ViVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDQsIDIgKSApOyAvLyBWZWN0b3IyRCB7IHg6IC00LCB5OiAtMiB9XG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5zdWJWZWN0b3IgPSBmdW5jdGlvbiBzdWJWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5zdWIoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQo9C80L3QvtC20LDQtdGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgg0LggWSDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbXVsVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGAINC00LvRjyDRg9C80L3QvtC20LXQvdC40Y8uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjJEKCA0LCAyICkubXVsVmVjdG9yKCBuZXcgVmVjdG9yMkQoIDIsIDMgKSApOyAvLyBWZWN0b3IyRCB7IHg6IDgsIHk6IDYgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubXVsVmVjdG9yID0gZnVuY3Rpb24gbXVsVmVjdG9yICggdmVjdG9yIClcbntcbiAgdGhpcy54ICo9IHZlY3Rvci54O1xuICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgg0LggWSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIFgg0LggWSDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjZGl2VmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQvdCwINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kaXZWZWN0b3IoIG5ldyBWZWN0b3IyRCggMiwgMC41ICkgKTsgLy8gVmVjdG9yMkQgeyB4OiAyLCB5OiA0IH1cbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpdlZlY3RvciA9IGZ1bmN0aW9uIGRpdlZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAvPSB2ZWN0b3IueDtcbiAgdGhpcy55IC89IHZlY3Rvci55O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCNkb3RWZWN0b3JcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yMkQoIDQsIDIgKS5kb3RWZWN0b3IoIG5ldyBWZWN0b3IyRCggMywgNSApICk7IC8vIC0+IDIyXG4gKi9cblZlY3RvcjJELnByb3RvdHlwZS5kb3RWZWN0b3IgPSBmdW5jdGlvbiBkb3RWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5kb3QoIHZlY3Rvci54LCB2ZWN0b3IueSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYINC4IFkg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0LzQtdC20LTRgyDQtNGA0YPQs9C40Lwg0LLQtdC60YLQvtGA0L7QvC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbGVycFZlY3RvclxuICogQHBhcmFtIHt2Ni5BYnN0cmFjdFZlY3Rvcn0gdmVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICB2YWx1ZVxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IyRCggNCwgMiApLmxlcnBWZWN0b3IoIG5ldyBWZWN0b3IyRCggMiwgMSApLCAwLjUgKTsgLy8gVmVjdG9yMkQgeyB4OiAzLCB5OiAxLjUgfVxuICovXG5WZWN0b3IyRC5wcm90b3R5cGUubGVycFZlY3RvciA9IGZ1bmN0aW9uIGxlcnBWZWN0b3IgKCB2ZWN0b3IsIHZhbHVlIClcbntcbiAgcmV0dXJuIHRoaXMubGVycCggdmVjdG9yLngsIHZlY3Rvci55LCB2YWx1ZSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjbWFnU3FcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLm1hZ1NxID0gZnVuY3Rpb24gbWFnU3EgKClcbntcbiAgcmV0dXJuICggdGhpcy54ICogdGhpcy54ICkgKyAoIHRoaXMueSAqIHRoaXMueSApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQjY2xvbmVcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUgKClcbntcbiAgcmV0dXJuIG5ldyBWZWN0b3IyRCggdGhpcy54LCB0aGlzLnkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjJEI2Rpc3RcbiAqL1xuVmVjdG9yMkQucHJvdG90eXBlLmRpc3QgPSBmdW5jdGlvbiBkaXN0ICggdmVjdG9yIClcbntcbiAgdmFyIHggPSB2ZWN0b3IueCAtIHRoaXMueDtcbiAgdmFyIHkgPSB2ZWN0b3IueSAtIHRoaXMueTtcbiAgcmV0dXJuIE1hdGguc3FydCggKCB4ICogeCApICsgKCB5ICogeSApICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IyRCN0b1N0cmluZ1xuICovXG5WZWN0b3IyRC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKVxue1xuICByZXR1cm4gJ3Y2LlZlY3RvcjJEIHsgeDogJyArIHRoaXMueC50b0ZpeGVkKCAyICkgKyAnLCB5OiAnICsgdGhpcy55LnRvRml4ZWQoIDIgKSArICcgfSc7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQucmFuZG9tXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLnJhbmRvbVxuICovXG5WZWN0b3IyRC5yYW5kb20gPSBmdW5jdGlvbiByYW5kb20gKClcbntcbiAgdmFyIHZhbHVlO1xuXG4gIGlmICggc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICB2YWx1ZSA9IDM2MDtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IE1hdGguUEkgKiAyO1xuICB9XG5cbiAgcmV0dXJuIFZlY3RvcjJELmZyb21BbmdsZSggTWF0aC5yYW5kb20oKSAqIHZhbHVlICk7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yMkQuZnJvbUFuZ2xlXG4gKiBAc2VlIHY2LkFic3RyYWN0VmVjdG9yLmZyb21BbmdsZVxuICovXG5WZWN0b3IyRC5mcm9tQW5nbGUgPSBmdW5jdGlvbiBmcm9tQW5nbGUgKCBhbmdsZSApXG57XG4gIHJldHVybiBBYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlKCBWZWN0b3IyRCwgYW5nbGUgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yMkQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBBYnN0cmFjdFZlY3RvciA9IHJlcXVpcmUoICcuL0Fic3RyYWN0VmVjdG9yJyApO1xuXG4vKipcbiAqIDNEINCy0LXQutGC0L7RgC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5WZWN0b3IzRFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RWZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD0wXSBYINC60L7QvtGA0LTQuNC90LDRgtCwINCy0LXQutGC0L7RgNCwLlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LLQtdC60YLQvtGA0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0gWiDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgVmVjdG9yM0QgPSByZXF1aXJlKCAndjYuanMvbWF0aC9WZWN0b3IzRCcgKTtcbiAqIHZhciBwb3NpdGlvbiA9IG5ldyBWZWN0b3IzRCggNCwgMiwgMyApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDMgfVxuICovXG5mdW5jdGlvbiBWZWN0b3IzRCAoIHgsIHksIHogKVxue1xuICAvKipcbiAgICogWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN4XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB4ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkueDsgLy8gLT4gNFxuICAgKi9cblxuICAvKipcbiAgICogWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN5XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB5ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkueTsgLy8gLT4gMlxuICAgKi9cblxuICAvKipcbiAgICogWiDQutC+0L7RgNC00LjQvdCw0YLQsCDQstC10LrRgtC+0YDQsC5cbiAgICogQG1lbWJlciB7bnVtYmVyfSB2Ni5WZWN0b3IzRCN6XG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB6ID0gbmV3IFZlY3RvcjNEKCA0LCAyLCAzICkuejsgLy8gLT4gM1xuICAgKi9cblxuICB0aGlzLnNldCggeCwgeSwgeiApO1xufVxuXG5WZWN0b3IzRC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUgKTtcblZlY3RvcjNELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFZlY3RvcjNEO1xuXG4vKipcbiAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3NldFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCd0L7QstCw0Y8gWCDQutC+0L7RgNC00LjQvdCw0YLQsC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT0wXSDQndC+0LLQsNGPIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAuXG4gKiBAcGFyYW0ge251bWJlcn0gW3o9MF0g0J3QvtCy0LDRjyBaINC60L7QvtGA0LTQuNC90LDRgtCwLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLnNldCggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICggeCwgeSwgeiApXG57XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICB0aGlzLnogPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC+0LHQsNCy0LvRj9C10YIg0Log0LrQvtC+0YDQtNC40L3QsNGC0LDQvCBYLCBZLCDQuCBaINGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjQtSDQv9Cw0YDQsNC80LXRgtGA0YsuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI2FkZFxuICogQHBhcmFtIHtudW1iZXJ9IFt4PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC90L4uXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbej0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LTQvtCx0LDQstC70LXQvdC+LlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCgpLmFkZCggNCwgMiwgNiApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkICggeCwgeSwgeiApXG57XG4gIHRoaXMueCArPSB4IHx8IDA7XG4gIHRoaXMueSArPSB5IHx8IDA7XG4gIHRoaXMueiArPSB6IHx8IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQktGL0YfQuNGC0LDQtdGCINC40Lcg0LrQvtC+0YDQtNC40L3QsNGCIFgsIFksINC4IFog0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC1INC/0LDRgNCw0LzQtdGC0YDRiy5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc3ViXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0g0KfQuNGB0LvQviwg0LrQvtGC0L7RgNC+0LUg0LTQvtC70LbQvdC+INCx0YvRgtGMINCy0YvRh9GC0LXQvdC+LlxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdINCn0LjRgdC70L4sINC60L7RgtC+0YDQvtC1INC00L7Qu9C20L3QviDQsdGL0YLRjCDQstGL0YfRgtC10L3Qvi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbej0wXSDQp9C40YHQu9C+LCDQutC+0YLQvtGA0L7QtSDQtNC+0LvQttC90L4g0LHRi9GC0Ywg0LLRi9GH0YLQtdC90L4uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc3ViKCA0LCAyLCA2ICk7IC8vIFZlY3RvcjNEIHsgeDogLTQsIHk6IC0yLCB6OiAtNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbiBzdWIgKCB4LCB5LCB6IClcbntcbiAgdGhpcy54IC09IHggfHwgMDtcbiAgdGhpcy55IC09IHkgfHwgMDtcbiAgdGhpcy56IC09IHogfHwgMDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqINCj0LzQvdC+0LbQsNC10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCwIGB2YWx1ZWAuXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI211bFxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlINCn0LjRgdC70L4sINC90LAg0LrQvtGC0L7RgNC+0LUg0L3QsNC00L4g0YPQvNC90L7QttC40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5tdWwoIDIgKTsgLy8gVmVjdG9yM0QgeyB4OiA4LCB5OiA0LCB6OiAxMiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5tdWwgPSBmdW5jdGlvbiBtdWwgKCB2YWx1ZSApXG57XG4gIHRoaXMueCAqPSB2YWx1ZTtcbiAgdGhpcy55ICo9IHZhbHVlO1xuICB0aGlzLnogKj0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBgdmFsdWVgLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkaXZcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSDQp9C40YHQu9C+LCDQvdCwINC60L7RgtC+0YDQvtC1INC90LDQtNC+INGA0LDQt9C00LXQu9C40YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kaXYoIDIgKTsgLy8gVmVjdG9yM0QgeyB4OiAyLCB5OiAxLCB6OiAzIH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdiAoIHZhbHVlIClcbntcbiAgdGhpcy54IC89IHZhbHVlO1xuICB0aGlzLnkgLz0gdmFsdWU7XG4gIHRoaXMueiAvPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZG90XG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt4PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt5PTBdXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFt6PTBdXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkuZG90KCAyLCAzLCA0ICk7IC8vIC0+IDM4LCDQv9C+0YLQvtC80YMg0YfRgtC+OiBcIig0ICogMikgKyAoMiAqIDMpICsgKDYgKiA0KSA9IDggKyA2ICsgMjQgPSAzOFwiXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QgKCB4LCB5LCB6IClcbntcbiAgcmV0dXJuICggdGhpcy54ICogKCB4IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy55ICogKCB5IHx8IDAgKSApICtcbiAgICAgICAgICggdGhpcy56ICogKCB6IHx8IDAgKSApO1xufTtcblxuLyoqXG4gKiDQmNC90YLQtdGA0L/QvtC70LjRgNGD0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC80LXQttC00YMg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNC80Lgg0L/QsNGA0LDQvNC10YLRgNCw0LzQuC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbGVycFxuICogQHBhcmFtIHtudW1iZXJ9IHhcbiAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gKiBAcGFyYW0ge251bWJlcn0gelxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubGVycCggOCwgNCwgMTIsIDAuNSApOyAvLyBWZWN0b3IzRCB7IHg6IDYsIHk6IDMsIHo6IDkgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uICggeCwgeSwgeiwgdmFsdWUgKVxue1xuICB0aGlzLnggKz0gKCB4IC0gdGhpcy54ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnkgKz0gKCB5IC0gdGhpcy55ICkgKiB2YWx1ZSB8fCAwO1xuICB0aGlzLnogKz0gKCB6IC0gdGhpcy56ICkgKiB2YWx1ZSB8fCAwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNzZXRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INGB0LrQvtC/0LjRgNC+0LLQsNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuc2V0VmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuc2V0VmVjdG9yID0gZnVuY3Rpb24gc2V0VmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuc2V0KCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCU0L7QsdCw0LLQu9GP0LXRgiDQtNGA0YPQs9C+0Lkg0LLQtdC60YLQvtGALlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNhZGRWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC60L7RgtC+0YDRi9C5INC90LDQtNC+INC00L7QsdCw0LLQuNGC0YwuXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCkuYWRkVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDQsIHk6IDIsIHo6IDYgfVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gYWRkVmVjdG9yICggdmVjdG9yIClcbntcbiAgcmV0dXJuIHRoaXMuYWRkKCB2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56ICk7XG59O1xuXG4vKipcbiAqINCS0YvRh9C40YLQsNC10YIg0LTRgNGD0LPQvtC5INCy0LXQutGC0L7RgC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0Qjc3ViVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGALCDQutC+0YLQvtGA0YvQuSDQvdCw0LTQviDQstGL0YfQtdGB0YLRjC5cbiAqIEBjaGFpbmFibGVcbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoKS5zdWJWZWN0b3IoIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApICk7IC8vIFZlY3RvcjNEIHsgeDogLTQsIHk6IC0yLCB6OiAtNiB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5zdWJWZWN0b3IgPSBmdW5jdGlvbiBzdWJWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5zdWIoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcbn07XG5cbi8qKlxuICog0KPQvNC90L7QttCw0LXRgiBYLCBZLCDQuCBaINC60L7QvtGA0LTQuNC90LDRgtGLINC90LAgWCwgWSwg0LggWiDQtNGA0YPQs9C+0LPQviDQstC10LrRgtC+0YDQsC5cbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjbXVsVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3Ig0JLQtdC60YLQvtGAINC00LvRjyDRg9C80L3QvtC20LXQvdC40Y8uXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubXVsVmVjdG9yKCBuZXcgVmVjdG9yM0QoIDIsIDMsIDQgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDgsIHk6IDYsIHo6IDI0IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLm11bFZlY3RvciA9IGZ1bmN0aW9uIG11bFZlY3RvciAoIHZlY3RvciApXG57XG4gIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgdGhpcy55ICo9IHZlY3Rvci55O1xuICB0aGlzLnogKj0gdmVjdG9yLno7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQlNC10LvQuNGCIFgsIFksINC4IFog0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsCBYLCBZLCDQuCBaINC00YDRg9Cz0L7Qs9C+INCy0LXQutGC0L7RgNCwLlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkaXZWZWN0b3JcbiAqIEBwYXJhbSB7djYuQWJzdHJhY3RWZWN0b3J9IHZlY3RvciDQktC10LrRgtC+0YAsINC90LAg0LrQvtGC0L7RgNGL0Lkg0L3QsNC00L4g0LTQtdC70LjRgtGMLlxuICogQGNoYWluYWJsZVxuICogQGV4YW1wbGVcbiAqIG5ldyBWZWN0b3IzRCggNCwgMiwgNiApLmRpdlZlY3RvciggbmV3IFZlY3RvcjNEKCAyLCAwLjUsIDQgKSApOyAvLyBWZWN0b3IzRCB7IHg6IDIsIHk6IDQsIHo6IDEuNSB9XG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kaXZWZWN0b3IgPSBmdW5jdGlvbiBkaXZWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICB0aGlzLnggLz0gdmVjdG9yLng7XG4gIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgdGhpcy56IC89IHZlY3Rvci56O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNkb3RWZWN0b3JcbiAqIEBwYXJhbSAge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqIEBleGFtcGxlXG4gKiBuZXcgVmVjdG9yM0QoIDQsIDIsIDYgKS5kb3RWZWN0b3IoIG5ldyBWZWN0b3IzRCggMiwgMywgLTIgKSApOyAvLyAtPiAyXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS5kb3RWZWN0b3IgPSBmdW5jdGlvbiBkb3RWZWN0b3IgKCB2ZWN0b3IgKVxue1xuICByZXR1cm4gdGhpcy5kb3QoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnogKTtcbn07XG5cbi8qKlxuICog0JjQvdGC0LXRgNC/0L7Qu9C40YDRg9C10YIgWCwgWSwg0LggWiDQutC+0L7RgNC00LjQvdCw0YLRiyDQvNC10LbQtNGDINC00YDRg9Cz0LjQvCDQstC10LrRgtC+0YDQvtC8LlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNsZXJwVmVjdG9yXG4gKiBAcGFyYW0ge3Y2LkFic3RyYWN0VmVjdG9yfSB2ZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgIHZhbHVlXG4gKiBAY2hhaW5hYmxlXG4gKiBAZXhhbXBsZVxuICogbmV3IFZlY3RvcjNEKCA0LCAyLCA2ICkubGVycFZlY3RvciggbmV3IFZlY3RvcjNEKCA4LCA0LCAxMiApLCAwLjUgKTsgLy8gVmVjdG9yM0QgeyB4OiA2LCB5OiAzLCB6OiA5IH1cbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmxlcnBWZWN0b3IgPSBmdW5jdGlvbiBsZXJwVmVjdG9yICggdmVjdG9yLCB2YWx1ZSApXG57XG4gIHJldHVybiB0aGlzLmxlcnAoIHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnosIHZhbHVlICk7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRCNtYWdTcVxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUubWFnU3EgPSBmdW5jdGlvbiBtYWdTcSAoKVxue1xuICByZXR1cm4gKCB0aGlzLnggKiB0aGlzLnggKSArICggdGhpcy55ICogdGhpcy55ICkgKyAoIHRoaXMueiAqIHRoaXMueiApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjY2xvbmVcbiAqL1xuVmVjdG9yM0QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUgKClcbntcbiAgcmV0dXJuIG5ldyBWZWN0b3IzRCggdGhpcy54LCB0aGlzLnksIHRoaXMueiApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuVmVjdG9yM0QjZGlzdFxuICovXG5WZWN0b3IzRC5wcm90b3R5cGUuZGlzdCA9IGZ1bmN0aW9uIGRpc3QgKCB2ZWN0b3IgKVxue1xuICB2YXIgeCA9IHZlY3Rvci54IC0gdGhpcy54O1xuICB2YXIgeSA9IHZlY3Rvci55IC0gdGhpcy55O1xuICB2YXIgeiA9IHZlY3Rvci56IC0gdGhpcy56O1xuICByZXR1cm4gTWF0aC5zcXJ0KCAoIHggKiB4ICkgKyAoIHkgKiB5ICkgKyAoIHogKiB6ICkgKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNEI3RvU3RyaW5nXG4gKi9cblZlY3RvcjNELnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpXG57XG4gIHJldHVybiAndjYuVmVjdG9yM0QgeyB4OiAnICsgdGhpcy54LnRvRml4ZWQoIDIgKSArICcsIHk6ICcgKyB0aGlzLnkudG9GaXhlZCggMiApICsgJywgejogJyArIHRoaXMuei50b0ZpeGVkKCAyICkgKyAnIH0nO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIHY2LlZlY3RvcjNELnJhbmRvbVxuICogQHNlZSB2Ni5BYnN0cmFjdFZlY3Rvci5yYW5kb21cbiAqL1xuVmVjdG9yM0QucmFuZG9tID0gZnVuY3Rpb24gcmFuZG9tICgpXG57XG4gIC8vIFVzZSB0aGUgZXF1YWwtYXJlYSBwcm9qZWN0aW9uIGFsZ29yaXRobS5cbiAgdmFyIHRoZXRhID0gTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyO1xuICB2YXIgeiAgICAgPSAoIE1hdGgucmFuZG9tKCkgKiAyICkgLSAxO1xuICB2YXIgbiAgICAgPSBNYXRoLnNxcnQoIDEgLSAoIHogKiB6ICkgKTtcbiAgcmV0dXJuIG5ldyBWZWN0b3IzRCggbiAqIE1hdGguY29zKCB0aGV0YSApLCBuICogTWF0aC5zaW4oIHRoZXRhICksIHogKTtcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5WZWN0b3IzRC5mcm9tQW5nbGVcbiAqIEBzZWUgdjYuQWJzdHJhY3RWZWN0b3IuZnJvbUFuZ2xlXG4gKi9cblZlY3RvcjNELmZyb21BbmdsZSA9IGZ1bmN0aW9uIGZyb21BbmdsZSAoIGFuZ2xlIClcbntcbiAgcmV0dXJuIEFic3RyYWN0VmVjdG9yLl9mcm9tQW5nbGUoIFZlY3RvcjNELCBhbmdsZSApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3IzRDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQrdGC0L4g0L/RgNC+0YHRgtGA0LDQvdGB0YLQstC+INC40LzQtdC9ICjRjdGC0L7RgiBuYW1lcHNwYWNlKSDRgNC10LDQu9C40LfRg9C10YIg0YDQsNCx0L7RgtGDINGBIDJEINC80LDRgtGA0LjRhtCw0LzQuCAzeDMuXG4gKiBAbmFtZXNwYWNlIHY2Lm1hdDNcbiAqIEBleGFtcGxlXG4gKiB2YXIgbWF0MyA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL21hdGgvbWF0MycgKTtcbiAqL1xuXG4vKipcbiAqINCh0L7Qt9C00LDQtdGCINGB0YLQsNC90LTQsNGA0YLQvdGD0Y4gKGlkZW50aXR5KSAzeDMg0LzQsNGC0YDQuNGG0YMuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuaWRlbnRpdHlcbiAqIEByZXR1cm4ge0FycmF5LjxudW1iZXI+fSDQndC+0LLQsNGPINC80LDRgtGA0LjRhtCwLlxuICogQGV4YW1wbGVcbiAqIC8vIFJldHVybnMgdGhlIGlkZW50aXR5LlxuICogdmFyIG1hdHJpeCA9IG1hdDMuaWRlbnRpdHkoKTtcbiAqL1xuZXhwb3J0cy5pZGVudGl0eSA9IGZ1bmN0aW9uIGlkZW50aXR5ICgpXG57XG4gIHJldHVybiBbXG4gICAgMSwgMCwgMCxcbiAgICAwLCAxLCAwLFxuICAgIDAsIDAsIDFcbiAgXTtcbn07XG5cbi8qKlxuICog0KHQsdGA0LDRgdGL0LLQsNC10YIg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAg0LTQviDRgdGC0LDQvdC00LDRgNGC0L3Ri9GFIChpZGVudGl0eSkg0LfQvdCw0YfQtdC90LjQuS5cbiAqIEBtZXRob2QgdjYubWF0My5zZXRJZGVudGl0eVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCc0LDRgtGA0LjRhtCwLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFNldHMgdGhlIGlkZW50aXR5LlxuICogbWF0My5zZXRJZGVudGl0eSggbWF0cml4ICk7XG4gKi9cbmV4cG9ydHMuc2V0SWRlbnRpdHkgPSBmdW5jdGlvbiBzZXRJZGVudGl0eSAoIG0xIClcbntcbiAgbTFbIDAgXSA9IDE7XG4gIG0xWyAxIF0gPSAwO1xuICBtMVsgMiBdID0gMDtcbiAgbTFbIDMgXSA9IDA7XG4gIG0xWyA0IF0gPSAxO1xuICBtMVsgNSBdID0gMDtcbiAgbTFbIDYgXSA9IDA7XG4gIG0xWyA3IF0gPSAwO1xuICBtMVsgOCBdID0gMTtcbn07XG5cbi8qKlxuICog0JrQvtC/0LjRgNGD0LXRgiDQt9C90LDRh9C10L3QuNGPINC80LDRgtGA0LjRhtGLIGBcIm0yXCJgINC90LAg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAuXG4gKiBAbWV0aG9kIHY2Lm1hdDMuY29weVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCc0LDRgtGA0LjRhtCwLCDQsiDQutC+0YLQvtGA0YPRjiDQvdCw0LTQviDQutC+0L/QuNGA0L7QstCw0YLRjC5cbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMiDQnNCw0YLRgNC40YbQsCwg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0YHQutC+0L/QuNGA0L7QstCw0YLRjC5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBDb3BpZXMgYSBtYXRyaXguXG4gKiBtYXQzLmNvcHkoIGRlc3RpbmF0aW9uTWF0cml4LCBzb3VyY2VNYXRyaXggKTtcbiAqL1xuZXhwb3J0cy5jb3B5ID0gZnVuY3Rpb24gY29weSAoIG0xLCBtMiApXG57XG4gIG0xWyAwIF0gPSBtMlsgMCBdO1xuICBtMVsgMSBdID0gbTJbIDEgXTtcbiAgbTFbIDIgXSA9IG0yWyAyIF07XG4gIG0xWyAzIF0gPSBtMlsgMyBdO1xuICBtMVsgNCBdID0gbTJbIDQgXTtcbiAgbTFbIDUgXSA9IG0yWyA1IF07XG4gIG0xWyA2IF0gPSBtMlsgNiBdO1xuICBtMVsgNyBdID0gbTJbIDcgXTtcbiAgbTFbIDggXSA9IG0yWyA4IF07XG59O1xuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC60LvQvtC9INC80LDRgtGA0LjRhtGLIGBcIm0xXCJgLlxuICogQG1ldGhvZCB2Ni5tYXQzLmNsb25lXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEg0JjRgdGF0L7QtNC90LDRjyDQvNCw0YLRgNC40YbQsC5cbiAqIEByZXR1cm4ge0FycmF5LjxudW1iZXI+fSAgICDQmtC70L7QvSDQvNCw0YLRgNC40YbRiy5cbiAqIEBleGFtcGxlXG4gKiAvLyBDcmVhdGVzIGEgY2xvbmUuXG4gKiB2YXIgY2xvbmUgPSBtYXQzLmNsb25lKCBtYXRyaXggKTtcbiAqL1xuZXhwb3J0cy5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lICggbTEgKVxue1xuICByZXR1cm4gW1xuICAgIG0xWyAwIF0sXG4gICAgbTFbIDEgXSxcbiAgICBtMVsgMiBdLFxuICAgIG0xWyAzIF0sXG4gICAgbTFbIDQgXSxcbiAgICBtMVsgNSBdLFxuICAgIG0xWyA2IF0sXG4gICAgbTFbIDcgXSxcbiAgICBtMVsgOCBdXG4gIF07XG59O1xuXG4vKipcbiAqINCf0LXRgNC10LzQtdGJ0LDQtdGCINC80LDRgtGA0LjRhtGDIGBcIm0xXCJgLlxuICogQG1ldGhvZCB2Ni5tYXQzLnRyYW5zbGF0ZVxuICogQHBhcmFtICB7QXJyYXkuPG51bWJlcj59IG0xINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIHggIFgg0L/QtdGA0LXQvNC10YnQtdC90LjRjy5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICB5ICBZINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8uXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gVHJhbnNsYXRlcyBieSBbIDQsIDIgXS5cbiAqIG1hdDMudHJhbnNsYXRlKCBtYXRyaXgsIDQsIDIgKTtcbiAqL1xuZXhwb3J0cy50cmFuc2xhdGUgPSBmdW5jdGlvbiB0cmFuc2xhdGUgKCBtMSwgeCwgeSApXG57XG4gIG0xWyA2IF0gPSAoIHggKiBtMVsgMCBdICkgKyAoIHkgKiBtMVsgMyBdICkgKyBtMVsgNiBdO1xuICBtMVsgNyBdID0gKCB4ICogbTFbIDEgXSApICsgKCB5ICogbTFbIDQgXSApICsgbTFbIDcgXTtcbiAgbTFbIDggXSA9ICggeCAqIG0xWyAyIF0gKSArICggeSAqIG0xWyA1IF0gKSArIG0xWyA4IF07XG59O1xuXG4vKipcbiAqINCf0L7QstC+0YDQsNGH0LjQstCw0LXRgiDQvNCw0YLRgNC40YbRgyBgXCJtMVwiYCDQvdCwIGBcImFuZ2xlXCJgINGA0LDQtNC40LDQvdC+0LIuXG4gKiBAbWV0aG9kIHY2Lm1hdDMucm90YXRlXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEgICAg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgYW5nbGUg0KPQs9C+0LsuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gUm90YXRlcyBieSA0NSBkZWdyZWVzLlxuICogbWF0My5yb3RhdGUoIG1hdHJpeCwgNDUgKiBNYXRoLlBJIC8gMTgwICk7XG4gKi9cbmV4cG9ydHMucm90YXRlID0gZnVuY3Rpb24gcm90YXRlICggbTEsIGFuZ2xlIClcbntcbiAgdmFyIG0xMCA9IG0xWyAwIF07XG4gIHZhciBtMTEgPSBtMVsgMSBdO1xuICB2YXIgbTEyID0gbTFbIDIgXTtcbiAgdmFyIG0xMyA9IG0xWyAzIF07XG4gIHZhciBtMTQgPSBtMVsgNCBdO1xuICB2YXIgbTE1ID0gbTFbIDUgXTtcbiAgdmFyIHggPSBNYXRoLmNvcyggYW5nbGUgKTtcbiAgdmFyIHkgPSBNYXRoLnNpbiggYW5nbGUgKTtcbiAgbTFbIDAgXSA9ICggeCAqIG0xMCApICsgKCB5ICogbTEzICk7XG4gIG0xWyAxIF0gPSAoIHggKiBtMTEgKSArICggeSAqIG0xNCApO1xuICBtMVsgMiBdID0gKCB4ICogbTEyICkgKyAoIHkgKiBtMTUgKTtcbiAgbTFbIDMgXSA9ICggeCAqIG0xMyApIC0gKCB5ICogbTEwICk7XG4gIG0xWyA0IF0gPSAoIHggKiBtMTQgKSAtICggeSAqIG0xMSApO1xuICBtMVsgNSBdID0gKCB4ICogbTE1ICkgLSAoIHkgKiBtMTIgKTtcbn07XG5cbi8qKlxuICog0JzQsNGB0YjRgtCw0LHQuNGA0YPQtdGCINC80LDRgtGA0LjRhtGDLlxuICogQG1ldGhvZCB2Ni5tYXQzLnNjYWxlXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgeCAgWC3RhNCw0LrRgtC+0YAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgeSAgWS3RhNCw0LrRgtC+0YAuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAg0J3QuNGH0LXQs9C+INC90LUg0LLQvtC30LLRgNCw0YnQsNC10YIuXG4gKiBAZXhhbXBsZVxuICogLy8gU2NhbGVzIGluIFsgMiwgMiBdIHRpbWVzLlxuICogbWF0My5zY2FsZSggbWF0cml4LCAyLCAyICk7XG4gKi9cbmV4cG9ydHMuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZSAoIG0xLCB4LCB5IClcbntcbiAgbTFbIDAgXSAqPSB4O1xuICBtMVsgMSBdICo9IHg7XG4gIG0xWyAyIF0gKj0geDtcbiAgbTFbIDMgXSAqPSB5O1xuICBtMVsgNCBdICo9IHk7XG4gIG0xWyA1IF0gKj0geTtcbn07XG5cbi8qKlxuICog0J/RgNC40LzQtdC90Y/QtdGCINC80LDRgtGA0LjRhtGDINC40Lcg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQuNGFINC/0LDRgNCw0LzQtdGC0YDQvtCyINC90LAg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAuXG4gKiBAbWV0aG9kIHY2Lm1hdDMudHJhbnNmb3JtXG4gKiBAcGFyYW0gIHtBcnJheS48bnVtYmVyPn0gbTEgINCc0LDRgtGA0LjRhtCwLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0xMSBYINC80LDRgdGI0YLQsNCxIChzY2FsZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTEyIFgg0L3QsNC60LvQvtC9IChza2V3KS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMjEgWSDQvdCw0LrQu9C+0L0gKHNrZXcpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0yMiBZINC80LDRgdGI0YLQsNCxIChzY2FsZSkuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgZHggIFgg0L/QtdGA0LXQvNC10YnQtdC90LjRjyAodHJhbnNsYXRlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBkeSAgWSDQv9C10YDQtdC80LXRidC10L3QuNGPICh0cmFuc2xhdGUpLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiAvLyBBcHBsaWVzIGEgZG91YmxlLXNjYWxlZCBtYXRyaXguXG4gKiBtYXQzLnRyYW5zZm9ybSggbWF0cml4LCAyLCAwLCAwLCAyLCAwLCAwICk7XG4gKi9cbmV4cG9ydHMudHJhbnNmb3JtID0gZnVuY3Rpb24gdHJhbnNmb3JtICggbTEsIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbntcbiAgbTFbIDAgXSAqPSBtMTE7XG4gIG0xWyAxIF0gKj0gbTIxO1xuICBtMVsgMiBdICo9IGR4O1xuICBtMVsgMyBdICo9IG0xMjtcbiAgbTFbIDQgXSAqPSBtMjI7XG4gIG0xWyA1IF0gKj0gZHk7XG4gIG0xWyA2IF0gPSAwO1xuICBtMVsgNyBdID0gMDtcbn07XG5cbi8qKlxuICog0KHQsdGA0LDRgdGL0LLQsNC10YIg0LzQsNGC0YDQuNGG0YMgYFwibTFcImAg0LTQviDQvNCw0YLRgNC40YbRiyDQuNC3INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7Qsi5cbiAqIEBtZXRob2QgdjYubWF0My5zZXRUcmFuc2Zvcm1cbiAqIEBwYXJhbSAge0FycmF5LjxudW1iZXI+fSBtMSAg0JzQsNGC0YDQuNGG0LAuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTExIFgg0LzQsNGB0YjRgtCw0LEgKHNjYWxlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBtMTIgWCDQvdCw0LrQu9C+0L0gKHNrZXcpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIG0yMSBZINC90LDQutC70L7QvSAoc2tldykuXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgbTIyIFkg0LzQsNGB0YjRgtCw0LEgKHNjYWxlKS5cbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICBkeCAgWCDQv9C10YDQtdC80LXRidC10L3QuNGPICh0cmFuc2xhdGUpLlxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgIGR5ICBZINC/0LXRgNC10LzQtdGJ0LXQvdC40Y8gKHRyYW5zbGF0ZSkuXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICogQGV4YW1wbGVcbiAqIC8vIFNldHMgdGhlIGlkZW50aXR5IGFuZCB0aGVuIGFwcGxpZXMgYSBkb3VibGUtc2NhbGVkIG1hdHJpeC5cbiAqIG1hdDMuc2V0VHJhbnNmb3JtKCBtYXRyaXgsIDIsIDAsIDAsIDIsIDAsIDAgKTtcbiAqL1xuZXhwb3J0cy5zZXRUcmFuc2Zvcm0gPSBmdW5jdGlvbiBzZXRUcmFuc2Zvcm0gKCBtMSwgbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxue1xuICAvLyBYIHNjYWxlXG4gIG0xWyAwIF0gPSBtMTE7XG4gIC8vIFggc2tld1xuICBtMVsgMSBdID0gbTEyO1xuICAvLyBZIHNrZXdcbiAgbTFbIDMgXSA9IG0yMTtcbiAgLy8gWSBzY2FsZVxuICBtMVsgNCBdID0gbTIyO1xuICAvLyBYIHRyYW5zbGF0ZVxuICBtMVsgNiBdID0gZHg7XG4gIC8vIFkgdHJhbnNsYXRlXG4gIG0xWyA3IF0gPSBkeTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZ2V0RWxlbWVudFcgPSByZXF1aXJlKCAncGVha28vZ2V0LWVsZW1lbnQtdycgKTtcbnZhciBnZXRFbGVtZW50SCA9IHJlcXVpcmUoICdwZWFrby9nZXQtZWxlbWVudC1oJyApO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG52YXIgY3JlYXRlUG9seWdvbiA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9jcmVhdGVfcG9seWdvbicgKTtcbnZhciBwb2x5Z29ucyA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9wb2x5Z29ucycgKTtcbnZhciBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvc2V0X2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncycgKTtcbnZhciBnZXRXZWJHTCA9IHJlcXVpcmUoICcuL2ludGVybmFsL2dldF93ZWJnbCcgKTtcbnZhciBjb3B5RHJhd2luZ1NldHRpbmdzID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvY29weV9kcmF3aW5nX3NldHRpbmdzJyApO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSggJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJyApLnByb2Nlc3NSZWN0QWxpZ25ZO1xudmFyIHByb2Nlc3NTaGFwZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3Nfc2hhcGUnICk7XG52YXIgY2xvc2VTaGFwZSA9IHJlcXVpcmUoICcuL2ludGVybmFsL2Nsb3NlX3NoYXBlJyApO1xudmFyIG9wdGlvbnMgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKTtcbi8qKlxuICog0JDQsdGB0YLRgNCw0LrRgtC90YvQuSDQutC70LDRgdGBINGA0LXQvdC00LXRgNC10YDQsC5cbiAqIEBhYnN0cmFjdFxuICogQGNvbnN0cnVjdG9yIHY2LkFic3RyYWN0UmVuZGVyZXJcbiAqIEBzZWUgdjYuUmVuZGVyZXJHTFxuICogQHNlZSB2Ni5SZW5kZXJlcjJEXG4gKiBAZXhhbXBsZVxuICogdmFyIEFic3RyYWN0UmVuZGVyZXIgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9BYnN0cmFjdFJlbmRlcmVyJyApO1xuICovXG5mdW5jdGlvbiBBYnN0cmFjdFJlbmRlcmVyICgpXG57XG4gIHRocm93IEVycm9yKCAnQ2Fubm90IGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgYWJzdHJhY3QgY2xhc3MgKG5ldyB2Ni5BYnN0cmFjdFJlbmRlcmVyKScgKTtcbn1cbkFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAvKipcbiAgICog0JTQvtCx0LDQstC70Y/QtdGCIGBjYW52YXNgINGA0LXQvdC00LXRgNC10YDQsCDQsiBET00uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNhcHBlbmRUb1xuICAgKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCDQrdC70LXQvNC10L3Rgiwg0LIg0LrQvtGC0L7RgNGL0LkgYGNhbnZhc2Ag0YDQtdC90LTQtdGA0LXRgNCwINC00L7Qu9C20LXQvSDQsdGL0YLRjCDQtNC+0LHQsNCy0LvQtdC9LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFkZCByZW5kZXJlciBpbnRvIERPTS5cbiAgICogcmVuZGVyZXIuYXBwZW5kVG8oIGRvY3VtZW50LmJvZHkgKTtcbiAgICovXG4gIGFwcGVuZFRvOiBmdW5jdGlvbiBhcHBlbmRUbyAoIHBhcmVudCApXG4gIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoIHRoaXMuY2FudmFzICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQo9C00LDQu9GP0LXRgiBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LjQtyBET00uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkZXN0cm95XG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVtb3ZlIHJlbmRlcmVyIGZyb20gRE9NLlxuICAgKiByZW5kZXJlci5kZXN0cm95KCk7XG4gICAqL1xuICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95ICgpXG4gIHtcbiAgICB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKCB0aGlzLmNhbnZhcyApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KHQvtGF0YDQsNC90Y/QtdGCINGC0LXQutGD0YnQuNC1INC90LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3B1c2hcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTYXZlIGRyYXdpbmcgc2V0dGluZ3MgKGZpbGwsIGxpbmVXaWR0aC4uLikgKHB1c2ggb250byBzdGFjaykuXG4gICAqIHJlbmRlcmVyLnB1c2goKTtcbiAgICovXG4gIHB1c2g6IGZ1bmN0aW9uIHB1c2ggKClcbiAge1xuICAgIGlmICggdGhpcy5fc3RhY2tbICsrdGhpcy5fc3RhY2tJbmRleCBdICkge1xuICAgICAgY29weURyYXdpbmdTZXR0aW5ncyggdGhpcy5fc3RhY2tbIHRoaXMuX3N0YWNrSW5kZXggXSwgdGhpcyApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdGFjay5wdXNoKCBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzKCB7fSwgdGhpcyApICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JLQvtGB0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINC/0YDQtdC00YvQtNGD0YnQuNC1INC90LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQuNC90LPQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvcFxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlc3RvcmUgZHJhd2luZyBzZXR0aW5ncyAoZmlsbCwgbGluZVdpZHRoLi4uKSAodGFrZSBmcm9tIHN0YWNrKS5cbiAgICogcmVuZGVyZXIucG9wKCk7XG4gICAqL1xuICBwb3A6IGZ1bmN0aW9uIHBvcCAoKVxuICB7XG4gICAgaWYgKCB0aGlzLl9zdGFja0luZGV4ID49IDAgKSB7XG4gICAgICBjb3B5RHJhd2luZ1NldHRpbmdzKCB0aGlzLCB0aGlzLl9zdGFja1sgdGhpcy5fc3RhY2tJbmRleC0tIF0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyggdGhpcywgdGhpcyApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCY0LfQvNC10L3Rj9C10YIg0YDQsNC30LzQtdGAINGA0LXQvdC00LXRgNC10YDQsC5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3Jlc2l6ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gdyDQndC+0LLQsNGPINGI0LjRgNC40L3QsC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGgg0J3QvtCy0LDRjyDQstGL0YHQvtGC0LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzaXplIHJlbmRlcmVyIHRvIDYwMHg0MDAuXG4gICAqIHJlbmRlcmVyLnJlc2l6ZSggNjAwLCA0MDAgKTtcbiAgICovXG4gIHJlc2l6ZTogZnVuY3Rpb24gcmVzaXplICggdywgaCApXG4gIHtcbiAgICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXM7XG4gICAgdmFyIHNjYWxlID0gdGhpcy5zZXR0aW5ncy5zY2FsZTtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gaCArICdweCc7XG4gICAgY2FudmFzLndpZHRoID0gdGhpcy53ID0gTWF0aC5mbG9vciggdyAqIHNjYWxlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbXVsdGktYXNzaWduXG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMuaCA9IE1hdGguZmxvb3IoIGggKiBzY2FsZSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JjQt9C80LXQvdGP0LXRgiDRgNCw0LfQvNC10YAg0YDQtdC90LTQtdGA0LXRgNCwINC00L4g0YDQsNC30LzQtdGA0LAgYGVsZW1lbnRgINGN0LvQtdC80LXQvdGC0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZXNpemVUb1xuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQg0K3Qu9C10LzQtdC90YIsINC00L4g0LrQvtGC0L7RgNC+0LPQviDQvdCw0LTQviDRgNCw0YHRgtGP0L3Rg9GC0Ywg0YDQtdC90LTQtdGA0LXRgC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXNpemUgcmVuZGVyZXIgdG8gbWF0Y2ggPGJvZHkgLz4gc2l6ZXMuXG4gICAqIHJlbmRlcmVyLnJlc2l6ZVRvKCBkb2N1bWVudC5ib2R5ICk7XG4gICAqL1xuICByZXNpemVUbzogZnVuY3Rpb24gcmVzaXplVG8gKCBlbGVtZW50IClcbiAge1xuICAgIHJldHVybiB0aGlzLnJlc2l6ZSggZ2V0RWxlbWVudFcoIGVsZW1lbnQgKSwgZ2V0RWxlbWVudEgoIGVsZW1lbnQgKSApO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC/0L7Qu9C40LPQvtC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZHJhd1BvbHlnb25cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB4ICAgICAgICAgICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB5ICAgICAgICAgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICBzaWRlcyAgICAgICAgINCa0L7Qu9C40YfQtdGB0YLQstC+INGB0YLQvtGA0L7QvSDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgIHhSYWRpdXMgICAgICAgWCDRgNCw0LTQuNGD0YEg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICB5UmFkaXVzICAgICAgIFkg0YDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgcm90YXRpb25BbmdsZSDQo9Cz0L7QuyDQv9C+0LLQvtGA0L7RgtCwINC/0L7Qu9C40LPQvtC90LBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjRh9GC0L7QsdGLINC90LUg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMIHtAbGluayB2Ni5UcmFuc2Zvcm0jcm90YXRlfSkuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgZGVncmVlcyAgICAgICDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNCw0LTRg9GB0YsuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyBoZXhhZ29uIGF0IFsgNCwgMiBdIHdpdGggcmFkaXVzIDI1LlxuICAgKiByZW5kZXJlci5wb2x5Z29uKCA0LCAyLCA2LCAyNSwgMjUsIDAgKTtcbiAgICovXG4gIGRyYXdQb2x5Z29uOiBmdW5jdGlvbiBkcmF3UG9seWdvbiAoIHgsIHksIHNpZGVzLCB4UmFkaXVzLCB5UmFkaXVzLCByb3RhdGlvbkFuZ2xlLCBkZWdyZWVzIClcbiAge1xuICAgIHZhciBwb2x5Z29uID0gcG9seWdvbnNbIHNpZGVzIF07XG4gICAgaWYgKCAhIHBvbHlnb24gKSB7XG4gICAgICBwb2x5Z29uID0gcG9seWdvbnNbIHNpZGVzIF0gPSBjcmVhdGVQb2x5Z29uKCBzaWRlcyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW11bHRpLWFzc2lnblxuICAgIH1cbiAgICBpZiAoIGRlZ3JlZXMgKSB7XG4gICAgICByb3RhdGlvbkFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuICAgIHRoaXMubWF0cml4LnNhdmUoKTtcbiAgICB0aGlzLm1hdHJpeC50cmFuc2xhdGUoIHgsIHkgKTtcbiAgICB0aGlzLm1hdHJpeC5yb3RhdGUoIHJvdGF0aW9uQW5nbGUgKTtcbiAgICB0aGlzLmRyYXdBcnJheXMoIHBvbHlnb24sIHBvbHlnb24ubGVuZ3RoICogMC41LCB2b2lkIDAsIHhSYWRpdXMsIHlSYWRpdXMgKTtcbiAgICB0aGlzLm1hdHJpeC5yZXN0b3JlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0L/QvtC70LjQs9C+0L0uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNwb2x5Z29uXG4gICAqIEBwYXJhbSAge251bWJlcn0geCAgICAgICAgICAgICAgIFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSB5ICAgICAgICAgICAgICAgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9C+0LvQuNCz0L7QvdCwLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IHNpZGVzICAgICAgICAgICDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0L7RgNC+0L0g0L/QvtC70LjQs9C+0L3QsC5cbiAgICogQHBhcmFtICB7bnVtYmVyfSByICAgICAgICAgICAgICAg0KDQsNC00LjRg9GBINC/0L7Qu9C40LPQvtC90LAuXG4gICAqIEBwYXJhbSAge251bWJlcn0gW3JvdGF0aW9uQW5nbGVdINCj0LPQvtC7INC/0L7QstC+0YDQvtGC0LAg0L/QvtC70LjQs9C+0L3QsC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKNGH0YLQvtCx0Ysg0L3QtSDQuNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywge0BsaW5rIHY2LlRyYW5zZm9ybSNyb3RhdGV9KS5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IGhleGFnb24gYXQgWyA0LCAyIF0gd2l0aCByYWRpdXMgMjUuXG4gICAqIHJlbmRlcmVyLnBvbHlnb24oIDQsIDIsIDYsIDI1ICk7XG4gICAqL1xuICBwb2x5Z29uOiBmdW5jdGlvbiBwb2x5Z29uICggeCwgeSwgc2lkZXMsIHIsIHJvdGF0aW9uQW5nbGUgKVxuICB7XG4gICAgaWYgKCBzaWRlcyAlIDEgKSB7XG4gICAgICBzaWRlcyA9IE1hdGguZmxvb3IoIHNpZGVzICogMTAwICkgKiAwLjAxO1xuICAgIH1cbiAgICBpZiAoIHR5cGVvZiByb3RhdGlvbkFuZ2xlID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgIHRoaXMuZHJhd1BvbHlnb24oIHgsIHksIHNpZGVzLCByLCByLCAtTWF0aC5QSSAqIDAuNSApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdQb2x5Z29uKCB4LCB5LCBzaWRlcywgciwgciwgcm90YXRpb25BbmdsZSwgb3B0aW9ucy5kZWdyZWVzICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNpbWFnZVxuICAgKiBAcGFyYW0ge3Y2LkFic3RyYWN0SW1hZ2V9IGltYWdlINCa0LDRgNGC0LjQvdC60LAg0LrQvtGC0L7RgNGD0Y4g0L3QsNC00L4g0L7RgtGA0LjRgdC+0LLQsNGC0YwuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgeCAgICAgWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHkgICAgIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBbd10gICDQqNC40YDQuNC90LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICBbaF0gICDQktGL0YHQvtGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBDcmVhdGUgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IG5ldyBJbWFnZSggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdpbWFnZScgKSApO1xuICAgKiAvLyBEcmF3IGltYWdlIGF0IFsgNCwgMiBdLlxuICAgKiByZW5kZXJlci5pbWFnZSggaW1hZ2UsIDQsIDIgKTtcbiAgICovXG4gIGltYWdlOiBmdW5jdGlvbiBpbWFnZSAoIGltYWdlLCB4LCB5LCB3LCBoIClcbiAge1xuICAgIGlmICggaW1hZ2UuZ2V0KCkubG9hZGVkICkge1xuICAgICAgaWYgKCB0eXBlb2YgdyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgIHcgPSBpbWFnZS5kdztcbiAgICAgIH1cbiAgICAgIGlmICggdHlwZW9mIGggPT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICBoID0gaW1hZ2UuZGg7XG4gICAgICB9XG4gICAgICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgICAgIHggPSBwcm9jZXNzUmVjdEFsaWduWSggdGhpcywgeSwgaCApO1xuICAgICAgdGhpcy5kcmF3SW1hZ2UoIGltYWdlLCB4LCB5LCB3LCBoICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQtNC70Y8g0L3QsNGH0LDQu9CwINC+0YLRgNC40YHQvtCy0LrQuCDRhNC40LPRg9GA0YsuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSAgIFtvcHRpb25zXSAgICAgICAgICAgICAg0J/QsNGA0LDQvNC10YLRgNGLINGE0LjQs9GD0YDRiy5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW29wdGlvbnMuZHJhd0Z1bmN0aW9uXSDQpNGD0L3QutGG0LjRjywg0LrQvtGC0L7RgNC+0Y8g0LHRg9C00LXRgiDQvtGC0YDQuNGB0L7QstGL0LLQsNGC0Ywg0LLRgdC1INCy0LXRgNGI0LjQvdGLINCyIHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyLmVuZFNoYXBlfS4g0JzQvtC20LXRgiDQsdGL0YLRjCDQv9C10YDQtdC30LDQv9C40YHQsNC90LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVxdWlyZSBcInY2LnNoYXBlc1wiIChcInY2LmpzXCIgYnVpbHQtaW4gZHJhd2luZyBmdW5jdGlvbnMpLlxuICAgKiB2YXIgc2hhcGVzID0gcmVxdWlyZSggJ3Y2LmpzL3JlbmRlcmVyL3NoYXBlcy9wb2ludHMnICk7XG4gICAqIC8vIEJlZ2luIGRyYXdpbmcgcG9pbnRzIHNoYXBlLlxuICAgKiByZW5kZXJlci5iZWdpblNoYXBlKCB7IGRyYXdGdW5jdGlvbjogc2hhcGVzLmRyYXdQb2ludHMgfSApO1xuICAgKiAvLyBCZWdpbiBkcmF3aW5nIHNoYXBlIHdpdGhvdXQgZHJhd2luZyBmdW5jdGlvbiAobXVzdCBiZSBwYXNzZWQgbGF0ZXIgaW4gYGVuZFNoYXBlYCkuXG4gICAqIHJlbmRlcmVyLmJlZ2luU2hhcGUoKTtcbiAgICovXG4gIGJlZ2luU2hhcGU6IGZ1bmN0aW9uIGJlZ2luU2hhcGUgKCBvcHRpb25zIClcbiAge1xuICAgIGlmICggISBvcHRpb25zICkge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICB0aGlzLl92ZXJ0aWNlcy5sZW5ndGggPSAwO1xuICAgIHRoaXMuX2Nsb3NlZFNoYXBlID0gbnVsbDtcbiAgICBpZiAoIHR5cGVvZiBvcHRpb25zLmRyYXdGdW5jdGlvbiA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICB0aGlzLl9kcmF3RnVuY3Rpb24gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kcmF3RnVuY3Rpb24gPSBvcHRpb25zLmRyYXdGdW5jdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQodC+0LfQtNCw0LXRgiDQstC10YDRiNC40L3RgyDQsiDQutC+0L7RgNC00LjQvdCw0YLQsNGFINC40Lcg0YHQvtC+0YLQstC10YLRgdCy0YPRjtGJ0LjRhSDQv9Cw0YDQsNC80LXRgtGA0L7Qsi5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAcGFyYW0ge251bWJlcn0geCBYINC60L7QvtGA0LTQuNC90LDRgtCwINC90L7QstC+0Lkg0LLQtdGA0YjQuNC90YsuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0L3QvtCy0L7QuSDQstC10YDRiNC40L3Riy5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRHJhdyByZWN0YW5nbGUgd2l0aCB2ZXJ0aWNlcy5cbiAgICogcmVuZGVyZXIudmVydGV4KCAwLCAwICk7XG4gICAqIHJlbmRlcmVyLnZlcnRleCggMSwgMCApO1xuICAgKiByZW5kZXJlci52ZXJ0ZXgoIDEsIDEgKTtcbiAgICogcmVuZGVyZXIudmVydGV4KCAwLCAxICk7XG4gICAqL1xuICB2ZXJ0ZXg6IGZ1bmN0aW9uIHZlcnRleCAoIHgsIHkgKVxuICB7XG4gICAgdGhpcy5fdmVydGljZXMucHVzaCggTWF0aC5mbG9vciggeCApLCBNYXRoLmZsb29yKCB5ICkgKTtcbiAgICB0aGlzLl9jbG9zZWRTaGFwZSA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0YTQuNCz0YPRgNGDINC40Lcg0LLQtdGA0YjQuNC9LlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICogQHBhcmFtIHtvYmplY3R9ICAgW29wdGlvbnNdICAgICAgICAgICAgICDQn9Cw0YDQsNC80LXRgtGA0Ysg0YTQuNCz0YPRgNGLLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5jbG9zZV0gICAgICAgINCh0L7QtdC00LjQvdC40YLRjCDQv9C+0YHQu9C10LTQvdGO0Y4g0LLQtdGA0YjQuNC90YMg0YEg0L/QtdGA0LLQvtC5ICjQt9Cw0LrRgNGL0YLRjCDRhNC40LPRg9GA0YMpLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbb3B0aW9ucy5kcmF3RnVuY3Rpb25dINCk0YPQvdC60YbQuNGPLCDQutC+0YLQvtGA0L7RjyDQsdGD0LTQtdGCINC+0YLRgNC40YHQvtCy0YvQstCw0YLRjCDQstGB0LUg0LLQtdGA0YjQuNC90YsuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0JjQvNC10LXRgiDQsdC+0LvRjNGI0LjQuSDQv9GA0LjQvtGA0LjRgtC10YIg0YfQtdC8INCyIHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGV9LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFJlcXVpcmUgXCJ2Ni5zaGFwZXNcIiAoXCJ2Ni5qc1wiIGJ1aWx0LWluIGRyYXdpbmcgZnVuY3Rpb25zKS5cbiAgICogdmFyIHNoYXBlcyA9IHJlcXVpcmUoICd2Ni5qcy9yZW5kZXJlci9zaGFwZXMvcG9pbnRzJyApO1xuICAgKiAvLyBDbG9zZSBhbmQgZHJhdyBhIHNoYXBlLlxuICAgKiByZW5kZXJlci5lbmRTaGFwZSggeyBjbG9zZTogdHJ1ZSB9ICk7XG4gICAqIC8vIERyYXcgd2l0aCBhIGN1c3RvbSBmdW5jdGlvbi5cbiAgICogcmVuZGVyZXIuZW5kU2hhcGUoIHsgZHJhd0Z1bmN0aW9uOiBzaGFwZXMuZHJhd0xpbmVzIH0gKTtcbiAgICovXG4gIGVuZFNoYXBlOiBmdW5jdGlvbiBlbmRTaGFwZSAoIG9wdGlvbnMgKVxuICB7XG4gICAgdmFyIGRyYXdGdW5jdGlvbiwgdmVydGljZXM7XG4gICAgaWYgKCAhIG9wdGlvbnMgKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIGlmICggISAoIGRyYXdGdW5jdGlvbiA9IG9wdGlvbnMuZHJhd0Z1bmN0aW9uIHx8IHRoaXMuX2RyYXdGdW5jdGlvbiApICkge1xuICAgICAgdGhyb3cgRXJyb3IoICdObyBcImRyYXdGdW5jdGlvblwiIHNwZWNpZmllZCBmb3IgXCJyZW5kZXJlci5lbmRTaGFwZVwiJyApO1xuICAgIH1cbiAgICBpZiAoIG9wdGlvbnMuY2xvc2UgKSB7XG4gICAgICBjbG9zZVNoYXBlKCB0aGlzICk7XG4gICAgICB2ZXJ0aWNlcyA9IHRoaXMuX2Nsb3NlZFNoYXBlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ZXJ0aWNlcyA9IHRoaXMuX3ZlcnRpY2VzO1xuICAgIH1cbiAgICBkcmF3RnVuY3Rpb24oIHRoaXMsIHByb2Nlc3NTaGFwZSggdGhpcywgdmVydGljZXMgKSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3NhdmVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNzYXZlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNhdmUgdHJhbnNmb3JtLlxuICAgKiByZW5kZXJlci5zYXZlKCk7XG4gICAqL1xuICBzYXZlOiBmdW5jdGlvbiBzYXZlICgpXG4gIHtcbiAgICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVzdG9yZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3Jlc3RvcmVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUmVzdG9yZSB0cmFuc2Zvcm0uXG4gICAqIHJlbmRlcmVyLnJlc3RvcmUoKTtcbiAgICovXG4gIHJlc3RvcmU6IGZ1bmN0aW9uIHJlc3RvcmUgKClcbiAge1xuICAgIHRoaXMubWF0cml4LnJlc3RvcmUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzZXRUcmFuc2Zvcm1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSNzZXRUcmFuc2Zvcm1cbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IGlkZW50aXR5IHRyYW5zZm9ybS5cbiAgICogcmVuZGVyZXIuc2V0VHJhbnNmb3JtKCAxLCAwLCAwLCAxLCAwLCAwICk7XG4gICAqL1xuICBzZXRUcmFuc2Zvcm06IGZ1bmN0aW9uIHNldFRyYW5zZm9ybSAoIG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5IClcbiAge1xuICAgIHRoaXMubWF0cml4LnNldFRyYW5zZm9ybSggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN0cmFuc2xhdGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSN0cmFuc2xhdGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gVHJhbnNsYXRlIHRyYW5zZm9ybSB0byBbIDQsIDIgXS5cbiAgICogcmVuZGVyZXIudHJhbnNsYXRlKCA0LCAyICk7XG4gICAqL1xuICB0cmFuc2xhdGU6IGZ1bmN0aW9uIHRyYW5zbGF0ZSAoIHgsIHkgKVxuICB7XG4gICAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKCB4LCB5ICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcm90YXRlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQHNlZSB2Ni5UcmFuc2Zvcm0jcm90YXRlXG4gICAqIEB0b2RvIHJlbmRlcmVyLnNldHRpbmdzLmRlZ3JlZXNcbiAgICogQGV4YW1wbGVcbiAgICogLy8gUm90YXRlIHRyYW5zZm9ybSBvbiA0NSBkZWdyZWVzLlxuICAgKiByZW5kZXJlci5yb3RhdGUoIDQ1ICogTWF0aC5QSSAvIDE4MCApO1xuICAgKi9cbiAgcm90YXRlOiBmdW5jdGlvbiByb3RhdGUgKCBhbmdsZSApXG4gIHtcbiAgICBpZiAoIHRoaXMuc2V0dGluZ3MuZGVncmVlcyApIHtcbiAgICAgIGFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgfVxuICAgIHRoaXMubWF0cml4LnJvdGF0ZSggYW5nbGUgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzY2FsZVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBzZWUgdjYuVHJhbnNmb3JtI3NjYWxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNjYWxlIHRyYW5zZm9ybSB0d2ljZS5cbiAgICogcmVuZGVyZXIuc2NhbGUoIDIsIDIgKTtcbiAgICovXG4gIHNjYWxlOiBmdW5jdGlvbiBzY2FsZSAoIHgsIHkgKVxuICB7XG4gICAgdGhpcy5tYXRyaXguc2NhbGUoIHgsIHkgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciN0cmFuc2Zvcm1cbiAgICogQGNoYWluYWJsZVxuICAgKiBAc2VlIHY2LlRyYW5zZm9ybSN0cmFuc2Zvcm1cbiAgICogQGV4YW1wbGVcbiAgICogLy8gQXBwbHkgdHJhbnNsYXRlZCB0byBbIDQsIDIgXSBcInRyYW5zZm9ybWF0aW9uIG1hdHJpeFwiLlxuICAgKiByZW5kZXJlci50cmFuc2Zvcm0oIDEsIDAsIDAsIDEsIDQsIDIgKTtcbiAgICovXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gdHJhbnNmb3JtICggbTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkgKVxuICB7XG4gICAgdGhpcy5tYXRyaXgudHJhbnNmb3JtKCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSApO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgbGluZVdpZHRoICjRiNC40YDQuNC90YMg0LrQvtC90YLRg9GA0LApLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbGluZVdpZHRoXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIg0J3QvtCy0YvQuSBsaW5lV2lkdGguXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IGBsaW5lV2lkdGhgIHRvIDEwcHguXG4gICAqIHJlbmRlcmVyLmxpbmVXaWR0aCggMTAgKTtcbiAgICovXG4gIGxpbmVXaWR0aDogZnVuY3Rpb24gbGluZVdpZHRoICggbnVtYmVyIClcbiAge1xuICAgIHRoaXMuX2xpbmVXaWR0aCA9IG51bWJlcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGBiYWNrZ3JvdW5kUG9zaXRpb25YYCDQvdCw0YHRgtGA0L7QudC60YMg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNiYWNrZ3JvdW5kUG9zaXRpb25YXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIHZhbHVlXG4gICAqIEBwYXJhbSB7Y29uc3RhbnR9IHR5cGVcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBTZXQgXCJiYWNrZ3JvdW5kUG9zaXRpb25YXCIgZHJhd2luZyBzZXR0aW5nIHRvIENFTlRFUiAoZGVmYXVsdDogTEVGVCkuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblgoIGNvbnN0YW50cy5nZXQoICdDRU5URVInICksIGNvbnN0YW50cy5nZXQoICdDT05TVEFOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25YKCAwLjUsIGNvbnN0YW50cy5nZXQoICdQRVJDRU5UJyApICk7XG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblgoIHJlbmRlcmVyLncgLyAyICk7XG4gICAqL1xuICBiYWNrZ3JvdW5kUG9zaXRpb25YOiBmdW5jdGlvbiBiYWNrZ3JvdW5kUG9zaXRpb25YICggdmFsdWUsIHR5cGUgKSB7IGlmICggdHlwZW9mIHR5cGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdWQUxVRScgKSApIHsgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKSB7IHR5cGUgPSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKTsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJMRUZUXCIgKSApIHsgdmFsdWUgPSAwOyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJDRU5URVJcIiApICkgeyB2YWx1ZSA9IDAuNTsgfSBlbHNlIGlmICggdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoIFwiUklHSFRcIiApICkgeyB2YWx1ZSA9IDE7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gdmFsdWUuIFRoZSBrbm93biBhcmU6ICcgKyBcIkxFRlRcIiArICcsICcgKyBcIkNFTlRFUlwiICsgJywgJyArIFwiUklHSFRcIiApOyB9IH0gaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApIHsgdmFsdWUgKj0gdGhpcy53OyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGB2YWx1ZWAgdHlwZS4gVGhlIGtub3duIGFyZTogVkFMVUUsIFBFUkNFTlQsIENPTlNUQU5UJyApOyB9IH0gdGhpcy5fYmFja2dyb3VuZFBvc2l0aW9uWCA9IHZhbHVlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgYmFja2dyb3VuZFBvc2l0aW9uWWAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZFBvc2l0aW9uWVxuICAgKiBAcGFyYW0ge251bWJlcn0gICB2YWx1ZVxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB0eXBlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwiYmFja2dyb3VuZFBvc2l0aW9uWVwiIGRyYXdpbmcgc2V0dGluZyB0byBNSURETEUgKGRlZmF1bHQ6IFRPUCkuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblkoIGNvbnN0YW50cy5nZXQoICdNSURETEUnICksIGNvbnN0YW50cy5nZXQoICdDT05TVEFOVCcgKSApO1xuICAgKiByZW5kZXJlci5iYWNrZ3JvdW5kUG9zaXRpb25ZKCAwLjUsIGNvbnN0YW50cy5nZXQoICdQRVJDRU5UJyApICk7XG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRQb3NpdGlvblkoIHJlbmRlcmVyLmggLyAyICk7XG4gICAqL1xuICBiYWNrZ3JvdW5kUG9zaXRpb25ZOiBmdW5jdGlvbiBiYWNrZ3JvdW5kUG9zaXRpb25ZICggdmFsdWUsIHR5cGUgKSB7IGlmICggdHlwZW9mIHR5cGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoICdWQUxVRScgKSApIHsgaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnQ09OU1RBTlQnICkgKSB7IHR5cGUgPSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKTsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJUT1BcIiApICkgeyB2YWx1ZSA9IDA7IH0gZWxzZSBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCBcIk1JRERMRVwiICkgKSB7IHZhbHVlID0gMC41OyB9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggXCJCT1RUT01cIiApICkgeyB2YWx1ZSA9IDE7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gdmFsdWUuIFRoZSBrbm93biBhcmU6ICcgKyBcIlRPUFwiICsgJywgJyArIFwiTUlERExFXCIgKyAnLCAnICsgXCJCT1RUT01cIiApOyB9IH0gaWYgKCB0eXBlID09PSBjb25zdGFudHMuZ2V0KCAnUEVSQ0VOVCcgKSApIHsgdmFsdWUgKj0gdGhpcy5oOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGB2YWx1ZWAgdHlwZS4gVGhlIGtub3duIGFyZTogVkFMVUUsIFBFUkNFTlQsIENPTlNUQU5UJyApOyB9IH0gdGhpcy5fYmFja2dyb3VuZFBvc2l0aW9uWSA9IHZhbHVlOyByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiBgcmVjdEFsaWduWGAg0L3QsNGB0YLRgNC+0LnQutGDINGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdEFsaWduWFxuICAgKiBAcGFyYW0ge2NvbnN0YW50fSB2YWx1ZSBgTEVGVGAsIGBDRU5URVJgLCBgUklHSFRgLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFNldCBcInJlY3RBbGlnblhcIiBkcmF3aW5nIHNldHRpbmcgdG8gQ0VOVEVSIChkZWZhdWx0OiBMRUZUKS5cbiAgICogcmVuZGVyZXIucmVjdEFsaWduWCggY29uc3RhbnRzLmdldCggJ0NFTlRFUicgKSApO1xuICAgKi9cbiAgcmVjdEFsaWduWDogZnVuY3Rpb24gcmVjdEFsaWduWCAoIHZhbHVlICkgeyBpZiAoIHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSB8fCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0NFTlRFUicgKSB8fCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ1JJR0hUJyApICkgeyB0aGlzLl9yZWN0QWxpZ25YID0gdmFsdWU7IH0gZWxzZSB7IHRocm93IEVycm9yKCAnR290IHVua25vd24gYHJlY3RBbGlnbmAgY29uc3RhbnQuIFRoZSBrbm93biBhcmU6ICcgKyBcIkxFRlRcIiArICcsICcgKyBcIkNFTlRFUlwiICsgJywgJyArIFwiUklHSFRcIiApOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCIGByZWN0QWxpZ25ZYCDQvdCw0YHRgtGA0L7QudC60YMg0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNyZWN0QWxpZ25ZXG4gICAqIEBwYXJhbSB7Y29uc3RhbnR9IHZhbHVlIGBUT1BgLCBgTUlERExFYCwgYEJPVFRPTWAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gU2V0IFwicmVjdEFsaWduWVwiIGRyYXdpbmcgc2V0dGluZyB0byBNSURETEUgKGRlZmF1bHQ6IFRPUCkuXG4gICAqIHJlbmRlcmVyLnJlY3RBbGlnblkoIGNvbnN0YW50cy5nZXQoICdNSURETEUnICkgKTtcbiAgICovXG4gIHJlY3RBbGlnblk6IGZ1bmN0aW9uIHJlY3RBbGlnblkgKCB2YWx1ZSApIHsgaWYgKCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCggJ0xFRlQnICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdDRU5URVInICkgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoICdSSUdIVCcgKSApIHsgdGhpcy5fcmVjdEFsaWduWSA9IHZhbHVlOyB9IGVsc2UgeyB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIGByZWN0QWxpZ25gIGNvbnN0YW50LiBUaGUga25vd24gYXJlOiAnICsgXCJUT1BcIiArICcsICcgKyBcIk1JRERMRVwiICsgJywgJyArIFwiQk9UVE9NXCIgKTsgfSByZXR1cm4gdGhpczsgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBicmFjZS1ydWxlcy9icmFjZS1vbi1zYW1lLWxpbmUsIG5vLXVzZWxlc3MtY29uY2F0LCBxdW90ZXMsIG1heC1zdGF0ZW1lbnRzLXBlci1saW5lLCBtYXgtbGVuXG4gIC8qKlxuICAgKiDQo9GB0YLQsNC90LDQstC70LjQstCw0LXRgiDRhtCy0LXRgiBgc3Ryb2tlYCDQv9GA0Lgg0YDQuNGB0L7QstCw0L3QuNC4INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdH0g0Lgg0YIu0L8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNzdHJva2VcbiAgICogQHBhcmFtIHtudW1iZXJ8Ym9vbGVhbnxUQ29sb3J9IFtyXSDQldGB0LvQuCDRjdGC0L4gYGJvb2xlYW5gLCDRgtC+INGN0YLQviDQstC60LvRjtGH0LjRgiDQuNC70Lgg0LLRi9C60LvRjtGH0LjRgiBgc3Ryb2tlYFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICjQutCw0Log0YfQtdGA0LXQtyB7QGxpbmsgdjYuQWJzdHJhY3RSZW5kZXJlciNub1N0cm9rZX0pLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2ddXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYl1cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgYW5kIHRoZW4gZW5hYmxlIGBzdHJva2VgLlxuICAgKiByZW5kZXJlci5zdHJva2UoIGZhbHNlICkuc3Ryb2tlKCB0cnVlICk7XG4gICAqIC8vIFNldCBgc3Ryb2tlYCB0byBcImxpZ2h0c2t5Ymx1ZVwiLlxuICAgKiByZW5kZXJlci5zdHJva2UoICdsaWdodHNreWJsdWUnICk7XG4gICAqIC8vIFNldCBgc3Ryb2tlYCBmcm9tIGB2Ni5SR0JBYC5cbiAgICogcmVuZGVyZXIuc3Ryb2tlKCBuZXcgUkdCQSggMjU1LCAwLCAwICkucGVyY2VpdmVkQnJpZ2h0bmVzcygpICk7XG4gICAqL1xuICBzdHJva2U6IGZ1bmN0aW9uIHN0cm9rZSAoIHIsIGcsIGIsIGEgKSB7IGlmICggdHlwZW9mIHIgPT09ICdib29sZWFuJyApIHsgdGhpcy5fZG9TdHJva2UgPSByOyB9IGVsc2UgeyBpZiAoIHR5cGVvZiByID09PSAnc3RyaW5nJyB8fCB0aGlzLl9zdHJva2VDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUgKSB7IHRoaXMuX3N0cm9rZUNvbG9yID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKTsgfSBlbHNlIHsgdGhpcy5fc3Ryb2tlQ29sb3Iuc2V0KCByLCBnLCBiLCBhICk7IH0gdGhpcy5fZG9TdHJva2UgPSB0cnVlOyB9IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdGCINGG0LLQtdGCIGBmaWxsYCDQv9GA0Lgg0YDQuNGB0L7QstCw0L3QuNC4INGH0LXRgNC10Lcge0BsaW5rIHY2LkFic3RyYWN0UmVuZGVyZXIjcmVjdH0g0Lgg0YIu0L8uXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNmaWxsXG4gICAqIEBwYXJhbSB7bnVtYmVyfGJvb2xlYW58VENvbG9yfSBbcl0g0JXRgdC70Lgg0Y3RgtC+IGBib29sZWFuYCwg0YLQviDRjdGC0L4g0LLQutC70Y7Rh9C40YIg0LjQu9C4INCy0YvQutC70Y7Rh9C40YIgYGZpbGxgXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKNC60LDQuiDRh9C10YDQtdC3IHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyI25vRmlsbH0pLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICAgW2ddXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgICBbYl1cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgICAgIFthXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERpc2FibGUgYW5kIHRoZW4gZW5hYmxlIGBmaWxsYC5cbiAgICogcmVuZGVyZXIuZmlsbCggZmFsc2UgKS5maWxsKCB0cnVlICk7XG4gICAqIC8vIFNldCBgZmlsbGAgdG8gXCJsaWdodHBpbmtcIi5cbiAgICogcmVuZGVyZXIuZmlsbCggJ2xpZ2h0cGluaycgKTtcbiAgICogLy8gU2V0IGBmaWxsYCBmcm9tIGB2Ni5SR0JBYC5cbiAgICogcmVuZGVyZXIuZmlsbCggbmV3IFJHQkEoIDI1NSwgMCwgMCApLmJyaWdodG5lc3MoKSApO1xuICAgKi9cbiAgZmlsbDogZnVuY3Rpb24gZmlsbCAoIHIsIGcsIGIsIGEgKSB7IGlmICggdHlwZW9mIHIgPT09ICdib29sZWFuJyApIHsgdGhpcy5fZG9GaWxsID0gcjsgfSBlbHNlIHsgaWYgKCB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdGhpcy5fZmlsbENvbG9yLnR5cGUgIT09IHRoaXMuc2V0dGluZ3MuY29sb3IudHlwZSApIHsgdGhpcy5fZmlsbENvbG9yID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKTsgfSBlbHNlIHsgdGhpcy5fZmlsbENvbG9yLnNldCggciwgZywgYiwgYSApOyB9IHRoaXMuX2RvRmlsbCA9IHRydWU7IH0gcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0JLRi9C60LvRjtGH0LDQtdGCINGA0LjRgdC+0LLQsNC90LjQtSDQutC+0L3RgtGD0YDQsCAoc3Ryb2tlKS5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI25vU3Ryb2tlXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRGlzYWJsZSBkcmF3aW5nIHN0cm9rZS5cbiAgICogcmVuZGVyZXIubm9TdHJva2UoKTtcbiAgICovXG4gIG5vU3Ryb2tlOiBmdW5jdGlvbiBub1N0cm9rZSAoKSB7IHRoaXMuX2RvU3Ryb2tlID0gZmFsc2U7IHJldHVybiB0aGlzOyB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiAgLyoqXG4gICAqINCS0YvQutC70Y7Rh9Cw0LXRgiDQt9Cw0L/QvtC70L3QtdC90LjRjyDRhNC+0L3QsCAoZmlsbCkuXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNub0ZpbGxcbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEaXNhYmxlIGZpbGxpbmcuXG4gICAqIHJlbmRlcmVyLm5vRmlsbCgpO1xuICAgKi9cbiAgbm9GaWxsOiBmdW5jdGlvbiBub0ZpbGwgKCkgeyB0aGlzLl9kb0ZpbGwgPSBmYWxzZTsgcmV0dXJuIHRoaXM7IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuICAvKipcbiAgICog0JfQsNC/0L7Qu9C90Y/QtdGCINGE0L7QvSDRgNC10L3QtNC10YDQtdGA0LAg0YbQstC10YLQvtC8LlxuICAgKiBAdmlydHVhbFxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjYmFja2dyb3VuZENvbG9yXG4gICAqIEBwYXJhbSB7bnVtYmVyfFRDb2xvcn0gW3JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2ddXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2JdXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW2FdXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gRmlsbCByZW5kZXJlciB3aXRoIFwibGlnaHRwaW5rXCIgY29sb3IuXG4gICAqIHJlbmRlcmVyLmJhY2tncm91bmRDb2xvciggJ2xpZ2h0cGluaycgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQl9Cw0L/QvtC70L3Rj9C10YIg0YTQvtC9INGA0LXQvdC00LXRgNC10YDQsCDQutCw0YDRgtC40L3QutC+0LkuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNiYWNrZ3JvdW5kSW1hZ2VcbiAgICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZSDQmtCw0YDRgtC40L3QutCwLCDQutC+0YLQvtGA0LDRjyDQtNC+0LvQttC90LAg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGM0YHRjyDQtNC70Y8g0YTQvtC90LAuXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQ3JlYXRlIGJhY2tncm91bmQgaW1hZ2UuXG4gICAqIHZhciBpbWFnZSA9IEltYWdlLmZyb21VUkwoICdiYWNrZ3JvdW5kLmpwZycgKTtcbiAgICogLy8gRmlsbCByZW5kZXJlciB3aXRoIHRoZSBpbWFnZS5cbiAgICogcmVuZGVyZXIuYmFja2dyb3VuZEltYWdlKCBJbWFnZS5zdHJldGNoKCBpbWFnZSwgcmVuZGVyZXIudywgcmVuZGVyZXIuaCApICk7XG4gICAqL1xuICAvKipcbiAgICog0J7Rh9C40YnQsNC10YIg0LrQvtC90YLQtdC60YHRgi5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2NsZWFyXG4gICAqIEBjaGFpbmFibGVcbiAgICogQGV4YW1wbGVcbiAgICogLy8gQ2xlYXIgcmVuZGVyZXIncyBjb250ZXh0LlxuICAgKiByZW5kZXJlci5jbGVhcigpO1xuICAgKi9cbiAgLyoqXG4gICAqINCe0YLRgNC40YHQvtCy0YvQstCw0LXRgiDQv9C10YDQtdC00LDQvdC90YvQtSDQstC10YDRiNC40L3Riy5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI2RyYXdBcnJheXNcbiAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl8QXJyYXl9IHZlcnRzINCS0LXRgNGI0LjQvdGLLCDQutC+0YLQvtGA0YvQtSDQvdCw0LTQviDQvtGC0YDQuNGB0L7QstCw0YLRjC4g0JXRgdC70Lgg0L3QtSDQv9C10YDQtdC00LDQvdC+INC00LvRj1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge0BsaW5rIHY2LlJlbmRlcmVyR0x9LCDRgtC+INCx0YPQtNGD0YIg0LjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGM0YHRjyDQstC10YDRiNC40L3RiyDQuNC3XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDRgdGC0LDQvdC00LDRgNGC0L3QvtCz0L4g0LHRg9GE0LXRgNCwICh7QGxpbmsgdjYuUmVuZGVyZXJHTCNidWZmZXJzLmRlZmF1bHR9KS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICAgIGNvdW50INCa0L7Qu9C40YfQtdGB0YLQstC+INCy0LXRgNGI0LjQvSwg0L3QsNC/0YDQuNC80LXRgDogMyDQtNC70Y8g0YLRgNC10YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEEgdHJpYW5nbGUuXG4gICAqIHZhciB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoIFtcbiAgICogICAwLCAgMCxcbiAgICogICA1MCwgNTAsXG4gICAqICAgMCwgIDUwXG4gICAqIF0gKTtcbiAgICpcbiAgICogLy8gRHJhdyB0aGUgdHJpYW5nbGUuXG4gICAqIHJlbmRlcmVyLmRyYXdBcnJheXMoIHZlcnRpY2VzLCAzICk7XG4gICAqL1xuICAvKipcbiAgICog0KDQuNGB0YPQtdGCINC60LDRgNGC0LjQvdC60YMuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNkcmF3SW1hZ2VcbiAgICogQHBhcmFtIHt2Ni5BYnN0cmFjdEltYWdlfSBpbWFnZSDQmtCw0YDRgtC40L3QutCwINC60L7RgtC+0YDRg9GOINC90LDQtNC+INC+0YLRgNC40YHQvtCy0LDRgtGMLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIHggICAgIFwiRGVzdGluYXRpb24gWFwiLiBYINC60L7QvtGA0LTQuNC90LDRgtCwINC60LDRgNGC0LjQvdC60LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgeSAgICAgXCJEZXN0aW5hdGlvbiBZXCIuIFkg0LrQvtC+0YDQtNC40L3QsNGC0LAg0LrQsNGA0YLQuNC90LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICAgICB3ICAgICBcIkRlc3RpbmF0aW9uIFdpZHRoXCIuINCo0LjRgNC40L3QsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIGggICAgIFwiRGVzdGluYXRpb24gSGVpZ2h0XCIuINCS0YvRgdC+0YLQsCDQutCw0YDRgtC40L3QutC4LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIENyZWF0ZSBpbWFnZS5cbiAgICogdmFyIGltYWdlID0gSW1hZ2UuZnJvbVVSTCggJzMwMHgyMDAucG5nJyApO1xuICAgKiAvLyBEcmF3IGltYWdlIGF0IFsgMCwgMCBdLlxuICAgKiByZW5kZXJlci5kcmF3SW1hZ2UoIGltYWdlLCAwLCAwLCA2MDAsIDQwMCApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQui5cbiAgICogQHZpcnR1YWxcbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3JlY3RcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0geSBZINC60L7QvtGA0LTQuNC90LDRgtCwINC/0YDRj9C80L7Rg9Cz0L7Qu9GM0L3QuNC60LAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB3INCo0LjRgNC40L3QsCDQv9GA0Y/QvNC+0YPQs9C+0LvRjNC90LjQutCwLlxuICAgKiBAcGFyYW0ge251bWJlcn0gaCDQktGL0YHQvtGC0LAg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsC5cbiAgICogQGNoYWluYWJsZVxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBEcmF3IHNxdWFyZSBhdCBbIDIwLCAyMCBdIHdpdGggc2l6ZSA4MC5cbiAgICogcmVuZGVyZXIucmVjdCggMjAsIDIwLCA4MCwgODAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0LrRgNGD0LMuXG4gICAqIEB2aXJ0dWFsXG4gICAqIEBtZXRob2QgdjYuQWJzdHJhY3RSZW5kZXJlciNhcmNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggWCDQutC+0L7RgNC00LjQvdCw0YLQsCDQutGA0YPQs9CwLlxuICAgKiBAcGFyYW0ge251bWJlcn0geSBZINC60L7QvtGA0LTQuNC90LDRgtCwINC60YDRg9Cz0LAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByINCg0LDQtNC40YPRgSDQutGA0YPQs9CwLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgY2lyY2xlIGF0IFsgNjAsIDYwIF0gd2l0aCByYWRpdXMgNDAuXG4gICAqIHJlbmRlcmVyLmFyYyggNjAsIDYwLCA0MCApO1xuICAgKi9cbiAgLyoqXG4gICAqINCg0LjRgdGD0LXRgiDQu9C40L3QuNGOLlxuICAgKiBAbWV0aG9kIHY2LkFic3RyYWN0UmVuZGVyZXIjbGluZVxuICAgKiBAcGFyYW0ge251bWJlcn0geDEgWCDQvdCw0YfQsNC70LAg0LvQuNC90LjQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkxIFkg0L3QsNGH0LDQu9CwINC70LjQvdC40LguXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4MiBYINC60L7QvdGG0Ysg0LvQuNC90LjQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkyIFkg0LrQvtC90YbRiyDQu9C40L3QuNC4LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgbGluZSBmcm9tIFsgMTAsIDEwIF0gdG8gWyAyMCwgMjAgXS5cbiAgICogcmVuZGVyZXIubGluZSggMTAsIDEwLCAyMCwgMjAgKTtcbiAgICovXG4gIC8qKlxuICAgKiDQoNC40YHRg9C10YIg0YLQvtGH0LrRgy5cbiAgICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvaW50XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFgg0LrQvtC+0YDQtNC40L3QsNGC0LAg0YLQvtGH0LrQuC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgWSDQutC+0L7RgNC00LjQvdCw0YLQsCDRgtC+0YfQutC4LlxuICAgKiBAY2hhaW5hYmxlXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIERyYXcgcG9pbnQgYXQgWyA0LCAyIF0uXG4gICAqIHJlbmRlcmVyLnBvaW50KCA0LCAyICk7XG4gICAqL1xuICBjb25zdHJ1Y3RvcjogQWJzdHJhY3RSZW5kZXJlclxufTtcbi8qKlxuICogSW5pdGlhbGl6ZSByZW5kZXJlciBvbiBgXCJzZWxmXCJgLlxuICogQG1ldGhvZCB2Ni5BYnN0cmFjdFJlbmRlcmVyLmNyZWF0ZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gc2VsZiAgICBSZW5kZXJlciB0aGF0IHNob3VsZCBiZSBpbml0aWFsaXplZC5cbiAqIEBwYXJhbSAge29iamVjdH0gICAgICAgICAgICAgIG9wdGlvbnMge0BsaW5rIHY2LnNldHRpbmdzLnJlbmRlcmVyfVxuICogQHBhcmFtICB7Y29uc3RhbnR9ICAgICAgICAgICAgdHlwZSAgICBUeXBlIG9mIHJlbmRlcmVyOiBgMkRgIG9yIGBHTGAuIENhbm5vdCBiZSBgQVVUT2AhLlxuICogQHJldHVybiB7dm9pZH0gICAgICAgICAgICAgICAgICAgICAgICBSZXR1cm5zIG5vdGhpbmcuXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DdXN0b20gUmVuZGVyZXI8L2NhcHRpb24+XG4gKiB2YXIgQWJzdHJhY3RSZW5kZXJlciA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXInICk7XG4gKiB2YXIgc2V0dGluZ3MgICAgICAgICA9IHJlcXVpcmUoICd2Ni5qcy9jb3JlL3JlbmRlcmVyL3NldHRpbmdzJyApO1xuICogdmFyIGNvbnN0YW50cyAgICAgICAgPSByZXF1aXJlKCAndjYuanMvY29yZS9jb25zdGFudHMnICk7XG4gKlxuICogZnVuY3Rpb24gQ3VzdG9tUmVuZGVyZXIgKCBvcHRpb25zIClcbiAqIHtcbiAqICAgLy8gSW5pdGlhbGl6ZSBDdXN0b21SZW5kZXJlci5cbiAqICAgQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUoIHRoaXMsIGRlZmF1bHRzKCBzZXR0aW5ncywgb3B0aW9ucyApLCBjb25zdGFudHMuZ2V0KCAnMkQnICkgKTtcbiAqIH1cbiAqL1xuQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUgKCBzZWxmLCBvcHRpb25zLCB0eXBlIClcbntcbiAgdmFyIGNvbnRleHQ7XG4gIC8qKlxuICAgKiBgY2FudmFzYCDRgNC10L3QtNC10YDQtdGA0LAg0LTQu9GPINC+0YLRgNC40YHQvtCy0LrQuCDQvdCwINGN0LrRgNCw0L3QtS5cbiAgICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9IHY2LkFic3RyYWN0UmVuZGVyZXIjY2FudmFzXG4gICAqL1xuICBpZiAoIG9wdGlvbnMuY2FudmFzICkge1xuICAgIHNlbGYuY2FudmFzID0gb3B0aW9ucy5jYW52YXM7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuICAgIHNlbGYuY2FudmFzLmlubmVySFRNTCA9ICdVbmFibGUgdG8gcnVuIHRoaXMgYXBwbGljYXRpb24uJztcbiAgfVxuICBpZiAoIHR5cGUgPT09IGNvbnN0YW50cy5nZXQoICcyRCcgKSApIHtcbiAgICBjb250ZXh0ID0gJzJkJztcbiAgfSBlbHNlIGlmICggdHlwZSAhPT0gY29uc3RhbnRzLmdldCggJ0dMJyApICkge1xuICAgIHRocm93IEVycm9yKCAnR290IHVua25vd24gcmVuZGVyZXIgdHlwZS4gVGhlIGtub3duIGFyZTogMkQgYW5kIEdMJyApO1xuICB9IGVsc2UgaWYgKCAhICggY29udGV4dCA9IGdldFdlYkdMKCkgKSApIHtcbiAgICB0aHJvdyBFcnJvciggJ0Nhbm5vdCBnZXQgV2ViR0wgY29udGV4dC4gVHJ5IHRvIHVzZSAyRCBhcyB0aGUgcmVuZGVyZXIgdHlwZSBvciB2Ni5SZW5kZXJlcjJEIGluc3RlYWQgb2YgdjYuUmVuZGVyZXJHTCcgKTtcbiAgfVxuICAvKipcbiAgICog0JrQvtC90YLQtdC60YHRgiDRhdC+0LvRgdGC0LAuXG4gICAqIEBtZW1iZXIge29iamVjdH0gdjYuQWJzdHJhY3RSZW5kZXJlciNjb250ZXh0XG4gICAqL1xuICBzZWxmLmNvbnRleHQgPSBzZWxmLmNhbnZhcy5nZXRDb250ZXh0KCBjb250ZXh0LCB7XG4gICAgYWxwaGE6IG9wdGlvbnMuYWxwaGFcbiAgfSApO1xuICAvKipcbiAgICog0J3QsNGB0YLRgNC+0LnQutC4INGA0LXQvdC00LXRgNC10YDQsC5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3NldHRpbmdzXG4gICAqIEBzZWUgdjYuc2V0dGluZ3MucmVuZGVyZXIuc2V0dGluZ3NcbiAgICovXG4gIHNlbGYuc2V0dGluZ3MgPSBvcHRpb25zLnNldHRpbmdzO1xuICAvKipcbiAgICog0KLQuNC/INGA0LXQvdC00LXRgNC10YDQsDogR0wsIDJELlxuICAgKiBAbWVtYmVyIHtjb25zdGFudH0gdjYuQWJzdHJhY3RSZW5kZXJlciN0eXBlXG4gICAqL1xuICBzZWxmLnR5cGUgPSB0eXBlO1xuICAvKipcbiAgICog0KHRgtGN0Log0YHQvtGF0YDQsNC90LXQvdC90YvRhSDQvdCw0YHRgtGA0L7QtdC6INGA0LXQvdC00LXRgNC40L3Qs9CwLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWVtYmVyIHtBcnJheS48b2JqZWN0Pn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfc3RhY2tcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3B1c2hcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3BvcFxuICAgKi9cbiAgc2VsZi5fc3RhY2sgPSBbXTtcbiAgLyoqXG4gICAqINCf0L7Qt9C40YbQuNGPINC/0L7RgdC70LXQtNC90LjRhSDRgdC+0YXRgNCw0L3QtdC90L3Ri9GFINC90LDRgdGC0YDQvtC10Log0YDQtdC90LTQtdGA0LjQvdCz0LAuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge251bWJlcn0gdjYuQWJzdHJhY3RSZW5kZXJlciNfc3RhY2tJbmRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjcHVzaFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjcG9wXG4gICAqL1xuICBzZWxmLl9zdGFja0luZGV4ID0gLTE7XG4gIC8qKlxuICAgKiDQktC10YDRiNC40L3RiyDRhNC40LPRg9GA0YsuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge0FycmF5LjxudW1iZXI+fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI192ZXJ0aWNlc1xuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjdmVydGV4XG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNlbmRTaGFwZVxuICAgKi9cbiAgc2VsZi5fdmVydGljZXMgPSBbXTtcbiAgLyoqXG4gICAqINCX0LDQutGA0YvRgtCw0Y8g0YTQuNCz0YPRgNCwICjQstC10YDRiNC40L3QsCkuXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXIge0FycmF5LjxudW1iZXI+fSB2Ni5BYnN0cmFjdFJlbmRlcmVyI19kcmF3RnVuY3Rpb25cbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI2JlZ2luU2hhcGVcbiAgICogQHNlZSB2Ni5BYnN0cmFjdFJlbmRlcmVyI3ZlcnRleFxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAgICovXG4gIHNlbGYuX2Nsb3NlZFNoYXBlID0gbnVsbDtcbiAgLyoqXG4gICAqINCk0YPQvdC60YbQuNGPLCDQutC+0YLQvtGA0L7RjyDQsdGD0LTQtdGCINC+0YLRgNC40YHQvtCy0YvQstCw0YLRjCDQstC10YDRiNC40L3Riy5cbiAgICogQHByaXZhdGVcbiAgICogQG1lbWJlciB7ZnVuY3Rpb259IHY2LkFic3RyYWN0UmVuZGVyZXIjX2RyYXdGdW5jdGlvblxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjYmVnaW5TaGFwZVxuICAgKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjdmVydGV4XG4gICAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNlbmRTaGFwZVxuICAgKi9cbiAgc2VsZi5fZHJhd0Z1bmN0aW9uID0gbnVsbDtcbiAgaWYgKCB0eXBlb2Ygb3B0aW9ucy5hcHBlbmRUbyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgc2VsZi5hcHBlbmRUbyggZG9jdW1lbnQuYm9keSApO1xuICB9IGVsc2UgaWYgKCBvcHRpb25zLmFwcGVuZFRvICE9PSBudWxsICkge1xuICAgIHNlbGYuYXBwZW5kVG8oIG9wdGlvbnMuYXBwZW5kVG8gKTtcbiAgfVxuICBpZiAoICd3JyBpbiBvcHRpb25zIHx8ICdoJyBpbiBvcHRpb25zICkge1xuICAgIHNlbGYucmVzaXplKCBvcHRpb25zLncgfHwgMCwgb3B0aW9ucy5oIHx8IDAgKTtcbiAgfSBlbHNlIGlmICggb3B0aW9ucy5hcHBlbmRUbyAhPT0gbnVsbCApIHtcbiAgICBzZWxmLnJlc2l6ZVRvKCBvcHRpb25zLmFwcGVuZFRvIHx8IGRvY3VtZW50LmJvZHkgKTtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLnJlc2l6ZSggNjAwLCA0MDAgKTtcbiAgfVxuICBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzKCBzZWxmLCBzZWxmICk7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdFJlbmRlcmVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVmYXVsdHMgICAgICAgICAgPSByZXF1aXJlKCAncGVha28vZGVmYXVsdHMnICk7XG5cbnZhciBjb25zdGFudHMgICAgICAgICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICk7XG5cbnZhciBwcm9jZXNzUmVjdEFsaWduWCA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWDtcbnZhciBwcm9jZXNzUmVjdEFsaWduWSA9IHJlcXVpcmUoICcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicgKS5wcm9jZXNzUmVjdEFsaWduWTtcblxudmFyIEFic3RyYWN0UmVuZGVyZXIgID0gcmVxdWlyZSggJy4vQWJzdHJhY3RSZW5kZXJlcicgKTtcbnZhciBzZXR0aW5ncyAgICAgICAgICA9IHJlcXVpcmUoICcuL3NldHRpbmdzJyApO1xuXG4vKipcbiAqIDJEINGA0LXQvdC00LXRgNC10YAuXG4gKiBAY29uc3RydWN0b3IgdjYuUmVuZGVyZXIyRFxuICogQGV4dGVuZHMgdjYuQWJzdHJhY3RSZW5kZXJlclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMge0BsaW5rIHY2LnNldHRpbmdzLnJlbmRlcmVyfVxuICogQGV4YW1wbGVcbiAqIC8vIFJlcXVpcmUgUmVuZGVyZXIyRC5cbiAqIHZhciBSZW5kZXJlcjJEID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXIyRCcgKTtcbiAqIC8vIENyZWF0ZSBhbiBSZW5kZXJlcjJEIGlzbnRhbmNlLlxuICogdmFyIHJlbmRlcmVyID0gbmV3IFJlbmRlcmVyMkQoKTtcbiAqL1xuZnVuY3Rpb24gUmVuZGVyZXIyRCAoIG9wdGlvbnMgKVxue1xuICBBYnN0cmFjdFJlbmRlcmVyLmNyZWF0ZSggdGhpcywgKCBvcHRpb25zID0gZGVmYXVsdHMoIHNldHRpbmdzLCBvcHRpb25zICkgKSwgY29uc3RhbnRzLmdldCggJzJEJyApICk7XG5cbiAgLyoqXG4gICAqIEBtZW1iZXIgdjYuUmVuZGVyZXIyRCNtYXRyaXhcbiAgICogQGFsaWFzIHY2LlJlbmRlcmVyMkQjY29udGV4dFxuICAgKi9cbiAgdGhpcy5tYXRyaXggPSB0aGlzLmNvbnRleHQ7XG59XG5cblJlbmRlcmVyMkQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3RSZW5kZXJlci5wcm90b3R5cGUgKTtcblJlbmRlcmVyMkQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmVuZGVyZXIyRDtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNiYWNrZ3JvdW5kQ29sb3JcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYmFja2dyb3VuZENvbG9yID0gZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yICggciwgZywgYiwgYSApXG57XG4gIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3M7XG4gIHZhciBjb250ZXh0ICA9IHRoaXMuY29udGV4dDtcblxuICBjb250ZXh0LnNhdmUoKTtcbiAgY29udGV4dC5maWxsU3R5bGUgPSBuZXcgc2V0dGluZ3MuY29sb3IoIHIsIGcsIGIsIGEgKTtcbiAgY29udGV4dC5zZXRUcmFuc2Zvcm0oIDEsIDAsIDAsIDEsIDAsIDAgKTtcbiAgY29udGV4dC5maWxsUmVjdCggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgY29udGV4dC5yZXN0b3JlKCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2JhY2tncm91bmRJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5iYWNrZ3JvdW5kSW1hZ2UgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kSW1hZ2UgKCBpbWFnZSApXG57XG4gIHZhciBfcmVjdEFsaWduWCA9IHRoaXMuX3JlY3RBbGlnblg7XG4gIHZhciBfcmVjdEFsaWduWSA9IHRoaXMuX3JlY3RBbGlnblk7XG5cbiAgdGhpcy5fcmVjdEFsaWduWCA9IGNvbnN0YW50cy5nZXQoICdDRU5URVInICk7XG4gIHRoaXMuX3JlY3RBbGlnblkgPSBjb25zdGFudHMuZ2V0KCAnTUlERExFJyApO1xuXG4gIHRoaXMuaW1hZ2UoIGltYWdlLCB0aGlzLncgKiAwLjUsIHRoaXMuaCAqIDAuNSApO1xuXG4gIHRoaXMuX3JlY3RBbGlnblggPSBfcmVjdEFsaWduWDtcbiAgdGhpcy5fcmVjdEFsaWduWSA9IF9yZWN0QWxpZ25ZO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNjbGVhclxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuY29udGV4dC5jbGVhciggMCwgMCwgdGhpcy53LCB0aGlzLmggKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdBcnJheXNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXMgKCB2ZXJ0cywgY291bnQsIF9tb2RlLCBfc3gsIF9zeSApXG57XG4gIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICB2YXIgaTtcblxuICBpZiAoIGNvdW50IDwgMiApIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICggdHlwZW9mIF9zeCA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgX3N4ID0gX3N5ID0gMTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tdWx0aS1hc3NpZ25cbiAgfVxuXG4gIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gIGNvbnRleHQubW92ZVRvKCB2ZXJ0c1sgMCBdICogX3N4LCB2ZXJ0c1sgMSBdICogX3N5ICk7XG5cbiAgZm9yICggaSA9IDIsIGNvdW50ICo9IDI7IGkgPCBjb3VudDsgaSArPSAyICkge1xuICAgIGNvbnRleHQubGluZVRvKCB2ZXJ0c1sgaSBdICogX3N4LCB2ZXJ0c1sgaSArIDEgXSAqIF9zeSApO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5fZmlsbCgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwICkge1xuICAgIHRoaXMuX3N0cm9rZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlcjJEI2RyYXdJbWFnZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5kcmF3SW1hZ2UgPSBmdW5jdGlvbiBkcmF3SW1hZ2UgKCBpbWFnZSwgeCwgeSwgdywgaCApXG57XG4gIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoIGltYWdlLmdldCgpLmltYWdlLCBpbWFnZS5zeCwgaW1hZ2Uuc3ksIGltYWdlLnN3LCBpbWFnZS5zaCwgeCwgeSwgdywgaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjcmVjdFxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gcmVjdCAoIHgsIHksIHcsIGggKVxue1xuICB4ID0gcHJvY2Vzc1JlY3RBbGlnblgoIHRoaXMsIHgsIHcgKTtcbiAgeSA9IHByb2Nlc3NSZWN0QWxpZ25ZKCB0aGlzLCB5LCBoICk7XG5cbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICB0aGlzLmNvbnRleHQucmVjdCggeCwgeSwgdywgaCApO1xuXG4gIGlmICggdGhpcy5fZG9GaWxsICkge1xuICAgIHRoaXMuX2ZpbGwoKTtcbiAgfVxuXG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLl9zdHJva2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXIyRCNhcmNcbiAqL1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYXJjID0gZnVuY3Rpb24gYXJjICggeCwgeSwgciApXG57XG4gIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgdGhpcy5jb250ZXh0LmFyYyggeCwgeSwgciwgMCwgTWF0aC5QSSAqIDIgKTtcblxuICBpZiAoIHRoaXMuX2RvRmlsbCApIHtcbiAgICB0aGlzLl9maWxsKCk7XG4gIH1cblxuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5fc3Ryb2tlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyMkQjbGluZVxuICovXG5SZW5kZXJlcjJELnByb3RvdHlwZS5saW5lID0gZnVuY3Rpb24gbGluZSAoIHgxLCB5MSwgeDIsIHkyIClcbntcbiAgdGhpcy5jb250ZXh0Lm1vdmVUbyggeDEsIHkxICk7XG4gIHRoaXMuY29udGV4dC5saW5lVG8oIHgyLCB5MiApO1xuXG4gIGlmICggdGhpcy5fZG9TdHJva2UgJiYgdGhpcy5fbGluZVdpZHRoID4gMCApIHtcbiAgICB0aGlzLl9zdHJva2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuUmVuZGVyZXIyRC5wcm90b3R5cGUuX2ZpbGwgPSBmdW5jdGlvbiBfZmlsbCAoKVxue1xuICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5fZmlsbENvbG9yO1xuICB0aGlzLmNvbnRleHQuZmlsbCgpO1xufTtcblxuUmVuZGVyZXIyRC5wcm90b3R5cGUuX3N0cm9rZSA9IGZ1bmN0aW9uIF9zdHJva2UgKClcbntcbiAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG5cbiAgY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuX3N0cm9rZUNvbG9yO1xuXG4gIGlmICggKCBjb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuX2xpbmVXaWR0aCApIDw9IDEgKSB7XG4gICAgY29udGV4dC5zdHJva2UoKTtcbiAgfVxuXG4gIGNvbnRleHQuc3Ryb2tlKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyMkQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZhdWx0cyAgICAgICAgICA9IHJlcXVpcmUoICdwZWFrby9kZWZhdWx0cycgKTtcblxudmFyIGNyZWF0ZUFycmF5ICAgICAgID0gcmVxdWlyZSggJy4uL2ludGVybmFsL2NyZWF0ZV9hcnJheScgKTtcblxudmFyIFNoYWRlclByb2dyYW0gICAgID0gcmVxdWlyZSggJy4uL1NoYWRlclByb2dyYW0nICk7XG52YXIgVHJhbnNmb3JtICAgICAgICAgPSByZXF1aXJlKCAnLi4vVHJhbnNmb3JtJyApO1xudmFyIGNvbnN0YW50cyAgICAgICAgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKTtcbnZhciBzaGFkZXJzICAgICAgICAgICA9IHJlcXVpcmUoICcuLi9zaGFkZXJzJyApO1xuXG52YXIgcHJvY2Vzc1JlY3RBbGlnblggPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblg7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblkgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nICkucHJvY2Vzc1JlY3RBbGlnblk7XG5cbnZhciBBYnN0cmFjdFJlbmRlcmVyICA9IHJlcXVpcmUoICcuL0Fic3RyYWN0UmVuZGVyZXInICk7XG52YXIgc2V0dGluZ3MgICAgICAgICAgPSByZXF1aXJlKCAnLi9zZXR0aW5ncycgKTtcblxudmFyIHJlY3QgPSBjcmVhdGVBcnJheSggW1xuICAwLCAwLFxuICAxLCAwLFxuICAxLCAxLFxuICAwLCAxXG5dICk7XG5cbi8qKlxuICogV2ViR0wg0YDQtdC90LTQtdGA0LXRgC5cbiAqIEBjb25zdHJ1Y3RvciB2Ni5SZW5kZXJlckdMXG4gKiBAZXh0ZW5kcyB2Ni5BYnN0cmFjdFJlbmRlcmVyXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB7QGxpbmsgdjYuc2V0dGluZ3MucmVuZGVyZXJ9XG4gKiBAZXhhbXBsZVxuICogLy8gUmVxdWlyZSBSZW5kZXJlckdMLlxuICogdmFyIFJlbmRlcmVyR0wgPSByZXF1aXJlKCAndjYuanMvY29yZS9yZW5kZXJlci9SZW5kZXJlckdMJyApO1xuICogLy8gQ3JlYXRlIGFuIFJlbmRlcmVyR0wgaXNudGFuY2UuXG4gKiB2YXIgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJHTCgpO1xuICovXG5mdW5jdGlvbiBSZW5kZXJlckdMICggb3B0aW9ucyApXG57XG4gIEFic3RyYWN0UmVuZGVyZXIuY3JlYXRlKCB0aGlzLCAoIG9wdGlvbnMgPSBkZWZhdWx0cyggc2V0dGluZ3MsIG9wdGlvbnMgKSApLCBjb25zdGFudHMuZ2V0KCAnR0wnICkgKTtcblxuICAvKipcbiAgICog0K3RgtCwIFwidHJhbnNmb3JtYXRpb24gbWF0cml4XCIg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyB7QGxpbmsgdjYuUmVuZGVyZXJHTCNyb3RhdGV9INC4INGCLtC/LlxuICAgKiBAbWVtYmVyIHt2Ni5UcmFuc2Zvcm19IHY2LlJlbmRlcmVyR0wjbWF0cml4XG4gICAqL1xuICB0aGlzLm1hdHJpeCA9IG5ldyBUcmFuc2Zvcm0oKTtcblxuICAvKipcbiAgICog0JHRg9GE0LXRgNGLINC00LDQvdC90YvRhSAo0LLQtdGA0YjQuNC9KS5cbiAgICogQG1lbWJlciB7b2JqZWN0fSB2Ni5SZW5kZXJlckdMI2J1ZmZlcnNcbiAgICogQHByb3BlcnR5IHtXZWJHTEJ1ZmZlcn0gZGVmYXVsdCDQntGB0L3QvtCy0L3QvtC5INCx0YPRhNC10YAuXG4gICAqIEBwcm9wZXJ0eSB7V2ViR0xCdWZmZXJ9IHJlY3QgICAg0JjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0L/RgNGP0LzQvtGD0LPQvtC70YzQvdC40LrQsCDQsiB7QGxpbmsgdjYuUmVuZGVyZXJHTCNyZWN0fS5cbiAgICovXG4gIHRoaXMuYnVmZmVycyA9IHtcbiAgICBkZWZhdWx0OiB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKCksXG4gICAgcmVjdDogIHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIoKVxuICB9O1xuXG4gIHRoaXMuY29udGV4dC5iaW5kQnVmZmVyKCB0aGlzLmNvbnRleHQuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlcnMucmVjdCApO1xuICB0aGlzLmNvbnRleHQuYnVmZmVyRGF0YSggdGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgcmVjdCwgdGhpcy5jb250ZXh0LlNUQVRJQ19EUkFXICk7XG5cbiAgLyoqXG4gICAqINCo0LXQudC00LXRgNGLIChXZWJHTCDQv9GA0L7Qs9GA0LDQvNC80YspLlxuICAgKiBAbWVtYmVyIHtvYmplY3R9IHY2LlJlbmRlcmVyR0wjcHJvZ3JhbXNcbiAgICogQHByb3BlcnR5IHt2Ni5TaGFkZXJQcm9ncmFtfSBkZWZhdWx0XG4gICAqL1xuICB0aGlzLnByb2dyYW1zID0ge1xuICAgIGRlZmF1bHQ6IG5ldyBTaGFkZXJQcm9ncmFtKCBzaGFkZXJzLmJhc2ljLCB0aGlzLmNvbnRleHQgKVxuICB9O1xuXG4gIHRoaXMuYmxlbmRpbmcoIG9wdGlvbnMuYmxlbmRpbmcgKTtcbn1cblxuUmVuZGVyZXJHTC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBBYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZSApO1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBSZW5kZXJlckdMO1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI3Jlc2l6ZVxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiByZXNpemUgKCB3LCBoIClcbntcbiAgQWJzdHJhY3RSZW5kZXJlci5wcm90b3R5cGUucmVzaXplLmNhbGwoIHRoaXMsIHcsIGggKTtcbiAgdGhpcy5jb250ZXh0LnZpZXdwb3J0KCAwLCAwLCB0aGlzLncsIHRoaXMuaCApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQG1ldGhvZCB2Ni5SZW5kZXJlckdMI2JsZW5kaW5nXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGJsZW5kaW5nXG4gKiBAY2hhaW5hYmxlXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmJsZW5kaW5nID0gZnVuY3Rpb24gYmxlbmRpbmcgKCBibGVuZGluZyApXG57XG4gIHZhciBnbCA9IHRoaXMuY29udGV4dDtcblxuICBpZiAoIGJsZW5kaW5nICkge1xuICAgIGdsLmVuYWJsZSggZ2wuQkxFTkQgKTtcbiAgICBnbC5kaXNhYmxlKCBnbC5ERVBUSF9URVNUICk7XG4gICAgZ2wuYmxlbmRGdW5jKCBnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEgKTtcbiAgICBnbC5ibGVuZEVxdWF0aW9uKCBnbC5GVU5DX0FERCApO1xuICB9IGVsc2Uge1xuICAgIGdsLmRpc2FibGUoIGdsLkJMRU5EICk7XG4gICAgZ2wuZW5hYmxlKCBnbC5ERVBUSF9URVNUICk7XG4gICAgZ2wuZGVwdGhGdW5jKCBnbC5MRVFVQUwgKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiDQntGH0LjRidCw0LXRgiDQutC+0L3RgtC10LrRgdGCLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNfY2xlYXJcbiAqIEBwYXJhbSAge251bWJlcn0gciDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSBcInJlZCBjaGFubmVsXCIuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGcg0J3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUgXCJncmVlbiBjaGFubmVsXCIuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGIg0J3QvtGA0LzQsNC70LjQt9C+0LLQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUgXCJibHVlIGNoYW5uZWxcIi5cbiAqIEBwYXJhbSAge251bWJlcn0gYSDQndC+0YDQvNCw0LvQuNC30L7QstCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSDQv9GA0L7Qt9GA0LDRh9C90L7RgdGC0LggKGFscGhhKS5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICDQndC40YfQtdCz0L4g0L3QtSDQstC+0LfQstGA0LDRidCw0LXRgi5cbiAqIEBleGFtcGxlXG4gKiByZW5kZXJlci5fY2xlYXIoIDEsIDAsIDAsIDEgKTsgLy8gRmlsbCBjb250ZXh0IHdpdGggcmVkIGNvbG9yLlxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5fY2xlYXIgPSBmdW5jdGlvbiBfY2xlYXIgKCByLCBnLCBiLCBhIClcbntcbiAgdmFyIGdsID0gdGhpcy5jb250ZXh0O1xuICBnbC5jbGVhckNvbG9yKCByLCBnLCBiLCBhICk7XG4gIGdsLmNsZWFyKCBnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWJpdHdpc2Vcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAbWV0aG9kIHY2LlJlbmRlcmVyR0wjYmFja2dyb3VuZENvbG9yXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmJhY2tncm91bmRDb2xvciA9IGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvciAoIHIsIGcsIGIsIGEgKVxue1xuICB2YXIgcmdiYSA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKCByLCBnLCBiLCBhICkucmdiYSgpO1xuICB0aGlzLl9jbGVhciggcmdiYVsgMCBdIC8gMjU1LCByZ2JhWyAxIF0gLyAyNTUsIHJnYmFbIDIgXSAvIDI1NSwgcmdiYVsgMyBdICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNjbGVhclxuICovXG5SZW5kZXJlckdMLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpXG57XG4gIHRoaXMuX2NsZWFyKCAwLCAwLCAwLCAwICk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNkcmF3QXJyYXlzXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmRyYXdBcnJheXMgPSBmdW5jdGlvbiBkcmF3QXJyYXlzICggdmVydHMsIGNvdW50LCBtb2RlLCBfc3gsIF9zeSApXG57XG4gIHZhciBwcm9ncmFtID0gdGhpcy5wcm9ncmFtcy5kZWZhdWx0O1xuICB2YXIgZ2wgICAgICA9IHRoaXMuY29udGV4dDtcblxuICBpZiAoIGNvdW50IDwgMiApIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICggdmVydHMgKSB7XG4gICAgaWYgKCB0eXBlb2YgbW9kZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICBtb2RlID0gZ2wuU1RBVElDX0RSQVc7XG4gICAgfVxuXG4gICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlcnMuZGVmYXVsdCApO1xuICAgIGdsLmJ1ZmZlckRhdGEoIGdsLkFSUkFZX0JVRkZFUiwgdmVydHMsIG1vZGUgKTtcbiAgfVxuXG4gIGlmICggdHlwZW9mIF9zeCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdGhpcy5tYXRyaXguc2NhbGUoIF9zeCwgX3N5ICk7XG4gIH1cblxuICBwcm9ncmFtXG4gICAgLnVzZSgpXG4gICAgLnNldFVuaWZvcm0oICd1dHJhbnNmb3JtJywgdGhpcy5tYXRyaXgubWF0cml4IClcbiAgICAuc2V0VW5pZm9ybSggJ3VyZXMnLCBbIHRoaXMudywgdGhpcy5oIF0gKVxuICAgIC5zZXRBdHRyaWJ1dGUoICdhcG9zJywgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwICk7XG5cbiAgdGhpcy5fZmlsbCggY291bnQgKTtcbiAgdGhpcy5fc3Ryb2tlKCBjb3VudCApO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuUmVuZGVyZXJHTC5wcm90b3R5cGUuX2ZpbGwgPSBmdW5jdGlvbiBfZmlsbCAoIGNvdW50IClcbntcbiAgaWYgKCB0aGlzLl9kb0ZpbGwgKSB7XG4gICAgdGhpcy5wcm9ncmFtcy5kZWZhdWx0LnNldFVuaWZvcm0oICd1Y29sb3InLCB0aGlzLl9maWxsQ29sb3IucmdiYSgpICk7XG4gICAgdGhpcy5jb250ZXh0LmRyYXdBcnJheXMoIHRoaXMuY29udGV4dC5UUklBTkdMRV9GQU4sIDAsIGNvdW50ICk7XG4gIH1cbn07XG5cblJlbmRlcmVyR0wucHJvdG90eXBlLl9zdHJva2UgPSBmdW5jdGlvbiBfc3Ryb2tlICggY291bnQgKVxue1xuICBpZiAoIHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDAgKSB7XG4gICAgdGhpcy5wcm9ncmFtcy5kZWZhdWx0LnNldFVuaWZvcm0oICd1Y29sb3InLCB0aGlzLl9zdHJva2VDb2xvci5yZ2JhKCkgKTtcbiAgICB0aGlzLmNvbnRleHQubGluZVdpZHRoKCB0aGlzLl9saW5lV2lkdGggKTtcbiAgICB0aGlzLmNvbnRleHQuZHJhd0FycmF5cyggdGhpcy5jb250ZXh0LkxJTkVfTE9PUCwgMCwgY291bnQgKTtcbiAgfVxufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNhcmNcbiAqL1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYXJjID0gZnVuY3Rpb24gYXJjICggeCwgeSwgciApXG57XG4gIHJldHVybiB0aGlzLmRyYXdQb2x5Z29uKCB4LCB5LCByLCByLCAyNCwgMCApO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNsaW5lXG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLmxpbmUgPSBmdW5jdGlvbiBsaW5lICggeDEsIHkxLCB4MiwgeTIgKVxue1xuICB0aGlzLmRyYXdBcnJheXMoIGNyZWF0ZUFycmF5KCBbXG4gICAgeDEsIHkxLFxuICAgIHgyLCB5MlxuICBdICksIDIsIHRoaXMuY29udGV4dC5TVEFUSUNfRFJBVyApO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEBtZXRob2QgdjYuUmVuZGVyZXJHTCNyZWN0XG4gKi9cblJlbmRlcmVyR0wucHJvdG90eXBlLnJlY3QgPSBmdW5jdGlvbiByZWN0ICggeCwgeSwgdywgaCApXG57XG4gIHggPSBwcm9jZXNzUmVjdEFsaWduWCggdGhpcywgeCwgdyApO1xuICB5ID0gcHJvY2Vzc1JlY3RBbGlnblkoIHRoaXMsIHksIGggKTtcbiAgdGhpcy5tYXRyaXguc2F2ZSgpO1xuICB0aGlzLm1hdHJpeC50cmFuc2xhdGUoIHgsIHkgKTtcbiAgdGhpcy5tYXRyaXguc2NhbGUoIHcsIGggKTtcbiAgdGhpcy5jb250ZXh0LmJpbmRCdWZmZXIoIHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5yZWN0ICk7XG4gIHRoaXMuZHJhd0FycmF5cyggbnVsbCwgNCApO1xuICB0aGlzLm1hdHJpeC5yZXN0b3JlKCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlckdMO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RhbnRzICAgICAgID0gcmVxdWlyZSggJy4uL2NvbnN0YW50cycgKTtcblxudmFyIHJlcG9ydCAgICAgICAgICA9IHJlcXVpcmUoICcuLi9pbnRlcm5hbC9yZXBvcnQnICk7XG5cbnZhciBnZXRSZW5kZXJlclR5cGUgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9nZXRfcmVuZGVyZXJfdHlwZScgKTtcbnZhciBnZXRXZWJHTCAgICAgICAgPSByZXF1aXJlKCAnLi9pbnRlcm5hbC9nZXRfd2ViZ2wnICk7XG5cbnZhciBSZW5kZXJlckdMICAgICAgPSByZXF1aXJlKCAnLi9SZW5kZXJlckdMJyApO1xudmFyIFJlbmRlcmVyMkQgICAgICA9IHJlcXVpcmUoICcuL1JlbmRlcmVyMkQnICk7XG52YXIgdHlwZSAgICAgICAgICAgID0gcmVxdWlyZSggJy4vc2V0dGluZ3MnICkudHlwZTtcblxuLyoqXG4gKiDQodC+0LfQtNCw0LXRgiDQvdC+0LLRi9C5INGA0LXQvdC00LXRgNC10YAuINCV0YHQu9C4INGB0L7Qt9C00LDRgtGMIFdlYkdMINC60L7QvdGC0LXQutGB0YIg0L3QtSDQv9C+0LvRg9GH0LjRgtGB0Y8sINGC0L4g0LHRg9C00LXRgiDQuNGB0L/QvtC70YzQt9C+0LLQsNC9IDJELlxuICogQG1ldGhvZCB2Ni5jcmVhdGVSZW5kZXJlclxuICogQHBhcmFtICB7b2JqZWN0fSAgICAgICAgICAgICAgb3B0aW9ucyB7QGxpbmsgdjYuc2V0dGluZ3MucmVuZGVyZXJ9LlxuICogQHJldHVybiB7djYuQWJzdHJhY3RSZW5kZXJlcn0gICAgICAgICDQndC+0LLRi9C5INGA0LXQvdC00LXRgNC10YAgKDJELCBHTCkuXG4gKiBAZXhhbXBsZVxuICogdmFyIGNyZWF0ZVJlbmRlcmVyID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvY3JlYXRlX3JlbmRlcmVyJyApO1xuICogdmFyIGNvbnN0YW50cyAgICAgID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvY29uc3RhbnRzJyApO1xuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRpbmcgV2ViR0wgb3IgMkQgcmVuZGVyZXIgYmFzZWQgb24gcGxhdGZvcm0gYW5kIGJyb3dzZXI8L2NhcHRpb24+XG4gKiB2YXIgcmVuZGVyZXIgPSBjcmVhdGVSZW5kZXJlciggeyB0eXBlOiBjb25zdGFudHMuZ2V0KCAnQVVUTycgKSB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyBXZWJHTCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICdHTCcgKSB9ICk7XG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGluZyAyRCByZW5kZXJlcjwvY2FwdGlvbj5cbiAqIHZhciByZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKCB7IHR5cGU6IGNvbnN0YW50cy5nZXQoICcyRCcgKSB9ICk7XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJlbmRlcmVyICggb3B0aW9ucyApXG57XG4gIHZhciB0eXBlXyA9ICggb3B0aW9ucyAmJiBvcHRpb25zLnR5cGUgKSB8fCB0eXBlO1xuXG4gIGlmICggdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoICdBVVRPJyApICkge1xuICAgIHR5cGVfID0gZ2V0UmVuZGVyZXJUeXBlKCk7XG4gIH1cblxuICBpZiAoIHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnR0wnICkgKSB7XG4gICAgaWYgKCBnZXRXZWJHTCgpICkge1xuICAgICAgcmV0dXJuIG5ldyBSZW5kZXJlckdMKCBvcHRpb25zICk7XG4gICAgfVxuXG4gICAgcmVwb3J0KCAnQ2Fubm90IGNyZWF0ZSBXZWJHTCBjb250ZXh0LiBGYWxsaW5nIGJhY2sgdG8gMkQuJyApO1xuICB9XG5cbiAgaWYgKCB0eXBlXyA9PT0gY29uc3RhbnRzLmdldCggJzJEJyApIHx8IHR5cGVfID09PSBjb25zdGFudHMuZ2V0KCAnR0wnICkgKSB7XG4gICAgcmV0dXJuIG5ldyBSZW5kZXJlcjJEKCBvcHRpb25zICk7XG4gIH1cblxuICB0aHJvdyBFcnJvciggJ0dvdCB1bmtub3duIHJlbmRlcmVyIHR5cGUuIFRoZSBrbm93biBhcmU6IDJEIGFuZCBHTCcgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVSZW5kZXJlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQl9Cw0LrRgNGL0LLQsNC10YIg0YTQuNCz0YPRgNGDLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgY2xvc2VTaGFwZVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXIg0KDQtdC90LTQtdGA0LXRgC5cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgICAgICAgICAgICAgICAgINCd0LjRh9C10LPQviDQvdC1INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCLlxuICovXG5mdW5jdGlvbiBjbG9zZVNoYXBlICggcmVuZGVyZXIgKVxue1xuICBpZiAoICEgcmVuZGVyZXIuX2Nsb3NlZFNoYXBlICkge1xuICAgIHJlbmRlcmVyLl9jbG9zZWRTaGFwZSA9IHJlbmRlcmVyLl92ZXJ0aWNlcy5zbGljZSgpO1xuICAgIHJlbmRlcmVyLl9jbG9zZWRTaGFwZS5wdXNoKCByZW5kZXJlci5fY2xvc2VkU2hhcGVbIDAgXSApO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xvc2VTaGFwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiDQmtC+0L/QuNGA0YPQtdGCIGRyYXdpbmcgc2V0dGluZ3MgKF9saW5lV2lkdGgsIF9yZWN0QWxpZ25YLCDQuCDRgi7QtC4pINC40LcgYHNvdXJjZWAg0LIgYHRhcmdldGAuXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBjb3B5RHJhd2luZ1NldHRpbmdzXG4gKiBAcGFyYW0gIHtvYmplY3R9ICB0YXJnZXQg0JzQvtC20LXRgiDQsdGL0YLRjCBgQWJzdHJhY3RSZW5kZXJlcmAg0LjQu9C4INC/0YDQvtGB0YLRi9C8INC+0LHRitC10LrRgtC+0Lwg0YEg0YHQvtGF0YDQsNC90LXQvdC90YvQvNC4INGH0LXRgNC10LdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICDRjdGC0YMg0YTRg9C90LrRhtC40Y4g0L3QsNGB0YLRgNC+0LnQutCw0LzQuC5cbiAqIEBwYXJhbSAge29iamVjdH0gIHNvdXJjZSDQntC/0LjRgdCw0L3QuNC1INGC0L4g0LbQtSwg0YfRgtC+INC4INC00LvRjyBgdGFyZ2V0YC5cbiAqIEBwYXJhbSAge2Jvb2xlYW59IFtkZWVwXSDQldGB0LvQuCBgdHJ1ZWAsINGC0L4g0LHRg9C00LXRgiDRgtCw0LrQttC1INC60L7Qv9C40YDQvtCy0LDRgtGMIF9maWxsQ29sb3IsIF9zdHJva2VDb2xvciDQuCDRgi7QtC5cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgICDQktC+0LfQstGA0LDRidCw0LXRgiBgdGFyZ2V0YC5cbiAqL1xuZnVuY3Rpb24gY29weURyYXdpbmdTZXR0aW5ncyAoIHRhcmdldCwgc291cmNlLCBkZWVwIClcbntcbiAgaWYgKCBkZWVwICkge1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAwIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAwIF07XG4gICAgdGFyZ2V0Ll9maWxsQ29sb3JbIDEgXSAgID0gc291cmNlLl9maWxsQ29sb3JbIDEgXTtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvclsgMiBdICAgPSBzb3VyY2UuX2ZpbGxDb2xvclsgMiBdO1xuICAgIHRhcmdldC5fZmlsbENvbG9yWyAzIF0gICA9IHNvdXJjZS5fZmlsbENvbG9yWyAzIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMCBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMCBdO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbIDEgXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbIDEgXTtcbiAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWyAyIF0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWyAyIF07XG4gICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsgMyBdID0gc291cmNlLl9zdHJva2VDb2xvclsgMyBdO1xuICB9XG5cbiAgdGFyZ2V0Ll9iYWNrZ3JvdW5kUG9zaXRpb25YID0gc291cmNlLl9iYWNrZ3JvdW5kUG9zaXRpb25YO1xuICB0YXJnZXQuX2JhY2tncm91bmRQb3NpdGlvblkgPSBzb3VyY2UuX2JhY2tncm91bmRQb3NpdGlvblk7XG4gIHRhcmdldC5fcmVjdEFsaWduWCAgICAgICAgICA9IHNvdXJjZS5fcmVjdEFsaWduWDtcbiAgdGFyZ2V0Ll9yZWN0QWxpZ25ZICAgICAgICAgID0gc291cmNlLl9yZWN0QWxpZ25ZO1xuICB0YXJnZXQuX2xpbmVXaWR0aCAgICAgICAgICAgPSBzb3VyY2UuX2xpbmVXaWR0aDtcbiAgdGFyZ2V0Ll9kb1N0cm9rZSAgICAgICAgICAgID0gc291cmNlLl9kb1N0cm9rZTtcbiAgdGFyZ2V0Ll9kb0ZpbGwgICAgICAgICAgICAgID0gc291cmNlLl9kb0ZpbGw7XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb3B5RHJhd2luZ1NldHRpbmdzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcblxudmFyIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgPSB7XG4gIF9iYWNrZ3JvdW5kUG9zaXRpb25YOiBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSxcbiAgX2JhY2tncm91bmRQb3NpdGlvblk6IGNvbnN0YW50cy5nZXQoICdUT1AnICksXG4gIF9yZWN0QWxpZ25YOiAgICAgICAgICBjb25zdGFudHMuZ2V0KCAnTEVGVCcgKSxcbiAgX3JlY3RBbGlnblk6ICAgICAgICAgIGNvbnN0YW50cy5nZXQoICdUT1AnICksXG4gIF9saW5lV2lkdGg6ICAgICAgICAgICAyLFxuICBfZG9TdHJva2U6ICAgICAgICAgICAgdHJ1ZSxcbiAgX2RvRmlsbDogICAgICAgICAgICAgIHRydWVcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdERyYXdpbmdTZXR0aW5ncztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9uY2UgICAgICA9IHJlcXVpcmUoICdwZWFrby9vbmNlJyApO1xuXG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKTtcblxuLy8gXCJwbGF0Zm9ybVwiIG5vdCBpbmNsdWRlZCB1c2luZyA8c2NyaXB0IC8+IHRhZy5cbmlmICggdHlwZW9mIHBsYXRmb3JtID09PSAndW5kZWZpbmVkJyApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuICB2YXIgcGxhdGZvcm07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdmFycy1vbi10b3BcblxuICB0cnkge1xuICAgIHBsYXRmb3JtID0gcmVxdWlyZSggJ3BsYXRmb3JtJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGdsb2JhbC1yZXF1aXJlXG4gIH0gY2F0Y2ggKCBlcnJvciApIHtcbiAgICAvLyBcInBsYXRmb3JtXCIgbm90IGluc3RhbGxlZCB1c2luZyBOUE0uXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXJUeXBlICgpXG57XG4gIHZhciBzYWZhcmksIHRvdWNoYWJsZTtcblxuICBpZiAoIHBsYXRmb3JtICkge1xuICAgIHNhZmFyaSA9IHBsYXRmb3JtLm9zICYmXG4gICAgICBwbGF0Zm9ybS5vcy5mYW1pbHkgPT09ICdpT1MnICYmXG4gICAgICBwbGF0Zm9ybS5uYW1lID09PSAnU2FmYXJpJztcbiAgfVxuXG4gIGlmICggdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgdG91Y2hhYmxlID0gJ29udG91Y2hlbmQnIGluIHdpbmRvdztcbiAgfVxuXG4gIGlmICggdG91Y2hhYmxlICYmICEgc2FmYXJpICkge1xuICAgIHJldHVybiBjb25zdGFudHMuZ2V0KCAnR0wnICk7XG4gIH1cblxuICByZXR1cm4gY29uc3RhbnRzLmdldCggJzJEJyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9uY2UoIGdldFJlbmRlcmVyVHlwZSApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb25jZSA9IHJlcXVpcmUoICdwZWFrby9vbmNlJyApO1xuXG4vKipcbiAqINCS0L7Qt9Cy0YDQsNGJ0LDQtdGCINC40LzRjyDQv9C+0LTQtNC10YDQttC40LLQsNC10LzQvtCz0L4gV2ViR0wg0LrQvtC90YLQtdC60YHRgtCwLCDQvdCw0L/RgNC40LzQtdGAOiAnZXhwZXJpbWVudGFsLXdlYmdsJy5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIGdldFdlYkdMXG4gKiBAcmV0dXJuIHtzdHJpbmc/fSDQkiDRgdC70YPRh9Cw0LUg0L3QtdGD0LTQsNGH0LggKFdlYkdMINC90LUg0L/QvtC00LTQtdGA0LbQuNCy0LDQtdGC0YHRjykgLSDQstC10YDQvdC10YIgYG51bGxgLlxuICovXG5mdW5jdGlvbiBnZXRXZWJHTCAoKVxue1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgdmFyIG5hbWUgICA9IG51bGw7XG5cbiAgaWYgKCBjYW52YXMuZ2V0Q29udGV4dCggJ3dlYmdsJyApICkge1xuICAgIG5hbWUgPSAnd2ViZ2wnO1xuICB9IGVsc2UgaWYgKCBjYW52YXMuZ2V0Q29udGV4dCggJ2V4cGVyaW1lbnRhbC13ZWJnbCcgKSApIHtcbiAgICBuYW1lID0gJ2V4cGVyaW1lbnRhbC13ZWJnbCc7XG4gIH1cblxuICAvLyBGaXhpbmcgcG9zc2libGUgbWVtb3J5IGxlYWsuXG4gIGNhbnZhcyA9IG51bGw7XG4gIHJldHVybiBuYW1lO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9uY2UoIGdldFdlYkdMICk7XG4iLCIvKiBlc2xpbnQgbGluZXMtYXJvdW5kLWRpcmVjdGl2ZTogb2ZmICovXG4vKiBlc2xpbnQgbGluZXMtYXJvdW5kLWNvbW1lbnQ6IG9mZiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi8uLi9jb25zdGFudHMnICk7XG4vKipcbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHByb2Nlc3NSZWN0QWxpZ25YXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlclxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgeFxuICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgd1xuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnRzLnByb2Nlc3NSZWN0QWxpZ25YID0gZnVuY3Rpb24gcHJvY2Vzc1JlY3RBbGlnblggKCByZW5kZXJlciwgeCwgdyApIHsgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWCA9PT0gY29uc3RhbnRzLmdldCggXCJDRU5URVJcIiApICkgeyB4IC09IHcgKiAwLjU7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25YID09PSBjb25zdGFudHMuZ2V0KCBcIlJJR0hUXCIgKSApIHsgeCAtPSB3OyB9IGVsc2UgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWCAhPT0gY29uc3RhbnRzLmdldCggXCJMRUZUXCIgKSApIHsgdGhyb3cgRXJyb3IoICdVbmtub3duIFwiICsnICsgXCJyZWN0QWxpZ25YXCIgKyAnXCI6ICcgKyByZW5kZXJlci5fcmVjdEFsaWduWCApOyB9IHJldHVybiBNYXRoLmZsb29yKCB4ICk7IH07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYnJhY2UtcnVsZXMvYnJhY2Utb24tc2FtZS1saW5lLCBuby11c2VsZXNzLWNvbmNhdCwgcXVvdGVzLCBtYXgtc3RhdGVtZW50cy1wZXItbGluZSwgbWF4LWxlblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBwcm9jZXNzUmVjdEFsaWduWVxuICogQHBhcmFtICB7djYuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXJcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIHlcbiAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgIGhcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0cy5wcm9jZXNzUmVjdEFsaWduWSA9IGZ1bmN0aW9uIHByb2Nlc3NSZWN0QWxpZ25ZICggcmVuZGVyZXIsIHgsIHcgKSB7IGlmICggcmVuZGVyZXIuX3JlY3RBbGlnblkgPT09IGNvbnN0YW50cy5nZXQoIFwiTUlERExFXCIgKSApIHsgeCAtPSB3ICogMC41OyB9IGVsc2UgaWYgKCByZW5kZXJlci5fcmVjdEFsaWduWSA9PT0gY29uc3RhbnRzLmdldCggXCJCT1RUT01cIiApICkgeyB4IC09IHc7IH0gZWxzZSBpZiAoIHJlbmRlcmVyLl9yZWN0QWxpZ25ZICE9PSBjb25zdGFudHMuZ2V0KCBcIlRPUFwiICkgKSB7IHRocm93IEVycm9yKCAnVW5rbm93biBcIiArJyArIFwicmVjdEFsaWduWVwiICsgJ1wiOiAnICsgcmVuZGVyZXIuX3JlY3RBbGlnblkgKTsgfSByZXR1cm4gTWF0aC5mbG9vciggeCApOyB9OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJyYWNlLXJ1bGVzL2JyYWNlLW9uLXNhbWUtbGluZSwgbm8tdXNlbGVzcy1jb25jYXQsIHF1b3RlcywgbWF4LXN0YXRlbWVudHMtcGVyLWxpbmUsIG1heC1sZW5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdMID0gcmVxdWlyZSggJy4uLy4uL2NvbnN0YW50cycgKS5nZXQoICdHTCcgKTtcblxuLyoqXG4gKiDQntCx0YDQsNCx0LDRgtGL0LLQsNC10YIg0YTQuNCz0YPRgNGDLlxuICogQHByaXZhdGVcbiAqIEBtZXRob2QgcHJvY2Vzc1NoYXBlXG4gKiBAcGFyYW0gIHt2Ni5BYnN0cmFjdFJlbmRlcmVyfSByZW5kZXJlciDQoNC10L3QtNC10YDQtdGALlxuICogQHBhcmFtICB7QXJyYXl8RmxvYXQzMkFycmF5fSAgdmVydGljZXMg0JLQtdGA0YjQuNC90YsuXG4gKiBAcmV0dXJuIHtBcnJheXxGbG9hdDMyQXJyYXl9ICAgICAgICAgICDQntCx0YDQsNCx0L7RgtCw0L3QvdGL0LUg0LLQtdGA0YjQuNC90YsuXG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NTaGFwZSAoIHJlbmRlcmVyLCB2ZXJ0aWNlcyApXG57XG4gIGlmICggcmVuZGVyZXIudHlwZSA9PT0gR0wgJiYgdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAhICggdmVydGljZXMgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSApIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICAgIHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheSggdmVydGljZXMgKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgfVxuXG4gIHJldHVybiB2ZXJ0aWNlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwcm9jZXNzU2hhcGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZhdWx0RHJhd2luZ1NldHRpbmdzID0gcmVxdWlyZSggJy4vZGVmYXVsdF9kcmF3aW5nX3NldHRpbmdzJyApO1xudmFyIGNvcHlEcmF3aW5nU2V0dGluZ3MgICAgPSByZXF1aXJlKCAnLi9jb3B5X2RyYXdpbmdfc2V0dGluZ3MnICk7XG5cbi8qKlxuICog0KPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YIgZHJhd2luZyBzZXR0aW5ncyDQv9C+INGD0LzQvtC70YfQsNC90LjRjiDQsiBgdGFyZ2V0YC5cbiAqIEBwcml2YXRlXG4gKiBAbWV0aG9kIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3NcbiAqIEBwYXJhbSAge29iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldCAgINCc0L7QttC10YIg0LHRi9GC0YwgYEFic3RyYWN0UmVuZGVyZXJgINC40LvQuCDQv9GA0L7RgdGC0YvQvFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg0L7QsdGK0LXQutGC0L7QvC5cbiAqIEBwYXJhbSAge21vZHVsZTpcInY2LmpzXCIuQWJzdHJhY3RSZW5kZXJlcn0gcmVuZGVyZXIgYFJlbmRlcmVyR0xgINC40LvQuCBgUmVuZGVyZXIyRGAg0L3Rg9C20L3RiyDQtNC70Y9cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINGD0YHRgtCw0L3QvtCy0LrQuCBfc3Ryb2tlQ29sb3IsIF9maWxsQ29sb3IuXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDQktC+0LfQstGA0LDRidCw0LXRgiBgdGFyZ2V0YC5cbiAqL1xuZnVuY3Rpb24gc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyAoIHRhcmdldCwgcmVuZGVyZXIgKVxue1xuXG4gIGNvcHlEcmF3aW5nU2V0dGluZ3MoIHRhcmdldCwgZGVmYXVsdERyYXdpbmdTZXR0aW5ncyApO1xuXG4gIHRhcmdldC5fc3Ryb2tlQ29sb3IgPSBuZXcgcmVuZGVyZXIuc2V0dGluZ3MuY29sb3IoKTtcbiAgdGFyZ2V0Ll9maWxsQ29sb3IgICA9IG5ldyByZW5kZXJlci5zZXR0aW5ncy5jb2xvcigpO1xuXG4gIHJldHVybiB0YXJnZXQ7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29sb3IgPSByZXF1aXJlKCAnLi4vY29sb3IvUkdCQScgKTtcbnZhciB0eXBlICA9IHJlcXVpcmUoICcuLi9jb25zdGFudHMnICkuZ2V0KCAnMkQnICk7XG5cbi8qKlxuICog0J3QsNGB0YLRgNC+0LnQutC4INC00LvRjyDRgNC10L3QtNC10YDQtdGA0L7Qsjoge0BsaW5rIHY2LlJlbmRlcmVyMkR9LCB7QGxpbmsgdjYuUmVuZGVyZXJHTH0sIHtAbGluayB2Ni5BYnN0cmFjdFJlbmRlcmVyfSwge0BsaW5rIHY2LmNyZWF0ZVJlbmRlcmVyfS5cbiAqIEBuYW1lc3BhY2UgdjYuc2V0dGluZ3MucmVuZGVyZXJcbiAqL1xuXG4vKipcbiAqIEBtZW1iZXIgICB7b2JqZWN0fSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuc2V0dGluZ3NdINCd0LDRgdGC0YDQvtC50LrQuCDRgNC10L3QtNC10YDQtdGA0LAg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y4uXG4gKiBAcHJvcGVydHkge29iamVjdH0gW2NvbG9yPXtAbGluayB2Ni5SR0JBfV0gICAgICAgICDQmtC+0L3RgdGC0YDRg9C60YLQvtGA0Ysge0BsaW5rIHY2LlJHQkF9INC40LvQuCB7QGxpbmsgdjYuSFNMQX0uXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3NjYWxlPTFdICAgICAgICAgICAgICAgICAgICAgICDQn9C70L7RgtC90L7RgdGC0Ywg0L/QuNC60YHQtdC70LXQuSDRgNC10L3QtNC10YDQtdGA0LAsINC90LDQv9GA0LjQvNC10YA6IGBkZXZpY2VQaXhlbFJhdGlvYC5cbiAqL1xuZXhwb3J0cy5zZXR0aW5ncyA9IHtcbiAgY29sb3I6IGNvbG9yLFxuICBzY2FsZTogMVxufTtcblxuLyoqXG4gKiDQn9C+0LrQsCDQvdC1INGB0LTQtdC70LDQvdC+LlxuICogQG1lbWJlciB7Ym9vbGVhbn0gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmFudGlhbGlhcz10cnVlXVxuICovXG5leHBvcnRzLmFudGlhbGlhcyA9IHRydWU7XG5cbi8qKlxuICog0J/QvtC60LAg0L3QtSDRgdC00LXQu9Cw0L3Qvi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IFt2Ni5zZXR0aW5ncy5yZW5kZXJlci5ibGVuZGluZz10cnVlXVxuICovXG5leHBvcnRzLmJsZW5kaW5nID0gdHJ1ZTtcblxuLyoqXG4gKiDQmNGB0L/QvtC70YzQt9C+0LLQsNGC0Ywg0LPRgNCw0LTRg9GB0Ysg0LLQvNC10YHRgtC+INGA0LDQtNC40LDQvdC+0LIuXG4gKiBAbWVtYmVyIHtib29sZWFufSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuZGVncmVlcz1mYWxzZV1cbiAqL1xuZXhwb3J0cy5kZWdyZWVzID0gZmFsc2U7XG5cbi8qKlxuICog0JjRgdC/0L7Qu9GM0LfQvtCy0LDRgtGMINC/0YDQvtC30YDQsNGH0L3Ri9C5ICjQstC80LXRgdGC0L4g0YfQtdGA0L3QvtCz0L4pINC60L7QvdGC0LXQutGB0YIuXG4gKiBAbWVtYmVyIHtib29sZWFufSBbdjYuc2V0dGluZ3MucmVuZGVyZXIuYWxwaGE9dHJ1ZV1cbiAqL1xuZXhwb3J0cy5hbHBoYSA9IHRydWU7XG5cbi8qKlxuICog0KLQuNC/INC60L7QvdGC0LXQutGB0YLQsCAoMkQsIEdMLCBBVVRPKS5cbiAqIEBtZW1iZXIge2NvbnN0YW50fSBbdjYuc2V0dGluZ3MucmVuZGVyZXIudHlwZT0yRF1cbiAqL1xuZXhwb3J0cy50eXBlID0gdHlwZTtcblxuLyoqXG4gKiDQkiDRjdGC0L7RgiDRjdC70LXQvNC10L3RgiDQsdGD0LTQtdGCINC00L7QsdCw0LLQu9C10L0gYGNhbnZhc2AuXG4gKiBAbWVtYmVyIHtFbGVtZW50P30gW3Y2LnNldHRpbmdzLnJlbmRlcmVyLmFwcGVuZFRvXVxuICovXG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG1lbWJlciB2Ni5zaGFwZXMuZHJhd0xpbmVzXG4gKiBAZXhhbXBsZVxuICogc2hhcGVzLmRyYXdMaW5lcyggcmVuZGVyZXIsIHZlcnRpY2VzICk7XG4gKi9cbmZ1bmN0aW9uIGRyYXdMaW5lcyAoKVxue1xuICB0aHJvdyBFcnJvciggJ05vdCBpbXBsZW1lbnRlZCcgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkcmF3TGluZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG1lbWJlciB2Ni5zaGFwZXMuZHJhd1BvaW50c1xuICogQGV4YW1wbGVcbiAqIHNoYXBlcy5kcmF3UG9pbnRzKCByZW5kZXJlciwgdmVydGljZXMgKTtcbiAqL1xuZnVuY3Rpb24gZHJhd1BvaW50cyAoKVxue1xuICB0aHJvdyBFcnJvciggJ05vdCBpbXBsZW1lbnRlZCcgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkcmF3UG9pbnRzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqINCT0LvQsNCy0L3Ri9C1INC90LDRgdGC0YDQvtC50LrQuCBcInY2LmpzXCIuXG4gKiBAbmFtZXNwYWNlIHY2LnNldHRpbmdzLmNvcmVcbiAqL1xuXG4vKipcbiAqINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCDQs9GA0LDQtNGD0YHRiyDQstC80LXRgdGC0L4g0YDQsNC00LjQsNC90L7Qsi5cbiAqIEBtZW1iZXIge2Jvb2xlYW59IHY2LnNldHRpbmdzLmNvcmUuZGVncmVlc1xuICovXG5leHBvcnRzLmRlZ3Jlc3MgPSBmYWxzZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAaW50ZXJmYWNlIElTaGFkZXJTb3VyY2VzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdmVydCDQmNGB0YXQvtC00L3QuNC6INCy0LXRgNGI0LjQvdC90L7Qs9C+ICh2ZXJ0ZXgpINGI0LXQudC00LXRgNCwLlxuICogQHByb3BlcnR5IHtzdHJpbmd9IGZyYWcg0JjRgdGF0L7QtNC90LjQuiDRhNGA0LDQs9C80LXQvdGC0L3QvtCz0L4gKGZyYWdtZW50KSDRiNC10LnQtNC10YDQsC5cbiAqL1xuXG4vKipcbiAqIFdlYkdMINGI0LXQudC00LXRgNGLLlxuICogQG1lbWJlciB7b2JqZWN0fSB2Ni5zaGFkZXJzXG4gKiBAcHJvcGVydHkge0lTaGFkZXJTb3VyY2VzfSBiYXNpYyAgICAgINCh0YLQsNC90LTQsNGA0YLQvdGL0LUg0YjQtdC50LTQtdGA0YsuXG4gKiBAcHJvcGVydHkge0lTaGFkZXJTb3VyY2VzfSBiYWNrZ3JvdW5kINCo0LXQudC00LXRgNGLINC00LvRjyDQvtGC0YDQuNGB0L7QstC60Lgg0YTQvtC90LAuXG4gKi9cbnZhciBzaGFkZXJzID0ge1xuICBiYXNpYzoge1xuICAgIHZlcnQ6ICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDthdHRyaWJ1dGUgdmVjMiBhcG9zO3VuaWZvcm0gdmVjMiB1cmVzO3VuaWZvcm0gbWF0MyB1dHJhbnNmb3JtO3ZvaWQgbWFpbigpe2dsX1Bvc2l0aW9uPXZlYzQoKCh1dHJhbnNmb3JtKnZlYzMoYXBvcywxLjApKS54eS91cmVzKjIuMC0xLjApKnZlYzIoMSwtMSksMCwxKTt9JyxcbiAgICBmcmFnOiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7dW5pZm9ybSB2ZWM0IHVjb2xvcjt2b2lkIG1haW4oKXtnbF9GcmFnQ29sb3I9dmVjNCh1Y29sb3IucmdiLzI1NS4wLHVjb2xvci5hKTt9J1xuICB9LFxuXG4gIGJhY2tncm91bmQ6IHtcbiAgICB2ZXJ0OiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7YXR0cmlidXRlIHZlYzIgYXBvczt2b2lkIG1haW4oKXtnbF9Qb3NpdGlvbiA9IHZlYzQoYXBvcywwLDEpO30nLFxuICAgIGZyYWc6ICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDt1bmlmb3JtIHZlYzQgdWNvbG9yO3ZvaWQgbWFpbigpe2dsX0ZyYWdDb2xvcj11Y29sb3I7fSdcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGFkZXJzO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctMjAxOCBWbGFkaXNsYXYgVGlraGl5IChTSUxFTlQpXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgR1BMLTMuMCBsaWNlbnNlLlxuICogaHR0cHM6Ly9naXRodWIuY29tL3Rpa2hpeS92Ni5qcy90cmVlL2Rldi9cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSB2NlxuICovXG5cbmV4cG9ydHMuQWJzdHJhY3RJbWFnZSAgICA9IHJlcXVpcmUoICcuL2NvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZScgKTtcbmV4cG9ydHMuQWJzdHJhY3RSZW5kZXJlciA9IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlcicgKTtcbmV4cG9ydHMuQWJzdHJhY3RWZWN0b3IgICA9IHJlcXVpcmUoICcuL2NvcmUvbWF0aC9BYnN0cmFjdFZlY3RvcicgKTtcbmV4cG9ydHMuQ2FtZXJhICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY2FtZXJhL0NhbWVyYScgKTtcbmV4cG9ydHMuQ29tcG91bmRlZEltYWdlICA9IHJlcXVpcmUoICcuL2NvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlJyApO1xuZXhwb3J0cy5IU0xBICAgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9jb2xvci9IU0xBJyApO1xuZXhwb3J0cy5JbWFnZSAgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9pbWFnZS9JbWFnZScgKTtcbmV4cG9ydHMuUkdCQSAgICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvY29sb3IvUkdCQScgKTtcbmV4cG9ydHMuUmVuZGVyZXIyRCAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXIyRCcgKTtcbmV4cG9ydHMuUmVuZGVyZXJHTCAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTCcgKTtcbmV4cG9ydHMuU2hhZGVyUHJvZ3JhbSAgICA9IHJlcXVpcmUoICcuL2NvcmUvU2hhZGVyUHJvZ3JhbScgKTtcbmV4cG9ydHMuVGlja2VyICAgICAgICAgICA9IHJlcXVpcmUoICcuL2NvcmUvVGlja2VyJyApO1xuZXhwb3J0cy5UcmFuc2Zvcm0gICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9UcmFuc2Zvcm0nICk7XG5leHBvcnRzLlZlY3RvcjJEICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL21hdGgvVmVjdG9yMkQnICk7XG5leHBvcnRzLlZlY3RvcjNEICAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL21hdGgvVmVjdG9yM0QnICk7XG5leHBvcnRzLmNvbnN0YW50cyAgICAgICAgPSByZXF1aXJlKCAnLi9jb3JlL2NvbnN0YW50cycgKTtcbmV4cG9ydHMuY3JlYXRlUmVuZGVyZXIgICA9IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvY3JlYXRlX3JlbmRlcmVyJyApO1xuZXhwb3J0cy5zaGFkZXJzICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9zaGFkZXJzJyApO1xuZXhwb3J0cy5tYXQzICAgICAgICAgICAgID0gcmVxdWlyZSggJy4vY29yZS9tYXRoL21hdDMnICk7XG5cbi8qKlxuICogXCJ2Ni5qc1wiIGJ1aWx0LWluIGRyYXdpbmcgZnVuY3Rpb25zLlxuICogQG5hbWVzcGFjZSB2Ni5zaGFwZXNcbiAqIEBzZWUgdjYuQWJzdHJhY3RSZW5kZXJlciNiZWdpblNoYXBlXG4gKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjdmVydGV4XG4gKiBAc2VlIHY2LkFic3RyYWN0UmVuZGVyZXIjZW5kU2hhcGVcbiAqIEBleGFtcGxlXG4gKiB2YXIgc2hhcGVzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvc2hhcGVzJyApO1xuICogQGV4YW1wbGVcbiAqIHJlbmRlcmVyLmJlZ2luU2hhcGUoIHtcbiAqICAgZHJhd0Z1bmN0aW9uOiBzaGFwZXMuZHJhd1BvaW50c1xuICogfSApO1xuICovXG5leHBvcnRzLnNoYXBlcyA9IHtcbiAgZHJhd1BvaW50czogcmVxdWlyZSggJy4vY29yZS9yZW5kZXJlci9zaGFwZXMvZHJhd19wb2ludHMnICksXG4gIGRyYXdMaW5lczogIHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvc2hhcGVzL2RyYXdfbGluZXMnIClcbn07XG5cbi8qKlxuICog0J3QsNGB0YLRgNC+0LnQutC4IFwidjYuanNcIi5cbiAqIEBuYW1lc3BhY2UgdjYuc2V0dGluZ3NcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNvcmUgU2V0dGluZ3M8L2NhcHRpb24+XG4gKiB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAndjYuanMvY29yZS9zZXR0aW5ncycgKTtcbiAqIHNldHRpbmdzLmRlZ3JlZXMgPSB0cnVlO1xuICogQGV4YW1wbGUgPGNhcHRpb24+UmVuZGVyZXIgU2V0dGluZ3M8L2NhcHRpb24+XG4gKiAvLyBEZWZhdWx0IHJlbmRlcmVyIHNldHRpbmdzLlxuICogdmFyIHNldHRpbmdzID0gcmVxdWlyZSggJ3Y2LmpzL2NvcmUvcmVuZGVyZXIvc2V0dGluZ3MnICk7XG4gKiBzZXR0aW5ncy5kZWdyZWVzID0gdHJ1ZTtcbiAqL1xuZXhwb3J0cy5zZXR0aW5ncyA9IHtcbiAgcmVuZGVyZXI6IHJlcXVpcmUoICcuL2NvcmUvcmVuZGVyZXIvc2V0dGluZ3MnICksXG4gIGNhbWVyYTogICByZXF1aXJlKCAnLi9jb3JlL2NhbWVyYS9zZXR0aW5ncycgKSxcbiAgY29yZTogICAgIHJlcXVpcmUoICcuL2NvcmUvc2V0dGluZ3MnIClcbn07XG5cbmlmICggdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICkge1xuICBzZWxmLnY2ID0gZXhwb3J0cztcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7c3RyaW5nfHY2LkhTTEF8djYuUkdCQX0gVENvbG9yXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5BIHN0cmluZyAoQ1NTIGNvbG9yKS48L2NhcHRpb24+XG4gKiB2YXIgY29sb3IgPSAncmdiYSggMjU1LCAwLCAyNTUsIDEgKSc7XG4gKiB2YXIgY29sb3IgPSAnaHNsKCAzNjAsIDEwMCUsIDUwJSApJztcbiAqIHZhciBjb2xvciA9ICcjZmYwMGZmJztcbiAqIHZhciBjb2xvciA9ICdsaWdodHBpbmsnO1xuICogLy8gXCJyZ2JhKDAsIDAsIDAsIDApXCJcbiAqIHZhciBjb2xvciA9IGdldENvbXB1dGVkU3R5bGUoIGRvY3VtZW50LmJvZHkgKS5nZXRQcm9wZXJ0eVZhbHVlKCAnYmFja2dyb3VuZC1jb2xvcicgKTtcbiAqIC8vIFRoZSBzYW1lIGFzIFwidHJhbnNwYXJlbnRcIi5cbiAqIC8vIE5PVEU6IENTUyBkb2VzIG5vdCBzdXBwb3J0IHRoaXMgc3ludGF4IGJ1dCBcInY2LmpzXCIgZG9lcy5cbiAqIHZhciBjb2xvciA9ICcjMDAwMDAwMDAnO1xuICogQGV4YW1wbGUgPGNhcHRpb24+QW4gb2JqZWN0ICh2Ni5SR0JBLCB2Ni5IU0xBKTwvY2FwdGlvbj5cbiAqIHZhciBjb2xvciA9IG5ldyBSR0JBKCAyNTUsIDAsIDI1NSwgMSApO1xuICogdmFyIGNvbG9yID0gbmV3IEhTTEEoIDM2MCwgMTAwLCA1MCApO1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge251bWJlcn0gY29uc3RhbnRcbiAqIEBzZWUgdjYuY29uc3RhbnRzXG4gKiBAZXhhbXBsZVxuICogLy8gVGhpcyBpcyBhIGNvbnN0YW50LlxuICogdmFyIFJFTkRFUkVSX1RZUEUgPSBjb25zdGFudHMuZ2V0KCAnR0wnICk7XG4gKi9cblxuLyoqXG4gKiBAaW50ZXJmYWNlIElWZWN0b3IyRFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHhcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5XG4gKi9cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIGxpZ2h0d2VpZ2h0IGltcGxlbWVudGF0aW9uIG9mIE5vZGUuanMgRXZlbnRFbWl0dGVyLlxuICogQGNvbnN0cnVjdG9yIExpZ2h0RW1pdHRlclxuICogQGV4YW1wbGVcbiAqIHZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCAnbGlnaHRfZW1pdHRlcicgKTtcbiAqL1xuZnVuY3Rpb24gTGlnaHRFbWl0dGVyICgpIHt9XG5cbkxpZ2h0RW1pdHRlci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNlbWl0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gICAqIEBwYXJhbSB7Li4uYW55fSBbZGF0YV1cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZW1pdDogZnVuY3Rpb24gZW1pdCAoIHR5cGUgKSB7XG4gICAgdmFyIGxpc3QgPSBfZ2V0TGlzdCggdGhpcywgdHlwZSApO1xuICAgIHZhciBkYXRhLCBpLCBsO1xuXG4gICAgaWYgKCAhIGxpc3QgKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPiAxICkge1xuICAgICAgZGF0YSA9IFtdLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApO1xuICAgIH1cblxuICAgIGZvciAoIGkgPSAwLCBsID0gbGlzdC5sZW5ndGg7IGkgPCBsOyArK2kgKSB7XG4gICAgICBpZiAoICEgbGlzdFsgaSBdLmFjdGl2ZSApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmICggbGlzdFsgaSBdLm9uY2UgKSB7XG4gICAgICAgIGxpc3RbIGkgXS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBkYXRhICkge1xuICAgICAgICBsaXN0WyBpIF0ubGlzdGVuZXIuYXBwbHkoIHRoaXMsIGRhdGEgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3RbIGkgXS5saXN0ZW5lci5jYWxsKCB0aGlzICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI29mZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbdHlwZV1cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2xpc3RlbmVyXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvZmY6IGZ1bmN0aW9uIG9mZiAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIHZhciBsaXN0LCBpO1xuXG4gICAgaWYgKCAhIHR5cGUgKSB7XG4gICAgICB0aGlzLl9ldmVudHMgPSBudWxsO1xuICAgIH0gZWxzZSBpZiAoICggbGlzdCA9IF9nZXRMaXN0KCB0aGlzLCB0eXBlICkgKSApIHtcbiAgICAgIGlmICggbGlzdGVuZXIgKSB7XG4gICAgICAgIGZvciAoIGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgIGlmICggbGlzdFsgaSBdLmxpc3RlbmVyID09PSBsaXN0ZW5lciAmJiBsaXN0WyBpIF0uYWN0aXZlICkge1xuICAgICAgICAgICAgbGlzdFsgaSBdLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gICB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uOiBmdW5jdGlvbiBvbiAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIF9vbiggdGhpcywgdHlwZSwgbGlzdGVuZXIgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb25jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uY2U6IGZ1bmN0aW9uIG9uY2UgKCB0eXBlLCBsaXN0ZW5lciApIHtcbiAgICBfb24oIHRoaXMsIHR5cGUsIGxpc3RlbmVyLCB0cnVlICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IExpZ2h0RW1pdHRlclxufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBfb25cbiAqIEBwYXJhbSAge0xpZ2h0RW1pdHRlcn0gc2VsZlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICB0eXBlXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gICAgIGxpc3RlbmVyXG4gKiBAcGFyYW0gIHtib29sZWFufSAgICAgIG9uY2VcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9vbiAoIHNlbGYsIHR5cGUsIGxpc3RlbmVyLCBvbmNlICkge1xuICB2YXIgZW50aXR5ID0ge1xuICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcbiAgICBhY3RpdmU6ICAgdHJ1ZSxcbiAgICB0eXBlOiAgICAgdHlwZSxcbiAgICBvbmNlOiAgICAgb25jZVxuICB9O1xuXG4gIGlmICggISBzZWxmLl9ldmVudHMgKSB7XG4gICAgc2VsZi5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZSggbnVsbCApO1xuICB9XG5cbiAgaWYgKCAhIHNlbGYuX2V2ZW50c1sgdHlwZSBdICkge1xuICAgIHNlbGYuX2V2ZW50c1sgdHlwZSBdID0gW107XG4gIH1cblxuICBzZWxmLl9ldmVudHNbIHR5cGUgXS5wdXNoKCBlbnRpdHkgKTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBfZ2V0TGlzdFxuICogQHBhcmFtICB7TGlnaHRFbWl0dGVyfSAgIHNlbGZcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICB0eXBlXG4gKiBAcmV0dXJuIHthcnJheTxvYmplY3Q+P31cbiAqL1xuZnVuY3Rpb24gX2dldExpc3QgKCBzZWxmLCB0eXBlICkge1xuICByZXR1cm4gc2VsZi5fZXZlbnRzICYmIHNlbGYuX2V2ZW50c1sgdHlwZSBdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpZ2h0RW1pdHRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfdGhyb3dBcmd1bWVudEV4Y2VwdGlvbiAoIHVuZXhwZWN0ZWQsIGV4cGVjdGVkICkge1xuICB0aHJvdyBFcnJvciggJ1wiJyArIHRvU3RyaW5nLmNhbGwoIHVuZXhwZWN0ZWQgKSArICdcIiBpcyBub3QgJyArIGV4cGVjdGVkICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHlwZSA9IHJlcXVpcmUoICcuL3R5cGUnICk7XG52YXIgbGFzdFJlcyA9ICd1bmRlZmluZWQnO1xudmFyIGxhc3RWYWw7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX3R5cGUgKCB2YWwgKSB7XG4gIGlmICggdmFsID09PSBsYXN0VmFsICkge1xuICAgIHJldHVybiBsYXN0UmVzO1xuICB9XG5cbiAgcmV0dXJuICggbGFzdFJlcyA9IHR5cGUoIGxhc3RWYWwgPSB2YWwgKSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfdW5lc2NhcGUgKCBzdHJpbmcgKSB7XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZSggL1xcXFwoXFxcXCk/L2csICckMScgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc3NldCA9IHJlcXVpcmUoICcuLi9pc3NldCcgKTtcblxudmFyIHVuZGVmaW5lZDsgLy8ganNoaW50IGlnbm9yZTogbGluZVxuXG52YXIgZGVmaW5lR2V0dGVyID0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZUdldHRlcl9fLFxuICAgIGRlZmluZVNldHRlciA9IE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVTZXR0ZXJfXztcblxuZnVuY3Rpb24gYmFzZURlZmluZVByb3BlcnR5ICggb2JqZWN0LCBrZXksIGRlc2NyaXB0b3IgKSB7XG4gIHZhciBoYXNHZXR0ZXIgPSBpc3NldCggJ2dldCcsIGRlc2NyaXB0b3IgKSxcbiAgICAgIGhhc1NldHRlciA9IGlzc2V0KCAnc2V0JywgZGVzY3JpcHRvciApLFxuICAgICAgZ2V0LCBzZXQ7XG5cbiAgaWYgKCBoYXNHZXR0ZXIgfHwgaGFzU2V0dGVyICkge1xuICAgIGlmICggaGFzR2V0dGVyICYmIHR5cGVvZiAoIGdldCA9IGRlc2NyaXB0b3IuZ2V0ICkgIT09ICdmdW5jdGlvbicgKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoICdHZXR0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uOiAnICsgZ2V0ICk7XG4gICAgfVxuXG4gICAgaWYgKCBoYXNTZXR0ZXIgJiYgdHlwZW9mICggc2V0ID0gZGVzY3JpcHRvci5zZXQgKSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ1NldHRlciBtdXN0IGJlIGEgZnVuY3Rpb246ICcgKyBzZXQgKTtcbiAgICB9XG5cbiAgICBpZiAoIGlzc2V0KCAnd3JpdGFibGUnLCBkZXNjcmlwdG9yICkgKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoICdJbnZhbGlkIHByb3BlcnR5IGRlc2NyaXB0b3IuIENhbm5vdCBib3RoIHNwZWNpZnkgYWNjZXNzb3JzIGFuZCBhIHZhbHVlIG9yIHdyaXRhYmxlIGF0dHJpYnV0ZScgKTtcbiAgICB9XG5cbiAgICBpZiAoIGRlZmluZUdldHRlciApIHtcbiAgICAgIGlmICggaGFzR2V0dGVyICkge1xuICAgICAgICBkZWZpbmVHZXR0ZXIuY2FsbCggb2JqZWN0LCBrZXksIGdldCApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIGhhc1NldHRlciApIHtcbiAgICAgICAgZGVmaW5lU2V0dGVyLmNhbGwoIG9iamVjdCwga2V5LCBzZXQgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoICdDYW5ub3QgZGVmaW5lIGdldHRlciBvciBzZXR0ZXInICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCBpc3NldCggJ3ZhbHVlJywgZGVzY3JpcHRvciApICkge1xuICAgIG9iamVjdFsga2V5IF0gPSBkZXNjcmlwdG9yLnZhbHVlO1xuICB9IGVsc2UgaWYgKCAhIGlzc2V0KCBrZXksIG9iamVjdCApICkge1xuICAgIG9iamVjdFsga2V5IF0gPSB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gb2JqZWN0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VEZWZpbmVQcm9wZXJ0eTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlRXhlYyAoIHJlZ2V4cCwgc3RyaW5nICkge1xuICB2YXIgcmVzdWx0ID0gW10sXG4gICAgICB2YWx1ZTtcblxuICByZWdleHAubGFzdEluZGV4ID0gMDtcblxuICB3aGlsZSAoICggdmFsdWUgPSByZWdleHAuZXhlYyggc3RyaW5nICkgKSApIHtcbiAgICByZXN1bHQucHVzaCggdmFsdWUgKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FsbEl0ZXJhdGVlID0gcmVxdWlyZSggJy4uL2NhbGwtaXRlcmF0ZWUnICksXG4gICAgaXNzZXQgICAgICAgID0gcmVxdWlyZSggJy4uL2lzc2V0JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VGb3JFYWNoICggYXJyLCBmbiwgY3R4LCBmcm9tUmlnaHQgKSB7XG4gIHZhciBpLCBqLCBpZHg7XG5cbiAgZm9yICggaSA9IC0xLCBqID0gYXJyLmxlbmd0aCAtIDE7IGogPj0gMDsgLS1qICkge1xuICAgIGlmICggZnJvbVJpZ2h0ICkge1xuICAgICAgaWR4ID0gajtcbiAgICB9IGVsc2Uge1xuICAgICAgaWR4ID0gKytpO1xuICAgIH1cblxuICAgIGlmICggaXNzZXQoIGlkeCwgYXJyICkgJiYgY2FsbEl0ZXJhdGVlKCBmbiwgY3R4LCBhcnJbIGlkeCBdLCBpZHgsIGFyciApID09PSBmYWxzZSApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcnI7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2FsbEl0ZXJhdGVlID0gcmVxdWlyZSggJy4uL2NhbGwtaXRlcmF0ZWUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUZvckluICggb2JqLCBmbiwgY3R4LCBmcm9tUmlnaHQsIGtleXMgKSB7XG4gIHZhciBpLCBqLCBrZXk7XG5cbiAgZm9yICggaSA9IC0xLCBqID0ga2V5cy5sZW5ndGggLSAxOyBqID49IDA7IC0taiApIHtcbiAgICBpZiAoIGZyb21SaWdodCApIHtcbiAgICAgIGtleSA9IGtleXNbIGogXTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0ga2V5c1sgKytpIF07XG4gICAgfVxuXG4gICAgaWYgKCBjYWxsSXRlcmF0ZWUoIGZuLCBjdHgsIG9ialsga2V5IF0sIGtleSwgb2JqICkgPT09IGZhbHNlICkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc3NldCA9IHJlcXVpcmUoICcuLi9pc3NldCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlR2V0ICggb2JqLCBwYXRoLCBvZmYgKSB7XG4gIHZhciBsID0gcGF0aC5sZW5ndGggLSBvZmYsXG4gICAgICBpID0gMCxcbiAgICAgIGtleTtcblxuICBmb3IgKCA7IGkgPCBsOyArK2kgKSB7XG4gICAga2V5ID0gcGF0aFsgaSBdO1xuXG4gICAgaWYgKCBpc3NldCgga2V5LCBvYmogKSApIHtcbiAgICAgIG9iaiA9IG9ialsga2V5IF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VUb0luZGV4ID0gcmVxdWlyZSggJy4vYmFzZS10by1pbmRleCcgKTtcblxudmFyIGluZGV4T2YgICAgID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YsXG4gICAgbGFzdEluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2Y7XG5cbmZ1bmN0aW9uIGJhc2VJbmRleE9mICggYXJyLCBzZWFyY2gsIGZyb21JbmRleCwgZnJvbVJpZ2h0ICkge1xuICB2YXIgbCwgaSwgaiwgaWR4LCB2YWw7XG5cbiAgLy8gdXNlIHRoZSBuYXRpdmUgZnVuY3Rpb24gaWYgaXQgaXMgc3VwcG9ydGVkIGFuZCB0aGUgc2VhcmNoIGlzIG5vdCBuYW4uXG5cbiAgaWYgKCBzZWFyY2ggPT09IHNlYXJjaCAmJiAoIGlkeCA9IGZyb21SaWdodCA/IGxhc3RJbmRleE9mIDogaW5kZXhPZiApICkge1xuICAgIHJldHVybiBpZHguY2FsbCggYXJyLCBzZWFyY2gsIGZyb21JbmRleCApO1xuICB9XG5cbiAgbCA9IGFyci5sZW5ndGg7XG5cbiAgaWYgKCAhIGwgKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgaiA9IGwgLSAxO1xuXG4gIGlmICggdHlwZW9mIGZyb21JbmRleCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgZnJvbUluZGV4ID0gYmFzZVRvSW5kZXgoIGZyb21JbmRleCwgbCApO1xuXG4gICAgaWYgKCBmcm9tUmlnaHQgKSB7XG4gICAgICBqID0gTWF0aC5taW4oIGosIGZyb21JbmRleCApO1xuICAgIH0gZWxzZSB7XG4gICAgICBqID0gTWF0aC5tYXgoIDAsIGZyb21JbmRleCApO1xuICAgIH1cblxuICAgIGkgPSBqIC0gMTtcbiAgfSBlbHNlIHtcbiAgICBpID0gLTE7XG4gIH1cblxuICBmb3IgKCA7IGogPj0gMDsgLS1qICkge1xuICAgIGlmICggZnJvbVJpZ2h0ICkge1xuICAgICAgaWR4ID0gajtcbiAgICB9IGVsc2Uge1xuICAgICAgaWR4ID0gKytpO1xuICAgIH1cblxuICAgIHZhbCA9IGFyclsgaWR4IF07XG5cbiAgICBpZiAoIHZhbCA9PT0gc2VhcmNoIHx8IHNlYXJjaCAhPT0gc2VhcmNoICYmIHZhbCAhPT0gdmFsICkge1xuICAgICAgcmV0dXJuIGlkeDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUluZGV4T2Y7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlSW5kZXhPZiA9IHJlcXVpcmUoICcuL2Jhc2UtaW5kZXgtb2YnICk7XG5cbnZhciBzdXBwb3J0ID0gcmVxdWlyZSggJy4uL3N1cHBvcnQvc3VwcG9ydC1rZXlzJyApO1xuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgaywgZml4S2V5cztcblxuaWYgKCBzdXBwb3J0ID09PSAnbm90LXN1cHBvcnRlZCcgKSB7XG4gIGsgPSBbXG4gICAgJ3RvU3RyaW5nJyxcbiAgICAndG9Mb2NhbGVTdHJpbmcnLFxuICAgICd2YWx1ZU9mJyxcbiAgICAnaGFzT3duUHJvcGVydHknLFxuICAgICdpc1Byb3RvdHlwZU9mJyxcbiAgICAncHJvcGVydHlJc0VudW1lcmFibGUnLFxuICAgICdjb25zdHJ1Y3RvcidcbiAgXTtcblxuICBmaXhLZXlzID0gZnVuY3Rpb24gZml4S2V5cyAoIGtleXMsIG9iamVjdCApIHtcbiAgICB2YXIgaSwga2V5O1xuXG4gICAgZm9yICggaSA9IGsubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICBpZiAoIGJhc2VJbmRleE9mKCBrZXlzLCBrZXkgPSBrWyBpIF0gKSA8IDAgJiYgaGFzT3duUHJvcGVydHkuY2FsbCggb2JqZWN0LCBrZXkgKSApIHtcbiAgICAgICAga2V5cy5wdXNoKCBrZXkgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ga2V5cztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlS2V5cyAoIG9iamVjdCApIHtcbiAgdmFyIGtleXMgPSBbXTtcblxuICB2YXIga2V5O1xuXG4gIGZvciAoIGtleSBpbiBvYmplY3QgKSB7XG4gICAgaWYgKCBoYXNPd25Qcm9wZXJ0eS5jYWxsKCBvYmplY3QsIGtleSApICkge1xuICAgICAga2V5cy5wdXNoKCBrZXkgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIHN1cHBvcnQgIT09ICdub3Qtc3VwcG9ydGVkJyApIHtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIHJldHVybiBmaXhLZXlzKCBrZXlzLCBvYmplY3QgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXQgPSByZXF1aXJlKCAnLi9iYXNlLWdldCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlUHJvcGVydHkgKCBvYmplY3QsIHBhdGggKSB7XG4gIGlmICggb2JqZWN0ICE9IG51bGwgKSB7XG4gICAgaWYgKCBwYXRoLmxlbmd0aCA+IDEgKSB7XG4gICAgICByZXR1cm4gZ2V0KCBvYmplY3QsIHBhdGgsIDAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0WyBwYXRoWyAwIF0gXTtcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlVG9JbmRleCAoIHYsIGwgKSB7XG4gIGlmICggISBsIHx8ICEgdiApIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGlmICggdiA8IDAgKSB7XG4gICAgdiArPSBsO1xuICB9XG5cbiAgcmV0dXJuIHYgfHwgMDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfdGhyb3dBcmd1bWVudEV4Y2VwdGlvbiA9IHJlcXVpcmUoICcuL190aHJvdy1hcmd1bWVudC1leGNlcHRpb24nICk7XG52YXIgZGVmYXVsdFRvID0gcmVxdWlyZSggJy4vZGVmYXVsdC10bycgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiZWZvcmUgKCBuLCBmbiApIHtcbiAgdmFyIHZhbHVlO1xuXG4gIGlmICggdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nICkge1xuICAgIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uKCBmbiwgJ2EgZnVuY3Rpb24nICk7XG4gIH1cblxuICBuID0gZGVmYXVsdFRvKCBuLCAxICk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIC0tbiA+PSAwICkge1xuICAgICAgdmFsdWUgPSBmbi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsSXRlcmF0ZWUgKCBmbiwgY3R4LCB2YWwsIGtleSwgb2JqICkge1xuICBpZiAoIHR5cGVvZiBjdHggPT09ICd1bmRlZmluZWQnICkge1xuICAgIHJldHVybiBmbiggdmFsLCBrZXksIG9iaiApO1xuICB9XG5cbiAgcmV0dXJuIGZuLmNhbGwoIGN0eCwgdmFsLCBrZXksIG9iaiApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJhc2VFeGVjICA9IHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1leGVjJyApLFxuICAgIF91bmVzY2FwZSA9IHJlcXVpcmUoICcuL191bmVzY2FwZScgKSxcbiAgICBpc0tleSAgICAgPSByZXF1aXJlKCAnLi9pcy1rZXknICksXG4gICAgdG9LZXkgICAgID0gcmVxdWlyZSggJy4vdG8ta2V5JyApLFxuICAgIF90eXBlICAgICA9IHJlcXVpcmUoICcuL190eXBlJyApO1xuXG52YXIgclByb3BlcnR5ID0gLyhefFxcLilcXHMqKFtfYS16XVxcdyopXFxzKnxcXFtcXHMqKCg/Oi0pPyg/OlxcZCt8XFxkKlxcLlxcZCspfChcInwnKSgoW15cXFxcXVxcXFwoXFxcXFxcXFwpKnxbXlxcNF0pKilcXDQpXFxzKlxcXS9naTtcblxuZnVuY3Rpb24gc3RyaW5nVG9QYXRoICggc3RyICkge1xuICB2YXIgcGF0aCA9IGJhc2VFeGVjKCByUHJvcGVydHksIHN0ciApLFxuICAgICAgaSA9IHBhdGgubGVuZ3RoIC0gMSxcbiAgICAgIHZhbDtcblxuICBmb3IgKCA7IGkgPj0gMDsgLS1pICkge1xuICAgIHZhbCA9IHBhdGhbIGkgXTtcblxuICAgIC8vIC5uYW1lXG4gICAgaWYgKCB2YWxbIDIgXSApIHtcbiAgICAgIHBhdGhbIGkgXSA9IHZhbFsgMiBdO1xuICAgIC8vIFsgXCJcIiBdIHx8IFsgJycgXVxuICAgIH0gZWxzZSBpZiAoIHZhbFsgNSBdICE9IG51bGwgKSB7XG4gICAgICBwYXRoWyBpIF0gPSBfdW5lc2NhcGUoIHZhbFsgNSBdICk7XG4gICAgLy8gWyAwIF1cbiAgICB9IGVsc2Uge1xuICAgICAgcGF0aFsgaSBdID0gdmFsWyAzIF07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG5cbmZ1bmN0aW9uIGNhc3RQYXRoICggdmFsICkge1xuICB2YXIgcGF0aCwgbCwgaTtcblxuICBpZiAoIGlzS2V5KCB2YWwgKSApIHtcbiAgICByZXR1cm4gWyB0b0tleSggdmFsICkgXTtcbiAgfVxuXG4gIGlmICggX3R5cGUoIHZhbCApID09PSAnYXJyYXknICkge1xuICAgIHBhdGggPSBBcnJheSggbCA9IHZhbC5sZW5ndGggKTtcblxuICAgIGZvciAoIGkgPSBsIC0gMTsgaSA+PSAwOyAtLWkgKSB7XG4gICAgICBwYXRoWyBpIF0gPSB0b0tleSggdmFsWyBpIF0gKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcGF0aCA9IHN0cmluZ1RvUGF0aCggJycgKyB2YWwgKTtcbiAgfVxuXG4gIHJldHVybiBwYXRoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNhc3RQYXRoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNsYW1wICggdmFsdWUsIGxvd2VyLCB1cHBlciApIHtcbiAgaWYgKCB2YWx1ZSA+PSB1cHBlciApIHtcbiAgICByZXR1cm4gdXBwZXI7XG4gIH1cblxuICBpZiAoIHZhbHVlIDw9IGxvd2VyICkge1xuICAgIHJldHVybiBsb3dlcjtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcmVhdGUgICAgICAgICA9IHJlcXVpcmUoICcuL2NyZWF0ZScgKSxcbiAgICBnZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoICcuL2dldC1wcm90b3R5cGUtb2YnICksXG4gICAgdG9PYmplY3QgICAgICAgPSByZXF1aXJlKCAnLi90by1vYmplY3QnICksXG4gICAgZWFjaCAgICAgICAgICAgPSByZXF1aXJlKCAnLi9lYWNoJyApLFxuICAgIGlzT2JqZWN0TGlrZSAgID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xvbmUgKCBkZWVwLCB0YXJnZXQsIGd1YXJkICkge1xuICB2YXIgY2xuO1xuXG4gIGlmICggdHlwZW9mIHRhcmdldCA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3VhcmQgKSB7XG4gICAgdGFyZ2V0ID0gZGVlcDtcbiAgICBkZWVwID0gdHJ1ZTtcbiAgfVxuXG4gIGNsbiA9IGNyZWF0ZSggZ2V0UHJvdG90eXBlT2YoIHRhcmdldCA9IHRvT2JqZWN0KCB0YXJnZXQgKSApICk7XG5cbiAgZWFjaCggdGFyZ2V0LCBmdW5jdGlvbiAoIHZhbHVlLCBrZXksIHRhcmdldCApIHtcbiAgICBpZiAoIHZhbHVlID09PSB0YXJnZXQgKSB7XG4gICAgICB0aGlzWyBrZXkgXSA9IHRoaXM7XG4gICAgfSBlbHNlIGlmICggZGVlcCAmJiBpc09iamVjdExpa2UoIHZhbHVlICkgKSB7XG4gICAgICB0aGlzWyBrZXkgXSA9IGNsb25lKCBkZWVwLCB2YWx1ZSApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyBrZXkgXSA9IHZhbHVlO1xuICAgIH1cbiAgfSwgY2xuICk7XG5cbiAgcmV0dXJuIGNsbjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBFUlI6IHtcbiAgICBJTlZBTElEX0FSR1M6ICAgICAgICAgICdJbnZhbGlkIGFyZ3VtZW50cycsXG4gICAgRlVOQ1RJT05fRVhQRUNURUQ6ICAgICAnRXhwZWN0ZWQgYSBmdW5jdGlvbicsXG4gICAgU1RSSU5HX0VYUEVDVEVEOiAgICAgICAnRXhwZWN0ZWQgYSBzdHJpbmcnLFxuICAgIFVOREVGSU5FRF9PUl9OVUxMOiAgICAgJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcsXG4gICAgUkVEVUNFX09GX0VNUFRZX0FSUkFZOiAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZScsXG4gICAgTk9fUEFUSDogICAgICAgICAgICAgICAnTm8gcGF0aCB3YXMgZ2l2ZW4nXG4gIH0sXG5cbiAgTUFYX0FSUkFZX0xFTkdUSDogNDI5NDk2NzI5NSxcbiAgTUFYX1NBRkVfSU5UOiAgICAgOTAwNzE5OTI1NDc0MDk5MSxcbiAgTUlOX1NBRkVfSU5UOiAgICAtOTAwNzE5OTI1NDc0MDk5MSxcblxuICBERUVQOiAgICAgICAgIDEsXG4gIERFRVBfS0VFUF9GTjogMixcblxuICBQTEFDRUhPTERFUjoge31cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZpbmVQcm9wZXJ0aWVzID0gcmVxdWlyZSggJy4vZGVmaW5lLXByb3BlcnRpZXMnICk7XG5cbnZhciBzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoICcuL3NldC1wcm90b3R5cGUtb2YnICk7XG5cbnZhciBpc1ByaW1pdGl2ZSA9IHJlcXVpcmUoICcuL2lzLXByaW1pdGl2ZScgKTtcblxuZnVuY3Rpb24gQyAoKSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gY3JlYXRlICggcHJvdG90eXBlLCBkZXNjcmlwdG9ycyApIHtcbiAgdmFyIG9iamVjdDtcblxuICBpZiAoIHByb3RvdHlwZSAhPT0gbnVsbCAmJiBpc1ByaW1pdGl2ZSggcHJvdG90eXBlICkgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCAnT2JqZWN0IHByb3RvdHlwZSBtYXkgb25seSBiZSBhbiBPYmplY3Qgb3IgbnVsbDogJyArIHByb3RvdHlwZSApO1xuICB9XG5cbiAgQy5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG5cbiAgb2JqZWN0ID0gbmV3IEMoKTtcblxuICBDLnByb3RvdHlwZSA9IG51bGw7XG5cbiAgaWYgKCBwcm90b3R5cGUgPT09IG51bGwgKSB7XG4gICAgc2V0UHJvdG90eXBlT2YoIG9iamVjdCwgbnVsbCApO1xuICB9XG5cbiAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID49IDIgKSB7XG4gICAgZGVmaW5lUHJvcGVydGllcyggb2JqZWN0LCBkZXNjcmlwdG9ycyApO1xuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiYXNlRm9yRWFjaCAgPSByZXF1aXJlKCAnLi4vYmFzZS9iYXNlLWZvci1lYWNoJyApLFxuICAgIGJhc2VGb3JJbiAgICA9IHJlcXVpcmUoICcuLi9iYXNlL2Jhc2UtZm9yLWluJyApLFxuICAgIGlzQXJyYXlMaWtlICA9IHJlcXVpcmUoICcuLi9pcy1hcnJheS1saWtlJyApLFxuICAgIHRvT2JqZWN0ICAgICA9IHJlcXVpcmUoICcuLi90by1vYmplY3QnICksXG4gICAgaXRlcmF0ZWUgICAgID0gcmVxdWlyZSggJy4uL2l0ZXJhdGVlJyApLml0ZXJhdGVlLFxuICAgIGtleXMgICAgICAgICA9IHJlcXVpcmUoICcuLi9rZXlzJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUVhY2ggKCBmcm9tUmlnaHQgKSB7XG4gIHJldHVybiBmdW5jdGlvbiBlYWNoICggb2JqLCBmbiwgY3R4ICkge1xuXG4gICAgb2JqID0gdG9PYmplY3QoIG9iaiApO1xuXG4gICAgZm4gID0gaXRlcmF0ZWUoIGZuICk7XG5cbiAgICBpZiAoIGlzQXJyYXlMaWtlKCBvYmogKSApIHtcbiAgICAgIHJldHVybiBiYXNlRm9yRWFjaCggb2JqLCBmbiwgY3R4LCBmcm9tUmlnaHQgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYmFzZUZvckluKCBvYmosIGZuLCBjdHgsIGZyb21SaWdodCwga2V5cyggb2JqICkgKTtcblxuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBNdXN0IGJlICdXaWR0aCcgb3IgJ0hlaWdodCcgKGNhcGl0YWxpemVkKS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVHZXRFbGVtZW50RGltZW5zaW9uICggbmFtZSApIHtcblxuICAvKipcbiAgICogQHBhcmFtIHtXaW5kb3d8Tm9kZX0gZVxuICAgKi9cbiAgcmV0dXJuIGZ1bmN0aW9uICggZSApIHtcblxuICAgIHZhciB2LCBiLCBkO1xuXG4gICAgLy8gaWYgdGhlIGVsZW1lbnQgaXMgYSB3aW5kb3dcblxuICAgIGlmICggZS53aW5kb3cgPT09IGUgKSB7XG5cbiAgICAgIC8vIGlubmVyV2lkdGggYW5kIGlubmVySGVpZ2h0IGluY2x1ZGVzIGEgc2Nyb2xsYmFyIHdpZHRoLCBidXQgaXQgaXMgbm90XG4gICAgICAvLyBzdXBwb3J0ZWQgYnkgb2xkZXIgYnJvd3NlcnNcblxuICAgICAgdiA9IE1hdGgubWF4KCBlWyAnaW5uZXInICsgbmFtZSBdIHx8IDAsIGUuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50WyAnY2xpZW50JyArIG5hbWUgXSApO1xuXG4gICAgLy8gaWYgdGhlIGVsZW1lbnRzIGlzIGEgZG9jdW1lbnRcblxuICAgIH0gZWxzZSBpZiAoIGUubm9kZVR5cGUgPT09IDkgKSB7XG5cbiAgICAgIGIgPSBlLmJvZHk7XG4gICAgICBkID0gZS5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgIHYgPSBNYXRoLm1heChcbiAgICAgICAgYlsgJ3Njcm9sbCcgKyBuYW1lIF0sXG4gICAgICAgIGRbICdzY3JvbGwnICsgbmFtZSBdLFxuICAgICAgICBiWyAnb2Zmc2V0JyArIG5hbWUgXSxcbiAgICAgICAgZFsgJ29mZnNldCcgKyBuYW1lIF0sXG4gICAgICAgIGJbICdjbGllbnQnICsgbmFtZSBdLFxuICAgICAgICBkWyAnY2xpZW50JyArIG5hbWUgXSApO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHYgPSBlWyAnY2xpZW50JyArIG5hbWUgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdjtcblxuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhc3RQYXRoID0gcmVxdWlyZSggJy4uL2Nhc3QtcGF0aCcgKSxcbiAgICBub29wICAgICA9IHJlcXVpcmUoICcuLi9ub29wJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZVByb3BlcnR5ICggYmFzZVByb3BlcnR5LCB1c2VBcmdzICkge1xuICByZXR1cm4gZnVuY3Rpb24gKCBwYXRoICkge1xuICAgIHZhciBhcmdzO1xuXG4gICAgaWYgKCAhICggcGF0aCA9IGNhc3RQYXRoKCBwYXRoICkgKS5sZW5ndGggKSB7XG4gICAgICByZXR1cm4gbm9vcDtcbiAgICB9XG5cbiAgICBpZiAoIHVzZUFyZ3MgKSB7XG4gICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoIG9iamVjdCApIHtcbiAgICAgIHJldHVybiBiYXNlUHJvcGVydHkoIG9iamVjdCwgcGF0aCwgYXJncyApO1xuICAgIH07XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmF1bHRUbyAoIHZhbHVlLCBkZWZhdWx0VmFsdWUgKSB7XG4gIGlmICggdmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSA9PT0gdmFsdWUgKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtaXhpbiA9IHJlcXVpcmUoICcuL21peGluJyApLFxuICAgIGNsb25lID0gcmVxdWlyZSggJy4vY2xvbmUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmYXVsdHMgKCBkZWZhdWx0cywgb2JqZWN0ICkge1xuICBpZiAoIG9iamVjdCA9PSBudWxsICkge1xuICAgIHJldHVybiBjbG9uZSggdHJ1ZSwgZGVmYXVsdHMgKTtcbiAgfVxuXG4gIHJldHVybiBtaXhpbiggdHJ1ZSwgY2xvbmUoIHRydWUsIGRlZmF1bHRzICksIG9iamVjdCApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN1cHBvcnQgPSByZXF1aXJlKCAnLi9zdXBwb3J0L3N1cHBvcnQtZGVmaW5lLXByb3BlcnR5JyApO1xuXG52YXIgZGVmaW5lUHJvcGVydGllcywgYmFzZURlZmluZVByb3BlcnR5LCBpc1ByaW1pdGl2ZSwgZWFjaDtcblxuaWYgKCBzdXBwb3J0ICE9PSAnZnVsbCcgKSB7XG4gIGlzUHJpbWl0aXZlICAgICAgICA9IHJlcXVpcmUoICcuL2lzLXByaW1pdGl2ZScgKTtcbiAgZWFjaCAgICAgICAgICAgICAgID0gcmVxdWlyZSggJy4vZWFjaCcgKTtcbiAgYmFzZURlZmluZVByb3BlcnR5ID0gcmVxdWlyZSggJy4vYmFzZS9iYXNlLWRlZmluZS1wcm9wZXJ0eScgKTtcblxuICBkZWZpbmVQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyAoIG9iamVjdCwgZGVzY3JpcHRvcnMgKSB7XG4gICAgaWYgKCBzdXBwb3J0ICE9PSAnbm90LXN1cHBvcnRlZCcgKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIG9iamVjdCwgZGVzY3JpcHRvcnMgKTtcbiAgICAgIH0gY2F0Y2ggKCBlICkge31cbiAgICB9XG5cbiAgICBpZiAoIGlzUHJpbWl0aXZlKCBvYmplY3QgKSApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ2RlZmluZVByb3BlcnRpZXMgY2FsbGVkIG9uIG5vbi1vYmplY3QnICk7XG4gICAgfVxuXG4gICAgaWYgKCBpc1ByaW1pdGl2ZSggZGVzY3JpcHRvcnMgKSApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvciggJ1Byb3BlcnR5IGRlc2NyaXB0aW9uIG11c3QgYmUgYW4gb2JqZWN0OiAnICsgZGVzY3JpcHRvcnMgKTtcbiAgICB9XG5cbiAgICBlYWNoKCBkZXNjcmlwdG9ycywgZnVuY3Rpb24gKCBkZXNjcmlwdG9yLCBrZXkgKSB7XG4gICAgICBpZiAoIGlzUHJpbWl0aXZlKCBkZXNjcmlwdG9yICkgKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvciggJ1Byb3BlcnR5IGRlc2NyaXB0aW9uIG11c3QgYmUgYW4gb2JqZWN0OiAnICsgZGVzY3JpcHRvciApO1xuICAgICAgfVxuXG4gICAgICBiYXNlRGVmaW5lUHJvcGVydHkoIHRoaXMsIGtleSwgZGVzY3JpcHRvciApO1xuICAgIH0sIG9iamVjdCApO1xuXG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfTtcbn0gZWxzZSB7XG4gIGRlZmluZVByb3BlcnRpZXMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZpbmVQcm9wZXJ0aWVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoICcuL2NyZWF0ZS9jcmVhdGUtZWFjaCcgKSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoICcuL2NyZWF0ZS9jcmVhdGUtZ2V0LWVsZW1lbnQtZGltZW5zaW9uJyApKCAnSGVpZ2h0JyApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoICcuL2NyZWF0ZS9jcmVhdGUtZ2V0LWVsZW1lbnQtZGltZW5zaW9uJyApKCAnV2lkdGgnICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBFUlIgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuRVJSO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBnZXRQcm90b3R5cGVPZiAoIG9iaiApIHtcbiAgdmFyIHByb3RvdHlwZTtcblxuICBpZiAoIG9iaiA9PSBudWxsICkge1xuICAgIHRocm93IFR5cGVFcnJvciggRVJSLlVOREVGSU5FRF9PUl9OVUxMICk7XG4gIH1cblxuICBwcm90b3R5cGUgPSBvYmouX19wcm90b19fOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG5cbiAgaWYgKCB0eXBlb2YgcHJvdG90eXBlICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICByZXR1cm4gcHJvdG90eXBlO1xuICB9XG5cbiAgaWYgKCB0b1N0cmluZy5jYWxsKCBvYmouY29uc3RydWN0b3IgKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJyApIHtcbiAgICByZXR1cm4gb2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICksXG4gICAgaXNMZW5ndGggICAgID0gcmVxdWlyZSggJy4vaXMtbGVuZ3RoJyApLFxuICAgIGlzV2luZG93TGlrZSA9IHJlcXVpcmUoICcuL2lzLXdpbmRvdy1saWtlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXJyYXlMaWtlT2JqZWN0ICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiYgaXNMZW5ndGgoIHZhbHVlLmxlbmd0aCApICYmICEgaXNXaW5kb3dMaWtlKCB2YWx1ZSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzTGVuZ3RoICAgICA9IHJlcXVpcmUoICcuL2lzLWxlbmd0aCcgKSxcbiAgICBpc1dpbmRvd0xpa2UgPSByZXF1aXJlKCAnLi9pcy13aW5kb3ctbGlrZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FycmF5TGlrZSAoIHZhbHVlICkge1xuICBpZiAoIHZhbHVlID09IG51bGwgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkge1xuICAgIHJldHVybiBpc0xlbmd0aCggdmFsdWUubGVuZ3RoICkgJiYgIWlzV2luZG93TGlrZSggdmFsdWUgKTtcbiAgfVxuXG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoICcuL2lzLW9iamVjdC1saWtlJyApLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSggJy4vaXMtbGVuZ3RoJyApO1xuXG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIGlzQXJyYXkgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSggdmFsdWUgKSAmJlxuICAgIGlzTGVuZ3RoKCB2YWx1ZS5sZW5ndGggKSAmJlxuICAgIHRvU3RyaW5nLmNhbGwoIHZhbHVlICkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3R5cGUgICAgPSByZXF1aXJlKCAnLi9fdHlwZScgKTtcblxudmFyIHJEZWVwS2V5ID0gLyhefFteXFxcXF0pKFxcXFxcXFxcKSooXFwufFxcWykvO1xuXG5mdW5jdGlvbiBpc0tleSAoIHZhbCApIHtcbiAgdmFyIHR5cGU7XG5cbiAgaWYgKCAhIHZhbCApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICggX3R5cGUoIHZhbCApID09PSAnYXJyYXknICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHR5cGUgPSB0eXBlb2YgdmFsO1xuXG4gIGlmICggdHlwZSA9PT0gJ251bWJlcicgfHwgdHlwZSA9PT0gJ2Jvb2xlYW4nIHx8IF90eXBlKCB2YWwgKSA9PT0gJ3N5bWJvbCcgKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gISByRGVlcEtleS50ZXN0KCB2YWwgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0tleTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIE1BWF9BUlJBWV9MRU5HVEggPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuTUFYX0FSUkFZX0xFTkdUSDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0xlbmd0aCAoIHZhbHVlICkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJlxuICAgIHZhbHVlID49IDAgJiZcbiAgICB2YWx1ZSA8PSBNQVhfQVJSQVlfTEVOR1RIICYmXG4gICAgdmFsdWUgJSAxID09PSAwO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdExpa2UgKCB2YWx1ZSApIHtcbiAgcmV0dXJuICEhIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSggJy4vaXMtb2JqZWN0LWxpa2UnICk7XG5cbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0ICggdmFsdWUgKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UoIHZhbHVlICkgJiZcbiAgICB0b1N0cmluZy5jYWxsKCB2YWx1ZSApID09PSAnW29iamVjdCBPYmplY3RdJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoICcuL2dldC1wcm90b3R5cGUtb2YnICk7XG5cbnZhciBpc09iamVjdCA9IHJlcXVpcmUoICcuL2lzLW9iamVjdCcgKTtcblxudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxudmFyIHRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xuXG52YXIgT0JKRUNUID0gdG9TdHJpbmcuY2FsbCggT2JqZWN0ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdCAoIHYgKSB7XG4gIHZhciBwLCBjO1xuXG4gIGlmICggISBpc09iamVjdCggdiApICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHAgPSBnZXRQcm90b3R5cGVPZiggdiApO1xuXG4gIGlmICggcCA9PT0gbnVsbCApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICggISBoYXNPd25Qcm9wZXJ0eS5jYWxsKCBwLCAnY29uc3RydWN0b3InICkgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgYyA9IHAuY29uc3RydWN0b3I7XG5cbiAgcmV0dXJuIHR5cGVvZiBjID09PSAnZnVuY3Rpb24nICYmIHRvU3RyaW5nLmNhbGwoIGMgKSA9PT0gT0JKRUNUO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1ByaW1pdGl2ZSAoIHZhbHVlICkge1xuICByZXR1cm4gISB2YWx1ZSB8fFxuICAgIHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2YgdmFsdWUgIT09ICdmdW5jdGlvbic7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHlwZSA9IHJlcXVpcmUoICcuL3R5cGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNTeW1ib2wgKCB2YWx1ZSApIHtcbiAgcmV0dXJuIHR5cGUoIHZhbHVlICkgPT09ICdzeW1ib2wnO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoICcuL2lzLW9iamVjdC1saWtlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzV2luZG93TGlrZSAoIHZhbHVlICkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKCB2YWx1ZSApICYmIHZhbHVlLndpbmRvdyA9PT0gdmFsdWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzc2V0ICgga2V5LCBvYmogKSB7XG4gIGlmICggb2JqID09IG51bGwgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHR5cGVvZiBvYmpbIGtleSBdICE9PSAndW5kZWZpbmVkJyB8fCBrZXkgaW4gb2JqO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzQXJyYXlMaWtlT2JqZWN0ID0gcmVxdWlyZSggJy4vaXMtYXJyYXktbGlrZS1vYmplY3QnICksXG4gICAgbWF0Y2hlc1Byb3BlcnR5ICAgPSByZXF1aXJlKCAnLi9tYXRjaGVzLXByb3BlcnR5JyApLFxuICAgIHByb3BlcnR5ICAgICAgICAgID0gcmVxdWlyZSggJy4vcHJvcGVydHknICk7XG5cbmV4cG9ydHMuaXRlcmF0ZWUgPSBmdW5jdGlvbiBpdGVyYXRlZSAoIHZhbHVlICkge1xuICBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBpZiAoIGlzQXJyYXlMaWtlT2JqZWN0KCB2YWx1ZSApICkge1xuICAgIHJldHVybiBtYXRjaGVzUHJvcGVydHkoIHZhbHVlICk7XG4gIH1cblxuICByZXR1cm4gcHJvcGVydHkoIHZhbHVlICk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmFzZUtleXMgPSByZXF1aXJlKCAnLi9iYXNlL2Jhc2Uta2V5cycgKTtcbnZhciB0b09iamVjdCA9IHJlcXVpcmUoICcuL3RvLW9iamVjdCcgKTtcbnZhciBzdXBwb3J0ICA9IHJlcXVpcmUoICcuL3N1cHBvcnQvc3VwcG9ydC1rZXlzJyApO1xuXG5pZiAoIHN1cHBvcnQgIT09ICdlczIwMTUnICkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGtleXMgKCB2ICkge1xuICAgIHZhciBfa2V5cztcblxuICAgIC8qKlxuICAgICAqICsgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSArXG4gICAgICogfCBJIHRlc3RlZCB0aGUgZnVuY3Rpb25zIHdpdGggc3RyaW5nWzIwNDhdIChhbiBhcnJheSBvZiBzdHJpbmdzKSBhbmQgaGFkIHxcbiAgICAgKiB8IHRoaXMgcmVzdWx0cyBpbiBub2RlLmpzICh2OC4xMC4wKTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAqICsgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSArXG4gICAgICogfCBiYXNlS2V5cyB4IDEwLDY3NCBvcHMvc2VjIMKxMC4yMyUgKDk0IHJ1bnMgc2FtcGxlZCkgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICogfCBPYmplY3Qua2V5cyB4IDIyLDE0NyBvcHMvc2VjIMKxMC4yMyUgKDk1IHJ1bnMgc2FtcGxlZCkgICAgICAgICAgICAgICAgICB8XG4gICAgICogfCBGYXN0ZXN0IGlzIFwiT2JqZWN0LmtleXNcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAqICsgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSArXG4gICAgICovXG5cbiAgICBpZiAoIHN1cHBvcnQgPT09ICdlczUnICkge1xuICAgICAgX2tleXMgPSBPYmplY3Qua2V5cztcbiAgICB9IGVsc2Uge1xuICAgICAgX2tleXMgPSBiYXNlS2V5cztcbiAgICB9XG5cbiAgICByZXR1cm4gX2tleXMoIHRvT2JqZWN0KCB2ICkgKTtcbiAgfTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmtleXM7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYXN0UGF0aCA9IHJlcXVpcmUoICcuL2Nhc3QtcGF0aCcgKSxcbiAgICBnZXQgICAgICA9IHJlcXVpcmUoICcuL2Jhc2UvYmFzZS1nZXQnICksXG4gICAgRVJSICAgICAgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICkuRVJSO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1hdGNoZXNQcm9wZXJ0eSAoIHByb3BlcnR5ICkge1xuXG4gIHZhciBwYXRoICA9IGNhc3RQYXRoKCBwcm9wZXJ0eVsgMCBdICksXG4gICAgICB2YWx1ZSA9IHByb3BlcnR5WyAxIF07XG5cbiAgaWYgKCAhIHBhdGgubGVuZ3RoICkge1xuICAgIHRocm93IEVycm9yKCBFUlIuTk9fUEFUSCApO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICggb2JqZWN0ICkge1xuXG4gICAgaWYgKCBvYmplY3QgPT0gbnVsbCApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIHBhdGgubGVuZ3RoID4gMSApIHtcbiAgICAgIHJldHVybiBnZXQoIG9iamVjdCwgcGF0aCwgMCApID09PSB2YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0WyBwYXRoWyAwIF0gXSA9PT0gdmFsdWU7XG5cbiAgfTtcblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzUGxhaW5PYmplY3QgPSByZXF1aXJlKCAnLi9pcy1wbGFpbi1vYmplY3QnICk7XG5cbnZhciB0b09iamVjdCA9IHJlcXVpcmUoICcuL3RvLW9iamVjdCcgKTtcblxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCAnLi9pcy1hcnJheScgKTtcblxudmFyIGtleXMgPSByZXF1aXJlKCAnLi9rZXlzJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1peGluICggZGVlcCwgb2JqZWN0ICkge1xuXG4gIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcblxuICB2YXIgaSA9IDI7XG5cblxuICB2YXIgbmFtZXMsIGV4cCwgaiwgaywgdmFsLCBrZXksIG5vd0FycmF5LCBzcmM7XG5cbiAgLy8gIG1peGluKCB7fSwge30gKVxuXG4gIGlmICggdHlwZW9mIGRlZXAgIT09ICdib29sZWFuJyApIHtcbiAgICBvYmplY3QgPSBkZWVwO1xuICAgIGRlZXAgICA9IHRydWU7XG4gICAgaSAgICAgID0gMTtcbiAgfVxuXG4gIC8vIHZhciBleHRlbmRhYmxlID0ge1xuICAvLyAgIGV4dGVuZDogcmVxdWlyZSggJ3BlYWtvL21peGluJyApXG4gIC8vIH07XG5cbiAgLy8gZXh0ZW5kYWJsZS5leHRlbmQoIHsgbmFtZTogJ0V4dGVuZGFibGUgT2JqZWN0JyB9ICk7XG5cbiAgaWYgKCBpID09PSBsICkge1xuXG4gICAgb2JqZWN0ID0gdGhpczsgLy8ganNoaW50IGlnbm9yZTogbGluZVxuXG4gICAgLS1pO1xuXG4gIH1cblxuICBvYmplY3QgPSB0b09iamVjdCggb2JqZWN0ICk7XG5cbiAgZm9yICggOyBpIDwgbDsgKytpICkge1xuICAgIG5hbWVzID0ga2V5cyggZXhwID0gdG9PYmplY3QoIGFyZ3VtZW50c1sgaSBdICkgKTtcblxuICAgIGZvciAoIGogPSAwLCBrID0gbmFtZXMubGVuZ3RoOyBqIDwgazsgKytqICkge1xuICAgICAgdmFsID0gZXhwWyBrZXkgPSBuYW1lc1sgaiBdIF07XG5cbiAgICAgIGlmICggZGVlcCAmJiB2YWwgIT09IGV4cCAmJiAoIGlzUGxhaW5PYmplY3QoIHZhbCApIHx8ICggbm93QXJyYXkgPSBpc0FycmF5KCB2YWwgKSApICkgKSB7XG4gICAgICAgIHNyYyA9IG9iamVjdFsga2V5IF07XG5cbiAgICAgICAgaWYgKCBub3dBcnJheSApIHtcbiAgICAgICAgICBpZiAoICEgaXNBcnJheSggc3JjICkgKSB7XG4gICAgICAgICAgICBzcmMgPSBbXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBub3dBcnJheSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIGlzUGxhaW5PYmplY3QoIHNyYyApICkge1xuICAgICAgICAgIHNyYyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqZWN0WyBrZXkgXSA9IG1peGluKCB0cnVlLCBzcmMsIHZhbCApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JqZWN0WyBrZXkgXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBvYmplY3Q7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5vb3AgKCkge307XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24gbm93ICgpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJlZm9yZSA9IHJlcXVpcmUoICcuL2JlZm9yZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBvbmNlICggdGFyZ2V0ICkge1xuICByZXR1cm4gYmVmb3JlKCAxLCB0YXJnZXQgKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSggJy4vY3JlYXRlL2NyZWF0ZS1wcm9wZXJ0eScgKSggcmVxdWlyZSggJy4vYmFzZS9iYXNlLXByb3BlcnR5JyApICk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc1ByaW1pdGl2ZSA9IHJlcXVpcmUoICcuL2lzLXByaW1pdGl2ZScgKSxcbiAgICBFUlIgICAgICAgICA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIHNldFByb3RvdHlwZU9mICggdGFyZ2V0LCBwcm90b3R5cGUgKSB7XG4gIGlmICggdGFyZ2V0ID09IG51bGwgKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKCBFUlIuVU5ERUZJTkVEX09SX05VTEwgKTtcbiAgfVxuXG4gIGlmICggcHJvdG90eXBlICE9PSBudWxsICYmIGlzUHJpbWl0aXZlKCBwcm90b3R5cGUgKSApIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoICdPYmplY3QgcHJvdG90eXBlIG1heSBvbmx5IGJlIGFuIE9iamVjdCBvciBudWxsOiAnICsgcHJvdG90eXBlICk7XG4gIH1cblxuICBpZiAoICdfX3Byb3RvX18nIGluIHRhcmdldCApIHtcbiAgICB0YXJnZXQuX19wcm90b19fID0gcHJvdG90eXBlOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN1cHBvcnQ7XG5cbmZ1bmN0aW9uIHRlc3QgKCB0YXJnZXQgKSB7XG4gIHRyeSB7XG4gICAgaWYgKCAnJyBpbiBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRhcmdldCwgJycsIHt9ICkgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gY2F0Y2ggKCBlICkge31cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmlmICggdGVzdCgge30gKSApIHtcbiAgc3VwcG9ydCA9ICdmdWxsJztcbn0gZWxzZSBpZiAoIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGVzdCggZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICkgKSApIHtcbiAgc3VwcG9ydCA9ICdkb20nO1xufSBlbHNlIHtcbiAgc3VwcG9ydCA9ICdub3Qtc3VwcG9ydGVkJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3VwcG9ydDtcblxuaWYgKCBPYmplY3Qua2V5cyApIHtcbiAgdHJ5IHtcbiAgICBzdXBwb3J0ID0gT2JqZWN0LmtleXMoICcnICksICdlczIwMTUnOyAvLyBqc2hpbnQgaWdub3JlOiBsaW5lXG4gIH0gY2F0Y2ggKCBlICkge1xuICAgIHN1cHBvcnQgPSAnZXM1JztcbiAgfVxufSBlbHNlIGlmICggeyB0b1N0cmluZzogbnVsbCB9LnByb3BlcnR5SXNFbnVtZXJhYmxlKCAndG9TdHJpbmcnICkgKSB7XG4gIHN1cHBvcnQgPSAnbm90LXN1cHBvcnRlZCc7XG59IGVsc2Uge1xuICBzdXBwb3J0ID0gJ2hhcy1hLWJ1Zyc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VwcG9ydDtcbiIsIi8qKlxuICogQmFzZWQgb24gRXJpayBNw7ZsbGVyIHJlcXVlc3RBbmltYXRpb25GcmFtZSBwb2x5ZmlsbDpcbiAqXG4gKiBBZGFwdGVkIGZyb20gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzE1Nzk2NzEgd2hpY2ggZGVyaXZlZCBmcm9tXG4gKiBodHRwOi8vcGF1bGlyaXNoLmNvbS8yMDExL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtYW5pbWF0aW5nL1xuICogaHR0cDovL215Lm9wZXJhLmNvbS9lbW9sbGVyL2Jsb2cvMjAxMS8xMi8yMC9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWVyLWFuaW1hdGluZ1xuICpcbiAqIHJlcXVlc3RBbmltYXRpb25GcmFtZSBwb2x5ZmlsbCBieSBFcmlrIE3DtmxsZXIuXG4gKiBGaXhlcyBmcm9tIFBhdWwgSXJpc2gsIFRpbm8gWmlqZGVsLCBBbmRyZXcgTWFvLCBLbGVtZW4gU2xhdmnEjSwgRGFyaXVzIEJhY29uLlxuICpcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGltZXN0YW1wID0gcmVxdWlyZSggJy4vdGltZXN0YW1wJyApO1xuXG52YXIgcmVxdWVzdEFGLCBjYW5jZWxBRjtcblxuaWYgKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgY2FuY2VsQUYgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0Q2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1vekNhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgcmVxdWVzdEFGID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xufVxuXG52YXIgbm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSAhIHJlcXVlc3RBRiB8fCAhIGNhbmNlbEFGIHx8XG4gIHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIC9pUChhZHxob25lfG9kKS4qT1NcXHM2Ly50ZXN0KCBuYXZpZ2F0b3IudXNlckFnZW50ICk7XG5cbmlmICggbm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKSB7XG4gIHZhciBsYXN0UmVxdWVzdFRpbWUgPSAwLFxuICAgICAgZnJhbWVEdXJhdGlvbiAgID0gMTAwMCAvIDYwO1xuXG4gIGV4cG9ydHMucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QgKCBhbmltYXRlICkge1xuICAgIHZhciBub3cgICAgICAgICAgICAgPSB0aW1lc3RhbXAoKSxcbiAgICAgICAgbmV4dFJlcXVlc3RUaW1lID0gTWF0aC5tYXgoIGxhc3RSZXF1ZXN0VGltZSArIGZyYW1lRHVyYXRpb24sIG5vdyApO1xuXG4gICAgcmV0dXJuIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxhc3RSZXF1ZXN0VGltZSA9IG5leHRSZXF1ZXN0VGltZTtcbiAgICAgIGFuaW1hdGUoIG5vdyApO1xuICAgIH0sIG5leHRSZXF1ZXN0VGltZSAtIG5vdyApO1xuICB9O1xuXG4gIGV4cG9ydHMuY2FuY2VsID0gY2xlYXJUaW1lb3V0O1xufSBlbHNlIHtcbiAgZXhwb3J0cy5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCAoIGFuaW1hdGUgKSB7XG4gICAgcmV0dXJuIHJlcXVlc3RBRiggYW5pbWF0ZSApO1xuICB9O1xuXG4gIGV4cG9ydHMuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsICggaWQgKSB7XG4gICAgcmV0dXJuIGNhbmNlbEFGKCBpZCApO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbm93ID0gcmVxdWlyZSggJy4vbm93JyApO1xudmFyIG5hdmlnYXRvclN0YXJ0O1xuXG5pZiAoIHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gJ3VuZGVmaW5lZCcgfHwgISBwZXJmb3JtYW5jZS5ub3cgKSB7XG4gIG5hdmlnYXRvclN0YXJ0ID0gbm93KCk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0aW1lc3RhbXAgKCkge1xuICAgIHJldHVybiBub3coKSAtIG5hdmlnYXRvclN0YXJ0O1xuICB9O1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0aW1lc3RhbXAgKCkge1xuICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcbiAgfTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF91bmVzY2FwZSA9IHJlcXVpcmUoICcuL191bmVzY2FwZScgKSxcbiAgICBpc1N5bWJvbCAgPSByZXF1aXJlKCAnLi9pcy1zeW1ib2wnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9LZXkgKCB2YWwgKSB7XG4gIHZhciBrZXk7XG5cbiAgaWYgKCB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyApIHtcbiAgICByZXR1cm4gX3VuZXNjYXBlKCB2YWwgKTtcbiAgfVxuXG4gIGlmICggaXNTeW1ib2woIHZhbCApICkge1xuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICBrZXkgPSAnJyArIHZhbDtcblxuICBpZiAoIGtleSA9PT0gJzAnICYmIDEgLyB2YWwgPT09IC1JbmZpbml0eSApIHtcbiAgICByZXR1cm4gJy0wJztcbiAgfVxuXG4gIHJldHVybiBfdW5lc2NhcGUoIGtleSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVSUiA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKS5FUlI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9PYmplY3QgKCB2YWx1ZSApIHtcbiAgaWYgKCB2YWx1ZSA9PSBudWxsICkge1xuICAgIHRocm93IFR5cGVFcnJvciggRVJSLlVOREVGSU5FRF9PUl9OVUxMICk7XG4gIH1cblxuICByZXR1cm4gT2JqZWN0KCB2YWx1ZSApO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyZWF0ZSA9IHJlcXVpcmUoICcuL2NyZWF0ZScgKTtcblxudmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmcsXG4gICAgdHlwZXMgPSBjcmVhdGUoIG51bGwgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRUeXBlICggdmFsdWUgKSB7XG4gIHZhciB0eXBlLCB0YWc7XG5cbiAgaWYgKCB2YWx1ZSA9PT0gbnVsbCApIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9XG5cbiAgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICBpZiAoIHR5cGUgIT09ICdvYmplY3QnICYmIHR5cGUgIT09ICdmdW5jdGlvbicgKSB7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cblxuICB0eXBlID0gdHlwZXNbIHRhZyA9IHRvU3RyaW5nLmNhbGwoIHZhbHVlICkgXTtcblxuICBpZiAoIHR5cGUgKSB7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cblxuICByZXR1cm4gKCB0eXBlc1sgdGFnIF0gPSB0YWcuc2xpY2UoIDgsIC0xICkudG9Mb3dlckNhc2UoKSApO1xufTtcbiJdfQ==
