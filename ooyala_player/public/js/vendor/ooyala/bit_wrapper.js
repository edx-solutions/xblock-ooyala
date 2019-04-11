(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
if (!OOV4) {
  OOV4 = {};
}

},{}],2:[function(require,module,exports){
require("./InitOOUnderscore.js");

var hazmatConfig = {}; // 'debugHazmat' flag needs to be set before plugins are loaded. If we added
// this flag to the OOV4 namespace, it would be overriden during plugin initalization,
// so we need to use a global var instead

if (window && !window.debugHazmat) {
  hazmatConfig = {
    warn: function () {
      return;
    }
  };
}

if (!OOV4.HM && (typeof window === 'undefined' || typeof window._ === 'undefined')) {
  OOV4.HM = require('hazmat').create(hazmatConfig);
} else if (!window.Hazmat) {
  require('hazmat');
}

if (!OOV4.HM) {
  OOV4.HM = window.Hazmat.noConflict().create(hazmatConfig);
}

},{"./InitOOUnderscore.js":3,"hazmat":7}],3:[function(require,module,exports){
require("./InitOO.js");

if (!window._) {
  window._ = require('underscore');
}

if (!OOV4._) {
  OOV4._ = window._.noConflict();
}

},{"./InitOO.js":1,"underscore":8}],4:[function(require,module,exports){
/**
 * @namespace OOV4
 */
(function (OOV4, _) {
  // External States

  /**
   * @description The Ooyala Player run-time states apply to an Ooyala player while it is running. These states apply equally to both HTML5 and Flash players.
   * State changes occur either through user interaction (for example, the user clickes the PLAY button), or programmatically via API calls. For more information,
   * see <a href="http://support.ooyala.com/developers/documentation/api/pbv4_api_events.html" target="target">Player Message Bus Events</a>.
   * @summary Represents the Ooyala Player run-time states.
   * @namespace OOV4.STATE
   */
  OOV4.STATE = {
    /** The embed code has been set. The movie and its metadata is currently being loaded into the player. */
    LOADING: 'loading',

    /**
     * One of the following applies:
     * <ul>
     *   <li>All of the necessary data is loaded in the player. Playback of the movie can begin.</li>
     *   <li>Playback of the asset has finished and is ready to restart from the beginning.</li>
     * </ul>
     */
    READY: 'ready',

    /** The player is currently playing video content. */
    PLAYING: 'playing',

    /** The player has currently paused after playback had begun. */
    PAUSED: 'paused',

    /** Playback has currently stopped because it doesn't have enough movie data to continue and is downloading more. */
    BUFFERING: 'buffering',

    /** The player has encountered an error that prevents playback of the asset. The error could be due to many reasons,
     * such as video format, syndication rules, or the asset being disabled. Refer to the list of errors for details.
     * The error code for the root cause of the error is available from the [OOV4.Player.getErrorCode()]{@link OOV4.Player#getErrorCode} method.
     */
    ERROR: 'error',

    /** The player has been destroyed via its [OOV4.Player.destroy(<i>callback</i>)]{@link OOV4.Player#destroy} method. */
    DESTROYED: 'destroyed',
    __end_marker: true
  }; // All Events Constants

  /**
   * @description The Ooyala Player events are default events that are published by the event bus.Your modules can subscribe to any and all of these events.
   * Use message bus events to subscribe to or publish player events from video to ad playback. For more information,
   * see <a href="http://support.ooyala.com/developers/documentation/api/pbv4_api_events.html" target="target">Player Message Bus Events</a>.
   * @summary Represents the Ooyala Player events.
   * @namespace OOV4.EVENTS
   */

  OOV4.EVENTS = {
    /**
     * A player was created. This is the first event that is sent after player creation.
     * This event provides the opportunity for any other modules to perform their own initialization.
     * The handler is called with the query string parameters.
     * The DOM has been created at this point, and plugins may make changes or additions to the DOM.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#PLAYER_CREATED
     */
    PLAYER_CREATED: 'playerCreated',
    PLAYER_EMBEDDED: 'playerEmbedded',

    /**
     * An attempt has been made to set the embed code.
     * If you are developing a plugin, reset the internal state since the player is switching to a new asset.
     * Depending on the context, the handler is called with:
     *   <ul>
     *     <li>The ID (embed code) of the asset.</li>
     *     <li>The ID (embed code) of the asset, with options.</li>
     *   </ul>
     *
     *
     * @event OOV4.EVENTS#SET_EMBED_CODE
     */
    SET_EMBED_CODE: 'setEmbedCode',

    /**
     * HEVC playback availablility has been checked
     * The handler is called with:
     *   <ul>
     *     <li>canPlayHevc (boolean) If HEVC can be played in the current environment.</li>
     *   </ul>
     *
     *
     * @event OOV4.EVENTS#HEVC_CHECKED
     * @private
     */
    HEVC_CHECKED: 'hevcChecked',

    /**
     * An attempt has been made to set the embed code by Ooyala Ads.
     * If you are developing a plugin, reset the internal state since the player is switching to a new asset.
     * Depending on the context, the handler is called with:
     *   <ul>
     *     <li>The ID (embed code) of the asset.</li>
     *     <li>The ID (embed code) of the asset, with options.</li>
     *   </ul>
     *
     *
     * @event OOV4.EVENTS#SET_EMBED_CODE_AFTER_OOYALA_AD
     * @private
     */
    SET_EMBED_CODE_AFTER_OOYALA_AD: 'setEmbedCodeAfterOoyalaAd',

    /**
     * The player's embed code has changed. The handler is called with two parameters:
     * <ul>
     *    <li>The ID (embed code) of the asset.</li>
     *    <li>The options JSON object.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#EMBED_CODE_CHANGED
     */
    EMBED_CODE_CHANGED: 'embedCodeChanged',

    /**
     * An attempt has been made to set a new asset.
     * If you are developing a plugin, reset the internal state since the player is switching to a new asset.
     * Depending on the context, the handler is called with:
     *   <ul>
     *     <li>The asset Object</li>
     *     <li>The asset Object, with options.</li>
     *   </ul>
     *
     * <h5>Compatibility: </h5>
     * <p style="text-indent: 1em;">HTML5, Flash</p>
     *
     * @event OOV4.EVENTS#SET_ASSET
     */
    SET_ASSET: 'setAsset',

    /**
     * A new asset has been specified to for playback and has basic passed validation.
     * The handler will be called with an object representing the new asset.
     * The object will have the following structure:
     *   <ul>
     *     <li>{
     *           Content:
     *           <ul>
     *                 <li>title: String,</li>
     *                 <li>description: String,</li>
     *                 <li>duration: Number,</li>
     *                 <li>posterImages: Array,</li>
     *                 <li>streams: Array,</li>
     *                 <li>captions: Array</li>
     *           </ul>
     *     }</li>
     *
     *   </ul>
     *
     * <h5>Compatibility: </h5>
     * <p style="text-indent: 1em;">HTML5, Flash</p>
     *
     * @event OOV4.EVENTS#ASSET_CHANGED
     */
    ASSET_CHANGED: 'assetChanged',

    /**
     * An attempt has been made to update current asset for cms-less player.
     * The handler is called with:
     *   <ul>
     *     <li>The asset Object, with optional fields populated</li>
     *   </ul>
     *
     *
     * @event OOV4.EVENTS#UPDATE_ASSET
     * @public
     */
    UPDATE_ASSET: 'updateAsset',

    /**
     * New asset parameters were specified for playback and have passed basic validation.
     * The handler will be called with an object representing the new parameters.
     * The object will have the following structure:
     *   <ul> {
     *     <li> id: String </li>
     *     <li> content:
     *           <ul>
     *                 <li>title: String,</li>
     *                 <li>description: String,</li>
     *                 <li>duration: Number,</li>
     *                 <li>posterImages: Array,</li>
     *                 <li>streams: Array,</li>
     *                 <li>captions: Array</li>
     *           </ul>
     *     </li>
     *     <li> relatedVideos:
     *           <ul>
     *                 <li>title: String,</li>
     *                 <li>description: String,</li>
     *                 <li>thumbnailUrl: String,</li>
     *                 <li>asset: Object</li>
     *           </ul>
     *     </li>
     *   }</ul>
     *
     * <h5>Compatibility: </h5>
     * <p style="text-indent: 1em;">HTML5, Flash</p>
     *
     * @event OOV4.EVENTS#ASSET_UPDATED
     */
    ASSET_UPDATED: 'assetUpdated',

    /**
     * An <code>AUTH_TOKEN_CHANGED</code> event is triggered when an authorization token is issued by the Player Authorization API.<br/>
     * For example, in device registration, an authorization token is issued, as described in
     * <a href="http://support.ooyala.com/developers/documentation/concepts/device_registration.html" target="target">Device Registration</a>.
     * The handler is called with a new value for the authorization token.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#AUTH_TOKEN_CHANGED
     */
    AUTH_TOKEN_CHANGED: "authTokenChanged",

    /**
     * The GUID has been set. The handler is called with the GUID.
     * <p>This event notifies plugin or page developers that a unique ID has been either generated or loaded for the current user's browser.
     * This is useful for analytics.</p>
     * <p>In HTML5, Flash, and Chromecast environments, a unique user is identified by local storage or a cookie. </p>
     * <p>To generate the GUID, Flash players use the timestamp indicating when the GUID is generated, and append random data to it.
     * The string is then converted to base64.</p>
     * <p>To generate the GUID, HTML5 players use the current time, browser
     * information, and random data and hash it and convert it to base64.</p>
     * <p>Within the same browser on the desktop, once a GUID is set by one platform
     * it is used for both platforms for the user. If a user clears their browser cache, that user's (device's) ID will be regenerated the next time
     * they watch video. Incognito modes will track a user for a single session, but once the browser is closed the GUID is erased.</p>
     * <p>For more information, see <b>unique user</b> <a href="http://support.ooyala.com/users/users/documentation/reference/glossary.html" target="target">Glossary</a>.</p>
     *
     *
     * @event OOV4.EVENTS#GUID_SET
     */
    GUID_SET: 'guidSet',
    WILL_FETCH_PLAYER_XML: 'willFetchPlayerXml',
    PLAYER_XML_FETCHED: 'playerXmlFetched',
    WILL_FETCH_CONTENT_TREE: 'willFetchContentTree',
    SAVE_PLAYER_SETTINGS: 'savePlayerSettings',

    /**
     * A content tree was fetched. The handler is called with a JSON object that represents the content data for the current asset.<br/><br/>
     *
     *
     * <h5>Analytics:</h5>
     * <p style="text-indent: 1em;">Records a <code>display</code> event. For more information see
     * <a href="http://support.ooyala.com/developers/documentation/concepts/analytics_plays-and-displays.html" target="target">Displays, Plays, and Play Starts</a>.</p>
     *
     * @event OOV4.EVENTS#CONTENT_TREE_FETCHED
     */
    CONTENT_TREE_FETCHED: 'contentTreeFetched',
    WILL_FETCH_METADATA: 'willFetchMetadata',

    /**
     * The metadata, which is typically set in Backlot, has been retrieved.
     * The handler is called with the JSON object containing all metadata associated with the current asset.
     * The metadata includes page-level, asset-level, player-level, and account-level metadata, in addition to
     * metadata specific to 3rd party plugins. This is typically used for ad and anlytics plugins, but can be used
     * wherever you need specific logic based on the asset type.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#METADATA_FETCHED
     */
    METADATA_FETCHED: 'metadataFetched',

    /**
     * The skin metadata, which is set in Backlot, has been retrieved.
     * The handler is called with the JSON object containing metadata set in Backlot for the current asset.
     * This is used by the skin plug-in to deep merge with the embedded skin config.<br/><br/>
     *
     * @event OOV4.EVENTS#SKIN_METADATA_FETCHED
     */
    SKIN_METADATA_FETCHED: 'skinMetadataFetched',

    /**
     * The thumbnail metadata needed for thumbnail previews while seeking has been fetched and will be
     * passed through to the event handlers subscribing to this event.
     * Thumbnail metadata will have the following structure:
     * {
        data: {
          available_time_slices: [10],  //times that have thumbnails available
          available_widths: [100],       //widths of thumbnails available
          thumbnails: {
                10: {100: {url: http://test.com, height: 100, width: 100}}
          }
        }
      }
     * <br/><br/>
     *
     *
     * @event OOV4.EVENTS#THUMBNAILS_FETCHED
     * @public
     */
    THUMBNAILS_FETCHED: 'thumbnailsFetched',
    WILL_FETCH_AUTHORIZATION: 'willFetchAuthorization',

    /**
     * Playback was authorized. The handler is called with an object containing the entire SAS response, and includes the value of <code>video_bitrate</code>.
     * <p>For more information see
     * <a href="http://support.ooyala.com/developers/documentation/concepts/encodingsettings_videobitrate.html" target="target">Video Bit Rate</a>.</p>
     *
     *
     * @event OOV4.EVENTS#AUTHORIZATION_FETCHED
     */
    AUTHORIZATION_FETCHED: 'authorizationFetched',
    WILL_FETCH_AD_AUTHORIZATION: 'willFetchAdAuthorization',
    AD_AUTHORIZATION_FETCHED: 'adAuthorizationFetched',
    CAN_SEEK: 'canSeek',
    WILL_RESUME_MAIN_VIDEO: 'willResumeMainVideo',

    /**
     * The player has indicated that it is in a playback-ready state.
     * All preparations are complete, and the player is ready to receive playback commands
     * such as play, seek, and so on. The default UI shows the <b>Play</b> button,
     * displaying the non-clickable spinner before this point. <br/><br/>
     *
     *
     * @event OOV4.EVENTS#PLAYBACK_READY
     */
    PLAYBACK_READY: 'playbackReady',

    /**
     * Play has been called for the first time. <br/><br/>
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The unix timestamp of the initial playtime</li>
     *   <li>True if the playback request was the result of an autoplay, false or undefined otherwise</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#INITIAL_PLAY
     * @public
     */
    INITIAL_PLAY: "initialPlay",
    // when play is called for the very first time ( in start screen )
    WILL_PLAY: 'willPlay',

    /** The user has restarted the playback after the playback finished */
    REPLAY: 'replay',

    /**
     * The user is trying to set the playbackspeed of the main content.
     * <ul>
     *   <li>The desired speed</li>
     * </ul>
     * @event OOV4.EVENTS#SET_PLAYBACK_SPEED
     */
    SET_PLAYBACK_SPEED: "setPlaybackSpeed",

    /**
     * The playback speed changed. The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video whose playback speed changed.</li>
     *   <li>The new playback speed that was set.</li>
     * </ul>
     * @event OOV4.EVENTS#PLAYBACK_SPEED_CHANGED
     */
    PLAYBACK_SPEED_CHANGED: "playbackSpeedChanged",

    /**
     * The playhead time changed. The handler is called with the following arguments:
     * <ul>
     *   <li>The current time.</li>
     *   <li>The duration.</li>
     *   <li>The name of the buffer.</li>
     *   <li>The seek range.</li>
     *   <li>The id of the video (as defined by the module that controls it).</li>
     * </ul>
     *
     *
     * <h5>Analytics:</h5>
     * <p style="text-indent: 1em;">The first event is <code>video start</code>. Other instances of the event feed the <code>% completed data points</code>.</p>
     * <p style="text-indent: 1em;">For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/analytics_plays-and-displays.html">Displays, Plays, and Play Starts</a>.</p>
     *
     * @event OOV4.EVENTS#PLAYHEAD_TIME_CHANGED
     */
    PLAYHEAD_TIME_CHANGED: 'playheadTimeChanged',

    /**
     * The player is buffering the data stream.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The url of the video that is buffering.</li>
     *   <li>The playhead position.</li>
     *   <li>The id of the video that is buffering (as defined by the module that controls it).</li>
     * </ul><br/><br/>
     *
     *
     * @event OOV4.EVENTS#BUFFERING
     */
    BUFFERING: 'buffering',
    // playing stops because player is buffering

    /**
     * Play resumes because the player has completed buffering. The handler is called with the URL of the stream.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The url of the video that has buffered.</li>
     *   <li>The id of the video that has buffered (as defined by the module that controls it).</li>
     * </ul><br/><br/>
     *
     *
     * @event OOV4.EVENTS#BUFFERED
     */
    BUFFERED: 'buffered',

    /**
     * The player is downloading content (it can play while downloading).
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The current time.</li>
     *   <li>The duration.</li>
     *   <li>The name of the buffer.</li>
     *   <li>The seek range.</li>
     *   <li>The id of the video (as defined by the module that controls it).</li>
     * </ul>
     * <br/><br/>
     *
     *
     * @event OOV4.EVENTS#DOWNLOADING
     */
    DOWNLOADING: 'downloading',
    // player is downloading content (could be playing while downloading)

    /**
     * Lists the available bitrate information. The handler is called with an array containing the available streams, each object includes:
     *   <ul>
     *     <li>bitrate: The bitrate in bits per second. (number|string)</li>
     *     <li>height: The vertical resolution of the stream. (number)</li>
     *     <li>width: The horizontal resolution of the stream. (number)</li>
     *   </ul>
     * If The video plugin supports automatic ABR, one stream will have a bitrate value of "auto".
     *
     * <p>For more information see
     * <a href="http://support.ooyala.com/developers/documentation/concepts/encodingsettings_videobitrate.html" target="target">Video Bit Rate</a>.</p>
     * @event OOV4.EVENTS#BITRATE_INFO_AVAILABLE
     * @public
     */
    BITRATE_INFO_AVAILABLE: 'bitrateInfoAvailable',

    /**
     * A request to set a specific stream bitrate has occurred.
     * The method is published with an object representing the stream to switch to. This will
     * be one of the stream objects published in BITRATE_INFO_AVAILABLE. Each object includes:
     *   <ul>
     *     <li>bitrate: The bitrate in bits per second. (number|string)</li>
     *     <li>height: The vertical resolution of the stream. (number)</li>
     *     <li>width: The horizontal resolution of the stream. (number)</li>
     *   </ul>
     * <br/><br/>
     *
     * @event OOV4.EVENTS#SET_TARGET_BITRATE
     */
    SET_TARGET_BITRATE: 'setTargetBitrate',

    /**
     * The current playing bitrate has changed. The handler is called with the stream object which includes:
     *   <ul>
     *     <li>bitrate: The bitrate in bits per second. (number|string)</li>
     *     <li>height: The vertical resolution of the stream. (number)</li>
     *     <li>width: The horizontal resolution of the stream. (number)</li>
     *   </ul>
     * If the player is using automatic ABR, it should publish a stream object with the bitrate set to "auto".
     *
     * <p>For more information see
     * <a href="http://support.ooyala.com/developers/documentation/concepts/encodingsettings_videobitrate.html" target="target">Video Bit Rate</a>.</p>
     * @event OOV4.EVENTS#BITRATE_CHANGED
     * @public
     */
    BITRATE_CHANGED: 'bitrateChanged',

    /**
     * Lists the available closed caption information including languages and locale.
     *
     * Provide the following arguments:
     * <ul>
     *   <li>object containing:
     *     <ul>
     *       <li><code>languages</code>: (array) a list of available languages.</li>
     *       <li><code>locale</code>: (object) contains language names by id. For example, <code>{en:"English", fr:"Français", sp:"Español"}</code>.</li>
     *     </ul>
     *   </li>
     * </ul>
     *
     * @event OOV4.EVENTS#CLOSED_CAPTIONS_INFO_AVAILABLE
     * @public
     */
    CLOSED_CAPTIONS_INFO_AVAILABLE: 'closedCaptionsInfoAvailable',

    /**
     * Sets the closed captions language to use.  To remove captions, specify <code>"none"</code> as the language.
     *
     * Provide the following arguments:
     * <ul>
     *   <li>string specifying the language in which the captions appear.
     *   </li>
     * </ul>
     *
     * @event OOV4.EVENTS#SET_CLOSED_CAPTIONS_LANGUAGE
     * @public
     */
    SET_CLOSED_CAPTIONS_LANGUAGE: 'setClosedCaptionsLanguage',

    /**
     * Sent when the skin has chosen the language for the UI.
     *
     * Provide the following arguments:
     * <ul>
     *   <li>string specifying the language code of the UI.
     *   </li>
     * </ul>
     * @event OOV4.EVENTS#SKIN_UI_LANGUAGE
     * @private
     */
    SKIN_UI_LANGUAGE: 'skinUiLanguage',

    /**
     * Raised when closed caption text is changed at a point in time.
     *
     * Provide the following arguments:
     * <ul>
     *   <li>TBD
     *   </li>
     * </ul>
     *
     * @event OOV4.EVENTS#CLOSED_CAPTION_CUE_CHANGED
     * @private
     */
    CLOSED_CAPTION_CUE_CHANGED: 'closedCaptionCueChanged',

    /**
     * Raised when asset dimensions become available.
     *
     * Provide the following arguments in an object:
     * <ul>
     *   <li>width: the width of the asset (number)
     *   </li>
     *   <li>height: the height of the asset (number)
     *   </li>
     *   <li>videoId: the id of the video (string)
     *   </li>
     * </ul>
     *
     * @event OOV4.EVENTS#ASSET_DIMENSION
     * @public
     */
    ASSET_DIMENSION: 'assetDimension',
    SCRUBBING: 'scrubbing',
    SCRUBBED: 'scrubbed',

    /**
     * A request to perform a seek has occurred. The playhead is requested to move to
     * a specific location, specified in milliseconds. The handler is called with the position to which to seek.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#SEEK
     */
    SEEK: 'seek',

    /**
     * The player has finished seeking the main video to the requested position.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The current time of the video after seeking.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#SEEKED
     */
    SEEKED: 'seeked',

    /**
     * A playback request has been made. <br/><br/>
     *
     *
     * @event OOV4.EVENTS#PLAY
     */
    PLAY: 'play',
    PLAYING: 'playing',
    PLAY_FAILED: 'playFailed',

    /**
     * A player pause has been requested. <br/><br/>
     *
     *
     * @event OOV4.EVENTS#PAUSE
     */
    PAUSE: 'pause',

    /**
     * The player was paused. <br/><br/>
     *
     *
     * @event OOV4.EVENTS#PAUSED
     */
    PAUSED: 'paused',

    /**
     * The video and asset were played. The handler is called with the arguments that were passed.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#PLAYED
     */
    PLAYED: 'played',
    DISPLAY_CUE_POINTS: 'displayCuePoints',
    INSERT_CUE_POINT: 'insertCuePoint',
    RESET_CUE_POINTS: 'resetCuePoints',

    /**
     * This event is triggered before a change is made to the full screen setting of the player.
     * The handler is called with <code>true</code> if the full screen setting will be enabled,
     * and is called with <code>false</code> if the full screen setting will be disabled.
     *
     *
     * @event OOV4.EVENTS#WILL_CHANGE_FULLSCREEN
     */
    WILL_CHANGE_FULLSCREEN: 'willChangeFullscreen',

    /**
     * The fullscreen state has changed. Depending on the context, the handler is called with:
     * <ul>
     *   <li><code>isFullscreen</code> and <code>paused</code>:</li>
     *     <ul>
     *       <li><code>isFullscreen</code> is set to <code>true</code> or <code>false</code>.</li>
     *       <li><code>isFullscreen</code> and <code>paused</code> are each set to <code>true</code> or <code>false</code>.</li>
     *     </ul>
     *   </li>
     *   <li>The id of the video that has entered fullscreen (as defined by the module that controls it).
     * </ul>
     *
     *
     * @event OOV4.EVENTS#FULLSCREEN_CHANGED
     */
    FULLSCREEN_CHANGED: 'fullscreenChanged',

    /**
     * The screen size has changed. This event can also be triggered by a screen orientation change for handheld devices.
     * Depending on the context, the handler is called with:
     *   <ul>
     *     <li>The width of the player.</li>
     *     <li>The height of the player.</li>
     *   </ul>
     *
     *
     * @event OOV4.EVENTS#SIZE_CHANGED
     */
    SIZE_CHANGED: 'sizeChanged',

    /**
     * A request to change volume has been made.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The desired volume of the video element.</li>
     *   <li>The id of the video on which to change the volume (as defined by the module that controls it).
     *        If null or undefined, all video elements volume will be changed</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#CHANGE_VOLUME
     */
    CHANGE_VOLUME: 'changeVolume',

    /**
     * The volume has changed. The handler is called with the current volume, which has a value between 0 and 1, inclusive.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#VOLUME_CHANGED
     */
    VOLUME_CHANGED: 'volumeChanged',

    /**
     * A request to change the mute state has been made.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The desired mute state of the video element.</li>
     *   <li>The id of the video on which to mute (as defined by the module that controls it).
     *        If null or undefined, all video elements volume will be changed</li>
     *   <li>Whether or not the request was from a user action. True if it was from a user action,
     *        false otherwise.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#CHANGE_MUTE_STATE
     * @public
     */
    CHANGE_MUTE_STATE: 'changeMuteState',

    /**
     * The mute state has changed.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The current mute state of the video element.</li>
     *   <li>The id of the video that was muted (as defined by the module that controls it).</li>
     *   <li>Whether or not the mute state was changed for muted autoplay. True if it was
     *        done for muted autoplay, false or undefined otherwise.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#MUTE_STATE_CHANGED
     * @public
     */
    MUTE_STATE_CHANGED: 'muteStateChanged',

    /**
     * Controls are shown.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#CONTROLS_SHOWN
     */
    CONTROLS_SHOWN: 'controlsShown',

    /**
     * Controls are hidden.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#CONTROLS_HIDDEN
     */
    CONTROLS_HIDDEN: 'controlsHidden',
    END_SCREEN_SHOWN: 'endScreenShown',

    /**
     * An error has occurred. The handler is called with a JSON object that always includes an error code field,
     * and may also include other error-specific fields.<br/><br/>
     *
     *
     * @event OOV4.EVENTS#ERROR
     */
    ERROR: 'error',

    /**
     * An api related error has occurred. The handler is called with the following arguments:
     * <ul>
     *   <li>The error code.</li>
     *   <li>The error message.</li>
     *   <li>The url requested.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#API_ERROR
     * @public
     */
    API_ERROR: 'apiError',

    /**
     * Event containing the bitrate used at the start of playback. The handler is called with the following arguments:
     * <ul>
     *   <li>The bitrate in kbps.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#BITRATE_INITIAL
     * @public
     */
    BITRATE_INITIAL: 'bitrateInitial',

    /**
     * Event containing the bitrate used five seconds into playback. The handler is called with the following arguments:
     * <ul>
     *   <li>The bitrate in kbps.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#BITRATE_FIVE_SEC
     * @public
     */
    BITRATE_FIVE_SEC: 'bitrateFiveSec',

    /**
     * Event containing the bitrate used thirty seconds into playback. The handler is called with the following arguments:
     * <ul>
     *   <li>The bitrate in kbps.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#BITRATE_STABLE
     * @public
     */
    BITRATE_STABLE: 'bitrateStable',

    /**
     * A playback error has occurred before the video start. The handler is called with the following arguments:
     * <ul>
     *   <li>The error code.</li>
     *   <li>The error message.</li>
     *   <li>The la url if DRM used.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#PLAYBACK_START_ERROR
     * @public
     */
    PLAYBACK_START_ERROR: 'playbackStartError',

    /**
     * A playback error has occurred midstream. The handler is called with the following arguments:
     * <ul>
     *   <li>The error code.</li>
     *   <li>The error message.</li>
     *   <li>The playhead position.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#PLAYBACK_MIDSTREAM_ERROR
     * @public
     */
    PLAYBACK_MIDSTREAM_ERROR: 'playbackMidstreamError',

    /**
     * A plugin has been loaded successfully. The handler is called with the following arguments:
     * <ul>
     *   <li>The player core version.</li>
     *   <li>The plugin type: ad, video, analytics, playtest, skin.</li>
     *   <li>The plugin name.</li>
     *   <li>The time it took to load the plugin.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#PLAYBACK_MIDSTREAM_ERROR
     * @public
     */
    PLUGIN_LOADED: 'pluginLoaded',

    /**
     * The video plugin has sent an error message. The handler is called with the following arguments:
     * <ul>
     *   <li>The error code.</li>
     *   <li>The error message.</li>
     * </ul>
     *
     *
     * @event OOV4.EVENTS#VC_PLUGIN_ERROR
     * @public
     */
    VC_PLUGIN_ERROR: 'videoPluginError',

    /**
     * Notifies the player that the initial playback of content has started.
     * <ul>
     *   <li>The time since the initial play request was made (number)</li>
     *   <li>Boolean parameter. True if video was autoplayed, false otherwise (boolean)</li>
     *   <li>Boolean parameter. True if the video had an ad play before it started.
     *       This includes midrolls that play before content due to an initial playhead time > 0.
     *       False otherwise  (number)</li>(boolean)</li>
     *   <li>The initial position of the playhead upon playback start. (number)</li>
     *   <li>The video plugin used for playback (string)</li>
     *   <li>The browser technology used - HTML5, Flash, Mixed, or Other (string)</li>
     *   <li>The stream encoding type, i.e. MP4, HLS, Dash, etc. (string)</li>
     *   <li>The URL of the content being played (string)</li>
     *   <li>The DRM being used, none if there is no DRM (string)</li>
     *   <li>Boolean parameter. True if a live stream is playing. False if VOD.(boolean)</li>
     * </ul>
     * @event OOV4.EVENTS#INITIAL_PLAY_STARTING
     * @public
     */
    INITIAL_PLAY_STARTING: 'initialPlayStarting',

    /**
     * Notifies the player that the user has requested to play the previous video.
     * Depending on the plugin being used, this could either be the previous video in
     * a playlist, or the previously played Discovery video recommendation.
     *
     * @event OOV4.EVENTS#REQUEST_PREVIOUS_VIDEO
     * @public
     */
    REQUEST_PREVIOUS_VIDEO: 'requestPreviousVideo',

    /**
     * Notifies the player that the user has requested to play the next video.
     * Depending on the plugin being used, this could either be the next video in
     * a playlist, or the next Discovery video recommendation.
     *
     * @event OOV4.EVENTS#REQUEST_NEXT_VIDEO
     * @public
     */
    REQUEST_NEXT_VIDEO: 'requestNextVideo',

    /**
     * Fired by either the Playlist or Discovery plugins after the position of the
     * current video, relative to its siblings, has been determined. The main purpose
     * of this event is to let the UI know whether or not there are previous or next
     * videos that the user can navigate towards.<br/><br/>
     *
     * The handler is called with the following arguments:
     * <ul>
     *   <li>An object which contains the following properties:
     *     <ul>
     *       <li><code>hasPreviousVideos</code>: (boolean) True if there are videos before the current one, false otherwise</li>
     *       <li><code>hasNextVideos</code>: (boolean) True if there are videos after the current one, false otherwise</li>
     *     </ul>
     *   </li>
     * </ul>
     *
     * @event OOV4.EVENTS#POSITION_IN_PLAYLIST_DETERMINED
     * @private
     */
    POSITION_IN_PLAYLIST_DETERMINED: 'positionInPlaylistDetermined',

    /**
     * The player is currently being destroyed, and anything created by your module must also be deleted.
     * After the destruction is complete, there is nothing left to send an event.
     * Any plugin that creates or has initialized any long-living logic should listen to this event and clean up that logic.
     * <br/><br/>
     *
     *
     * @event OOV4.EVENTS#DESTROY
     */
    DESTROY: 'destroy',
    WILL_PLAY_FROM_BEGINNING: 'willPlayFromBeginning',
    DISABLE_PLAYBACK_CONTROLS: 'disablePlaybackControls',
    ENABLE_PLAYBACK_CONTROLS: 'enablePlaybackControls',
    // Video Controller action events

    /*
     * Denotes that the video controller is ready for playback to be triggered.
     * @event OOV4.EVENTS#VC_READY
     * @public
     */
    VC_READY: 'videoControllerReady',

    /**
     * Commands the video controller to create a video element.
     * It should be given the following arguments:
     * <ul>
     *   <li>videoId (string)
     *   </li>
     *   <li>streams (object) containing:
     *     <ul>
     *       <li>Encoding type (string) as key defined in OOV4.VIDEO.ENCODINGS
     *       </li>
     *       <li>Key-value pair (object) as value containing:
     *         <ul>
     *           <li>url (string): Url of the stream</li>
     *           <li>drm (object): Denoted by type of DRM with data as value object containing:
     *             <ul>
     *               <li>Type of DRM (string) as key (ex. "widevine", "fairplay", "playready")</li>
     *               <li>DRM specific data (object) as value</li>
     *             </ul>
     *           </li>
     *         </ul>
     *       </li>
     *     </ul>
     *   </li>
     *   <li>parentContainer of the element. This is a jquery element. (object)
     *   </li>
     *   <li>optional params object (object) containing:
     *     <ul>
     *       <li>closedCaptions: The possible closed captions available on this video. (object)</li>
     *       <li>crossorigin: The crossorigin attribute value to set on the video. (string)</li>
     *       <li>technology: The core video technology required (string) (ex. OOV4.VIDEO.TECHNOLOGY.HTML5)</li>
     *       <li>features: The video plugin features required (string) (ex. OOV4.VIDEO.FEATURE.CLOSED_CAPTIONS)</li>
     *     </ul>
     *   </li>
     * </ul>
     * @event OOV4.EVENTS#VC_CREATE_VIDEO_ELEMENT
     */
    VC_CREATE_VIDEO_ELEMENT: 'videoControllerCreateVideoElement',

    /**
     * A message to be interpreted by the Video Controller to update the URL of the stream for an element.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The name of the element who's URL is being altered</li>
     *   <li>The new url to be used</li>
     * </ul>
     * @event OOV4.EVENTS#VC_UPDATE_ELEMENT_STREAM
     * @public
     */
    VC_UPDATE_ELEMENT_STREAM: 'videoControllerUpdateElementStream',

    /**
     * The Video Controller has created the desired video element, as denoted by id (string).
     * The handler is called with the following arguments:
     * <ul>
     *   <li>Object containing:
     *     <ul>
     *       <li>videoId: The id of the video as defined by the module that controls it.</li>
     *       <li>encodings: The encoding types supported by the new video element.</li>
     *       <li>parent: The parent element of the video element.</li>
     *       <li>domId: The DOM id of the video element.</li>
     *       <li>videoElement: The video element or its wrapper as created by the video plugin.</li>
     *     </ul>
     *   </li>
     * </ul>
     * @event OOV4.EVENTS#VC_VIDEO_ELEMENT_CREATED
     */
    VC_VIDEO_ELEMENT_CREATED: 'videoControllerVideoElementCreated',

    /**
     * Commands the Video Controller to bring a video element into the visible range given the video element id (string).
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video to focus (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_FOCUS_VIDEO_ELEMENT
     */
    VC_FOCUS_VIDEO_ELEMENT: 'videoControllerFocusVideoElement',

    /**
     * The Video Controller has moved a video element (string) into focus.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that is in focus (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_VIDEO_ELEMENT_IN_FOCUS
     */
    VC_VIDEO_ELEMENT_IN_FOCUS: 'videoControllerVideoElementInFocus',

    /**
     * The Video Controller has removed a video element (string) from focus.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that lost focus (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_VIDEO_ELEMENT_LOST_FOCUS
     */
    VC_VIDEO_ELEMENT_LOST_FOCUS: 'videoControllerVideoElementLostFocus',

    /**
     * Commands the Video Controller to dispose a video element given the video element id (string).
     * @event OOV4.EVENTS#VC_DISPOSE_VIDEO_ELEMENT
     */
    VC_DISPOSE_VIDEO_ELEMENT: 'videoControllerDisposeVideoElement',

    /**
     * The Video Controller has disposed the denoted video element (string).
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that was disposed (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_VIDEO_ELEMENT_DISPOSED
     */
    VC_VIDEO_ELEMENT_DISPOSED: 'videoControllerVideoElementDisposed',

    /**
     * Commands the video controller to set the stream for a video element.
     * It should be given the video element name (string) and an object of streams denoted by encoding type (object).
     * @event OOV4.EVENTS#VC_SET_VIDEO_STREAMS
     */
    VC_SET_VIDEO_STREAMS: 'videoControllerSetVideoStreams',

    /**
     * The Video Controller has encountered an error attempting to configure video elements.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that encountered the error (as defined by the module that controls it).</li>
     *   <li>The error details (object) containing an error code.</li>
     * @event OOV4.EVENTS#VC_ERROR
     */
    VC_ERROR: 'videoControllerError',
    // Video Player action events

    /**
     * Sets the video element's initial playback time.
     * @event OOV4.EVENTS#VC_SET_INITIAL_TIME
     */
    VC_SET_INITIAL_TIME: 'videoSetInitialTime',

    /**
     * Commands the video element to play.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video to play (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_PLAY
     */
    VC_PLAY: 'videoPlay',

    /**
      * Notifies the video element to play.
      * The handler is called with the following arguments:
      * <ul>
      *   <li>The id of the video to play (as defined by the module that controls it).</li>
      * </ul>
      * @event OOV4.EVENTS#PLAY_VIDEO_ELEMENT
      * @private
      */
    PLAY_VIDEO_ELEMENT: 'playVideoElement',

    /**
     * The video element has detected a command to play and will begin playback.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video to seek (as defined by the module that controls it).</li>
     *   <li>The url of the video that will play.</li>
     * </ul>
     * @event OOV4.EVENTS#VC_WILL_PLAY
     */
    VC_WILL_PLAY: 'videoWillPlay',

    /**
     * The video element has detected playback in progress.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that is playing (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_PLAYING
     */
    VC_PLAYING: 'videoPlaying',

    /**
     * The video element has detected playback completion.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that has played (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_PLAYED
     */
    VC_PLAYED: 'videoPlayed',

    /**
     * The video element has detected playback failure.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that has played (as defined by the module that controls it).</li>
     *   <li>The error code of the failure (string).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_PLAY_FAILED
     */
    VC_PLAY_FAILED: 'videoPlayFailed',

    /**
     * Commands the video element to pause.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video to pause (as defined by the module that controls it).</li>
     *   <li>Optional string indicating the reason for the pause.  Supported values include:
     *     <ul>
     *       <li>"transition" indicates that a pause was triggered because a video is going into or out of focus.</li>
     *       <li>null or undefined for all other cases.</li>
     *     </ul>
     *   </li>
     * </ul>
     * @event OOV4.EVENTS#VC_PAUSE
     */
    VC_PAUSE: 'videoPause',

    /**
     * The video element has detected video state change to paused.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that has paused (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_PAUSED
     */
    VC_PAUSED: 'videoPaused',

    /**
     * Commands the video element to seek.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video to seek (as defined by the module that controls it).</li>
     *   <li>The time position to seek to (in seconds).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_SEEK
     */
    VC_SEEK: 'videoSeek',

    /**
     * The video element has detected seeking.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that is seeking (as defined by the module that controls it).</li>
     * </ul>
     * @event OOV4.EVENTS#VC_SEEKING
     */
    VC_SEEKING: 'videoSeeking',

    /**
     * The video element has detected seeked.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that has seeked (as defined by the module that controls it).</li>
     *   <li>The current time of the video after seeking.</li>
     * </ul>
     * @event OOV4.EVENTS#VC_SEEKED
     */
    VC_SEEKED: 'videoSeeked',

    /**
     * Commands the video element to preload.
     * @event OOV4.EVENTS#VC_PRELOAD
     */
    VC_PRELOAD: 'videoPreload',

    /**
     * Commands the video element to reload.
     * @event OOV4.EVENTS#VC_RELOAD
     */
    VC_RELOAD: 'videoReload',

    /**
     * Commands the video controller to prepare all video elements for playback.  This event should be
     * called on a click event and used to enable api-control on html5-based video elements.
     * @event OOV4.EVENTS#VC_PRIME_VIDEOS
     * @public
     */
    VC_PRIME_VIDEOS: 'videoPrimeVideos',

    /**
     * Notifies the player of tags (such as ID3) encountered during video playback.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The id of the video that has paused (as defined by the module that controls it). (string)</li>
     *   <li>The type of metadata tag found, such as ID3. (string)</li>
     *   <li>The metadata. (string|object)</li>
     * </ul>
     * @event OOV4.EVENTS#VC_TAG_FOUND
     * @public
     */
    VC_TAG_FOUND: 'videoTagFound',

    /**
     * Notifies the player that the initial playback of content has started.
     * <ul>
     *   <li>The time since the initial play request was made (number)</li>
     *   <li>Boolean parameter. True if video was autoplayed, false otherwise (boolean)</li>
     *   <li>Boolean parameter. True if the video had an ad play before it started.
     *       This includes midrolls that play before content due to an initial playhead time > 0.
     *       False otherwise  (number)</li>(boolean)</li>
     *   <li>The initial position of the playhead upon playback start. (number)</li>
     *   <li>The video plugin used for playback (string)</li>
     *   <li>The browser technology used - HTML5, Flash, Mixed, or Other (string)</li>
     *   <li>The stream encoding type, i.e. MP4, HLS, Dash, etc. (string)</li>
     *   <li>The URL of the content being played (string)</li>
     *   <li>The DRM being used, none if there is no DRM (string)</li>
     *   <li>Boolean parameter. True if a live stream is playing. False if VOD.(boolean)</li>
     * </ul>
     * @event OOV4.EVENTS#INITIAL_PLAY_STARTING
     * @public
     */
    INITIAL_PLAY_STARTING: 'initialPlayStarting',

    /**
     * This event is triggered when an ad sdk has been loaded successfully. The handler is called with:
     * <ul>
     *   <li>The ad plugin loaded.</li>
     * </ul>
     * @event OOV4.EVENTS#AD_SDK_LOADED
     */
    AD_SDK_LOADED: 'adSdkLoaded',

    /**
     * This event is triggered when there is an failure to load the ad sdk.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The ad plugin that failed to load.</li>
     *   <li>The player core version.</li>
     *   <li>The error message associated with the load failure.</li>
     * </ul>
     * @event OOV4.EVENTS#AD_SDK_LOAD_FAILED
     */
    AD_SDK_LOAD_FAILED: 'adSdkLoadFailed',

    /**
     * This event is triggered whenever an ad is requested.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The ad plugin.</li>
     *   <li>The time the ad was scheduled to play.</li>
     * </ul>
     * @event OOV4.EVENTS#AD_REQUEST
     */
    AD_REQUEST: 'adRequest',

    /**
     * This event is triggered upon receiving a successful response for an ad request.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The ad plugin.</li>
     *   <li>The time the ad was scheduled to play.</li>
     *   <li>The ad request response time.</li>
     *   <li>Time from initial play to ad request success</li>
     * </ul>
     * @event OOV4.EVENTS#AD_REQUEST_SUCCESS
     */
    AD_REQUEST_SUCCESS: 'adRequestSuccess',

    /**
     * This event is triggered upon receiving an error for an ad request.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The ad plugin.</li>
     *   <li>The time the ad was scheduled to play.</li>
     *   <li>The final ad tag after macro substitution</li>
     *   <li>The error code.</li>
     *   <li>The error message.</li>
     *   <li>If there was a request timeout or not.</li>
     * </ul>
     * @event OOV4.EVENTS#AD_REQUEST_ERROR
     */
    AD_REQUEST_ERROR: 'adRequestError',

    /**
     * This event is triggered upon receiving an empty response for an ad request.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The ad plugin.</li>
     *   <li>The time the ad was scheduled to play.</li>
     *   <li>The final ad tag after macro substitution</li>
     *   <li>The error code.</li>
     *   <li>The error message.</li>
     * </ul>
     * @event OOV4.EVENTS#AD_REQUEST_EMPTY
     */
    AD_REQUEST_EMPTY: 'adRequestEmpty',

    /**
     * This event is triggered upon when an error occurs trying to play an ad.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The ad plugin.</li>
     *   <li>The time the ad was scheduled to play.</li>
     *   <li>The final ad tag after macro substitution</li>
     *   <li>The list of all video plugins.</li>
     *   <li>The error code.</li>
     *   <li>The error message.</li>
     *   <li>The media file URL.</li>
     * </ul>
     * @event OOV4.EVENTS#AD_PLAYBACK_ERROR
     */
    AD_PLAYBACK_ERROR: 'adPlaybackError',

    /**
     * This event is triggered when the ad plugin sdk records an impression event.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The ad plugin.</li>
     *   <li>The time the ad was scheduled to play.</li>
     *   <li>The ad load time - time between ad request success and first frame started.</li>
     *   <li>The ad protocol: VAST or VPAID.</li>
     *   <li>The ad type: linearVideo, linearOverlay, nonLinearVideo, nonLinearOverlay.</li>
     * </ul>
     * @event OOV4.EVENTS#AD_SDK_IMPRESSION
     */
    AD_SDK_IMPRESSION: 'adSdkImpression',

    /**
     * This event is triggered when an ad has completed playback.
     * The handler is called with the following arguments:
     * <ul>
     *   <li>The ad plugin.</li>
     *   <li>The time passed since the ad impression.</li>
     *   <li>If the ad was skipped or not.</li>
     * </ul>
     * @event OOV4.EVENTS#AD_COMPLETED
     */
    AD_COMPLETED: 'adCompleted',
    WILL_FETCH_ADS: 'willFetchAds',
    DISABLE_SEEKING: 'disableSeeking',
    ENABLE_SEEKING: 'enableSeeking',

    /**
     * This event is triggered before an ad is played. Depending on the context, the handler is called with:
     *   <ul>
     *     <li>The duration of the ad.</li>
     *     <li>The ID of the ad.</li>
     *   </ul>
     *
     *
     * <h5>Analytics:</h5>
     * <p style="text-indent: 1em;"Triggers an <b>Ad Analytics</b> <code>AD_IMPRESSION</code> event.</p>
     *
     * @event OOV4.EVENTS#WILL_PLAY_ADS
     */
    WILL_PLAY_ADS: 'willPlayAds',
    WILL_PLAY_SINGLE_AD: 'willPlaySingleAd',
    WILL_PAUSE_ADS: 'willPauseAds',
    WILL_RESUME_ADS: 'willResumeAds',

    /**
     * This event is triggered to indicate that a non-linear ad will be played.  The handler is called with:
     *   <ul>
     *     <li>An object representing the ad.  For a definition, see class 'Ad' from the ad manager framework.</li>
     *   </ul>
     *
     * @event OOV4.EVENTS#WILL_PLAY_NONLINEAR_AD
     */
    WILL_PLAY_NONLINEAR_AD: 'willPlayNonlinearAd',

    /**
     * A non-linear ad will play now.  The handler is called with:
     *   <ul>
     *     <li>An object containing the following fields:</li>
     *     <ul>
     *       <li>ad: An object representing the ad.  For a definition, see class 'Ad' from the ad manager framework.</li>
     *       <li>url: [optional] The url of the nonlinear ad.</li>
     *     </ul>
     *   </ul>
     *
     * @event OOV4.EVENTS#PLAY_NONLINEAR_AD
     */
    PLAY_NONLINEAR_AD: 'playNonlinearAd',

    /**
    * A nonlinear ad was loaded in the UI.
    *
    *
    * @event OOV4.EVENTS#NONLINEAR_AD_DISPLAYED
    */
    NONLINEAR_AD_DISPLAYED: 'nonlinearAdDisplayed',

    /**
     * A set of ads have been played. Depending on the context, the handler is called with:
     *   <ul>
     *     <li>The duration of the ad.</li>
     *     <li>The ID of the item to play.</li>
     *   </ul>
     *
     *
     * @event OOV4.EVENTS#ADS_PLAYED
     */
    ADS_PLAYED: 'adsPlayed',
    SINGLE_AD_PLAYED: 'singleAdPlayed',

    /**
     * This event is triggered when an error has occurred with an ad. <br/><br/>
     *
     *
     * @event OOV4.EVENTS#ADS_ERROR
     */
    ADS_ERROR: 'adsError',

    /**
     * This event is triggered when an ad has been clicked. <br/><br/>
     *
     *
     * @event OOV4.EVENTS#ADS_CLICKED
     */
    ADS_CLICKED: 'adsClicked',
    FIRST_AD_FETCHED: "firstAdFetched",
    AD_CONFIG_READY: "adConfigReady",

    /**
     * This event is triggered before the companion ads are shown.
     * Companion ads are displayed on a customer page and are not displayed in the player.
     * This event notifies the page handler to display the specified ad, and is the only means by which companion ads can appear.
     * If the page does not handle this event, companion ads will not appear.
     * Depending on the context, the handler is called with:
     *   <ul>
     *     <li>The ID of all companion ads.</li>
     *     <li>The ID of a single companion ad.</li>
     *   </ul>
     *
     *
     * <h5>Analytics:</h5>
     * <p style="text-indent: 1em;"Triggers an <b>Ad Analytics</b> <code>AD_IMPRESSION</code> event.</p>
     *
     * @event OOV4.EVENTS#WILL_SHOW_COMPANION_ADS
     */
    WILL_SHOW_COMPANION_ADS: "willShowCompanionAds",
    AD_FETCH_FAILED: "adFetchFailed",
    MIDROLL_PLAY_FAILED: "midrollPlayFailed",
    SKIP_AD: "skipAd",
    UPDATE_AD_COUNTDOWN: "updateAdCountdown",
    // this player is part of these experimental variations
    REPORT_EXPERIMENT_VARIATIONS: "reportExperimentVariations",
    FETCH_STYLE: "fetchStyle",
    STYLE_FETCHED: "styleFetched",
    SET_STYLE: "setStyle",
    USE_SERVER_SIDE_HLS_ADS: "useServerSideHlsAds",
    LOAD_ALL_VAST_ADS: "loadAllVastAds",
    ADS_FILTERED: "adsFiltered",
    ADS_MANAGER_HANDLING_ADS: "adsManagerHandlingAds",
    ADS_MANAGER_FINISHED_ADS: "adsManagerFinishedAds",
    // This event contains the information AMC need to know to place the overlay in the correct position.
    OVERLAY_RENDERING: "overlayRendering",

    /**
     * Event for signaling Ad Controls (Scrubber bar and Control bar) rendering:
     *   <ul>
     *     <li>Boolean parameter, 'false' to not show ad controls, 'true' to show ad controls based on skin config</li>
     *   </ul>
     *
     *
     * @event OOV4.EVENTS#SHOW_AD_CONTROLS
     */
    SHOW_AD_CONTROLS: "showAdControls",

    /**
     * Event for signaling Ad Marquee rendering:
     *   <ul>
     *     <li>Boolean parameter, 'false' to not show ad marquee, 'true' to show ad marquee based on skin config</li>
     *   </ul>
     *
     *
     * @event OOV4.EVENTS#SHOW_AD_MARQUEE
     */
    SHOW_AD_MARQUEE: "showAdMarquee",

    /**
     * An ad plugin will publish this event whenever the ad SDK throws an ad event. Typical ad events are
     * impressions, clicks, quartiles, etc. <br/><br/>
     *
     * @event OOV4.EVENTS#SDK_AD_EVENT
     * @private
     */
    SDK_AD_EVENT: "sdkAdEvent",
    // Window published beforeUnload event. It's still user cancellable.

    /**
     * The window, document, and associated resources are being unloaded.
     * The handler is called with <code>true</code> if a page unload has been requested, <code>false</code> otherwise.
     * This event may be required since some browsers perform asynchronous page loading while the current page is still active,
     * meaning that the end user loads a page with the Ooyala player, plays an asset, then redirects the page to a new URL they have specified.
     * Some browsers will start loading the new data while still displaying the player, which will result in an error since the networking has already been reset.
     * To prevent such false errors, listen to this event and ignore any errors raised after such actions have occurred.
     * <br/><br/>
     *
     *
     * @event OOV4.EVENTS#PAGE_UNLOAD_REQUESTED
     */
    PAGE_UNLOAD_REQUESTED: "pageUnloadRequested",
    // Either 1) The page is refreshing (almost certain) or 2) The user tried to refresh
    // the page, the embedding page had an "Are you sure?" prompt, the user clicked
    // on "stay", and a real error was produced due to another reason during the
    // following few seconds. The real error, if any, will be received in some seconds.
    // If we are certain it has unloaded, it's too late to be useful.
    PAGE_PROBABLY_UNLOADING: "pageProbablyUnloading",
    // DiscoveryApi publishes these, OoyalaAnalytics listens for them and propagates to reporter.js
    REPORT_DISCOVERY_IMPRESSION: "reportDiscoveryImpression",
    REPORT_DISCOVERY_CLICK: "reportDiscoveryClick",
    // These discovery events are propagated to the iq plugin
    DISCOVERY_API: {
      /**
       * Represents the discovery display event
       * @event OOV4.EVENTS.DISCOVERY_API#SEND_DISPLAY_EVENT
       * @public
      */
      SEND_DISPLAY_EVENT: "sendDisplayEvent",

      /**
       * Represents the discovery click event
       * @event OOV4.EVENTS.DISCOVERY_API#SEND_CLICK_EVENT
       * @public
      */
      SEND_CLICK_EVENT: "sendClickEvent"
    },

    /**
     * Denotes that the playlist plugin is ready and has configured the playlist Pod(s).
     * @event OOV4.EVENTS#PLAYLISTS_READY
     * @public
     */
    PLAYLISTS_READY: 'playlistReady',

    /**
     * It shows that a type of a video was changed
     * @event OOV4.EVENTS#VIDEO_TYPE_CHANGED
     * @public
     */
    VIDEO_TYPE_CHANGED: "videoTypeChanged",

    /**
     * The UI layer has finished its initial render. The handler is called with an object
     * of the following structure:
     *
     * <ul>
     *   <li>videoWrapperClass: The class name of the element containing the UI layer</li>
     *   <li>pluginsClass: The class name of the element into which the plugins content should be inserted</li>
     * </ul>
     *
     * If the UI layer doesn't require any special handling, the values for these two keys will be null.
     *
     * @event OOV4.EVENTS#UI_READY
     */
    UI_READY: "uiReady",
    __end_marker: true
  };
  /**
  * @description Represents the Ooyala V3 Player Errors. Use message bus events to handle errors by subscribing to or intercepting the <code>OOV4.EVENTS.ERROR</code> event.
  * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
  * @summary Represents the Ooyala V3 Player Errors.
  * @namespace OOV4.ERROR
  */

  OOV4.ERROR = {
    /**
     * @description Represents the <code>OOV4.ERROR.API</code> Ooyala V3 Player Errors. Use message bus events to handle errors by subscribing to or intercepting the <code>OOV4.EVENTS.ERROR</code> event.
    * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
    * @summary Represents the <code>OOV4.ERROR.API</code> Ooyala V3 Player Errors.
     * @namespace OOV4.ERROR.API
     */
    API: {
      /**
       * @description <code>OOV4.ERROR.API.NETWORK ('network')</code>: Cannot contact the server.
      * @constant OOV4.ERROR.API.NETWORK
      * @type {string}
      */
      NETWORK: 'network',

      /**
       * @description Represents the <code>OOV4.ERROR.API.SAS</code> Ooyala V3 Player Errors for the Stream Authorization Server.
       * Use message bus events to handle errors by subscribing to or intercepting the <code>OOV4.EVENTS.ERROR</code> event.
      * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
      * @summary Represents the <code>OOV4.ERROR.API.SAS</code> Ooyala V3 Player Errors.
       * @namespace OOV4.ERROR.API.SAS
       */
      SAS: {
        /**
         * @description <code>OOV4.ERROR.API.SAS.GENERIC ('sas')</code>: Invalid authorization response.
         * @constant OOV4.ERROR.API.SAS.GENERIC
         * @type {string}
         */
        GENERIC: 'sas',

        /**
         * @description <code>OOV4.ERROR.API.SAS.GEO ('geo')</code>: This video is not authorized for your location.
         * @constant OOV4.ERROR.API.SAS.GEO
         * @type {string}
         */
        GEO: 'geo',

        /**
         * @description <code>OOV4.ERROR.API.SAS.DOMAIN ('domain')</code>: This video is not authorized for your domain.
         * @constant OOV4.ERROR.API.SAS.DOMAIN
         * @type {string}
         */
        DOMAIN: 'domain',

        /**
         * @description <code>OOV4.ERROR.API.SAS.FUTURE ('future')</code>: This video will be available soon.
         * @constant OOV4.ERROR.API.SAS.FUTURE
         * @type {string}
         */
        FUTURE: 'future',

        /**
         * @description <code>OOV4.ERROR.API.SAS.PAST ('past')</code>: This video is no longer available.
         * @constant OOV4.ERROR.API.SAS.PAST
         * @type {string}
         */
        PAST: 'past',

        /**
         * @description <code>OOV4.ERROR.API.SAS.DEVICE ('device')</code>: This video is not authorized for playback on this device.
         * @constant OOV4.ERROR.API.SAS.DEVICE
         * @type {string}
         */
        DEVICE: 'device',

        /**
         * @description <code>OOV4.ERROR.API.SAS.PROXY ('proxy')</code>: An anonymous proxy was detected. Please disable the proxy and retry.
         * @constant OOV4.ERROR.API.SAS.PROXY
         * @type {string}
         */
        PROXY: 'proxy',

        /**
         * @description <code>OOV4.ERROR.API.SAS.CONCURRENT_STREAM ('concurrent_streams')S</code>: You have exceeded the maximum number of concurrent streams.
         * @constant OOV4.ERROR.API.SAS.CONCURRENT_STREAMS
         * @type {string}
         */
        CONCURRENT_STREAMS: 'concurrent_streams',

        /**
         * @description <code>OOV4.ERROR.API.SAS.INVALID_HEARTBEAT ('invalid_heartbeat')</code>: Invalid heartbeat response.
         * @constant OOV4.ERROR.API.SAS.INVALID_HEARTBEAT
         * @type {string}
         */
        INVALID_HEARTBEAT: 'invalid_heartbeat',

        /**
         * @description <code>OOV4.ERROR.API.SAS.ERROR_DEVICE_INVALID_AUTH_TOKEN ('device_invalid_auth_token')</code>: Invalid Ooyala Player token.
         * @constant OOV4.ERROR.API.SAS.ERROR_DEVICE_INVALID_AUTH_TOKEN
         * @type {string}
         */
        ERROR_DEVICE_INVALID_AUTH_TOKEN: 'device_invalid_auth_token',

        /**
         * @description <code>OOV4.ERROR.API.SAS.ERROR_DEVICE_LIMIT_REACHED ('device_limit_reached')</code>: The device limit has been reached.
         * The device limit is the maximum number of devices that can be registered with the viewer.
         * When the number of registered devices exceeds the device limit for the account or provider, this error is displayed.
         * @constant OOV4.ERROR.API.SAS.ERROR_DEVICE_LIMIT_REACHED
         * @type {string}
         */
        ERROR_DEVICE_LIMIT_REACHED: 'device_limit_reached',

        /**
         * @description <code>OOV4.ERROR.API.SAS.ERROR_DEVICE_BINDING_FAILED ('device_binding_failed')</code>: Device binding failed.
         * If the number of devices registered is already equal to the number of devices that may be bound for the account,
         * attempting to register a new device will result in this error.
         * @constant OOV4.ERROR.API.SAS.ERROR_DEVICE_BINDING_FAILED
         * @type {string}
         */
        ERROR_DEVICE_BINDING_FAILED: 'device_binding_failed',

        /**
         * @description <code>OOV4.ERROR.API.SAS.ERROR_DEVICE_ID_TOO_LONG ('device_id_too_long')</code>: The device ID is too long.
         * The length limit for the device ID is 1000 characters.
         * @constant OOV4.ERROR.API.SAS.ERROR_DEVICE_ID_TOO_LONG
         * @type {string}
         */
        ERROR_DEVICE_ID_TOO_LONG: 'device_id_too_long',

        /**
         * @description <code>OOV4.ERROR.API.SAS.ERROR_DRM_RIGHTS_SERVER_ERROR ('drm_server_error')</code>: DRM server error.
         * @constant OOV4.ERROR.API.SAS.ERROR_DRM_RIGHTS_SERVER_ERROR
         * @type {string}
         */
        ERROR_DRM_RIGHTS_SERVER_ERROR: 'drm_server_error',

        /**
         * @description <code>OOV4.ERROR.API.SAS.ERROR_DRM_GENERAL_FAILURE ('drm_general_failure')</code>: General error with acquiring license.
         * @constant OOV4.ERROR.API.SAS.ERROR_DRM_GENERAL_FAILURE
         * @type {string}
         */
        ERROR_DRM_GENERAL_FAILURE: 'drm_general_failure',

        /**
         * @description <code>OOV4.ERROR.API.SAS.ERROR_INVALID_ENTITLEMENTS ('invalid_entitlements')</code>: User Entitlement Terminated - Stream No Longer Active for the User.
         * @constant OOV4.ERROR.API.SAS.ERROR_INVALID_ENTITLEMENTS
         * @type {string}
         */
        ERROR_INVALID_ENTITLEMENTS: 'invalid_entitlements'
      },

      /**
       * @description <code>OOV4.ERROR.API.CONTENT_TREE ('content_tree')</code>: Invalid Content.
      * @constant OOV4.ERROR.API.CONTENT_TREE
      * @type {string}
      */
      CONTENT_TREE: 'content_tree',

      /**
       * @description <code>OOV4.ERROR.API.METADATA ('metadata')</code>: Invalid Metadata.
      * @constant OOV4.ERROR.API.METADATA
      * @type {string}
      */
      METADATA: 'metadata'
    },

    /**
     * @description Represents the <code>OOV4.ERROR.PLAYBACK</code> Ooyala V3 Player Errors. Use message bus events to handle errors by subscribing to or intercepting the <code>OOV4.EVENTS.ERROR</code> event.
    * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
     * @summary Represents the <code>OOV4.ERROR.PLAYBACK</code> Ooyala V3 Player Errors.
     * @namespace OOV4.ERROR.PLAYBACK
     */
    PLAYBACK: {
      /**
       * @description <code>OOV4.ERROR.PLAYBACK.GENERIC ('playback')</code>: Could not play the content.
       * @constant OOV4.ERROR.PLAYBACK.GENERIC
       * @type {string}
       */
      GENERIC: 'playback',

      /**
       * @description <code>OOV4.ERROR.PLAYBACK.STREAM ('stream')</code>: This video is not encoded for your device.
       * @constant OOV4.ERROR.PLAYBACK.STREAM
       * @type {string}
       */
      STREAM: 'stream',

      /**
       * @description <code>OOV4.ERROR.PLAYBACK.LIVESTREAM ('livestream')</code>: Live stream is off air.
       * @constant OOV4.ERROR.PLAYBACK.LIVESTREAM
       * @type {string}
       */
      LIVESTREAM: 'livestream',

      /**
       * @description <code>OOV4.ERROR.PLAYBACK.NETWORK ('network_error')</code>: The network connection was temporarily lost.
       * @constant OOV4.ERROR.PLAYBACK.NETWORK
       * @type {string}
       */
      NETWORK: 'network_error'
    },
    CHROMECAST: {
      MANIFEST: 'chromecast_manifest',
      MEDIAKEYS: 'chromecast_mediakeys',
      NETWORK: 'chromecast_network',
      PLAYBACK: 'chromecast_playback'
    },

    /**
     * @description <code>OOV4.ERROR.UNPLAYABLE_CONTENT ('unplayable_content')</code>: This video is not playable on this player.
     * @constant OOV4.ERROR.UNPLAYABLE_CONTENT
     * @type {string}
     */
    UNPLAYABLE_CONTENT: 'unplayable_content',

    /**
     * @description <code>OOV4.ERROR.INVALID_EXTERNAL_ID ('invalid_external_id')</code>: Invalid External ID.
     * @constant OOV4.ERROR.INVALID_EXTERNAL_ID
     * @type {string}
     */
    INVALID_EXTERNAL_ID: 'invalid_external_id',

    /**
     * @description <code>OOV4.ERROR.EMPTY_CHANNEL ('empty_channel')</code>: This channel is empty.
     * @constant OOV4.ERROR.EMPTY_CHANNEL
     * @type {string}
     */
    EMPTY_CHANNEL: 'empty_channel',

    /**
     * @description <code>OOV4.ERROR.EMPTY_CHANNEL_SET ('empty_channel_set')</code>: This channel set is empty.
     * @constant OOV4.ERROR.EMPTY_CHANNEL_SET
     * @type {string}
     */
    EMPTY_CHANNEL_SET: 'empty_channel_set',

    /**
     * @description <code>OOV4.ERROR.CHANNEL_CONTENT ('channel_content')</code>: This channel is not playable at this time.
     * @constant OOV4.ERROR.CHANNEL_CONTENT
     * @type {string}
     */
    CHANNEL_CONTENT: 'channel_content',

    /**
     * @description Represents the <code>OOV4.ERROR.VC</code> Ooyala V4 Player Errors for the Video Technology stack.
     * Use message bus events to handle errors by subscribing to or intercepting the <code>OOV4.EVENTS.ERROR</code> event.
         * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
         * @summary Represents the <code>OOV4.ERROR.VC</code> Ooyala V4 Player Errors.
     * @namespace OOV4.ERROR.VC
     */
    VC: {
      /**
      * @description <code>OOV4.ERROR.VC.UNSUPPORTED_ENCODING ('unsupported_encoding')</code>:
      *    This device does not have an available decoder for this stream type.
      * @constant OOV4.ERROR.VC.UNSUPPORTED_ENCODING
      * @type {string}
      */
      UNSUPPORTED_ENCODING: 'unsupported_encoding',

      /**
      * @description <code>OOV4.ERROR.VC.UNABLE_TO_CREATE_VIDEO_ELEMENT ('unable_to_create_video_element')</code>:
      *    A video element to play the given stream could not be created
      * @constant OOV4.ERROR.VC.UNABLE_TO_CREATE_VIDEO_ELEMENT
      * @type {string}
      */
      UNABLE_TO_CREATE_VIDEO_ELEMENT: 'unable_to_create_video_element'
    },

    /**
     * @namespace OOV4.ERROR.MEDIA
     */
    MEDIA: {
      /**
       * @description <code>OOV4.ERROR.MEDIA.MEDIA_ERR_ABORTED ('aborted')</code>:
       * The fetching of the associated resource was aborted by the user's request.
       * @constant OOV4.ERROR.MEDIA.MEDIA_ERR_ABORTED
       * @type {string}
       */
      MEDIA_ERR_ABORTED: "aborted",

      /**
       * @description <code>OOV4.ERROR.MEDIA.MEDIA_ERR_NETWORK ('aborted')</code>:
       * Some kind of network error occurred which prevented the media from being
       * successfully fetched, despite having previously been available.
       * @constant OOV4.ERROR.MEDIA.MEDIA_ERR_NETWORK
       * @type {string}
       */
      MEDIA_ERR_NETWORK: "network_error",

      /**
       * @description <code>OOV4.ERROR.MEDIA.MEDIA_ERR_DECODE ('aborted')</code>:
       * Despite having previously been determined to be usable, an error occurred
       * while trying to decode the media resource, resulting in an error.
       * @constant OOV4.ERROR.MEDIA.MEDIA_ERR_DECODE
       * @type {string}
       */
      MEDIA_ERR_DECODE: "decode_error",

      /**
       * @description <code>OOV4.ERROR.MEDIA.MEDIA_ERR_SRC_NOT_SUPPORTED ('aborted')</code>:
       * The associated resource or media provider object has been found to be unsuitable.
       * @constant OOV4.ERROR.MEDIA.MEDIA_ERR_SRC_NOT_SUPPORTED
       * @type {string}
       */
      MEDIA_ERR_SRC_NOT_SUPPORTED: "unsupported_source"
    }
  }; // All Server-side URLS

  OOV4.URLS = {
    VAST_PROXY: _.template('http://player.ooyala.com/nuplayer/mobile_vast_ads_proxy?callback=<%=cb%>&embed_code=<%=embedCode%>&expires=<%=expires%>&tag_url=<%=tagUrl%>'),
    EXTERNAL_ID: _.template('<%=server%>/player_api/v1/content_tree/external_id/<%=pcode%>/<%=externalId%>'),
    CONTENT_TREE: _.template('<%=server%>/player_api/v1/content_tree/embed_code/<%=pcode%>/<%=embedCode%>'),
    METADATA: _.template('<%=server%>/player_api/v1/metadata/embed_code/<%=playerBrandingId%>/<%=embedCode%>?videoPcode=<%=pcode%>'),
    SAS: _.template('<%=server%>/player_api/v1/authorization/embed_code/<%=pcode%>/<%=embedCode%>'),
    ANALYTICS: _.template('<%=server%>/reporter.js'),
    THUMBNAILS: _.template('<%=server%>/api/v1/thumbnail_images/<%=embedCode%>'),
    __end_marker: true
  };
  /**
   * Defines all the possible tracking levels for analytics.
   * @private
   */

  OOV4.TRACKING_LEVEL = {
    /**
     * Default tracking level. Full tracking enabled.
     * @private
     */
    DEFAULT: 'default',

    /**
     * Anonymous mode. Tracking is enabled but a new GUID is created for each session.
     * GUID not saved in local storage.
     * @private
     */
    ANONYMOUS: 'anonymous',

    /**
     * Tracking completely disabled. IQ, Librato and Analytics plugins are not loaded.
     * GUID not saved in local storage.
     * @private
     */
    DISABLED: 'disabled'
  };
  OOV4.PLUGINS = {
    ADS: "ads",
    VIDEO: "video",
    ANALYTICS: "analytics",
    PLAYLIST: "playlist",
    SKIN: "skin"
  };
  OOV4.VIDEO = {
    MAIN: "main",
    ADS: "ads",

    /**
     * @description Represents the <code>OOV4.VIDEO.ENCODING</code> encoding types. Used to denote video
     *              encoding types associated with a video stream url.
     * @summary Represents the <code>OOV4.VIDEO.ENCODING</code> encoding types.
     * @namespace OOV4.VIDEO.ENCODING
     */
    ENCODING: {
      /**
       * @description Represents DRM support for the encoding types.
       * @summary Represents the <code>OOV4.VIDEO.ENCODING.DRM</code> encoding types.
       * @namespace OOV4.VIDEO.ENCODING.DRM
       */
      DRM: {
        /**
         * @description <code>OOV4.VIDEO.ENCODING.DRM.HLS ('hls_drm')</code>:
         *   An encoding type for drm HLS streams.
         * @constant OOV4.VIDEO.ENCODING.DRM.HLS
         * @type {string}
         */
        HLS: "hls_drm",

        /**
         * @description <code>OOV4.VIDEO.ENCODING.DRM.DASH ('dash_drm')</code>:
         *   An encoding type for drm dash streams.
         * @constant OOV4.VIDEO.ENCODING.DRM.DASH
         * @type {string}
         */
        DASH: "dash_drm"
      },

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AUDIO ('audio')</code>:
       *   An encoding type for non-drm audio streams.
       * @constant OOV4.VIDEO.ENCODING.AUDIO
       * @type {string}
       */
      AUDIO: "audio",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AUDIO_OGG ('audio_ogg')</code>:
       *   An encoding type for non-drm ogg audio streams.
       * @constant OOV4.VIDEO.ENCODING.AUDIO_OGG
       * @type {string}
       */
      AUDIO_OGG: "audio_ogg",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AUDIO_M4A ('audio_m4a')</code>:
       *   An encoding type for non-drm m4a audio streams.
       * @constant OOV4.VIDEO.ENCODING.AUDIO_M4A
       * @type {string}
       */
      AUDIO_M4A: "audio_m4a",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AUDIO_HLS ('audio_hls')</code>:
       *   An encoding type for non-drm audio only HLS streams.
       * @constant OOV4.VIDEO.ENCODING.AUDIO_HLS
       * @type {string}
       */
      AUDIO_HLS: "audio_hls",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.DASH ('dash')</code>:
       *   An encoding type for non-drm dash streams (mpd extension).
       * @constant OOV4.VIDEO.ENCODING.DASH
       * @type {string}
       */
      DASH: "dash",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.HDS ('hds')</code>:
       *   An encoding type for non-drm hds streams (hds extension).
       * @constant OOV4.VIDEO.ENCODING.HDS
       * @type {string}
       */
      HDS: "hds",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.HLS ('hls')</code>:
       *   An encoding type for non-drm HLS streams (m3u8 extension).
       * @constant OOV4.VIDEO.ENCODING.HLS
       * @type {string}
       */
      HLS: "hls",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.IMA ('ima')</code>:
       *   A string that represents a video stream that is controlled and configured directly by IMA.
       * @constant OOV4.VIDEO.ENCODING.IMA
       * @type {string}
       */
      IMA: "ima",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.PULSE ('pulse')</code>:
       *   A string that represents a video stream that is controlled and configured directly by Pulse.
       * @constant OOV4.VIDEO.ENCODING.PULSE
       * @type {string}
       */
      PULSE: "pulse",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.MP4 ('mp4')</code>:
       *   An encoding type for non-drm mp4 streams (mp4 extension).
       * @constant OOV4.VIDEO.ENCODING.MP4
       * @type {string}
       */
      MP4: "mp4",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.YOUTUBE ('youtube')</code>:
       *   An encoding type for non-drm youtube streams.
       * @constant OOV4.VIDEO.ENCODING.YOUTUBE
       * @type {string}
       */
      YOUTUBE: "youtube",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.RTMP ('rtmp')</code>:
       *   An encoding type for non-drm rtmp streams.
       * @constant OOV4.VIDEO.ENCODING.RTMP
       * @type {string}
       */
      RTMP: "rtmp",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.SMOOTH ('smooth')</code>:
       *   An encoding type for non-drm smooth streams.
       * @constant OOV4.VIDEO.ENCODING.SMOOTH
       * @type {string}
       */
      SMOOTH: "smooth",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.WEBM ('webm')</code>:
       *   An encoding type for non-drm webm streams (webm extension).
       * @constant OOV4.VIDEO.ENCODING.WEBM
       * @type {string}
       */
      WEBM: "webm",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AKAMAI_HD_VOD ('akamai_hd_vod')</code>:
       *   An encoding type for akamai hd vod streams.
       * @constant OOV4.VIDEO.ENCODING.AKAMAI_HD_VOD
       * @type {string}
       */
      AKAMAI_HD_VOD: "akamai_hd_vod",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS ('akamai_hd2_vod_hls')</code>:
       *   An encoding type for akamai hd2 vod hls streams.
       * @constant OOV4.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS
       * @type {string}
       */
      AKAMAI_HD2_VOD_HLS: "akamai_hd2_vod_hls",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AKAMAI_HD2_VOD_HDS ('akamai_hd2_vod_hds')</code>:
       *   An encoding type for akamai hd2 vod hds streams.
       * @constant OOV4.VIDEO.ENCODING.AKAMAI_HD2_VOD_HDS
       * @type {string}
       */
      AKAMAI_HD2_VOD_HDS: "akamai_hd2_vod_hds",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AKAMAI_HD2_HDS ('akamai_hd2_hds')</code>:
       *   An encoding type for akamai hd2 live/remote hds streams.
       * @constant OOV4.VIDEO.ENCODING.AKAMAI_HD2_HDS
       * @type {string}
       */
      AKAMAI_HD2_HDS: "akamai_hd2_hds",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.AKAMAI_HD2_HLS ('akamai_hd2_hls')</code>:
       *   An encoding type for akamai hd2 live hls streams.
       * @constant OOV4.VIDEO.ENCODING.AKAMAI_HD2_HLS
       * @type {string}
       */
      AKAMAI_HD2_HLS: "akamai_hd2_hls",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.FAXS_HLS ('faxs_hls')</code>:
       *   An encoding type for adobe faxs streams.
       * @constant OOV4.VIDEO.ENCODING.FAXS_HLS
       * @type {string}
       */
      FAXS_HLS: "faxs_hls",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.WIDEVINE_HLS ('wv_hls')</code>:
       *   An encoding type for widevine hls streams.
       * @constant OOV4.VIDEO.ENCODING.WIDEVINE_HLS
       * @type {string}
       */
      WIDEVINE_HLS: "wv_hls",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.WIDEVINE_MP4 ('wv_mp4')</code>:
       *   An encoding type for widevine mp4 streams.
       * @constant OOV4.VIDEO.ENCODING.WIDEVINE_MP4
       * @type {string}
       */
      WIDEVINE_MP4: "wv_mp4",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.WIDEVINE_WVM ('wv_wvm')</code>:
       *   An encoding type for widevine wvm streams.
       * @constant OOV4.VIDEO.ENCODING.WIDEVINE_WVM
       * @type {string}
       */
      WIDEVINE_WVM: "wv_wvm",

      /**
       * @description <code>OOV4.VIDEO.ENCODING.UNKNOWN ('unknown')</code>:
       *   An encoding type for unknown streams.
       * @constant OOV4.VIDEO.ENCODING.UNKNOWN
       * @type {string}
       */
      UNKNOWN: "unknown"
    },

    /**
     * @description Represents the <code>OOV4.VIDEO.FEATURE</code> feature list. Used to denote which
     * features are supported by a video player.
     * @summary Represents the <code>OOV4.VIDEO.FEATURE</code> feature list.
     * @namespace OOV4.VIDEO.FEATURE
     */
    FEATURE: {
      /**
       * @description <code>OOV4.VIDEO.FEATURE.CLOSED_CAPTIONS ('closedCaptions')</code>:
       *   Closed captions parsed by the video element and sent to the player.
       * @constant OOV4.VIDEO.FEATURE.CLOSED_CAPTIONS
       * @type {string}
       */
      CLOSED_CAPTIONS: "closedCaptions",

      /**
       * @description <code>OOV4.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_GIVE ('videoObjectSharingGive')</code>:
       *   The video object is accessible and can be found by the player via the DOM element id.  Other
       *   modules can use this video object if required.
       * @constant OOV4.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_GIVE
       * @type {string}
       */
      VIDEO_OBJECT_SHARING_GIVE: "videoObjectSharingGive",

      /**
       * @description <code>OOV4.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_TAKE ('videoObjectSharingTake')</code>:
       *   The video object used can be created external from this video plugin.  This plugin will use the
       *   existing video element as its own.
       * @constant OOV4.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_TAKE
       * @type {string}
       */
      VIDEO_OBJECT_SHARING_TAKE: "videoObjectSharingTake",

      /**
       * @description <code>OOV4.VIDEO.FEATURE.BITRATE_CONTROL ('bitrateControl')</code>:
       *   The video object allows the playing bitrate to be selected via the SET_TARGET_BITRATE event.
       *   The video controller must publish BITRATE_INFO_AVAILABLE with a list of bitrate objects that can be selected.
       *   The video controller must publish BITRATE_CHANGED events with the bitrate object that was switched to.
       *   A bitrate object should at minimum contain height, width, and bitrate properties. Height and width
       *   should be the vertical and horizontal resoluton of the stream and bitrate should be in bits per second.
       * @constant OOV4.VIDEO.FEATURE.BITRATE_CONTROL
       * @type {string}
       */
      BITRATE_CONTROL: "bitrateControl"
    },

    /**
     * @description Represents the <code>OOV4.VIDEO.TECHNOLOGY</code> core video technology.
     * @summary Represents the <code>OOV4.VIDEO.TECHNOLOGY</code> core technology of the video element.
     * @namespace OOV4.VIDEO.TECHNOLOGY
     */
    TECHNOLOGY: {
      /**
       * @description <code>OOV4.VIDEO.TECHNOLOGY.FLASH ('flash')</code>:
       *   The core video technology is based on Adobe Flash.
       * @constant OOV4.VIDEO.TECHNOLOGY.FLASH
       * @type {string}
       */
      FLASH: "flash",

      /**
       * @description <code>OOV4.VIDEO.TECHNOLOGY.HTML5 ('html5')</code>:
       *   The core video technology is based on the native html5 'video' tag.
       * @constant OOV4.VIDEO.TECHNOLOGY.HTML5
       * @type {string}
       */
      HTML5: "html5",

      /**
       * @description <code>OOV4.VIDEO.TECHNOLOGY.MIXED ('mixed')</code>:
       *   The core video technology used may be based on any one of multiple core technologies.
       * @constant OOV4.VIDEO.TECHNOLOGY.MIXED
       * @type {string}
       */
      MIXED: "mixed",

      /**
       * @description <code>OOV4.VIDEO.TECHNOLOGY.OTHER ('other')</code>:
       *   The video is based on a core video technology that doesn't fit into another classification
       *   found in <code>OOV4.VIDEO.TECHNOLOGY</code>.
       * @constant OOV4.VIDEO.TECHNOLOGY.OTHER
       * @type {string}
       */
      OTHER: "other"
    }
  };
  OOV4.CSS = {
    VISIBLE_POSITION: "0px",
    INVISIBLE_POSITION: "-100000px",
    VISIBLE_DISPLAY: "block",
    INVISIBLE_DISPLAY: "none",
    VIDEO_Z_INDEX: 10000,
    SUPER_Z_INDEX: 20000,
    ALICE_SKIN_Z_INDEX: 11000,
    OVERLAY_Z_INDEX: 10500,
    TRANSPARENT_COLOR: "rgba(255, 255, 255, 0)",
    __end_marker: true
  };
  OOV4.TEMPLATES = {
    RANDOM_PLACE_HOLDER: ['[place_random_number_here]', '<now>', '[timestamp]', '<rand-num>', '[cache_buster]', '[random]'],
    REFERAK_PLACE_HOLDER: ['[referrer_url]', '[LR_URL]', '[description_url]'],
    EMBED_CODE_PLACE_HOLDER: ['[oo_embedcode]'],
    MESSAGE: '\
                  <table width="100%" height="100%" bgcolor="black" style="padding-left:55px; padding-right:55px; \
                  background-color:black; color: white;">\
                  <tbody>\
                  <tr valign="middle">\
                  <td align="right"><span style="font-family:Arial; font-size:20px">\
                  <%= message %>\
                  </span></td></tr></tbody></table>\
                  ',
    __end_marker: true
  };
  OOV4.CONSTANTS = {
    // Ad frequency constants
    AD_PLAY_COUNT_KEY: "oo_ad_play_count",
    AD_ID_TO_PLAY_COUNT_DIVIDER: ":",
    AD_PLAY_COUNT_DIVIDER: "|",
    MAX_AD_PLAY_COUNT_HISTORY_LENGTH: 20,
    CONTROLS_BOTTOM_PADDING: 10,
    SEEK_TO_END_LIMIT: 3,

    /**
     * @description <code>OOV4.CONSTANTS.PLAYER_TYPE</code>:
     *   An object containing the possible modes in which the player can operate.
     * @constant OOV4.CONSTANTS.PLAYER_TYPE
     * @type {object}
     */
    PLAYER_TYPE: {
      /**
       * @description <code>OOV4.CONSTANTS.PLAYER_TYPE.VIDEO ('video')</code>:
       *   The default player type (video player).
       * @constant OOV4.CONSTANTS.PLAYER_TYPE.VIDEO
       * @type {string}
       */
      VIDEO: 'video',

      /**
       * @description <code>OOV4.CONSTANTS.PLAYER_TYPE.AUDIO ('audio')</code>:
       *   The audio-only player type.
       * @constant OOV4.CONSTANTS.PLAYER_TYPE.AUDIO
       * @type {string}
       */
      AUDIO: 'audio'
    },
    HEVC_CODEC: {
      HEV1: "hev1",
      HVC1: "hvc1"
    },

    /**
     * @description <code>OOV4.CONSTANTS.CLOSED_CAPTIONS</code>:
     *   An object containing the possible modes for the closed caption text tracks.
     * @constant OOV4.CONSTANTS.CLOSED_CAPTIONS
     * @type {object}
     */
    CLOSED_CAPTIONS: {
      /**
       * @description <code>OOV4.CONSTANTS.CLOSED_CAPTIONS.SHOWING ('showing')</code>:
       *   Closed caption text track mode for showing closed captions.
       * @constant OOV4.CONSTANTS.CLOSED_CAPTIONS.SHOWING
       * @type {string}
       */
      SHOWING: "showing",

      /**
       * @description <code>OOV4.CONSTANTS.CLOSED_CAPTIONS.HIDDEN ('hidden')</code>:
       *   Closed caption text track mode for hiding closed captions.
       * @constant OOV4.CONSTANTS.CLOSED_CAPTIONS.HIDDEN
       * @type {string}
       */
      HIDDEN: "hidden",

      /**
       * @description <code>OOV4.CONSTANTS.CLOSED_CAPTIONS.DISABLED ('disabled')</code>:
       *   Closed caption text track mode for disabling closed captions.
       * @constant OOV4.CONSTANTS.CLOSED_CAPTIONS.DISABLED
       * @type {string}
       */
      DISABLED: "disabled"
    },
    OOYALA_PLAYER_SETTINGS_KEY: 'ooyala_player_settings',
    PLAYBACK_SPEED: {
      /**
       * The minimum allowed speed multiplier for a video playback.
       * @constant OOV4.CONSTANTS.PLAYBACK_SPEED.MIN
       * @type {Number}
       */
      MIN: 0.5,

      /**
       * @description The maximum allowed speed multiplier for a video playback.
       * @constant OOV4.CONSTANTS.PLAYBACK_SPEED.MAX
       * @type {Number}
       */
      MAX: 2.0
    },
    __end_marker: true
  };
})(OOV4, OOV4._);

},{}],5:[function(require,module,exports){
(function (OOV4, _, HM) {
  // Ensure playerParams exists
  OOV4.playerParams = HM.safeObject('environment.playerParams', OOV4.playerParams, {}); // Init publisher's OOV4.playerParams via player parameter object

  OOV4.configurePublisher = function (parameters) {
    OOV4.playerParams.pcode = parameters.pcode || OOV4.playerParams.pcode || '';
    OOV4.playerParams.playerBrandingId = parameters.playerBrandingId || OOV4.playerParams.playerBrandingId || '';
    OOV4.playerParams.playerType = parameters.playerType || OOV4.playerParams.playerType || OOV4.CONSTANTS.PLAYER_TYPE.VIDEO;
    OOV4.playerParams.debug = parameters.debug || OOV4.playerParams.debug || '';
  };

  OOV4.isPublisherConfigured = function () {
    return !!(OOV4.playerParams.pcode && OOV4.playerParams.playerBrandingId);
  }; // Set API end point environment


  OOV4.setServerHost = function (parameters) {
    OOV4.playerParams.api_ssl_server = parameters.api_ssl_server || OOV4.playerParams.api_ssl_server || null;
    OOV4.playerParams.api_server = parameters.api_server || OOV4.playerParams.api_server || null;
    OOV4.playerParams.auth_ssl_server = parameters.auth_ssl_server || OOV4.playerParams.auth_ssl_server || null;
    OOV4.playerParams.auth_server = parameters.auth_server || OOV4.playerParams.auth_server || null;
    OOV4.playerParams.analytics_ssl_server = parameters.analytics_ssl_server || OOV4.playerParams.analytics_ssl_server || null;
    OOV4.playerParams.analytics_server = parameters.analytics_server || OOV4.playerParams.analytics_server || null;
    updateServerHost();
  };

  var updateServerHost = function () {
    OOV4.SERVER = {
      API: OOV4.isSSL ? OOV4.playerParams.api_ssl_server || "https://player.ooyala.com" : OOV4.playerParams.api_server || "http://player.ooyala.com",
      AUTH: OOV4.isSSL ? OOV4.playerParams.auth_ssl_server || "https://player.ooyala.com/sas" : OOV4.playerParams.auth_server || "http://player.ooyala.com/sas",
      ANALYTICS: OOV4.isSSL ? OOV4.playerParams.analytics_ssl_server || "https://player.ooyala.com" : OOV4.playerParams.analytics_server || "http://player.ooyala.com"
    };
  }; // process tweaks
  // tweaks is optional. Hazmat takes care of this but throws an undesirable warning.


  OOV4.playerParams.tweaks = OOV4.playerParams.tweaks || '';
  OOV4.playerParams.tweaks = HM.safeString('environment.playerParams.tweaks', OOV4.playerParams.tweaks, '');
  OOV4.playerParams.tweaks = OOV4.playerParams.tweaks.split(','); // explicit list of supported tweaks

  OOV4.tweaks = {};
  OOV4.tweaks["android-enable-hls"] = _.contains(OOV4.playerParams.tweaks, 'android-enable-hls');
  OOV4.tweaks["html5-force-mp4"] = _.contains(OOV4.playerParams.tweaks, 'html5-force-mp4'); // Max timeout for fetching ads metadata, default to 3 seconds.

  OOV4.playerParams.maxAdsTimeout = OOV4.playerParams.maxAdsTimeout || 5; // max wrapper ads depth we look, we will only look up to 3 level until we get vast inline ads

  OOV4.playerParams.maxVastWrapperDepth = OOV4.playerParams.maxVastWrapperDepth || 3;
  OOV4.playerParams.minLiveSeekWindow = OOV4.playerParams.minLiveSeekWindow || 10; // Ripped from: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript

  OOV4.guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
  OOV4.playerCount = 0; // Check environment to see if this is prod

  OOV4.isProd = !!(OOV4.playerParams.environment && OOV4.playerParams.environment.match(/^prod/i)); // Environment invariant.

  OOV4.platform = window.navigator.platform;
  OOV4.os = window.navigator.appVersion;
  OOV4.supportsVideo = !!document.createElement('video').canPlayType;

  OOV4.browserSupportsCors = function () {
    try {
      return _.has(new XMLHttpRequest(), "withCredentials") || _.has(XMLHttpRequest.prototype, "withCredentials");
    } catch (e) {
      return false;
    }
  }();

  OOV4.isWindows = function () {
    return !!OOV4.platform.match(/Win/);
  }();

  OOV4.isIos = function () {
    return !!OOV4.platform.match(/iPhone|iPad|iPod/);
  }();

  OOV4.isIphone = function () {
    return !!OOV4.platform.match(/iPhone|iPod/);
  }();

  OOV4.isIpad = function () {
    return !!OOV4.platform.match(/iPad/);
  }();

  OOV4.iosMajorVersion = function () {
    try {
      if (OOV4.isIos) {
        return parseInt(window.navigator.userAgent.match(/OS (\d+)/)[1], 10);
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  }();

  OOV4.isAndroid = function () {
    return !!(OOV4.os.match(/Android/) && !OOV4.os.match(/Windows Phone/));
  }();

  OOV4.isAndroid4Plus = function () {
    var version = OOV4.os.match(/Android [\d\.]*;/);

    if (version && version.length > 0) {
      version = parseInt(version[0].substring(version[0].indexOf(' ') + 1, version[0].search('[\.\;]')));
    }

    return OOV4.isAndroid && version >= 4;
  }();
  /**
   * Check if Android version > 4.3
   * @returns {boolean} true if OS is not Android or Android version > 4.3 otherwise false
   */


  OOV4.isAndroid4_4Plus = function () {
    var isAndroid4_4Plus = false;

    if (OOV4.isAndroid) {
      var userAgent = OOV4.os.match(/Android [\d\.]*;/);

      if (userAgent && userAgent.length) {
        var userAgentLowerCase = userAgent[0].toLowerCase();
        var version = userAgentLowerCase.match(/android\s([0-9\.]*)/)[1];
        var android4_3 = 4.3;
        isAndroid4_4Plus = parseFloat(version) > android4_3;
      }
    }

    return isAndroid4_4Plus;
  }();

  OOV4.isRimDevice = function () {
    return !!(OOV4.os.match(/BlackBerry/) || OOV4.os.match(/PlayBook/));
  }();

  OOV4.isFirefox = function () {
    return !!window.navigator.userAgent.match(/Firefox/);
  }();

  OOV4.isChrome = function () {
    return !!window.navigator.userAgent.match(/Chrome/) && !window.navigator.userAgent.match(/Edge/);
  }();

  OOV4.isSafari = function () {
    return !!window.navigator.userAgent.match(/AppleWebKit/) && !window.navigator.userAgent.match(/Chrome/) && !window.navigator.userAgent.match(/like iPhone/);
  }();

  OOV4.chromeMajorVersion = function () {
    try {
      return parseInt(window.navigator.userAgent.match(/Chrome.([0-9]*)/)[1], 10);
    } catch (err) {
      return null;
    }
  }();

  OOV4.isIE = function () {
    return !!window.navigator.userAgent.match(/MSIE/) || !!window.navigator.userAgent.match(/Trident/);
  }();

  OOV4.isEdge = function () {
    return !!window.navigator.userAgent.match(/Edge/);
  }();

  OOV4.isIE11Plus = function () {
    // check if IE
    if (!window.navigator.userAgent.match(/Trident/)) {
      return false;
    } // extract version number


    var ieVersionMatch = window.navigator.userAgent.match(/rv:(\d*)/);
    var ieVersion = ieVersionMatch && ieVersionMatch[1];
    return ieVersion >= 11;
  }();

  OOV4.isWinPhone = function () {
    return !!OOV4.os.match(/Windows Phone/) || !!OOV4.os.match(/ZuneWP/) || !!OOV4.os.match(/XBLWP/);
  }();

  OOV4.isSmartTV = function () {
    return !!window.navigator.userAgent.match(/SmartTV/) || !!window.navigator.userAgent.match(/NetCast/);
  }();

  OOV4.isMacOs = function () {
    return !OOV4.isIos && !!OOV4.os.match(/Mac/) && !window.navigator.userAgent.match(/like iPhone/);
  }();

  OOV4.isMacOsLionOrLater = function () {
    // TODO: revisit for Firefox when possible/necessary
    var macOs = OOV4.os.match(/Mac OS X ([0-9]+)_([0-9]+)/);

    if (macOs == null || macOs.length < 3) {
      return false;
    }

    return parseInt(macOs[1], 10) >= 10 && parseInt(macOs[2], 10) >= 7;
  }();

  OOV4.macOsSafariVersion = function () {
    try {
      if (OOV4.isMacOs && OOV4.isSafari) {
        return parseInt(window.navigator.userAgent.match(/Version\/(\d+)/)[1], 10);
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  }();

  OOV4.isKindleHD = function () {
    return !!OOV4.os.match(/Silk\/2/);
  }();

  OOV4.supportMSE = function () {
    return 'MediaSource' in window || 'WebKitMediaSource' in window || 'mozMediaSource' in window || 'msMediaSource' in window;
  }();

  OOV4.supportAds = function () {
    // We are disabling ads for Android 2/3 device, the reason is that main video is not resuming after
    // ads finish. Util we can figure out a work around, we will keep ads disabled.
    return !OOV4.isWinPhone && !OOV4.os.match(/Android [23]/);
  }();

  OOV4.allowGesture = function () {
    return OOV4.isIos;
  }();

  OOV4.allowAutoPlay = function () {
    return !OOV4.isIos && !OOV4.isAndroid;
  }();

  OOV4.supportTouch = function () {
    // IE8- doesn't support JS functions on DOM elements
    if (document.documentElement.hasOwnProperty && document.documentElement.hasOwnProperty("ontouchstart")) {
      return true;
    }

    return false;
  }();

  OOV4.docDomain = function () {
    var domain = null;

    try {
      domain = document.domain;
    } catch (e) {}

    if (!OOV4._.isEmpty(domain)) {
      return domain;
    }

    if (OOV4.isSmartTV) {
      return 'SmartTV';
    }

    return 'unknown';
  }();

  OOV4.uiParadigm = function () {
    var paradigm = 'tablet'; // The below code attempts to decide whether or not we are running in 'mobile' mode
    // Meaning that no controls are displayed, chrome is minimized and only fullscreen playback is allowed
    // Unfortunately there is no clean way to figure out whether the device is tablet or phone
    // or even to properly detect device screen size http://tripleodeon.com/2011/12/first-understand-your-screen/
    // So there is a bunch of heuristics for doing just that
    // Anything that is not explicitly detected as mobile defaults to desktop
    // so worst case they get ugly chrome instead of unworking player

    if (OOV4.isAndroid4Plus && OOV4.tweaks["android-enable-hls"]) {
      // special case for Android 4+ running HLS
      paradigm = 'tablet';
    } else if (OOV4.isIphone) {
      paradigm = 'mobile-native';
    } else if (OOV4.os.match(/BlackBerry/)) {
      paradigm = 'mobile-native';
    } else if (OOV4.os.match(/iPad/)) {
      paradigm = 'tablet';
    } else if (OOV4.isKindleHD) {
      // Kindle Fire HD
      paradigm = 'mobile-native';
    } else if (OOV4.os.match(/Silk/)) {
      // Kindle Fire
      paradigm = 'mobile';
    } else if (OOV4.os.match(/Android 2/)) {
      // On Android 2+ only window.outerWidth is reliable, so we are using that and window.orientation
      if (window.orientation % 180 == 0 && window.outerWidth / window.devicePixelRatio <= 480) {
        // portrait mode
        paradigm = 'mobile';
      } else if (window.outerWidth / window.devicePixelRatio <= 560) {
        // landscape mode
        paradigm = 'mobile';
      }
    } else if (OOV4.os.match(/Android/)) {
      paradigm = 'tablet';
    } else if (OOV4.isWinPhone) {
      // Windows Phone is mobile only for now, tablets not yet released
      paradigm = 'mobile';
    } else if (!!OOV4.platform.match(/Mac/) // Macs
    || !!OOV4.platform.match(/Win/) // Winboxes
    || !!OOV4.platform.match(/Linux/)) {
      // Linux
      paradigm = 'desktop';
    }

    return paradigm;
  }();
  /**
   * Determines if a single video element should be used.<br/>
   * <ul><li>Use single video element on iOS, all versions</li>
   *     <li>Use single video element on Android, all versions</li></ul>
   * 01/11/17 Previous JSDoc for Android - to be removed once fix is confirmed and there is no regression:<br />
   * <ul><li>Use single video element on Android < v4.0</li>
   *     <li>Use single video element on Android with Chrome < v40<br/>
   *       (note, it might work on earlier versions but don't know which ones! Does not work on v18)</li></ul>
   *
   * @private
   * @returns {boolean} True if a single video element is required
   */


  OOV4.requiresSingleVideoElement = function () {
    return OOV4.isIos || OOV4.isAndroid; // 01/11/17 - commenting out, but not removing three lines below pending QA, we may need to restore this logic
    //var iosRequireSingleElement = OOV4.isIos;
    //var androidRequireSingleElement = OOV4.isAndroid && (!OOV4.isAndroid4Plus || OOV4.chromeMajorVersion < 40);
    // return iosRequireSingleElement || androidRequireSingleElement;
  }(); // TODO(jj): need to make this more comprehensive
  // Note(jj): only applies to mp4 videos for now


  OOV4.supportedVideoProfiles = function () {
    // iOS only supports baseline profile
    if (OOV4.isIos || OOV4.isAndroid) {
      return "baseline";
    }

    return null;
  }(); // TODO(bz): add flash for device when we decide to use stream data from sas
  // TODO(jj): add AppleTV and other devices as necessary


  OOV4.device = function () {
    var device = 'html5';

    if (OOV4.isIphone) {
      device = 'iphone-html5';
    } else if (OOV4.isIpad) {
      device = 'ipad-html5';
    } else if (OOV4.isAndroid) {
      device = 'android-html5';
    } else if (OOV4.isRimDevice) {
      device = 'rim-html5';
    } else if (OOV4.isWinPhone) {
      device = 'winphone-html5';
    } else if (OOV4.isSmartTV) {
      device = 'smarttv-html5';
    }

    return device;
  }(); // list of environment-specific modules needed by the environment or empty to include all
  // Note: should never be empty because of html5


  OOV4.environmentRequiredFeatures = function () {
    var features = [];

    if (OOV4.os.match(/Android 2/)) {
      // safari android
      features.push('html5-playback');
    } else {
      // normal html5
      features.push('html5-playback');

      if (OOV4.supportAds) {
        features.push('ads');
      }
    }

    return _.reduce(features, function (memo, feature) {
      return memo + feature + ' ';
    }, '');
  }();

  OOV4.supportMidRollAds = function () {
    return OOV4.uiParadigm === "desktop" && !OOV4.isIos && !OOV4.isRimDevice;
  }();

  OOV4.supportCookies = function () {
    document.cookie = "ooyala_cookie_test=true";
    var cookiesSupported = document.cookie.indexOf("ooyala_cookie_test=true") >= 0;
    document.cookie = "ooyala_cookie_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    return cookiesSupported;
  }();

  OOV4.isSSL = document.location.protocol == "https:";
  updateServerHost(); // returns true iff environment-specific feature is required to run in current environment

  OOV4.requiredInEnvironment = OOV4.featureEnabled = function (feature) {
    return !!OOV4.environmentRequiredFeatures.match(new RegExp(feature));
  }; // Detect Chrome Extension. We will recieve an acknowledgement from the content script, which will prompt us to start sending logs


  OOV4.chromeExtensionEnabled = document.getElementById('ooyala-extension-installed') ? true : false; // Locale Getter and Setter

  OOV4.locale = "";

  OOV4.setLocale = function (locale) {
    OOV4.locale = locale.toUpperCase();
  };

  OOV4.getLocale = function () {
    return (OOV4.locale || document.documentElement.lang || navigator.language || navigator.userLanguage || "en").substr(0, 2).toUpperCase();
  };
})(OOV4, OOV4._, OOV4.HM);

},{}],6:[function(require,module,exports){
(function (OOV4, _, $) {
  OOV4.getRandomString = function () {
    return Math.random().toString(36).substring(7);
  };

  OOV4.safeClone = function (source) {
    if (_.isNumber(source) || _.isString(source) || _.isBoolean(source) || _.isFunction(source) || _.isNull(source) || _.isUndefined(source)) {
      return source;
    }

    var result = source instanceof Array ? [] : {};

    try {
      $.extend(true, result, source);
    } catch (e) {
      OOV4.log("deep clone error", e);
    }

    return result;
  };

  OOV4.d = function () {
    if (OOV4.isDebug) {
      OOV4.log.apply(OOV4, arguments);
    }

    OOV4.$("#OOYALA_DEBUG_CONSOLE").append(JSON.stringify(OOV4.safeClone(arguments)) + '<br>');
  }; // Note: This inherit only for simple inheritance simulation, the Parennt class still has a this binding
  // to the parent class. so any variable initiated in the Parent Constructor, will not be available to the
  // Child Class, you need to copy paste constructor to Child Class to make it work.
  // coffeescript is doing a better job here by binding the this context to child in the constructor.
  // Until we switch to CoffeeScript, we need to be careful using this simplified inherit lib.


  OOV4.inherit = function (ParentClass, myConstructor) {
    if (typeof ParentClass !== "function") {
      OOV4.log("invalid inherit, ParentClass need to be a class", ParentClass);
      return null;
    }

    var SubClass = function () {
      ParentClass.apply(this, arguments);

      if (typeof myConstructor === "function") {
        myConstructor.apply(this, arguments);
      }
    };

    var parentClass = new ParentClass();

    OOV4._.extend(SubClass.prototype, parentClass);

    SubClass.prototype.parentClass = parentClass;
    return SubClass;
  };

  var styles = {}; // keep track of all styles added so we can remove them later if destroy is called

  OOV4.attachStyle = function (styleContent, playerId) {
    var s = $('<style type="text/css">' + styleContent + '</style>').appendTo("head");
    styles[playerId] = styles[playerId] || [];
    styles[playerId].push(s);
  };

  OOV4.removeStyles = function (playerId) {
    OOV4._.each(styles[playerId], function (style) {
      style.remove();
    });
  }; // object: object to get the inner property for, ex. {"mod":{"fw":{"data":{"key":"val"}}}}
  // keylist: list of keys to find, ex. ["mod", "fw", "data"]
  // example output: {"key":"val"}


  OOV4.getInnerProperty = function (object, keylist) {
    var innerObject = object;
    var list = keylist;

    while (list.length > 0) {
      var key = list.shift(); // Note that function and arrays are objects

      if (_.isNull(innerObject) || !_.isObject(innerObject) || _.isFunction(innerObject) || _.isArray(innerObject)) return null;
      innerObject = innerObject[key];
    }

    return innerObject;
  };

  OOV4.formatSeconds = function (timeInSeconds) {
    var seconds = parseInt(timeInSeconds, 10) % 60;
    var hours = parseInt(timeInSeconds / 3600, 10);
    var minutes = parseInt((timeInSeconds - hours * 3600) / 60, 10);

    if (hours < 10) {
      hours = '0' + hours;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    if (seconds < 10) {
      seconds = '0' + seconds;
    }

    return parseInt(hours, 10) > 0 ? hours + ":" + minutes + ":" + seconds : minutes + ":" + seconds;
  };

  OOV4.timeStringToSeconds = function (timeString) {
    var timeArray = (timeString || '').split(":");
    return _.reduce(timeArray, function (m, s) {
      return m * 60 + parseInt(s, 10);
    }, 0);
  };

  OOV4.leftPadding = function (num, totalChars) {
    var pad = '0';
    var numString = num ? num.toString() : '';

    while (numString.length < totalChars) {
      numString = pad + numString;
    }

    return numString;
  };

  OOV4.getColorString = function (color) {
    return '#' + OOV4.leftPadding(color.toString(16), 6).toUpperCase();
  };

  OOV4.hexToRgb = function (hex) {
    var r = (hex & 0xFF0000) >> 16;
    var g = (hex & 0xFF00) >> 8;
    var b = hex & 0xFF;
    return [r, g, b];
  };

  OOV4.changeColor = function (color, ratio, darker) {
    var minmax = darker ? Math.max : Math.min;
    var boundary = darker ? 0 : 255;
    var difference = Math.round(ratio * 255) * (darker ? -1 : 1);
    var rgb = OOV4.hexToRgb(color);
    return [OOV4.leftPadding(minmax(rgb[0] + difference, boundary).toString(16), 2), OOV4.leftPadding(minmax(rgb[1] + difference, boundary).toString(16), 2), OOV4.leftPadding(minmax(rgb[2] + difference, boundary).toString(16), 2)].join('');
  };

  OOV4.decode64 = function (s) {
    s = s.replace(/\n/g, "");
    var results = "";
    var j,
        i = 0;
    var enc = [];
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="; //shortcut for browsers with atob

    if (window.atob) {
      return atob(s);
    }

    do {
      for (j = 0; j < 4; j++) {
        enc[j] = b64.indexOf(s.charAt(i++));
      }

      results += String.fromCharCode(enc[0] << 2 | enc[1] >> 4, enc[2] == 64 ? 0 : (enc[1] & 15) << 4 | enc[2] >> 2, enc[3] == 64 ? 0 : (enc[2] & 3) << 6 | enc[3]);
    } while (i < s.length); //trim tailing null characters


    return results.replace(/\0/g, "");
  };

  OOV4.pixelPing = function (url) {
    var img = new Image();

    img.onerror = img.onabort = function () {
      OOV4.d("onerror:", url);
    };

    img.src = OOV4.getNormalizedTagUrl(url);
  }; // ping array of urls.


  OOV4.pixelPings = function (urls) {
    if (_.isEmpty(urls)) {
      return;
    }

    _.each(urls, function (url) {
      OOV4.pixelPing(url);
    }, this);
  }; // helper function to convert types to boolean
  // the (!!) trick only works to verify if a string isn't the empty string
  // therefore, we must use a special case for that


  OOV4.stringToBoolean = function (value) {
    if (typeof value === 'string') return value.toLowerCase().indexOf("true") > -1 || value.toLowerCase().indexOf("yes") > -1;
    return !!value;
  };

  OOV4.regexEscape = function (value) {
    var specials = /[<>()\[\]{}]/g;
    return value.replace(specials, "\\$&");
  };

  OOV4.getNormalizedTagUrl = function (url, embedCode) {
    var ts = new Date().getTime();
    var pageUrl = escape(document.URL);

    var placeHolderReplace = function (template, replaceValue) {
      _.each(template, function (placeHolder) {
        var regexSearchVal = new RegExp("(" + OOV4.regexEscape(placeHolder) + ")", 'gi');
        url = url.replace(regexSearchVal, replaceValue);
      }, this);
    }; // replace the timestamp and referrer_url placeholders


    placeHolderReplace(OOV4.TEMPLATES.RANDOM_PLACE_HOLDER, ts);
    placeHolderReplace(OOV4.TEMPLATES.REFERAK_PLACE_HOLDER, pageUrl); // first make sure that the embedCode exists, then replace the
    // oo_embedcode placeholder

    if (embedCode) {
      placeHolderReplace(OOV4.TEMPLATES.EMBED_CODE_PLACE_HOLDER, embedCode);
    }

    return url;
  };

  OOV4.safeSeekRange = function (seekRange) {
    return {
      start: seekRange.length > 0 ? seekRange.start(0) : 0,
      end: seekRange.length > 0 ? seekRange.end(0) : 0
    };
  };

  OOV4.loadedJS = OOV4.loadedJS || {};
  OOV4.jsOnSuccessList = OOV4.jsOnSuccessList || {};

  OOV4.safeFuncCall = function (fn) {
    if (typeof fn !== "function") {
      return;
    }

    try {
      fn.apply();
    } catch (e) {
      OOV4.log("Can not invoke function!", e);
    }
  };

  OOV4.loadScriptOnce = function (jsSrc, successCallBack, errorCallBack, timeoutInMillis) {
    OOV4.jsOnSuccessList[jsSrc] = OOV4.jsOnSuccessList[jsSrc] || [];

    if (OOV4.loadedJS[jsSrc]) {
      // invoke call back directly if loaded.
      if (OOV4.loadedJS[jsSrc] === "loaded") {
        OOV4.safeFuncCall(successCallBack);
      } else if (OOV4.loadedJS[jsSrc] === "loading") {
        OOV4.jsOnSuccessList[jsSrc].unshift(successCallBack);
      }

      return false;
    }

    OOV4.loadedJS[jsSrc] = "loading";
    $.ajax({
      url: jsSrc,
      type: 'GET',
      cache: true,
      dataType: 'script',
      timeout: timeoutInMillis || 15000,
      success: function () {
        OOV4.loadedJS[jsSrc] = "loaded";
        OOV4.jsOnSuccessList[jsSrc].unshift(successCallBack);

        OOV4._.each(OOV4.jsOnSuccessList[jsSrc], function (fn) {
          OOV4.safeFuncCall(fn);
        }, this);

        OOV4.jsOnSuccessList[jsSrc] = [];
      },
      error: function () {
        OOV4.safeFuncCall(errorCallBack);
      }
    });
    return true;
  };

  try {
    OOV4.localStorage = window.localStorage;
  } catch (err) {
    OOV4.log(err);
  }

  if (!OOV4.localStorage) {
    OOV4.localStorage = {
      getItem: function (sKey) {
        if (!sKey || !this.hasOwnProperty(sKey)) {
          return null;
        }

        return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
      },
      key: function (nKeyId) {
        return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
      },
      setItem: function (sKey, sValue) {
        if (!sKey) {
          return;
        }

        document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
        this.length = document.cookie.match(/\=/g).length;
      },
      length: 0,
      removeItem: function (sKey) {
        if (!sKey || !this.hasOwnProperty(sKey)) {
          return;
        }

        document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        this.length--;
      },
      hasOwnProperty: function (sKey) {
        return new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=").test(document.cookie);
      }
    };
    OOV4.localStorage.length = (document.cookie.match(/\=/g) || OOV4.localStorage).length;
  } // A container to properly request OOV4.localStorage.setItem


  OOV4.setItem = function (sKey, sValue) {
    try {
      OOV4.localStorage.setItem(sKey, sValue);
    } catch (err) {
      OOV4.log(err);
    }
  };
  /**
   * Converts a value to a number or returns null if it can't be converted or is not a finite value.
   * @public
   * @method OOV4#ensureNumber
   * @param {*} value The value to convert.
   * @param {*} defaultValue A default value to return when the input is not a valid number.
   * @return {Number} The Number equivalent of value if it can be converted and is finite.
   * When value doesn't meet the criteria the function will return either defaultValue (if provided) or null.
   */


  OOV4.ensureNumber = function (value, defaultValue) {
    var number;

    if (value === null || _.isArray(value)) {
      value = NaN;
    }

    if (_.isNumber(value)) {
      number = value;
    } else {
      number = Number(value);
    }

    if (!isFinite(number)) {
      return typeof defaultValue === 'undefined' ? null : defaultValue;
    }

    return number;
  };

  OOV4.JSON = window.JSON;
})(OOV4, OOV4._, OOV4.$);

},{}],7:[function(require,module,exports){
// Actual Hazmat Code
var HazmatBuilder = function(_,root) {

  // top level module
  var Hazmat  = function(config) {
    this.config = config || {};
    if(!_.isObject(this.config)) {
      throw new Error('Hazmat is not initialized properly');
    }
    this.fail = _.isFunction(this.config.fail) ? this.config.fail : Hazmat.fail;
    this.warn = _.isFunction(this.config.warn) ? this.config.warn : Hazmat.warn;
    this.log = _.isFunction(this.config.log) ? this.config.log : Hazmat.log;
  };

  _.extend(Hazmat, {

    // constants
    ID_REGEX : /^[\_A-Za-z0-9]+$/,

    // factory
    create : function(config) {
      return new Hazmat(config);
    },

    // noConflict
    noConflict : function() {
      root.Hazmat = Hazmat.original;
      return Hazmat;
    },

    // default log function
    log : function() {
      if(console && _.isFunction(console.log)) {
        console.log.apply(console, arguments);
      }
    },

    // default fail function
    fail : function(_reason, _data) {
      var reason = _reason || "", data = _data || {};
      Hazmat.log('Hazmat Failure::', reason, data);
      throw new Error('Hazmat Failure '+reason.toString());
    },

    // default warn function
    warn : function(_reason, _data) {
      var reason = _reason || "", data = _data || {};
      Hazmat.log('Hazmat Warning::', reason, data);
    },

    // global fixers
    fixDomId : function(_value) {
      if(_.isString(_value) && _value.length > 0) {
        return _value.replace(/[^A-Za-z0-9\_]/g,'');
      } else {
        return null;
      }
    },

    // global testers
    isDomId : function(value) {
      return _.isString(value) && value.match(Hazmat.ID_REGEX);
    },


    __placeholder : true
  });

  _.extend(Hazmat.prototype, {
    _safeValue : function(name, value, fallback, type) {
      // make fallback safe and eat exceptions
      var _fallback = fallback;
      if(_.isFunction(fallback)) {
        fallback = _.once(function() {
          try {
            return _fallback.apply(this, arguments);
          } catch(e) {
          }
        });
      }

      if(type.checker(value)) {
        return value;
      } else if(type.evalFallback && _.isFunction(fallback) && type.checker(fallback(value))){
        this.warn('Expected valid '+type.name+' for '+name+' but was able to sanitize it:', [value, fallback(value)]);
        return fallback(value);
      } else if(type.checker(_fallback)){
        this.warn('Expected valid '+type.name+' for '+name+' but was able to fallback to default value:', [value, _fallback]);
        return _fallback;
      } else {
        this.fail('Expected valid '+type.name+' for '+name+' but received:', value);
      }
    },

    safeString : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'String', checker: _.isString, evalFallback:true});
    },

    safeStringOrNull : function(name, value, fallback) {
      if(value == null) {
        return value;
      } else {
        return this._safeValue(name, value, fallback, {name: 'String', checker: _.isString, evalFallback:true});
      }
    },

    safeDomId : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'DOM ID', checker: Hazmat.isDomId, evalFallback:true});
    },

    safeFunction : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'Function', checker: _.isFunction, evalFallback:false});
    },

    safeFunctionOrNull : function(name, value, fallback) {
      if(value == null) {
        return value;
      } else {
        return this._safeValue(name, value, fallback, {name: 'Function', checker: _.isFunction, evalFallback:false});
      }
    },

    safeObject : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'Object', checker: _.isObject, evalFallback:false});
    },

    safeObjectOrNull : function(name, value, fallback) {
      if(value == null) {
        return value;
      } else {
        return this._safeValue(name, value, fallback, {name: 'Object', checker: _.isObject, evalFallback:false});
      }
    },

    safeArray : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'Array', checker: _.isArray, evalFallback:false});
    },

    safeArrayOfElements : function(name, value, elementValidator, fallback) {
      var safeArray = this._safeValue(name, value, fallback, {name: 'Array', checker: _.isArray, evalFallback:false});
      return _.map(safeArray, elementValidator);
    },

    __placeholder:true
  });

  return Hazmat;
};

// Integration with Node.js/Browser
if(typeof window !== 'undefined' && typeof window._ !== 'undefined') {
  var hazmat = HazmatBuilder(window._, window);
  hazmat.original = window.Hazmat;
  window.Hazmat = hazmat;
} else {
  var _ = require('underscore');
  var hazmat = HazmatBuilder(_);
  _.extend(exports,hazmat);
}

},{"underscore":8}],8:[function(require,module,exports){
(function (global){
//     Underscore.js 1.9.1
//     http://underscorejs.org
//     (c) 2009-2018 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global ||
            this ||
            {};

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // Create quick reference variables for speed access to core prototypes.
  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `_` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.9.1';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      // The 2-argument case is omitted because we’re not using it.
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  var builtinIteratee;

  // An internal function to generate callbacks that can be applied to each
  // element in a collection, returning the desired result — either `identity`,
  // an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value);
  };

  // External wrapper for our callback generator. Users may customize
  // `_.iteratee` if they want additional predicate/iteratee shorthand styles.
  // This abstraction hides the internal-only argCount argument.
  _.iteratee = builtinIteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // Some functions take a variable number of arguments, or a few expected
  // arguments at the beginning and then a variable number of values to operate
  // on. This helper accumulates all remaining arguments past the function’s
  // argument length (or an explicit `startIndex`), into an array that becomes
  // the last argument. Similar to ES6’s "rest parameter".
  var restArguments = function(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0),
          rest = Array(length),
          index = 0;
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var shallowProperty = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  var has = function(obj, path) {
    return obj != null && hasOwnProperty.call(obj, path);
  }

  var deepGet = function(obj, path) {
    var length = path.length;
    for (var i = 0; i < length; i++) {
      if (obj == null) return void 0;
      obj = obj[path[i]];
    }
    return length ? obj : void 0;
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object.
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = shallowProperty('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  var createReduce = function(dir) {
    // Wrap code that reassigns argument variables in a separate function than
    // the one that accesses `arguments.length` to avoid a perf hit. (#1991)
    var reducer = function(obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };

    return function(obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
    var key = keyFinder(obj, predicate, context);
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = restArguments(function(obj, path, args) {
    var contextPath, func;
    if (_.isFunction(path)) {
      func = path;
    } else if (_.isArray(path)) {
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }
    return _.map(obj, function(context) {
      var method = func;
      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }
        if (context == null) return void 0;
        method = context[path];
      }
      return method == null ? method : method.apply(context, args);
    });
  });

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null || typeof iteratee == 'number' && typeof obj[0] != 'object' && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null || typeof iteratee == 'number' && typeof obj[0] != 'object' && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection.
  _.shuffle = function(obj) {
    return _.sample(obj, Infinity);
  };

  // Sample **n** random values from a collection using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, key, list) {
      return {
        value: value,
        index: index++,
        criteria: iteratee(value, key, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior, partition) {
    return function(obj, iteratee, context) {
      var result = partition ? [[], []] : {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (has(result, key)) result[key]++; else result[key] = 1;
  });

  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (_.isString(obj)) {
      // Keep surrogate pair characters together
      return obj.match(reStrSymbol);
    }
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = group(function(result, value, pass) {
    result[pass ? 0 : 1].push(value);
  }, true);

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, Boolean);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        // Flatten current level of array or arguments object.
        if (shallow) {
          var j = 0, len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = restArguments(function(array, otherArrays) {
    return _.difference(array, otherArrays);
  });

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // The faster algorithm will not work with an iteratee if the iteratee
  // is not a one-to-one function, so providing an iteratee will disable
  // the faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted && !iteratee) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = restArguments(function(arrays) {
    return _.uniq(flatten(arrays, true, true));
  });

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      var j;
      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = restArguments(function(array, rest) {
    rest = flatten(rest, true, true);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  });

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices.
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = restArguments(_.unzip);

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values. Passing by pairs is the reverse of _.pairs.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions.
  var createPredicateIndexFinder = function(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  };

  // Returns the first index on an array-like that passes a predicate test.
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions.
  var createIndexFinder = function(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    if (!step) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Chunk a single array into multiple arrays, each containing `count` or fewer
  // items.
  _.chunk = function(array, count) {
    if (count == null || count < 1) return [];
    var result = [];
    var i = 0, length = array.length;
    while (i < length) {
      result.push(slice.call(array, i, i += count));
    }
    return result;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments.
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = restArguments(function(func, context, args) {
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var bound = restArguments(function(callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder by default, allowing any combination of arguments to be
  // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.
  _.partial = restArguments(function(func, boundArgs) {
    var placeholder = _.partial.placeholder;
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });

  _.partial.placeholder = _;

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = restArguments(function(obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  });

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = restArguments(function(func, wait, args) {
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  });

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };

    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;

    var later = function(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArguments(function(args) {
      if (timeout) clearTimeout(timeout);
      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = _.delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  _.restArguments = restArguments;

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
    'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var collectNonEnumProps = function(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  };

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`.
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object.
  // In contrast to _.map it returns an object.
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
        length = keys.length,
        results = {};
    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  // The opposite of _.object.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`.
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, defaults) {
    return function(obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s).
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test.
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Internal pick helper function to determine if `obj` has key `key`.
  var keyInObj = function(value, key, obj) {
    return key in obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = restArguments(function(obj, keys) {
    var result = {}, iteratee = keys[0];
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  });

  // Return a copy of the object without the blacklisted properties.
  _.omit = restArguments(function(obj, keys) {
    var iteratee = keys[0], context;
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1];
    } else {
      keys = _.map(flatten(keys, false, false), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  });

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq, deepEq;
  eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // `null` or `undefined` only equal to itself (strict comparison).
    if (a == null || b == null) return false;
    // `NaN`s are equivalent, but non-reflexive.
    if (a !== a) return b !== b;
    // Exhaust primitive checks
    var type = typeof a;
    if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
    return deepEq(a, b, aStack, bStack);
  };

  // Internal recursive comparison function for `isEqual`.
  deepEq = function(a, b, aStack, bStack) {
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN.
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
      case '[object Symbol]':
        return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
  var nodelist = root.document && root.document.childNodes;
  if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, path) {
    if (!_.isArray(path)) {
      return has(obj, path);
    }
    var length = path.length;
    for (var i = 0; i < length; i++) {
      var key = path[i];
      if (obj == null || !hasOwnProperty.call(obj, key)) {
        return false;
      }
      obj = obj[key];
    }
    return !!length;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  // Creates a function that, when passed an object, will traverse that object’s
  // properties down the given `path`, specified as an array of keys or indexes.
  _.property = function(path) {
    if (!_.isArray(path)) {
      return shallowProperty(path);
    }
    return function(obj) {
      return deepGet(obj, path);
    };
  };

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    if (obj == null) {
      return function(){};
    }
    return function(path) {
      return !_.isArray(path) ? obj[path] : deepGet(obj, path);
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

  // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped.
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // Traverses the children of `obj` along `path`. If a child is a function, it
  // is invoked with its parent as context. Returns the value of the final
  // child, or `fallback` if any child is undefined.
  _.result = function(obj, path, fallback) {
    if (!_.isArray(path)) path = [path];
    var length = path.length;
    if (!length) {
      return _.isFunction(fallback) ? fallback.call(obj) : fallback;
    }
    for (var i = 0; i < length; i++) {
      var prop = obj == null ? void 0 : obj[path[i]];
      if (prop === void 0) {
        prop = fallback;
        i = length; // Ensure we don't continue iterating.
      }
      obj = _.isFunction(prop) ? prop.call(obj) : prop;
    }
    return obj;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OOV4-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var chainResult = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_, args));
      };
    });
    return _;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return chainResult(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return chainResult(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return String(this._wrapped);
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define == 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}());

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
(function (global){
"use strict";

var _vrCoordinates = require("./helpers/vrCoordinates");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
 * Plugin for bitdash player by Bitmovin GMBH
 * This player is used for demo purposes only. Access can be revoked at any time
 */
require("../../../html5-common/js/utils/InitModules/InitOO.js");

require("../../../html5-common/js/utils/InitModules/InitOOUnderscore.js");

require("../../../html5-common/js/utils/InitModules/InitOOHazmat.js");

require("../../../html5-common/js/utils/constants.js");

require("../../../html5-common/js/utils/utils.js");

require("../../../html5-common/js/utils/environment.js");

require("./helpers/polifillRequestAnimationFrame.js");

var bitmovinPlayer = null;

if (window.runningUnitTests) {
  bitmovinPlayer = function bitmovinPlayer(domId) {
    return player;
  };

  bitmovinPlayer.VR = {};
  bitmovinPlayer.VR.CONTENT_TYPE = {};
  bitmovinPlayer.VR.CONTENT_TYPE.SINGLE = "2d";
  bitmovinPlayer.EVENT = {};
  bitmovinPlayer.EVENT.ON_AUDIO_ADAPTATION = "onAudioAdaptation";
  bitmovinPlayer.EVENT.ON_AUDIO_ADDED = "onAudioAdded";
  bitmovinPlayer.EVENT.ON_AUDIO_CHANGED = "onAudioChanged";
  bitmovinPlayer.EVENT.ON_AUDIO_DOWNLOAD_QUALITY_CHANGED = "onAudioDownloadQualityChanged";
  bitmovinPlayer.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGED = "onAudioPlaybackQualityChanged";
  bitmovinPlayer.EVENT.ON_CUE_ENTER = "onCueEnter";
  bitmovinPlayer.EVENT.ON_CUE_EXIT = "onCueExit";
  bitmovinPlayer.EVENT.ON_DOWNLOAD_FINISHED = "onDownloadFinished";
  bitmovinPlayer.EVENT.ON_DVR_WINDOW_EXCEEDED = "onDVRWindowExceeded";
  bitmovinPlayer.EVENT.ON_ERROR = "onError";
  bitmovinPlayer.EVENT.ON_FULLSCREEN_ENTER = "onFullscreenEnter";
  bitmovinPlayer.EVENT.ON_FULLSCREEN_EXIT = "onFullscreenExit";
  bitmovinPlayer.EVENT.ON_METADATA = "onMetadata";
  bitmovinPlayer.EVENT.ON_MUTED = "onMuted";
  bitmovinPlayer.EVENT.ON_PAUSED = "onPaused";
  bitmovinPlayer.EVENT.ON_PERIOD_SWITCHED = "onPeriodSwitched";
  bitmovinPlayer.EVENT.ON_PLAY = "onPlay";
  bitmovinPlayer.EVENT.ON_PLAYING = "onPlaying";
  bitmovinPlayer.EVENT.ON_PLAYBACK_FINISHED = "onPlaybackFinished";
  bitmovinPlayer.EVENT.ON_PLAYER_RESIZE = "onPlayerResize";
  bitmovinPlayer.EVENT.ON_READY = "onReady";
  bitmovinPlayer.EVENT.ON_SEEK = "onSeek";
  bitmovinPlayer.EVENT.ON_SEEKED = "onSeeked";
  bitmovinPlayer.EVENT.ON_SEGMENT_REQUEST_FINISHED = "onSegmentRequestFinished";
  bitmovinPlayer.EVENT.ON_SOURCE_LOADED = "onSourceLoaded";
  bitmovinPlayer.EVENT.ON_SOURCE_UNLOADED = "onSourceUnloaded";
  bitmovinPlayer.EVENT.ON_STALL_STARTED = "onStallStarted";
  bitmovinPlayer.EVENT.ON_STALL_ENDED = "onStallEnded";
  bitmovinPlayer.EVENT.ON_SUBTITLE_ADDED = "onSubtitleAdded";
  bitmovinPlayer.EVENT.ON_SUBTITLE_CHANGED = "onSubtitleChanged";
  bitmovinPlayer.EVENT.ON_SUBTITLE_REMOVED = "onSubtitleRemoved";
  bitmovinPlayer.EVENT.ON_TIME_CHANGED = "onTimeChanged";
  bitmovinPlayer.EVENT.ON_TIME_SHIFT = "onTimeShift";
  bitmovinPlayer.EVENT.ON_TIME_SHIFTED = "onTimeShifted";
  bitmovinPlayer.EVENT.ON_UNMUTED = "onUnmuted";
  bitmovinPlayer.EVENT.ON_VIDEO_ADAPTATION = "onVideoAdaptation";
  bitmovinPlayer.EVENT.ON_VIDEO_DOWNLOAD_QUALITY_CHANGED = "onVideoDownloadQualityChanged";
  bitmovinPlayer.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGED = "onVideoPlaybackQualityChanged";
  bitmovinPlayer.EVENT.ON_VOLUME_CHANGED = "onVolumeChanged";
  bitmovinPlayer.EVENT.ON_VR_ERROR = "onVRError";
  bitmovinPlayer.EVENT.ON_VR_MODE_CHANGED = "onVrModeChanged";
  bitmovinPlayer.EVENT.ON_VR_STEREO_CHANGED = "onVrStereoChanged";
  bitmovinPlayer.EVENT.ON_VR_VIEWING_DIRECTION_CHANGE = "_onVrViewingDirectionChanging";
  bitmovinPlayer.EVENT.ON_VR_VIEWING_DIRECTION_CHANGED = "_onVrViewingDirectionChanged";
  bitmovinPlayer.EVENT.ON_WARNING = "onWarning";
  global.bitmovinPlayer = bitmovinPlayer;
} else {
  bitmovinPlayer = require("../lib/bitmovinplayer.js");
} //Exposing bitmovinPlayer in window for debugging purposes


window.bitmovinPlayer = bitmovinPlayer;
var BITDASH_TECHNOLOGY = {
  FLASH: "flash",
  HTML5: "html5",
  NATIVE: "native"
};
var BITDASH_STREAMING = {
  HLS: "hls",
  DASH: "dash",
  PROGRESSIVE: "progressive"
};
var BITDASH_FILES = {
  FLASH: 'bitmovinplayer.swf',
  VR: 'bitmovinplayer-vr.js',
  UI: 'bitmovinplayer-ui.js',
  UI_CSS: 'bitmovinplayer-ui.css'
};
var DEFAULT_TECHNOLOGY = BITDASH_TECHNOLOGY.HTML5;

(function (_, $) {
  var pluginName = "bit-wrapper";
  var BITDASH_LIB_TIMEOUT = 30000;

  var hasFlash = function hasFlash() {
    var flashVersion = parseInt(getFlashVersion().split(',').shift());
    return isNaN(flashVersion) ? false : flashVersion < 11 ? false : true;
  };

  var getFlashVersion = function getFlashVersion() {
    if (window.runningUnitTests) {
      return window.FLASH_VERSION;
    } else {
      // ie
      try {
        try {
          var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');

          try {
            axo.AllowScriptAccess = 'always';
          } catch (e) {
            return '6,0,0';
          }
        } catch (e) {}

        return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1]; // other browsers
      } catch (e) {
        try {
          if (navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin) {
            return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
          }
        } catch (e) {}
      }

      return '0,0,0';
    }
  };

  var BITDASH_WARNING_CODES = {
    USER_INTERACTION_REQUIRED: 5008
  };
  /*
   * HTML5 Media Error Constants:
   *   MediaError.MEDIA_ERR_ABORTED = 1
   *   MediaError.MEDIA_ERR_NETWORK = 2
   *   MediaError.MEDIA_ERR_DECODE = 3
   *   MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4
   *   MediaError.MEDIA_ERR_ENCRYPTED = 5 (Chrome only)
   *   Ooyala Extensions:
   *   NO_STREAM = 0
   *   UNKNOWN = -1
   *   DRM_ERROR = 6
   */
  // error code and message information is taken from https://bitmovin.com/errors/

  var bitdashErrorCodes = {
    '3036': {
      shortText: "DRM restriction error",
      longText: "Content cannot be played back because the output is restricted on this machine.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3029': {
      shortText: "Native HLS stream error",
      longText: "An unknown error occurred using the browser’s built-in HLS support.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3028': {
      shortText: "Progressive stream error",
      longText: "The progressive stream type is not supported or the stream has an error.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3027': {
      shortText: "DRM certificate error",
      longText: "An unknown error with the downloaded DRM certificate occurred.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3026': {
      shortText: "Progressive stream timeout",
      longText: "The progressive stream timed out.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3025': {
      shortText: "Segment download timeout",
      longText: "The request to download the segment timed out.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3024': {
      shortText: "Manifest download timeout",
      longText: "The request to download the manifest file timed out.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3023': {
      shortText: "Network error",
      longText: "A network error occurred. The reason might be: CORS is not enabled, No Internet connection, Domain name could not be resolved, The server refused the connection",
      ooErrorCode: 2 // MediaError.MEDIA_ERR_NETWORK

    },
    '3022': {
      shortText: "Manifest error",
      longText: "An unknown error occurred parsing the manifest file.",
      ooErrorCode: -1 // UNKNOWN

    },
    '3021': {
      shortText: "DRM system not supported",
      longText: "The chosen DRM system is not supported in the current browser.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3020': {
      shortText: "DRM key error",
      longText: "An error occured with the key returned by the DRM license server.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3019': {
      shortText: "DRM certificate requested failed",
      longText: "The request to receive the DRM certificate failed.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3018': {
      shortText: "Could not create MediaKeys",
      longText: "Could not create DRM MediaKeys to decrypt the content.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3017': {
      shortText: "Could not create key session",
      longText: "Creating a DRM key session was not successful.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3016': {
      shortText: "Could not create key system",
      longText: "The DRM system in the current browser can not be used with the current data.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3015': {
      shortText: "Unsupported codec or file format",
      longText: "The codec and/or file format of the audio or video stream is not supported by the HTML5 player.",
      ooErrorCode: 4 // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED

    },
    '3014': {
      shortText: "Key size not supported",
      longText: "The size of the given key to decrypt the content is not supported.",
      ooErrorCode: 3 // MediaError.MEDIA_ERR_DECODE

    },
    '3013': {
      shortText: "Decryption Key or KeyID missing",
      longText: "The key or the key ID to decrypt the content is missing",
      ooErrorCode: OOV4.isChrome ? 5
      /* MediaError.MEDIA_ERR_ENCRYPTED */
      : 3
      /* MediaError.MEDIA_ERR_DECODE */

    },
    '3012': {
      shortText: "Invalid header pair for DRM",
      longText: "The given header name/value pair for a DRM license request was invalid.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3011': {
      shortText: "DRM license request failed",
      longText: "Requesting a DRM license failed.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '3010': {
      shortText: "Error synchronizing streams",
      longText: "A problem occurred when the player tried to synchronize streams. This could result in the content being/running out of sync.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '3009': {
      shortText: "Maximum retries exceeded",
      longText: "The maximum number of retries for a download was exceeded.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '3007': {
      shortText: "Subitles or captions can not be loaded",
      longText: "The specified subitles/captions file could not be loaded.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3006': {
      shortText: "Manifest can not be loaded",
      longText: "The DASH or HLS manifest file could not be loaded.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3005': {
      shortText: "No manifest URL",
      longText: "No URL to a DASH or HLS manifest was given.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3004': {
      shortText: "Could not find segment URL",
      longText: "Could not find/build the URL to download a segment.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3003': {
      shortText: "Unsupported TFDT box version",
      longText: "The version of the ‘TFDT’ box in the mp4 container is not supported.",
      ooErrorCode: -1 // UNKNOWN

    },
    '3002': {
      shortText: "Segment contains no data",
      longText: "The downloaded media segment does not contain data.",
      ooErrorCode: 0 // NO_STREAM

    },
    '3001': {
      shortText: "Unsupported manifest format",
      longText: "The format of the downloaded manifest file is not supported.",
      ooErrorCode: 3 // MediaError.MEDIA_ERR_DECODE

    },
    '3000': {
      shortText: "Unknown HTML5 error",
      longText: "An unknown error happened in the HTML5 player.",
      ooErrorCode: -1 // UNKNOWN

    },
    '2015': {
      shortText: "Unsupported codec or file format",
      longText: "The codec and/or file format of the audio or video stream is not supported by the Flash player.",
      ooErrorCode: 3 // MediaError.MEDIA_ERR_DECODE

    },
    '2008': {
      shortText: "Adobe Access DRM Error",
      longText: "An error with Adobe Access DRM occurred in the Flash player.",
      ooErrorCode: 6 // DRM_ERROR

    },
    '2007': {
      shortText: "Segment can not be loaded",
      longText: "The Flash player could not load a DASH or HLS segment.",
      ooErrorCode: 0 // NO_STREAM

    },
    '2006': {
      shortText: "Manifest can not be loaded",
      longText: "The Flash player was unable to load the DASH or HLS manifest.",
      ooErrorCode: 0 // NO_STREAM

    },
    '2001': {
      shortText: "Unknown Flash error with details",
      longText: "General unknown error from the Flash player where additional information is available.",
      ooErrorCode: -1 // UNKNOWN

    },
    '2000': {
      shortText: "Unknown flash error",
      longText: "General unknown error from the Flash player.",
      ooErrorCode: -1 // UNKNOWN

    },
    '1017': {
      shortText: "License not compatible with domain",
      longText: "The currently used domain is not valid in combination with the used license.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '1016': {
      shortText: "License error",
      longText: "License error.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '1015': {
      shortText: "Forced player is not supported",
      longText: "The forced player is not supported.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '1014': {
      shortText: "Player type is unknown",
      longText: "The specified player type is unknown.",
      ooErrorCode: 1 // UNKNOWN

    },
    '1013': {
      shortText: "Stream type is not supported",
      longText: "The specified stream type is not supported.",
      ooErrorCode: 4 // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED

    },
    '1012': {
      shortText: "Player files can not be loaded",
      longText: "The JavaScript player files can not be loaded.",
      ooErrorCode: 2 // MediaError.MEDIA_ERR_NETWORK

    },
    '1011': {
      shortText: "No valid configuration object",
      longText: "No valid configuration object was provided.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '1010': {
      shortText: "Unsupported protocol",
      longText: "The site has been loaded using the unsupported “file” protocol.",
      ooErrorCode: 4 // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED

    },
    '1009': {
      shortText: "Skin can not be loaded",
      longText: "The specified skin can not be loaded.",
      ooErrorCode: 2 // MediaError.MEDIA_ERR_NETWORK

    },
    '1008': {
      shortText: "Domain error",
      longText: "The domain lock of the player is not valid for the current domain.",
      ooErrorCode: 2 // MediaError.MEDIA_ERR_NETWORK

    },
    '1007': {
      shortText: "Flash player version not supported",
      longText: "The used Flash player version is not supported.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '1006': {
      shortText: "No supported technology was detected",
      longText: "No supported technology was detected, i.e. neither Flash nor the MediaSource Extension was found and no HLS manifest was given or HLS is also not supported.",
      ooErrorCode: 4 // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED

    },
    '1005': {
      shortText: "Flash creation error",
      longText: "An error occurred during creating the flash player.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '1004': {
      shortText: "HTML video element error",
      longText: "There was an error when inserting the HTML video element.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '1003': {
      shortText: "No stream provided",
      longText: "No streams have been provided within the source part of the configuration.",
      ooErrorCode: 0 // NO_STREAM

    },
    '1002': {
      shortText: "Key error",
      longText: "The key within the configuration object of the player is not correct.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '1000': {
      shortText: "Unknown error",
      longText: "General unknown error.",
      ooErrorCode: -1 // UNKNOWN

    },
    '900': {
      shortText: "Undefined VAST error",
      longText: "Undefined VAST error.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    },
    '403': {
      shortText: "No supported VAST media file found",
      longText: "Couldn’t find MediaFile that is supported by this video player, based on the attributes of the MediaFile element.",
      ooErrorCode: 0 // NO_STREAM

    },
    '303': {
      shortText: "No VAST response",
      longText: "No ads VAST response after one or more wrappers.",
      ooErrorCode: 1 // MediaError.MEDIA_ERR_ABORTED

    }
  };
  /**
   * @class BitdashVideoFactory
   * @classdesc Factory for creating bitdash player objects that use HTML5 video tags.
   * @property {string} name The name of the plugin
   * @property {object} encodings An array of supported encoding types (ex. OOV4.VIDEO.ENCODING.DASH)
   * @property {object} features An array of supported features (ex. OOV4.VIDEO.FEATURE.CLOSED_CAPTIONS)
   * @property {string} technology The core video technology (ex. OOV4.VIDEO.TECHNOLOGY.HTML5)
   */

  var BitdashVideoFactory = function BitdashVideoFactory() {
    var _this = this;

    this.name = pluginName;

    this.technology = function () {
      if (OOV4.isIos || OOV4.isAndroid) {
        return OOV4.VIDEO.TECHNOLOGY.HTML5;
      }

      return OOV4.VIDEO.TECHNOLOGY.MIXED;
    }();

    this.features = [OOV4.VIDEO.FEATURE.CLOSED_CAPTIONS, OOV4.VIDEO.FEATURE.BITRATE_CONTROL];
    this.audioTracks = [];
    /**
     * Determines which encoding types are supported on the current platform.
     * @public
     * @method BitdashVideoFactory#getSupportedEncodings
     * @returns {object} Returns an array of strings containing the encoding types supported from a list of
     *   encodings found in object OOV4.VIDEO.ENCODING.
     */

    this.getSupportedEncodings = function () {
      // [PLAYER-1090] - NPAW showed many playback failures for users on Windows 7, Chrome 48.0.2564.109
      // using Bitmovin 6.1.17 for Accuweather. For now, we'll return an empty array here so we can fallback
      // to main_html5
      if (OOV4.chromeMajorVersion === 48) {
        return [];
      }

      var encodes = [];
      var vid, testPlayer;

      try {
        // iOS will be unblocked in [PLAYER-554]
        // We do not want to enable Bitmovin for iOS yet.
        if (!OOV4.isIos) {
          //Bitmovin requires a video element that is in the DOM
          vid = document.createElement('video');
          vid.id = _.uniqueId(); //TODO: Is there a better place to attach the video element?
          //We do not have access to our video player container, which would
          //be more ideal to use instead

          vid.style.display = 'none';
          document.documentElement.appendChild(vid);
          testPlayer = bitmovinPlayer(vid.id); //The getSupportedDRM API returns a promise, which is async.
          //We'll see if we can work in usage of this API at a later time.
          //For now, we'll rely on the super matrix to determine DRM
          //support. This matrix is found at:
          //https://docs.google.com/spreadsheets/d/1B7COivptOQ1WTJ6CLO8Y0yn2mxwuRBTdb-Ja4haANIE/edit#gid=956330529
          //Supported values for bitmovin v6 supported tech
          //found at: https://bitmovin.com/player-documentation/player-configuration-v6/

          /*
           { player: 'html5', streaming: 'dash'}
           { player: 'html5', streaming: 'hls'}
           { player: 'native', streaming: 'hls'}
           { player: 'flash', streaming: 'dash'}
           { player: 'flash', streaming: 'hls'}
           { player: 'native', streaming: 'progressive'}
           */

          var supportedTech = testPlayer.getSupportedTech();
          var tech;

          for (var i = 0; i < supportedTech.length; i++) {
            tech = supportedTech[i];

            switch (tech.streaming) {
              case BITDASH_STREAMING.DASH:
                // DASH support is still buggy on Safari as of Bitmovin 7.2.x
                if (!OOV4.isSafari) {
                  encodes.push(OOV4.VIDEO.ENCODING.DASH); //TODO: Replace with bitplayer.getSupportedDRM()

                  if (OOV4.supportMSE) {
                    encodes.push(OOV4.VIDEO.ENCODING.DRM.DASH);
                  }
                }

                break;

              case BITDASH_STREAMING.HLS:
                if (!OOV4.isAndroid || OOV4.isAndroid4_4Plus) {
                  encodes.push(OOV4.VIDEO.ENCODING.HLS);
                  encodes.push(OOV4.VIDEO.ENCODING.AUDIO_HLS);
                  encodes.push(OOV4.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS);
                  encodes.push(OOV4.VIDEO.ENCODING.AKAMAI_HD2_HLS); //TODO: Replace with bitplayer.getSupportedDRM()

                  if (OOV4.isSafari) {
                    encodes.push(OOV4.VIDEO.ENCODING.DRM.HLS);
                  }
                }

                break;

              case BITDASH_STREAMING.PROGRESSIVE:
                encodes.push(OOV4.VIDEO.ENCODING.MP4);

                if (_supportsM4A()) {
                  encodes.push(OOV4.VIDEO.ENCODING.AUDIO_M4A);
                }

                if (_supportsOGG()) {
                  encodes.push(OOV4.VIDEO.ENCODING.AUDIO_OGG);
                }

                break;
            }
          }
        }
      } catch (e) {
        OOV4.log("Bitmovin getSupportedTech error: " + e); //return the default supported encodings

        encodes = encodes.concat(_getHTML5Encodings());
        encodes = encodes.concat(_getFlashEncodings());
      }

      if (testPlayer) {
        testPlayer.destroy();
      }

      if (vid && vid.parentNode) {
        vid.parentNode.removeChild(vid);
      } //get rid of duplicates


      encodes = _.uniq(encodes);
      return encodes;
    };
    /**
     * Helper function to determine if we support OGG.
     * @private
     * @method BitdashVideoFactory#_supportsOGG
     * @returns {boolean} returns if current environment supporst OGG
     */


    var _supportsOGG = _.bind(function () {
      return !OOV4.isSafari && !OOV4.isIE && !OOV4.isIE11Plus;
    }, this);
    /**
     * Helper function to determine if we support M4A.
     * @private
     * @method BitdashVideoFactory#_supportsM4A
     * @returns {boolean} returns if current environment supporst M4A
     */


    var _supportsM4A = _.bind(function () {
      return !OOV4.isSafari && !OOV4.isIE && !OOV4.isIE11Plus;
    }, this);
    /**
     * Determines which encoding types are supported in HTML5
     * @private
     * @method BitdashVideoFactory#_getHTML5Encodings
     * @returns {object} Returns an array of strings containing the encoding types supported from a list of
     *   encodings found in object OOV4.VIDEO.ENCODING.
     */


    var _getHTML5Encodings = _.bind(function () {
      var encodes = []; // iOS will be unblocked in [PLAYER-554]
      // We do not want to enable Bitmovin for iOS yet.

      if (OOV4.isIos) {
        return encodes;
      } //TODO: Move to utils


      var element = document.createElement('video'); //Following checks are from: http://html5test.com/ and
      //https://bitmovin.com/browser-capabilities/ for DRM checks
      // HTML5 encodings:
      // Our Selenium tests will need to test the following section checking
      // element support
      //TODO: See if we can remove the DRM encodings and rely on Bitmovin to check using
      //bitplayer.getSupportedDRM() API
      //TODO: canPlayType returns possible values of "probably", "maybe", and ""
      //Is it safe to treat "probably" and "maybe" values the same?

      var supportsDash = !!element.canPlayType && element.canPlayType('application/dash+xml') != '';
      var supportsHLS = !!element.canPlayType && element.canPlayType('application/vnd.apple.mpegURL') != ''; //TODO: Add check for application/x-mpegurl for non-Safari, non-MSE HLS support if necessary
      //TODO: check if MSE support means HLS support across all browsers
      // DASH support is still buggy on Safari as of Bitmovin 7.2.x

      if (supportsDash && !OOV4.isSafari) {
        encodes.push(OOV4.VIDEO.ENCODING.DASH); //TODO: Replace with bitplayer.getSupportedDRM()

        encodes.push(OOV4.VIDEO.ENCODING.DRM.DASH);
      }

      if (supportsHLS || OOV4.supportMSE) {
        if (!OOV4.isAndroid || OOV4.isAndroid4_4Plus) {
          encodes.push(OOV4.VIDEO.ENCODING.HLS);
          encodes.push(OOV4.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS);
          encodes.push(OOV4.VIDEO.ENCODING.AKAMAI_HD2_HLS);
          encodes.push(OOV4.VIDEO.ENCODING.AUDIO_HLS); //TODO: Replace with bitplayer.getSupportedDRM()

          if (OOV4.isSafari) {
            encodes.push(OOV4.VIDEO.ENCODING.DRM.HLS);
          }
        }
      }

      encodes.push(OOV4.VIDEO.ENCODING.MP4);

      if (_supportsM4A()) {
        encodes.push(OOV4.VIDEO.ENCODING.AUDIO_M4A);
      }

      if (_supportsOGG()) {
        encodes.push(OOV4.VIDEO.ENCODING.AUDIO_OGG);
      }

      return encodes;
    }, this);
    /**
     * Determines which encoding types are supported in Flash
     * @private
     * @method BitdashVideoFactory#_getFlashEncodings
     * @returns {object} Returns an array of strings containing the encoding types supported from a list of
     *   encodings found in object OOV4.VIDEO.ENCODING.
     */


    var _getFlashEncodings = _.bind(function () {
      var encodes = []; // iOS will be unblocked in [PLAYER-554]
      // We do not want to enable Bitmovin for iOS yet.

      if (OOV4.isIos) {
        return encodes;
      } // FLASH encodings:
      // Flash support found at: https://bitmovin.com/browser-capabilities/
      // Will be unblocked in [PLAYER-555]
      // We do not want to enable HLS for Android yet.


      if (hasFlash() && !(OOV4.isAndroid4Plus && OOV4.isChrome)) {
        if (!OOV4.isAndroid || OOV4.isAndroid4_4Plus) {
          encodes.push(OOV4.VIDEO.ENCODING.HLS);
          encodes.push(OOV4.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS);
          encodes.push(OOV4.VIDEO.ENCODING.AKAMAI_HD2_HLS);
          encodes.push(OOV4.VIDEO.ENCODING.AUDIO_HLS); //TODO: Replace with bitplayer.getSupportedDRM()

          if (OOV4.isSafari) {
            encodes.push(OOV4.VIDEO.ENCODING.DRM.HLS);
          }
        }
      } // DASH support is still buggy on Safari as of Bitmovin 7.2.x,
      // we exclude it even when using Flash for consistency


      if (!OOV4.isSafari) {
        encodes.push(OOV4.VIDEO.ENCODING.DASH); //TODO: Replace with bitplayer.getSupportedDRM()

        if (OOV4.isChrome || OOV4.isEdge || OOV4.isIE11Plus || OOV4.isFirefox) {
          encodes.push(OOV4.VIDEO.ENCODING.DRM.DASH);
        }
      }

      encodes.push(OOV4.VIDEO.ENCODING.MP4);
      return encodes;
    }, this);

    this.encodings = this.getSupportedEncodings();
    /**
     * Creates a video player instance using BitdashVideoWrapper.
     * @public
     * @method BitdashVideoFactory#create
     * @param {object} parentContainer The jquery div that should act as the parent for the video element
     * @param {string} domId The id of the video player instance to create
     * @param {object} ooyalaVideoController A reference to the video controller in the Ooyala player
     * @param {object} css The css to apply to the video element
     * @param {string} playerId An id that represents the player instance
     * @param {object} pluginParams A set of optional plugin-specific configuration values
     * @returns {object} A reference to the wrapper for the newly created element
     */

    this.create = function (parentContainer, domId, ooyalaVideoController, css, playerId, pluginParams) {
      var videoWrapper = $("<div>");
      videoWrapper.attr("id", domId);
      videoWrapper.css(css);
      parentContainer.prepend(videoWrapper);
      var wrapper = new BitdashVideoWrapper(domId, ooyalaVideoController, videoWrapper[0], null, pluginParams);
      return wrapper;
    };
    /**
     * Destroys the video technology factory.
     * @public
     * @method BitdashVideoFactory#destroy
     */


    this.destroy = function () {
      _this.encodings = [];

      _this.create = function () {};
    };
    /**
     * Represents the max number of support instances of video elements that can be supported on the
     * current platform. -1 implies no limit.
     * @public
     * @property BitdashVideoFactory#maxSupportedElements
     */


    this.maxSupportedElements = -1;
  };
  /**
   * @class BitdashVideoWrapper
   * @classdesc Player object that wraps the video element.
   * @param {string} domId The id of the video player instance
   * @param {object} videoController A reference to the Ooyala Video Tech Controller
   * @param {object} videoWrapper div element that will host player DOM objects
   * @param {boolean} disableNativeSeek When true, the plugin should supress or undo seeks that come from
   *                                       native video controls
   * @param {object} pluginParams A set of optional plugin-specific configuration values
   */


  var BitdashVideoWrapper = function BitdashVideoWrapper(domId, videoController, videoWrapper, disableNativeSeek, pluginParams) {
    var _this2 = this,
        _arguments = arguments;

    this.controller = videoController;
    this.disableNativeSeek = disableNativeSeek || false;
    this.player = null;
    this.vrViewingDirection = {
      yaw: 0,
      roll: 0,
      pitch: 0,
      time: null
    };
    this.vrViewingDirectionPrev = {
      yaw: null,
      roll: null,
      pitch: null,
      time: null
    };
    this.startVrViewingDirection = {
      yaw: 0,
      roll: 0,
      pitch: 0
    };
    this.isVideoMoving = false; // data

    var _domId = domId;
    var _videoWrapper = videoWrapper;
    var _videoElement = null;
    var _currentUrl = '';
    var _currentTech = null;
    var _isM3u8 = false;
    var _isDash = false;
    var _isMP4 = false;
    var _isOGG = false;
    var _isM4A = false;
    var _isVr = false;
    var _trackId = null;
    var _vtcBitrates = {};
    var _currentBitRate = '';
    var _currentTime = 0;
    var _failoverPlayheadTime = 0;
    var _handleFailover = false;
    var _initialTime = {
      value: 0,
      reached: true,
      pendingSeek: false
    };
    var _ccWrapper = null;
    var _ccVisible = false;
    var _hasDRM = false;
    var _drm = {};
    var _playerSetupPromise = null;
    var _currentClosedCaptionsData = null;
    var _currentPlaybackSpeed = 1.0; // states

    var _initialized = false;
    var _pendingSetupOrLoad = false;
    var _hasPlayed = false;
    var _hasStartedPlaying = false;
    var _hasNotifiedInitialPlaying = false;
    var _willPlay = false;
    var _willLoad = false;
    var _videoEnded = false;
    var _pauseOnPlaying = true;
    var _priming = false;
    var _timeShifting = false;

    var _initialTimeOnLoad = -1;

    var _isSeeking = false;
    var _pauseRequested = false;
    var _shouldPauseOnSeeked = false;

    var _setVolumeOnReady = -1;

    var _currentVolume = 1;
    var _corePlayerMuteState = false;
    var _setMuteStateOnReady = false;
    var _checkedUnmutedPlayback = false;
    var _adsPlayed = false;
    var _captionsDisabled = false;
    var _playerSetup = false;
    var _loadedCurrentUrl = false;
    var _requestAnimationId = null;
    var _stepDirection = {
      dx: 36,
      dy: 36,
      phi: 0
    }; // degrees

    var _timeAnimation = 0;
    var _audioChanging = false;
    var _playOnAudioChange = false;
    var movingVrRequestId = 0;
    var conf = {
      key: this.controller.PLUGIN_MAGIC,
      style: {
        width: '100%',
        height: '100%',
        subtitlesHidden: true,
        ux: false
      },
      playback: {
        autoplay: false
      },
      adaptation: {
        desktop: {
          preload: false
        },
        mobile: {
          preload: false
        }
      },
      logs: {
        bitmovin: false
      },
      source: {}
    };
    var urlSource = {};
    /**
     * Extends the default Bitmovin configuration with values from the pluginParams
     * object that is passed during plugin initialization.
     * @param  {object} bmConfig The Bitmovin player configuration object
     * @param  {object} params The pluginParams object that contains additional configuration options
     */

    var _applyPluginParams = function _applyPluginParams(bmConfig, params) {
      if (!bmConfig || _.isEmpty(params)) {
        return;
      }

      var baseUrlLocation = {};
      var explicitLocation = {}; // locationBaseUrl is a custom feature that we added for Valhalla. It's not an
      // actual Bitmovin configuration parameter.

      if (_.isString(params.locationBaseUrl) && params.locationBaseUrl.length) {
        // Replace trailing backslashes. The parameter should be provided without them,
        // but we can fix this if the user makes a mistake
        var baseUrl = params.locationBaseUrl.replace(/\/+$/, '') + '/';
        baseUrlLocation = {
          flash: baseUrl + BITDASH_FILES.FLASH,
          vr: baseUrl + BITDASH_FILES.VR,
          ui: baseUrl + BITDASH_FILES.UI,
          ui_css: baseUrl + BITDASH_FILES.UI_CSS
        };
      }

      if (!_.isEmpty(params.location)) {
        explicitLocation = params.location;
      } // If both locationBaseUrl and location are specified, we override baseUrl
      // generated values with any values that were provided explicitly


      bmConfig.location = _.extend({}, baseUrlLocation, explicitLocation);

      var customConfig = _.clone(params); // Remove location and locationBaseUrl which have already been set above


      delete customConfig.location;
      delete customConfig.locationBaseUrl; // DRM config is set at a later time by calling setDRM(). We avoid setting
      // DRM values now since doing so will trigger an error because no source
      // has been set at this point.

      if (customConfig.source) {
        customConfig.source = _.clone(customConfig.source);
        delete customConfig.source.drm;
      } // This will extend the plugin's default configuration with page-level settings.
      // The effect of the custom config values will be the responsibility of the
      // person passing them. Note that we avoid doing any validations in order to
      // allow forward compatibility.
      // From a customer perspective only a subset of the options will be documented
      // and supported. The effect of documented config options DOES need to be assessed
      // and validated by QA. The rest of the options are reserved for dev use.
      // Values are not deep-merged, which means that page-level settings will
      // override the plugin's config. For this and other reasons, config values
      // that are used by the plugin should never be customer-facing (i.e. added to the docs).


      _.extend(bmConfig, customConfig); // Avoid giving extra exposure to our Bitmovin key when logging the new
      // state of the config object


      var loggableConfig = _.clone(bmConfig);

      delete loggableConfig.key;
      OOV4.log('Bitmovin configuration:', loggableConfig);
    };

    var _createCustomSubtitleDisplay = function _createCustomSubtitleDisplay() {
      _ccWrapper = $("<div>");
      var wrapperStyle = {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        pointerEvents: 'none'
      };

      _ccWrapper.css(wrapperStyle);

      var subtitleContainer = $('<div>');
      var subtitleList = $('<ol id="subtitles">');
      var subtitleContainerStyle = {
        textAlign: 'center',
        left: '5%',
        top: '5%',
        width: '90%',
        height: '90%',
        fontFamily: 'verdana',
        textShadow: 'black 1px 1px 1px, black 1px -1px 1px, black -1px 1px 1px, black -1px -1px 1px',
        color: 'white',
        position: 'absolute',
        fontSize: '25px',
        lineHeight: '25px',
        margin: 0,
        padding: 0
      };
      subtitleContainer.css(subtitleContainerStyle);
      var subtitleListStyle = {
        bottom: '30px',
        listStyle: 'none',
        position: 'absolute',
        margin: '0px 0px 10px',
        padding: 0,
        width: '100%'
      };
      subtitleList.css(subtitleListStyle);
      subtitleContainer.append(subtitleList);

      _ccWrapper.append(subtitleContainer);

      $(_videoWrapper).append(_ccWrapper);
    };

    _videoElement = $("<video>");

    _videoElement.attr("class", "video");

    _createCustomSubtitleDisplay();

    _applyPluginParams(conf, pluginParams);

    this.player = bitmovinPlayer(domId);
    this.player.setAuthentication(videoController.authenticationData);
    this.player.setVideoElement(_videoElement[0]);
    /**
     * Set DRM data
     * @public
     * @method BitdashVideoWrapper#setDRM
     * @param {object} drm DRM data object contains widevine, playready and fairplay as keys and object as value that includes
     * la_url {string} (optional for playready), and certificate_url {string} (for fairplay only).
     * (ex. {"widevine": {"la_url":"https://..."},"playready": {}, "fairplay": {"la_url":"https://...", "certificate_url":"https://..."}}})
     * More details: https://wiki.corp.ooyala.com/display/ENG/Design+of+DRM+Support+for+Playback+V4+-+HTML5+Player
     */

    this.setDRM = function (drm) {
      if (!drm || _.isEmpty(drm)) return;
      var MAX_NUM_OF_RETRY = 2;
      var RETRY_DELAY_MILLISEC = 1000;
      var auth_token = null;

      if (OOV4.localStorage) {
        var oo_auth_token = OOV4.localStorage.getItem("oo_auth_token");

        if (oo_auth_token && !_.isEmpty(oo_auth_token)) {
          auth_token = oo_auth_token;
        }
      }

      var customParams = null;

      if (pluginParams && pluginParams.source && pluginParams.source.drm) {
        customParams = pluginParams.source.drm;
      }

      if (drm.widevine) {
        _setWidevineDRM(drm.widevine, MAX_NUM_OF_RETRY, RETRY_DELAY_MILLISEC, customParams);
      }

      if (drm.playready) {
        _setPlayreadyDRM(drm.playready, auth_token, MAX_NUM_OF_RETRY, RETRY_DELAY_MILLISEC, customParams);
      }

      if (drm.fairplay) {
        _setFairplayDRM(drm.fairplay, auth_token, customParams);
      }
    };
    /************************************************************************************/
    // Required. Methods that Video Controller, Destroy, or Factory call

    /************************************************************************************/

    /**
     * Setting parameters for bitmovin player
     * @public
     * @method BitdashVideoWrapper#setupBitmovinPlayer
     */


    this.setupBitmovinPlayer = function () {
      if (!_playerSetup) {
        if (conf.source) {
          if (conf.source.vr) {
            var startPosition = conf.source.vr.startPosition;
            this.startVrViewingDirection.yaw = startPosition;
            this.getCurrentDirection({
              yaw: startPosition
            });

            _mergeSources();
          }
        }

        if (!_initialized) {
          _initPlayer();
        }

        _pendingSetupOrLoad = true; //player.setup is only handled by Bitmovin on the first call, so we can't change the config after the fact.
        //Future calls will throw a warning

        _playerSetupPromise = this.player.setup(conf);

        _playerSetupPromise.catch(function (error) {
          if (!window.runningUnitTests) {
            OOV4.log('%cError setting up Bitmovin player ' + error, 'color: red; font-weight: bold');
          }
        });

        _playerSetup = true;
      }
    };
    /**
     * Specifies encoding parameters and URLs for playback
     * @public
     * @method BitdashVideoWrapper#setSourceUrl
     */


    this.setSourceUrl = function () {
      //We are using a separate object urlSource rather than conf.source to keep track of our current url. We do not want to
      //change the conf.source object directly until we are ready to change the source as Bitmovin maintains a reference to it as well.
      //This reference is returned by the Bitmovin player.getConfig() API, which we make use of in our _getUrlFromBitmovinPlayer to get
      //the current source loaded by Bitmovin. We make use of _getUrlFromBitmovinPlayer to determine if we should load a new source.
      //PLAYER-2020 On Android, on replay, we are sometimes getting multiple stream formats set. One for the ad and one for main content.
      //BM doesn't seem to like this and plays the wrong stream for the ad. So we need to clear the old entries but we don't want to lose
      //and other data that that may be stored in 'source'.
      delete urlSource.hls;
      delete urlSource.dash;
      delete urlSource.progressive;
      delete urlSource.drm; //PLAYER-3004: Workround for an issue where the setup/load promises do not resolve nor error out when providing an empty
      //string for a source url.

      if (_currentUrl) {
        if (_isDash) {
          urlSource.dash = _currentUrl;
        } else if (_isM3u8) {
          urlSource.hls = _currentUrl;
        } else if (_isMP4) {
          urlSource.progressive = [{
            url: _currentUrl,
            type: 'video/mp4'
          }];
        } else if (_isOGG) {
          urlSource.progressive = [{
            url: _currentUrl,
            type: 'audio/ogg'
          }];
        } else if (_isM4A) {
          urlSource.progressive = [{
            url: _currentUrl,
            type: 'audio/mp4'
          }];
        } else {
          // Just in case, we shouldn't get here
          this.controller.notify(this.controller.EVENTS.ERROR, {
            errorcode: 4
          }); //4 -> MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED

          console.warn("Unsupported encoding, can't load player");
          return;
        }
      }

      if (_hasDRM) {
        // If the stream has DRM protected, the _drm data is required
        if (_.isEmpty(_drm)) {
          this.controller.notify(this.controller.EVENTS.ERROR, {
            errorcode: 3
          });
          console.warn("Missing DRM data");
          return;
        }

        urlSource.drm = _drm;
      }
    };
    /**
     * Sets the url of the video.
     * @public
     * @method BitdashVideoWrapper#setVideoUrl
     * @param {string} url The new url to insert into the video element's src attribute
     * @param {string} encoding The encoding of video stream, possible values are found in OOV4.VIDEO.ENCODING
     * @param {boolean} isLive True if it is a live asset, false otherwise
     * @param {number} initialTime The initial time to set, in seconds
     * @returns {boolean} True or false indicating success
     */


    this.setVideoUrl = function (url, encoding, isLive, initialTime) {
      _isVr = !!(conf && conf.source && conf.source.vr); // AMC clears the ad video source with empty values after an ad plays.
      // The empty url can be handled, but Bitmovin will throw an error if no encoding is set.

      if (url === '' && !encoding) {
        encoding = OOV4.VIDEO.ENCODING.MP4;
      }

      var urlChanged = false;

      if (_currentUrl.replace(/[\?&]_=[^&]+$/, '') != url) {
        _currentUrl = url || "";
        urlChanged = true;
        resetStreamData();
      }

      if (_.isNumber(initialTime) && _.isFinite(initialTime)) {
        _initialTimeOnLoad = initialTime;
      }

      _isM3u8 = _isDash = _isMP4 = _isOGG = _isM4A = _hasDRM = false;

      if (encoding == OOV4.VIDEO.ENCODING.HLS || encoding == OOV4.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS || encoding == OOV4.VIDEO.ENCODING.AKAMAI_HD2_HLS) {
        _isM3u8 = true;
      } else if (encoding == OOV4.VIDEO.ENCODING.DASH) {
        _isDash = true;
      } else if (encoding == OOV4.VIDEO.ENCODING.MP4) {
        _isMP4 = true;
      } else if (encoding == OOV4.VIDEO.ENCODING.AUDIO_OGG) {
        _isOGG = true;
      } else if (encoding == OOV4.VIDEO.ENCODING.AUDIO_M4A) {
        _isM4A = true;
      } else if (encoding == OOV4.VIDEO.ENCODING.AUDIO_HLS) {
        _isM3u8 = true;
      } else if (encoding == OOV4.VIDEO.ENCODING.DRM.HLS) {
        _isM3u8 = true;
        _hasDRM = true;
      } else if (encoding == OOV4.VIDEO.ENCODING.DRM.DASH) {
        _isDash = true;
        _hasDRM = true;
      } else if (!_.isEmpty(encoding)) {
        this.controller.notify(this.controller.EVENTS.ERROR, {
          errorcode: 4
        }); //4 -> MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED

        return false;
      } //To call the setup method in bitmovin, you should set the url in conf


      this.setSourceUrl();

      if (!_.isEmpty(url) && urlChanged) {
        _loadedCurrentUrl = false;
      } //We use empty string urls to clear out the source of the video. Bitmovin does not handle empty string urls well
      //with their load/setup functions (they do not fulfill promises - see https://github.com/bitmovin/ooyala-sync/issues/169),
      //but they do have a dedicated unload function.


      if (_.isEmpty(url) && _playerSetup) {
        this.player.unload();
      } //We need the video element to exist prior to PLAYBACK_READY, so we'll create the video element here
      //as we have all the information we need at this point.


      this.setupBitmovinPlayer();

      if (_.isEmpty(url) || urlChanged) {
        // Force iOS (without vr360) and Android to preload the stream so that when we click play the stream player is ready.
        // If we do not preload, then the stream will require multiple clicks, one to trigger load, and one
        // to trigger play.
        //for vr on ios player does not correctly handle pressing on play and pause
        if (OOV4.isIos && !_isVr || OOV4.isAndroid) {
          this.controller.markNotReady();
          this.load();
        }
      }

      if (_isVr && _currentTime !== 0 && _videoEnded) {
        _currentTime = 0;
      } //if we are playing live content, reset the playbackspeed.


      if (isLive || _isVr) {
        this.setPlaybackSpeed(1.0);
      }

      return urlChanged;
    };
    /**
     * Callback to handle notifications that ad finished playing
     * @private
     * @method BitdashVideoWrapper#onAdsPlayed
     */


    this.onAdsPlayed = function () {
      _adsPlayed = true;
    };
    /**
     * Sets the closed captions on the video element.
     * @public
     * @method BitdashVideoWrapper#setClosedCaptions
     * @param {string} language The language of the closed captions. If null, the current closed captions will be removed.
     * @param {object} closedCaptions The closedCaptions object
     * @param {object} params The params to set with closed captions
     */


    this.setClosedCaptions = function (language, closedCaptions, params) {
      _currentClosedCaptionsData = closedCaptions;

      if (!language || params && params.mode === OOV4.CONSTANTS.CLOSED_CAPTIONS.DISABLED) {
        _trackId = null;
        _captionsDisabled = true;
        this.player.setSubtitle(null);
        return;
      }

      _captionsDisabled = false;
      var toShow = true;

      if (params && params.mode == OOV4.CONSTANTS.CLOSED_CAPTIONS.HIDDEN) {
        toShow = false;
      } // Get url and label of the CC's with the selected language


      var ccData = _extractClosedCaptionsData(closedCaptions, language);

      var availableTracks = this.player.getAvailableSubtitles() || []; // Find out whether existing tracks already contain the current track id or the url to be set

      var existingTrackWithIdOrUrl = _.find(availableTracks, function (track) {
        var existsId = track.id && track.id === _trackId;
        var existsUrl = track.url && track.url === ccData.url;
        return (existsId || existsUrl) && track.lang === language;
      }); // Found an existing track with the same id or url (and language). We can simply enable that track


      if (existingTrackWithIdOrUrl) {
        _trackId = existingTrackWithIdOrUrl.id;

        _showCaptions(toShow);

        this.player.setSubtitle(_trackId);
        return;
      } // We haven't added a track for this language yet, but there might be an
      // in-manifest equivalent loaded already


      var existingTrackWithLang = _.find(availableTracks, function (track) {
        return track.lang === language;
      }); // New track is required if no previous track with the same langauge exists or
      // if there's a previous track with the specified language but the VTC passed CC data
      // for this language. The latter scenario means that the existing track is in-manifest,
      // so we want to override it with the external CC's passed by the VTC.


      var isNewTrackRequired = !existingTrackWithLang || ccData.url;
      _trackId = isNewTrackRequired ? OOV4.getRandomString() : existingTrackWithLang.id; // Add new track if needed

      if (isNewTrackRequired) {
        this.player.addSubtitle({
          id: _trackId,
          url: ccData.url,
          kind: 'captions',
          lang: language,
          label: ccData.label
        });
      } // Enable selected captions


      _showCaptions(toShow);

      this.player.setSubtitle(_trackId);
    };
    /**
     * Helper function that extracts the url and label of the CC's with the specified language from
     * the content tree's closed captions object.
     * @private
     * @method BitdashVideoWrapper#_extractClosedCaptionsData
     * @param {Object} closedCaptions The closed captions object passed by the VTC.
     * @param {String} language The language code of the CC's we want to get data for.
     * @return {Object} An object with the url and label properties that correspond to the CC's with
     * the given language. Will return an empty object if no matching CC's are found. Gives priority
     * to VTT captions but falls back to DFXP when VTT are missing.
     */


    var _extractClosedCaptionsData = _.bind(function (closedCaptions, language) {
      var data = {};
      closedCaptions = closedCaptions || {};
      var closedCaptionsVtt = closedCaptions.closed_captions_vtt && closedCaptions.closed_captions_vtt[language];

      if (closedCaptionsVtt) {
        data.url = closedCaptionsVtt.url;
        data.label = closedCaptionsVtt.name;
      } else if (closedCaptions.closed_captions_dfxp && closedCaptions.closed_captions_dfxp.languages && closedCaptions.closed_captions_dfxp.languages.length) {
        var existsDfxpLanguage = _.some(closedCaptions.closed_captions_dfxp.languages, function (dfxpLang) {
          return dfxpLang === language;
        }); // DFXP uses a single url for all languages, we just need to check that the
        // specified language is supported


        if (existsDfxpLanguage) {
          data.url = closedCaptions.closed_captions_dfxp.url;
          data.label = language + '_oo'; // Create unique label for dfxp captions since their data doesn't have one
        }
      } // Create default label if missing


      if (!data.label) {
        data.label = this.player && this.player.isLive() ? language + ' live' : language;
      }

      return data;
    }, this);
    /**
     * Searches for a label for a particular language inside the most recent closed
     * captions data passed by the VTC.
     * @private
     * @method BitdashVideoWrapper#_getCCLanguageLabel
     * @param {string} language The language code to match.
     * @param {string} defaultLabel A default value to return in case a matching label is not found.
     * @return {string} The label that matches specified language code or the value of defaultLabel if none is found.
     */


    var _getCCLanguageLabel = function _getCCLanguageLabel(language, defaultLabel) {
      var ccData = _currentClosedCaptionsData || {};
      var closedCaptionsVtt = ccData.closed_captions_vtt && ccData.closed_captions_vtt[language];
      var label = (closedCaptionsVtt || {}).name || defaultLabel;
      return label;
    };
    /**
     * Sets the closed captions mode on the video element.
     * @public
     * @method BitdashVideoWrapper#setClosedCaptionsMode
     * @param {string} mode The mode to set the text tracks element. One of
     * (OOV4.CONSTANTS.CLOSED_CAPTIONS.DISABLED, OOV4.CONSTANTS.CLOSED_CAPTIONS.HIDDEN, OOV4.CONSTANTS.CLOSED_CAPTIONS.SHOWING).
     */


    this.setClosedCaptionsMode = function (mode) {
      switch (mode) {
        case OOV4.CONSTANTS.CLOSED_CAPTIONS.DISABLED:
          _trackId = null;
          _captionsDisabled = true;
          this.player.setSubtitle(null);
          break;

        case OOV4.CONSTANTS.CLOSED_CAPTIONS.SHOWING:
          _captionsDisabled = false;

          _showCaptions(true);

          break;

        case OOV4.CONSTANTS.CLOSED_CAPTIONS.HIDDEN:
          _captionsDisabled = false;

          _showCaptions(false);

      }
    };
    /**
     * Sets the crossorigin attribute on the video element.
     * @public
     * @method BitdashVideoWrapper#setCrossorigin
     * @param {string} crossorigin The value to set the crossorigin attribute. Will remove crossorigin attribute if null.
     */


    this.setCrossorigin = function (crossorigin) {
      if (crossorigin) {
        $(_videoElement).attr("crossorigin", crossorigin);
      } else {
        $(_videoElement).removeAttr("crossorigin");
      }
    };
    /**
     * Sets the stream to play back based on given bitrate object. Plugin must support the
     * BITRATE_CONTROL feature to have this method called.
     * @public
     * @method BitdashVideoWrapper#setBitrate
     * @param {string} bitrateId representing bitrate, list with valid IDs was retrieved by player.calling getAvailableVideoQualities(),
     * "auto" resets to dynamic switching.
     *
     *   Example: "240p 250kbps", "480p 800kbps", "auto"
     */


    this.setBitrate = function (bitrateId) {
      this.player.setVideoQuality(bitrateId);
    };
    /**
     * Merges our internal urlSource object with the Bitmovin conf object.
     * @private
     * @method BitdashVideoWrapper#_mergeSources
     */


    var _mergeSources = _.bind(function () {
      if (conf && conf.source) {
        delete conf.source.hls;
        delete conf.source.dash;
        delete conf.source.progressive;
        delete conf.source.drm;

        _.extend(conf.source, urlSource);
      }
    }, this);
    /**
     * Checks to see if we should load a new source into the Bitmovin player. We should load a new source
     * if the current url is different from the url from Bitmovin's config or if we have not loaded the current url.
     * @private
     * @method BitdashVideoWrapper#_requiresSourceLoad
     * @returns {boolean} True if a source should be loaded into the Bitmovin player, false otherwise
     */


    var _requiresSourceLoad = _.bind(function () {
      var bitmovinUrl = _getUrlFromBitmovinPlayer();

      return !_loadedCurrentUrl || _currentUrl !== bitmovinUrl;
    }, this);
    /**
     * Loads a new source into the Bitmovin player. This should be called only after the Bitmovin player
     * has finished setting up.
     * @private
     * @method BitdashVideoWrapper#_loadBitmovinSource
     * @returns {boolean} True if the Bitmovin player will load a new source, false otherwise
     */


    var _loadBitmovinSource = _.bind(function () {
      if (this.player && conf) {
        var urlToBeLoaded = _currentUrl; //Bitmovin will throw an error if you call load with an empty source on Android or an empty string url. If
        //_currentUrl is an empty string or null, the source will be empty

        var loadSource = _requiresSourceLoad();

        if (_currentUrl && loadSource) {
          _mergeSources();

          conf.source.options = conf.source.options || {};

          if (_initialTimeOnLoad > 0) {
            _initialTime.value = _initialTimeOnLoad;
            _initialTime.reached = false;
            conf.source.options.startTime = _initialTimeOnLoad;
          } else {
            // Note: If startTime was set for a previous video, Bitmovin will keep
            // using the previous value until explicitly set to 0 on a new source
            conf.source.options.startTime = 0;
          }

          _initialTimeOnLoad = -1;
          _pendingSetupOrLoad = true;
          var playerLoadPromise = this.player.load(conf.source);
          playerLoadPromise.catch(function (error) {
            OOV4.log('%cError loading source URL ' + urlToBeLoaded + ' ' + error, 'color: red; font-weight: bold');
          });
          return true;
        }
      }

      return false;
    }, this);
    /**
     * Loads the current stream url in the video element; the element should be left paused. This needs
     * to be called after the player has already been setup.
     * @public
     * @method BitdashVideoWrapper#load
     * @param {boolean} rewind True if the stream should be set to time 0
     * @returns {boolean} True if we are going to load a url, false otherwise
     */


    this.load = function (rewind) {
      var loadSource = _requiresSourceLoad();

      if (loadSource) {
        this.setSourceUrl(); //The player setup promise and the player isSetup API both resolve/get set to true
        //prior to the source getting loaded (assuming the setup was provided a source url).
        //We will use the _pendingSetupOrLoad flag to track if we have a load pending instead. This flag
        //gets switched off in the _onReady callback
        //If we have a url load pending, we will set the new source after it is ready in the _onReady
        //callback

        if (_pendingSetupOrLoad) {
          _willLoad = true;
        } else {
          //Otherwise we can immediately load a new source
          _loadBitmovinSource();
        }

        return true;
      } else {
        return false;
      }
    };
    /**
     * Called after a source is loaded in order to output the current stream's
     * information to the browser console.
     * @private
     * @method BitdashVideoWrapper#_printPlayerLoadInfo
     * @param {Object} player The Bitmovin player instance.
     * @param {Object} currentUrl The url that was loaded.
     */


    var _printPlayerLoadInfo = function _printPlayerLoadInfo(player, currentUrl) {
      if (!player) {
        return;
      }

      var technology = player.getPlayerType() + '.' + player.getStreamType();
      var drmInfo = 'none';

      if (_hasDRM) {
        drmInfo = JSON.stringify(_.keys(_drm));
      }

      var infoText = '%cBitmovin player is using technology: ' + technology + ', manifest: ' + currentUrl + ', DRM: ' + drmInfo;
      OOV4.log(infoText, 'color: green; font-weight: bold');
    };
    /**
     * Sets the initial time of the video playback.
     * @public
     * @method BitdashVideoWrapper#setInitialTime
     * @param {number} initialTime The initial time of the video (seconds)
     */


    this.setInitialTime = function (initialTime) {
      if (!_.isNumber(initialTime) || !_.isFinite(initialTime) || initialTime <= 0) {
        return;
      } // We need to make sure that we fire the playing event once more
      // after initialTime is reset


      _hasNotifiedInitialPlaying = false; // For VOD streams the initial time will be handled using Bitmovin's startTime
      // config parameter when the source is loaded. For live DVR streams the
      // seekable ranges will be monitored and the time shift will occur as soon
      // as the ranges allow us to seek. For both cases a final check is performed
      // on the first playhead update in order to force the initial time if it hasn't
      // been reached by then.

      _initialTime.value = initialTime;
      _initialTime.reached = false;
    };
    /**
     * Notifies wrapper that failover has occurred in the Ooyala Player
     * @public
     * @method BitdashVideoWrapper#handleFailover
     * @param {number} failoverPlayheadTime The playhead time before failover (seconds)
     */


    this.handleFailover = function (failoverPlayheadTime) {
      _handleFailover = true;
      _failoverPlayheadTime = failoverPlayheadTime;
    };
    /**
     * Triggers playback on the video element.
     * @public
     * @method BitdashVideoWrapper#play
     */


    this.play = function () {
      _pauseRequested = false;
      _pauseOnPlaying = false;
      playVideo();
    };
    /**
     * Triggers a pause on the video element.
     * @public
     * @method BitdashVideoWrapper#pause
     */


    this.pause = function () {
      if (_hasStartedPlaying) {
        this.player.pause();
      } else {
        _pauseOnPlaying = true;
      }

      _pauseRequested = true; // If pause command comes while seeking, make sure to re-instante the pause upon seeked

      _shouldPauseOnSeeked = _isSeeking;
    };
    /**
     * Set the playback speed of the current video element.
     * @public
     * @method BitdashVideoWrapper#setPlaybackSpeed
     * @param  {number} speed The speed multiplier
     */


    this.setPlaybackSpeed = function (speed) {
      if (typeof speed !== 'number' || isNaN(speed)) {
        return;
      }

      if (this.player) {
        var oldSpeed = _currentPlaybackSpeed;
        var newSpeed = speed;

        if (this.player.isLive() || _isVr) {
          newSpeed = 1.0;
        }

        _currentPlaybackSpeed = newSpeed;
        this.player.setPlaybackSpeed(_currentPlaybackSpeed); // TODO:
        // The ON_PLAYBACK_SPEED_CHANGED event is only available on version 7.8
        // and higher. For now we notify the rate change immediately after setting it,
        // but we should use the event once we update to Bitmovin 7.8+

        var playbackSpeedChanged = oldSpeed !== newSpeed;

        if (playbackSpeedChanged) {
          this.controller.notify(this.controller.EVENTS.PLAYBACK_RATE_CHANGE, {
            playbackRate: _currentPlaybackSpeed
          });
        }
      }
    };
    /**
     * Get the playback speed of the current video element.
     * @public
     * @method BitdashVideoWrapper#getPlaybackSpeed
     * @returns {number} The speed multiplier
     */


    this.getPlaybackSpeed = function () {
      return _currentPlaybackSpeed;
    };
    /**
     * Triggers a seek on the video element.
     * @public
     * @method BitdashVideoWrapper#seek
     * @param {number} time The time to seek the video to (in seconds)
     */


    this.seek = function (time) {
      if (typeof time !== "number" || // We should time shift to initial time even when its value already matches
      // the current playhead, otherwise the flow will be broken and initial time
      // will never be reached
      !_initialTime.pendingSeek && time === Math.round(_currentTime)) {
        return;
      }

      if (!_hasPlayed) {//Alex: With the way we currently call Bitmovin APIs, seeking prior to or immediately
        //after playing seems to cause issues with the video automatically playing. I have
        //not been able to reproduce this with the standalone player yet. Seeking before play start
        //should not be needed since the initial time will now be taken care of with the startTime
        //Bitmovin option in _loadBitmovinSource. This section will remain empty for now
      } else {
        var duration = this.player.getDuration();

        if (duration > 0) {
          var safeTime = convertToSafeSeekTime(time, duration);

          if (this.player.isLive()) {
            this.player.timeShift(this.player.getMaxTimeShift() + safeTime);
          } else {
            this.player.seek(safeTime);
          }

          _currentTime = safeTime;
        }
      }
    };
    /**
     * Call moveViewingDirection method from bitmovin api
     * @public
     * @param {number} x - horizontal displacement
     * @param {number} y - vertical displacement
     * @param {number} phi - angle of rotation
     * @method BitdashVideoWrapper#moveVrViewingDirection
     * @returns {boolean} - the result of the function. True if the moveViewingDirection method is called in bitmovin
     */


    this.moveVrViewingDirection = function (x, y, phi) {
      return this.player && this.player.vr && this.player.vr.moveViewingDirection({
        x: x,
        y: y,
        phi: parseInt(phi)
      });
    };
    /**
     * Call setViewingDirection method from bitmovin api and set this.vrViewingDirection
     * @public
     * @param params {object} {{yaw: number, roll: number, pitch: number}}
     * yaw - rotation around the vertical axis
     * roll - rotation around the front-to-back axis
     * pitch - rotation around the side-to-side axis
     * @method BitdashVideoWrapper#setVrViewingDirection
     * @returns {boolean} - true if the setViewingDirection method is called in bitmovin
     */


    this.setVrViewingDirection = function (params) {
      if (params !== null && _typeof(params) === 'object') {
        params = _setViewBoundaries(params);

        if (_requestAnimationId) {
          cancelAnimationFrame(_requestAnimationId);
        }

        var yaw = params.yaw && _.isNumber(params.yaw) ? params.yaw : this.startVrViewingDirection.yaw;
        var roll = params.roll && _.isNumber(params.roll) ? params.roll : this.startVrViewingDirection.roll;
        var pitch = params.pitch && _.isNumber(params.pitch) ? params.pitch : this.startVrViewingDirection.pitch;
        this.vrViewingDirectionPrev = _.extend({}, this.vrViewingDirection);
        this.vrViewingDirection = {
          yaw: yaw,
          roll: roll,
          pitch: pitch,
          time: new Date().getTime()
        };

        if (this.player && this.player.vr && typeof this.player.vr.setViewingDirection === 'function') {
          return this.player.vr.setViewingDirection(this.vrViewingDirection);
        }
      }

      return false;
    };
    /**
     * Call getViewingDirection method from bitmovin api
     * @public
     * @method BitdashVideoWrapper#getVrViewingDirection
     * @returns {object} current viewing direction
     */


    this.getVrViewingDirection = function () {
      return this.player && this.player.vr && this.player.vr.getViewingDirection();
    };
    /**
     * Creating a camera deceleration effect
     * @public
     * @method BitdashVideoWrapper#onEndVrMove
     */


    this.onEndVrMove = function () {
      var self = this;
      _timeAnimation = 1000; // angular velocity changes

      var yawDeltaW = (self.vrViewingDirection.yaw - self.vrViewingDirectionPrev.yaw) / (self.vrViewingDirection.time - self.vrViewingDirectionPrev.time);
      var pitchDeltaW = (self.vrViewingDirection.pitch - self.vrViewingDirectionPrev.pitch) / (self.vrViewingDirection.time - self.vrViewingDirectionPrev.time);
      var timeStartAnim = self.vrViewingDirection.time; //undo the current animation

      if (_requestAnimationId) {
        cancelAnimationFrame(_requestAnimationId);
      }

      var rotate = function rotate() {
        var diffTime = new Date().getTime() - timeStartAnim; // time from the beginning of the animation (dt)

        if (diffTime) {
          var dYaw = _easeOutCubic(diffTime, 0, yawDeltaW, _timeAnimation);

          var dPitch = _easeOutCubic(diffTime, 0, pitchDeltaW, _timeAnimation);
        }

        self.setVrViewingDirection({
          yaw: self.vrViewingDirection.yaw + dYaw,
          pitch: self.vrViewingDirection.pitch + dPitch,
          roll: self.vrViewingDirection.roll
        });
        _requestAnimationId = requestAnimationFrame(rotate);
      };

      setTimeout(function () {
        if (_requestAnimationId) {
          cancelAnimationFrame(_requestAnimationId);
        }
      }, _timeAnimation);
      rotate();
    };
    /**
     * @public
     * @method BitdashVideoWrapper#getIsVideoMoving
     * @returns {boolean} If video is currently moving
     */


    this.getIsVideoMoving = function () {
      return this.isVideoMoving;
    };
    /**
     * Call enableMouseControl method from bitmovin api
     * @public
     * @method BitdashVideoWrapper#enableVrMouseControls
     * @returns {boolean}
     */


    this.enableVrMouseControls = function () {
      if (this.player && this.player.vr) {
        return this.player.vr.enableMouseControl();
      }

      return false;
    };
    /**
     * Call disableMouseControl method from bitmovin api
     * @public
     * @method BitdashVideoWrapper#disableVrMouseControls
     * @returns {boolean}
     */


    this.disableVrMouseControls = function () {
      if (this.player && this.player.vr) {
        return this.player.vr.disableMouseControl();
      }

      return false;
    };
    /**
     * Call setViewingDirectionChangeThreshold method from bitmovin api
     * @public
     * @param {number} threshold - number of degrees that the viewport can change before the
     * ON_VR_VIEWING_DIRECTION_CHANGE event is triggered {number}
     * @method BitdashVideoWrapper#setVrViewingDirectionChangeThreshold
     * @returns {boolean} - true if the setViewingDirectionChangeThreshold method is called in bitmovin
     */


    this.setVrViewingDirectionChangeThreshold = function (threshold) {
      if (this.player && this.player.vr) {
        return this.player.vr.setViewingDirectionChangeThreshold(threshold);
      }

      return false;
    };
    /**
     * Call setVRViewingDirectionChangingEventInterval method from bitmovin api
     * @public
     * @param {number} interval - minimal interval between consecutive ON_VR_VIEWING_DIRECTION_CHANGE events
     * @method BitdashVideoWrapper#setVrViewingDirectionChangingEventInterval
     * @returns {boolean} - true if the setViewingDirectionChangeEventInterval method is called in bitmovin
     */


    this.setVrViewingDirectionChangingEventInterval = function (interval) {
      if (this.player && this.player.vr) {
        return this.player.vr.setViewingDirectionChangeEventInterval(interval);
      }

      return false;
    };
    /**
     * Getting the current direction
     * @public
     * @method BitdashVideoWrapper#getCurrentDirection
     * @returns {object} local viewing direction
     */


    this.getCurrentDirection = function () {
      return this.vrViewingDirection;
    };
    /**
     * Call enableKeyboardControls method from bitmovin api
     * @public
     * @method BitdashVideoWrapper#enableVrKeyboardControls
     * returns {boolean}
     */


    this.enableVrKeyboardControls = function () {
      if (this.player && this.player.vr) {
        return this.player.vr.enableKeyboardControl();
      }

      return false;
    };
    /**
     * Call disableKeyboardControl method from bitmovin api
     * @public
     * @method BitdashVideoWrapper#disableVrKeyboardControls
     * @returns {boolean}
     */


    this.disableVrKeyboardControls = function () {
      if (this.player && this.player.vr) {
        return this.player.vr.disableKeyboardControl();
      }

      return false;
    };
    /**
     * Call getViewingDirectionChangeEventInterval method from bitmovin api
     * @public
     * @method BitdashVideoWrapper#getVrViewingDirectionChangingEventInterval
     * @returns {number} - The minimal interval between consecutive ON_VR_VIEWING_DIRECTION_CHANGE events.
     * If the method is unavailable, returns -1
     */


    this.getVrViewingDirectionChangingEventInterval = function () {
      var interval = -1; //the default value that is impossible when calling the getViewingDirectionChangeEventInterval method

      if (this.player && this.player.vr && typeof this.player.vr.getViewingDirectionChangeEventInterval === "function") {
        interval = this.player.vr.getViewingDirectionChangeEventInterval();
      }

      return interval;
    };
    /**
     * Call isKeyboardControlEnabled method from bitmovin api
     * @public
     * @method BitdashVideoWrapper#isVrKeyboardControlEnabled
     * @returns {boolean}
     */


    this.isVrKeyboardControlEnabled = function () {
      if (this.player && this.player.vr) {
        return this.player.vr.isKeyboardControlEnabled();
      }

      return false;
    };
    /**
     * Triggers a mute on the video element.
     * @public
     * @method BitdashVideoWrapper#mute
     */


    this.mute = function () {
      _corePlayerMuteState = true;
      var isMuted = this.player.isMuted();

      if (!canChangeVolume()) {
        _setMuteStateOnReady = true;
      }

      this.player.mute(); //Bitmovin does not throw the onMuted event if there are no audio tracks available.
      //In this case we'll manually send out the VTC notification if previously unmuted

      if (_.isEmpty(this.player.getAvailableAudio()) && !isMuted) {
        _onMuted();
      }
    };
    /**
     * Triggers an unmute on the video element.
     * @public
     * @method BitdashVideoWrapper#unmute
     */


    this.unmute = function () {
      _corePlayerMuteState = false;
      var isMuted = this.player.isMuted();

      if (!canChangeVolume()) {
        _setMuteStateOnReady = true;
      }

      this.player.unmute(); //Bitmovin does not throw the onUnmuted event if there are no audio tracks available.
      //In this case we'll manually send out the VTC notification if previously muted

      if (_.isEmpty(this.player.getAvailableAudio()) && isMuted) {
        _onUnmuted();
      }
    };
    /**
     * Checks to see if the video element is muted.
     * @public
     * @method BitdashVideoWrapper#isMuted
     * @returns {boolean} True if the video element is muted, false otherwise
     */


    this.isMuted = function () {
      return this.player.isMuted();
    };
    /**
     * Triggers a volume change on the video element.
     * @public
     * @method BitdashVideoWrapper#setVolume
     * @param {number} volume A number between 0 and 1 indicating the desired volume percentage
     * @param {boolean} currentMuteState True if the player should be currently muted, false otherwise
     */


    this.setVolume = function (volume, currentMuteState) {
      var isMuted = currentMuteState || this.player.isMuted();
      var resolvedVolume = volume;

      if (resolvedVolume < 0) {
        resolvedVolume = 0;
      } else if (resolvedVolume > 1) {
        resolvedVolume = 1;
      } //[PLAYER-678] Workaround of an issue where player.isReady is returning true but _onReady
      //has not been called yet. If the player is not playing and not paused, we'll save the volume
      //as well


      if (!canChangeVolume()) {
        _setVolumeOnReady = resolvedVolume;
      }

      _currentVolume = resolvedVolume; //The Bitmovin player unmutes if you call setVolume if you set a positive non-zero volume.
      //Due to browser autoplay policies, do not call setVolume if we are currently muted.
      //In this case, we'll set the volume when we unmute the player

      if (!isMuted) {
        this.player.setVolume(resolvedVolume * 100);
      }
    };
    /**
     * Call setStereo method from bitmovin api
     * @public
     * @method BitdashVideoWrapper#toggleStereoVr
     * @returns {boolean} - true if the setStereo method is called in bitmovin
     */


    this.toggleStereoVr = function () {
      //checking for the existence of properties and methods
      var checkVrStereoParams = this.player && this.player.vr && typeof this.player.vr.setStereo === "function" && typeof this.player.vr.getStereo === "function";

      if (checkVrStereoParams) {
        this.player.vr.setStereo(!this.player.vr.getStereo());
      }

      return checkVrStereoParams;
    };
    /**
     * Method to toggle fullscreen mode
     * This method is needed for video360.
     * If native fullscreen does not work correctly, then we use player (pseudo-fullscreen) methods.
     * Now it is used for IOS. only
     * @public
     * @method BitdashVideoWrapper#toggleFullscreen
     */


    this.toggleFullscreen = function () {
      var checkPlayer = this.player && this.player.isReady();

      if (checkPlayer) {
        if (!!this.player.isFullscreen()) {
          this.player.exitFullscreen();
        } else {
          this.player.enterFullscreen();
        }
      }
    };
    /**
     * The method forms an array with input parameters for calling moveViewingDirection from bitmovin api.
     * @param {string} direction - "camera" offset direction. Correct values: "left", "right", "up", "down".
     * @returns {Array}  - an array with camera bias parameters [dx, dy, phi].
     * If the values are incorrect, then return an empty list
     * @private
     * @method BitdashVideoWrapper#_getArrayDirections
     */


    this._getArrayDirections = function (direction) {
      var dx = _stepDirection.dx,
          dy = _stepDirection.dy,
          arrDirection = [];

      switch (direction) {
        case 'right':
          arrDirection = [-dx, 0, 0];
          break;

        case 'left':
          arrDirection = [dx, 0, 0];
          break;

        case 'up':
          arrDirection = [0, dy, 0];
          break;

        case 'down':
          arrDirection = [0, -dy, 0];
          break;
      }

      return arrDirection;
    };
    /**
     * moveVrToDirection controls the rotation.
     * @param isRotating : {boolean} This parameter indicates whether the rotation has started or stopped.
     * Can take a value of true (rotating) or false (not rotating)
     * @param direction : {string} This parameter shows the direction of rotation (the "camera" offset).
     * It can take the values "left", "right", "up", "down", "init".
     * @public
     * @method BitdashVideoWrapper#moveVrToDirection
     * @return {boolean} - false if the arguments are not correct In all other cases, returns true
     */


    this.moveVrToDirection = function (isRotating, direction) {
      if (direction === 'init') {
        if (!isRotating) {
          return false;
        }

        this._moveVrToInitCoordinates();

        return true;
      }

      var self = this;

      var arrDirection = this._getArrayDirections(direction); //validation of values


      if (typeof isRotating !== "boolean" || isRotating === true && arrDirection.length !== 3) {
        return false;
      }

      var rotate = function rotate() {
        self.isVideoMoving = true;
        self.moveVrViewingDirection.apply(self, arrDirection);
        _requestAnimationId = requestAnimationFrame(rotate);
        return _requestAnimationId;
      };

      var cancelRotate = function cancelRotate() {
        _requestAnimationId && cancelAnimationFrame(_requestAnimationId);
        self.setBitrate("auto");
        return _requestAnimationId;
      };

      if (isRotating) {
        rotate();
      } else {
        cancelRotate();
      }

      return true;
    };
    /**
     * Return camera to initial coordinates with animation
     * @private
     * @method BitdashVideoWrapper#_moveVrToInitCoordinates
     */


    this._moveVrToInitCoordinates = function () {
      if (movingVrRequestId !== 0) {
        cancelAnimationFrame(movingVrRequestId);
      }

      var lowestVrCoordinateYaw = (0, _vrCoordinates.getLowestVrCoordinate)(_this2.vrViewingDirection.yaw);
      var lowestVrCoordinatePitch = (0, _vrCoordinates.getLowestVrCoordinate)(_this2.vrViewingDirection.pitch);
      var distanceCoeffObject = (0, _vrCoordinates.getDirectionCoefficients)(lowestVrCoordinateYaw, lowestVrCoordinatePitch);

      var moveVrVideo = function moveVrVideo() {
        lowestVrCoordinateYaw = (0, _vrCoordinates.getDecreasedVrCoordinate)(lowestVrCoordinateYaw, distanceCoeffObject.coeffYaw);
        lowestVrCoordinatePitch = (0, _vrCoordinates.getDecreasedVrCoordinate)(lowestVrCoordinatePitch, distanceCoeffObject.coeffPitch);

        _this2.setVrViewingDirection({
          yaw: lowestVrCoordinateYaw,
          roll: 0,
          pitch: lowestVrCoordinatePitch
        });

        if (lowestVrCoordinateYaw !== 0 || lowestVrCoordinatePitch !== 0) {
          movingVrRequestId = requestAnimationFrame(moveVrVideo);
        }
      };

      requestAnimationFrame(moveVrVideo);
    };
    /**
     * Checks to see if the Bitmovin player is ready to change volume.
     * @private
     * @method BitdashVideoWrapper#canChangeVolume
     */


    var canChangeVolume = _.bind(function () {
      return this.player.isReady() && (this.player.isPlaying() || this.player.isPaused());
    }, this);
    /**
     * Gets the current time position of the video.
     * @public
     * @method BitdashVideoWrapper#getCurrentTime
     * @returns {number} The current time position of the video (seconds)
     */


    this.getCurrentTime = function () {
      return _currentTime;
    };
    /**
     * Prepares a video element to be played via API.  This is called on a user click event, and is used in
     * preparing HTML5-based video elements on devices.  To prepare the element for playback, call pause and
     * play.  Do not raise playback events during this time.
     * @public
     * @method BitdashVideoWrapper#primeVideoElement
     */


    this.primeVideoElement = function () {
      // Prime iOS and Android videos with a play on a click so that we can control them via JS later
      // TODO: This is only required on HTML5-based video elements.
      if (_videoElement) {
        var video = _videoElement[0];

        if (video) {
          _priming = true;
          var playPromise = video.play();

          if (playPromise) {
            playPromise.then(function () {
              if (!_hasPlayed) {
                video.pause();
              } else {
                _priming = false;
              }
            }).catch(function () {
              _priming = false;
            });
          }
        }
      }
    };
    /**
     * For multi audio we can get a list of available audio tracks
     * @public
     * method BitdashVideoWrapper#getAvailableAudio
     * @returns {Array} an array of all available audio tracks.
     */


    this.getAvailableAudio = function () {
      if (this.player && typeof this.player.getAvailableAudio === 'function') {
        var availableAudio = this.player.getAvailableAudio();

        if (availableAudio && availableAudio.length) {
          var currentAudio = this.getAudio();
          availableAudio = availableAudio.filter(function (track) {
            return track; // a track must exist
          }).map(function (track) {
            var label = track.label || '';
            var language = track.lang || track.language || '';
            var enabled = track.id === currentAudio.id;
            /*
            * check if label is equal to language which
            * essentialy should mean
            * that videoformat is dash or if both are empty
            */

            if (label === language || !label.length) {
              if (track.role && // track.role is Array
              track.role.length && typeof track.role[0].value !== 'undefined') {
                label = track.role[0].value;
              }
            }

            var trackDetails = {
              id: track.id,
              lang: language,
              label: label,
              enabled: enabled
            };
            return trackDetails;
          });
        } else {
          availableAudio = [];
        }

        return availableAudio;
      }

      return [];
    };
    /**
     * Returns the currently used audio track
     * @public
     * method BitdashVideoWrapper#getAudio
     * @returns {Object} object with information about active audio track.
     */


    this.getAudio = function () {
      if (this.player && typeof this.player.getAudio === 'function') {
        var currentAudio = this.player.getAudio();
        return currentAudio;
      }
    };
    /**
     * Sets the audio track to the ID specified by trackID
     * @public
     * @method BitdashVideoWrapper#setAudio
     * @param {String} trackId - the ID of the audio track to activate
     */


    this.setAudio = function (trackId) {
      if (this.player && typeof this.player.setAudio === 'function') {
        var currentAudio = this.player.getAudio();
        var currentTrackId = currentAudio ? currentAudio.id : null;

        if (trackId !== currentTrackId) {
          _audioChanging = true;
        }

        this.player.setAudio(trackId);
      }
    };
    /**
     * Applies the given css to the video element.
     * @public
     * @method BitdashVideoWrapper#applyCss
     * @param {object} css The css to apply in key value pairs
     */


    this.applyCss = function (css) {
      $(_videoWrapper).css(css);
    };
    /**
     * Removes video wrapper element and destroys the player
     * @public
     * @method BitdashVideoWrapper#destroy
     */


    this.destroy = function () {
      this.player.pause();
      _currentUrl = '';
      _initialized = false;
      _playerSetup = false;
      _loadedCurrentUrl = false;
      _playerSetupPromise = null;
      $(_videoWrapper).remove();
      this.player.destroy();
    };
    /**************************************************/
    // Helpers

    /**************************************************/


    var resetStreamData = _.bind(function () {
      this.audioTracks = [];
      _audioChanging = false;
      _playOnAudioChange = false;
      _hasPlayed = false;
      _hasStartedPlaying = false;
      _hasNotifiedInitialPlaying = false;
      _videoEnded = false;
      _pauseOnPlaying = true;
      _isSeeking = false;
      _currentTime = 0;
      _failoverPlayheadTime = 0;
      _handleFailover = false;
      _trackId = '';
      _willPlay = false;
      _willLoad = false;
      _priming = false;
      _timeShifting = false;
      _pauseRequested = false;
      _shouldPauseOnSeeked = false;
      _initialTime.value = 0, _initialTime.reached = true, _initialTime.pendingSeek = false, _setVolumeOnReady = -1;
      _setMuteStateOnReady = false;
      _vtcBitrates = {};
      _currentBitRate = '';
      _currentClosedCaptionsData = null;
      _initialTimeOnLoad = -1;
    }, this);

    var _initPlayer = _.bind(function () {
      if (_initialized) {
        return;
      }

      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_AUDIO_ADAPTATION, _onAudioAdaptation);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_AUDIO_CHANGED, _onAudioChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_AUDIO_ADDED, _onAudioAdded);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_AUDIO_DOWNLOAD_QUALITY_CHANGED, _onAudioDownloadQualityChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGED, _onAudioPlaybackQualityChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_CUE_ENTER, _onCueEnter);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_CUE_EXIT, _onCueExit);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_DOWNLOAD_FINISHED, _onDownloadFinished);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_DVR_WINDOW_EXCEEDED, _onDVRWindowExceeded);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_ERROR, _onError);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_FULLSCREEN_ENTER, _onFullscreenEnter);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_FULLSCREEN_EXIT, _onFullscreenExit);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_METADATA, _onMetadata);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_MUTED, _onMuted);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_PAUSED, _onPaused);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_PERIOD_SWITCHED, _onPeriodSwitched);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_PLAY, _onPlay);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_PLAYING, _onPlaying);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_PLAYBACK_FINISHED, _onPlaybackFinished);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_PLAYER_RESIZE, _onPlayerResize);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_READY, _onReady);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_SEEK, _onSeek);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_SEEKED, _onSeeked);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_SEGMENT_REQUEST_FINISHED, _onSegmentRequestFinished);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_SOURCE_LOADED, _onSourceLoaded);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_SOURCE_UNLOADED, _onSourceUnloaded);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_STALL_STARTED, _onStallStarted);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_STALL_ENDED, _onStallEnded);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_SUBTITLE_ADDED, _onSubtitleAdded);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_SUBTITLE_CHANGED, _onSubtitleChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_SUBTITLE_REMOVED, _onSubtitleRemoved);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_TIME_CHANGED, _onTimeChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_TIME_SHIFT, _onTimeShift);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_TIME_SHIFTED, _onTimeShifted);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_UNMUTED, _onUnmuted);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VIDEO_ADAPTATION, _onVideoAdaptation);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VIDEO_DOWNLOAD_QUALITY_CHANGED, _onVideoDownloadQualityChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGED, _onVideoPlaybackQualityChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VOLUME_CHANGED, _onVolumeChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VR_ERROR, _onVRError);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VR_MODE_CHANGED, _onVrModeChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VR_STEREO_CHANGED, _onVrStereoChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VR_VIEWING_DIRECTION_CHANGE, _onVrViewingDirectionChanging);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_VR_VIEWING_DIRECTION_CHANGED, _onVrViewingDirectionChanged);
      this.player.addEventHandler(bitmovinPlayer.EVENT.ON_WARNING, _onWarning);
      _initialized = true;
    }, this);

    var _getSubtitleText = function _getSubtitleText(subtitleList) {
      var text = '';
      subtitleList.children().each(function () {
        text += $(this).text() + '\n';
      });
      return $.trim(text);
    };
    /**
     * Shows / hides element used to display closed captions / subtitles
     * @private
     * @param {boolean} toShow true to show captions, false to hide captions
     */


    var _showCaptions = function _showCaptions(toShow) {
      if (!_ccWrapper) {
        return;
      }

      var subtitleList = _ccWrapper.find("ol").attr("id", "subtitles");

      if (!subtitleList || subtitleList.length == 0) {
        return;
      }

      _ccVisible = toShow;

      if (window.runningUnitTests) {
        //in test environment call of show doesn't set css('display') property to 'block', so we explicitly set these properties here
        toShow ? subtitleList.css('display', OOV4.CSS.VISIBLE_DISPLAY) : subtitleList.css('display', OOV4.CSS.INVISIBLE_DISPLAY);
      } else {
        //in real environment call of css('display', 'block') doesn't show subtitleList element (<ol>), so we are explicitly calling show
        toShow ? subtitleList.show() : subtitleList.hide();
      }
    };
    /**
    * Set DRM data for Widevine Modular DRM
    * @private
    * @param {object} drm The object contains la_url {string}
    * @param {number} reqRetryNum Number of retries for license request
    * @param {number} retryDelayMillisec Milliseconds delay between retires
    * @param {object} customParams Custom Bitmovin DRM settings provided via page-level params.
    */


    var _setWidevineDRM = function _setWidevineDRM(drm, reqRetryNum, retryDelayMillisec, customParams) {
      var url = drm.la_url;

      if (url && !_.isEmpty(url)) {
        _drm["widevine"] = {
          LA_URL: url,
          maxLicenseRequestRetries: reqRetryNum,
          licenseRequestRetryDelay: retryDelayMillisec,
          // [PLAYER-1673] Reactivate the persistentState for device registration Widevine DRM.
          // This setting will block widevine assets to play in incognito mode.
          mediaKeySystemConfig: {
            persistentState: 'required'
          }
        }; // Extend config with page-level overrides when available

        if (customParams && customParams.widevine) {
          _.extend(_drm.widevine, customParams.widevine);

          OOV4.log("Bitmovin: Widevine page-level overrides applied.", _drm.widevine);
        }
      }
    };
    /**
    * Set DRM data for Playready DRM
    * @private
    * @param {object} drm The object contains la_url {string} (optional)
    * @param {string} authToken The string for authentication in SAS
    * @param {number} reqRetryNum Number of retries for license request
    * @param {number} retryDelayMillisec Milliseconds delay between retries
    * @param {object} customParams Custom Bitmovin DRM settings provided via page-level params.
    */


    var _setPlayreadyDRM = function _setPlayreadyDRM(drm, authToken, reqRetryNum, retryDelayMillisec, customParams) {
      _drm["playready"] = {
        maxLicenseRequestRetries: reqRetryNum,
        licenseRequestRetryDelay: retryDelayMillisec
      };

      if (authToken && !_.isEmpty(authToken)) {
        _drm.playready["headers"] = [{
          name: 'ooyala-auth-token',
          value: authToken
        }];
      }

      var url = drm.la_url;

      if (url && !_.isEmpty(url)) {
        _drm.playready["LA_URL"] = url;
      } // Extend config with page-level overrides when available


      if (customParams && customParams.playready) {
        _.extend(_drm.playready, customParams.playready);

        OOV4.log("Bitmovin: Playready page-level overrides applied.", _drm.playready);
      }
    };
    /**
    * Set DRM data for Fairplay DRM
    * @private
    * @param {object} drm The object contains la_url {string} and certificate_url {string}
    * @param {string} authToken The token from SAS for authentication
    * @param {object} customParams Custom Bitmovin DRM settings provided via page-level params.
    */


    var _setFairplayDRM = function _setFairplayDRM(drm, authToken, customParams) {
      var url = drm.la_url;
      var cert = drm.certificate_url;

      if (!_.isEmpty(url) && !_.isEmpty(cert)) {
        _drm["fairplay"] = {
          LA_URL: url,
          certificateURL: cert,
          prepareMessage: function prepareMessage(event, session) {
            var spc = event.messageBase64Encoded;

            if (_.isEmpty(spc)) {
              OOV4.log("Fairplay: Missing SPC");
              return "";
            }

            var body = {
              "spc": spc.replace(/\+/g, '-').replace(/\//g, '_'),
              "asset_id": session.contentId
            };

            if (!_.isEmpty(authToken)) {
              body["auth_token"] = authToken;
            }

            return JSON.stringify(body);
          },
          prepareContentId: function prepareContentId(contentId) {
            if (!_.isEmpty(contentId)) {
              var pattern = "skd://";
              var index = contentId.indexOf(pattern);

              if (index > -1) {
                var assetId = contentId.substring(index + pattern.length);
                return decodeURIComponent(assetId);
              }
            }

            OOV4.log("Fairplay: Incorrect contentId");
            return "";
          },
          prepareLicense: function prepareLicense(laResponse) {
            if (_.isEmpty(laResponse)) {
              OOV4.log("Fairplay: Missing license response");
              return "";
            }

            var ckcStr = JSON.parse(laResponse).ckc;

            if (_.isEmpty(ckcStr)) {
              OOV4.log("Fairplay: Missing CKC");
              return "";
            }

            return ckcStr.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
          },
          prepareCertificate: function prepareCertificate(certResponse) {
            if (!certResponse) {
              OOV4.log("Fairplay: Missing certificate response");
              return "";
            }

            var certJsonObj = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(certResponse)));
            var certStr = certJsonObj.certificate;

            if (_.isEmpty(certStr)) {
              OOV4.log("Fairplay: Missing certificate");
              return "";
            }

            certStr = OOV4.decode64(certStr.replace(/-/g, '+').replace(/_/g, '/'));
            var buf = new ArrayBuffer(certStr.length);
            var bufView = new Uint8Array(buf);

            for (var i = 0; i < certStr.length; i++) {
              bufView[i] = certStr.charCodeAt(i);
            }

            return bufView;
          }
        }; // Extend config with page-level overrides when available

        if (customParams && customParams.fairplay) {
          _.extend(_drm.fairplay, customParams.fairplay);

          OOV4.log("Bitmovin: Fairplay page-level overrides applied.", _drm.fairplay);
        }
      }
    };
    /**
     * Executes playback on the bitmovin player.
     * @private
     * @method BitdashVideoWrapper#playVideo
     */


    var playVideo = _.bind(function () {
      this.setVrViewingDirection(this.vrViewingDirection);
      var requireLoad = this.load();

      if (requireLoad) {
        _willPlay = true;
      } else if (_audioChanging) {
        _playOnAudioChange = true;
      } else {
        //PLAYER-3424: The _priming flag is to prevent certain Bitmovin playback events from
        //being published to the VTC.
        // We used to rely on the paused event from pausing after priming in order
        //to turn _priming off. However, Bitmovin does not always throw the paused event when priming.
        //One case where Bitmovin does not is when preroll ads are involved. Turn off _priming here
        //in case the flag as not been turned off since we now want all playback events to be
        //published to the VTC
        _priming = false; // PLAYER-1314
        // Priming needs to be done synchronously otherwise it won't work. When
        // priming we don't wait for player.setup or player.load to finish.
        // This should be re-tested when we enable Bitmovin HLS playback on Android and iOS.
        // PLAYER-1249
        // player.isReady will be true after player.setup is called (even if no
        // source is set at this point), so we also need to check whether we've
        // already loaded a source before actually starting playback.
        // The ready event will be fired once more after player.load succeeds,
        // so playVideo will be called again when that happens.

        this.player.play();
        this.setPlaybackSpeed(_currentPlaybackSpeed);
        _shouldPauseOnSeeked = false;
        _hasPlayed = true;
        _videoEnded = false;
      }
    }, this);
    /**
     * Converts the desired seek time to a safe seek time based on the duration and platform.  If seeking
     * within OOV4.CONSTANTS.SEEK_TO_END_LIMIT of the end of the stream, seeks to the end of the stream.
     * @private
     * @method BitdashVideoWrapper#convertToSafeSeekTime
     * @param {number} time The desired seek-to position
     * @param {number} duration The video's duration
     * @returns {number} The safe seek-to position
     */


    var convertToSafeSeekTime = function convertToSafeSeekTime(time, duration) {
      // If seeking within some threshold of the end of the stream, seek to end of stream directly
      if (duration - time < OOV4.CONSTANTS.SEEK_TO_END_LIMIT) {
        time = duration;
      }

      var safeTime = time >= duration ? duration - 2 : time < 0 ? 0 : time; // iPad with 6.1 has an interesting bug that causes the video to break if seeking exactly to zero

      if (OOV4.isIpad && safeTime < 0.1) {
        safeTime = 0.1;
      }

      return safeTime;
    };
    /**
     * Wrapper for Bitmovin's getSeekableRange() method which currently doesn't
     * work with live DVR streams. This function provides a workaround that lets
     * us access the seekable range regardless of the stream type.
     * @private
     * @method BitdashVideoWrapper#_getSeekableRange
     * @returns {Object} An object with "start" and "end" properties which indicate the seekable range of the video.
     */


    var _getSeekableRange = function _getSeekableRange() {
      var seekableRange = {
        start: -1,
        end: -1
      };

      if (!_this2.player) {
        return seekableRange;
      } // At the time of writing Bitmovin returns -1 for seekable ranges when
      // playing DVR-enabled streams. As a workaround we need to read these values
      // directly from the video element.


      if (_isDvrStream()) {
        var videoElement = _this2.player.getVideoElement();

        if (videoElement && videoElement.seekable && videoElement.seekable.length) {
          seekableRange.start = videoElement.seekable.start(0);
          seekableRange.end = videoElement.seekable.end(0);
        }
      } else {
        seekableRange = _this2.player.getSeekableRange();
      }

      return seekableRange;
    };
    /**
     * Determines whether or not the currently loaded stream supports DVR.
     * @private
     * @method BitdashVideoWrapper#_isDvrStream
     * @returns {Boolean} True if the supports DVR, false otherwise
     */


    var _isDvrStream = function _isDvrStream() {
      var isDvrStream = false;

      if (_this2.player) {
        isDvrStream = _this2.player.getMaxTimeShift() < 0;
      }

      return isDvrStream;
    };
    /**
     * Performs a check to see whether the stream's current seekable ranges allow
     * seeking or time-shifting to the currently configured initial time value. If the
     * initial time value is within the seekable ranges this function will automatically
     * try to seek to that position. This currently only used for the initialTime + DVR
     * scenario which Bitmovin doesn't support with their startTime config parameter.
     * @private
     * @method BitdashVideoWrapper#_monitorSeekableRanges
     */


    var _monitorSeekableRanges = function _monitorSeekableRanges() {
      if (_initialTime.reached || _initialTime.pendingSeek) {
        return;
      }

      var seekableRange = _getSeekableRange(); // Seek to initial time if initial time value is within seekable ranges


      if (_hasPlayed && // On Android seeking might fail if done before play request (even if seekable ranges are ready)
      _initialTime.value >= seekableRange.start && _initialTime.value <= seekableRange.end) {
        OOV4.log('BitWrapper: Trying to seek to initial time after checking seekable ranges.');

        _trySeekToInitialTime();
      } else {
        OOV4.log("BitWrapper: initialTime value of ".concat(_initialTime.value, " not within seekable range or waiting for play request:"), seekableRange, _hasPlayed);
      }
    };
    /**
     * Checks to see whether it is necessary to seek in order to reach the initial
     * time that has been configured. If initial time hasn't been reached, calling
     * this function will trigger a seek operation. For VOD, if initial time has been
     * reached when this function is called then this will trigger the PLAYING
     * notification if it hasn't happened yet.
     * @private
     * @method BitdashVideoWrapper#_trySeekToInitialTime
     */


    var _trySeekToInitialTime = function _trySeekToInitialTime() {
      if (_initialTime.reached || _initialTime.pendingSeek) {
        return;
      } // Constrain initialTime to the range of allowed values. Note that this
      // can't happen on setInitialTime() because the duration/maxTimeShift isn't
      // available at that point


      _initialTime.value = _getSafeInitialTime(_initialTime.value); // Shift to initial DVR time if it hasn't already been reached and we
      // haven't already time-shifted

      if (_isDvrStream()) {
        _initialTime.pendingSeek = true;

        _this2.seek(_initialTime.value);

        OOV4.log('BitWrapper: Seeking to initial time for live DVR stream:', _initialTime.value);
      } else {
        // For VOD we check whether or not the current time is already at
        // or past the intial time value and only seek if it isn't
        if (_this2.player.getCurrentTime() < _initialTime.value) {
          _initialTime.pendingSeek = true;

          _this2.seek(_initialTime.value);

          OOV4.log('BitWrapper: Manually seeking to initial time for VOD stream:', _initialTime.value);
        } else if (_hasStartedPlaying) {
          // Already at or past initial time point, notify PLAYING but only if playback
          // has already started from Bitmovin's perspective (i.e. it has already fired
          // its own playing event). If playback hasn't started we avoid triggering our
          // player's PLAYING event early which would cause the scrubber bar to flash
          _tryNotifyInitialPlaying();
        }
      }
    };
    /**
     * Returns a value of initialTime that is within the range of allowed values
     * considering the video's duration (or max time shift in the case DVR videos).
     * IMPORTANT:
     * This method shouldn't be called before the stream source has been loaded.
     * @private
     * @method BitdashVideoWrapper#_getSafeInitialTime
     * @param {number} initialTime The value of initial time to process
     * @returns {number} A new value of initialTime that has been constrained to allowed values
     */


    var _getSafeInitialTime = function _getSafeInitialTime(initialTime) {
      if (!initialTime) {
        return initialTime;
      }

      if (_isDvrStream()) {
        // Initial time for DVR can't be below 0 or above the positive value of
        // max time shift
        initialTime = Math.max(initialTime, 0);
        initialTime = Math.min(initialTime, _this2.player.getMaxTimeShift() * -1);
      } else {
        var duration = _this2.player.getDuration(); // Conversion should not be attempted without a valid duration


        if (duration) {
          // The plugin automatically prevents from seeking too close to the end of the
          // video and will decrease seek time by 2 seconds when it is equal or larger
          // than duration - OOV4.CONSTANTS.SEEK_TO_END_LIMIT.
          // We make sure that our initialTime matches the allowed seekable values
          initialTime = convertToSafeSeekTime(initialTime, duration);
        }
      }

      return initialTime;
    };
    /**
     * Notifies the first occurrence of the PLAYING event if hasn't been notified
     * before. This is mostly needed because we avoid notifying PLAYING until the
     * initial time value has been reached, which might happen after playback
     * starts from the Bitmovin player's perspective.
     * @private
     * @method BitdashVideoWrapper#_tryNotifyInitialPlaying
     */


    var _tryNotifyInitialPlaying = function _tryNotifyInitialPlaying() {
      if (_hasNotifiedInitialPlaying) {
        return;
      }

      _hasNotifiedInitialPlaying = true;
      _initialTime.reached = true;

      _this2.controller.notify(_this2.controller.EVENTS.PLAYING);
    };

    var notifyAssetDimensions = _.bind(function () {
      var playbackVideoData = this.player.getPlaybackVideoData();

      if (playbackVideoData.width > 0) {
        this.controller.notify(this.controller.EVENTS.ASSET_DIMENSION, {
          width: playbackVideoData.width,
          height: playbackVideoData.height
        });
      }
    }, this);

    var logError = function logError(errorText) {
      if (!window.runningUnitTests) {
        console.error(errorText);
      }
    };
    /**
     * Checks to see if an encoding type is a DRM encoding type.
     * @private
     * @method BitdashVideoWrapper#_isDRMEncoding
     * @param {string} encoding OOV4.VIDEO.ENCODING value to check
     * @returns {boolean} True if the encoding type is a DRM encoding type, false otherwise
     */


    var _isDRMEncoding = _.bind(function (encoding) {
      return encoding === OOV4.VIDEO.ENCODING.DRM.DASH || encoding === OOV4.VIDEO.ENCODING.DRM.HLS;
    }, this);
    /**************************************************/
    // BitPlayer event callbacks

    /**************************************************/


    var _onAudioAdaptation = _.bind(function () {
      printevent(arguments);
    }, this);
    /**
     * Fired when there is a change on an audio track.
     * @private
     * @method BitdashVideoFactory#onAudioChanged
     * @param {object} event The event from the track change
     * @fires VideoController#EVENTS.MULTI_AUDIO_CHANGED
     */


    var _onAudioChanged = _.bind(function (event) {
      printevent(arguments);
      _audioChanging = false;

      if (_playOnAudioChange) {
        _playOnAudioChange = false;
        playVideo();
      }

      var audioTracks = this.getAvailableAudio(); // check if there's actually a change

      if (!_.isEqual(this.audioTracks, audioTracks)) {
        this.audioTracks = audioTracks;
        this.controller.notify(this.controller.EVENTS.MULTI_AUDIO_CHANGED, audioTracks);
      }
    }, this);
    /**
     * Callback for onAudioAdded event from bitmovin plugin
     * @private
     * @func _onAudioAdded
     * @fires VideoController#EVENTS.MULTI_AUDIO_AVAILABLE
     */


    var _onAudioAdded = _.bind(function () {
      printevent(arguments);
      var audioTracks = this.getAvailableAudio(); // check if there's a need to display audioTracks

      if (audioTracks && audioTracks.length > 1) {
        // check if there's actually a change
        if (!_.isEqual(this.audioTracks, audioTracks)) {
          this.audioTracks = audioTracks;
          this.controller.notify(this.controller.EVENTS.MULTI_AUDIO_AVAILABLE, audioTracks);
        }
      }
    }, this);

    var _onAudioDownloadQualityChanged = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onAudioPlaybackQualityChanged = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onCueEnter = _.bind(function (data, params) {
      printevent(arguments);

      if (data && !data.text) {
        data = params || {};
      } //[PBW-5947] Bitmovin sometimes still fires cue events when disabled, don't render them


      if (_captionsDisabled) return;

      var subtitleList = _ccWrapper.find("ol").attr("id", "subtitles");

      if (!subtitleList || subtitleList.length == 0) {
        return;
      }

      var li = $('<li>');
      li.attr('data-state', data.text);
      li.text(data.text);
      subtitleList.append(li);

      if (!_ccVisible) {
        this.controller.notify(this.controller.EVENTS.CLOSED_CAPTION_CUE_CHANGED, _getSubtitleText(subtitleList));
      }
    }, this);

    var _onCueExit = _.bind(function (data) {
      printevent(arguments);

      var subtitleList = _ccWrapper.find("ol").attr("id", "subtitles");

      if (!subtitleList || subtitleList.length == 0) {
        return;
      }

      subtitleList.children().each(function () {
        if ($(this).attr('data-state') == data.text) {
          $(this).remove();
        }
      });

      if (!_ccVisible) {
        this.controller.notify(this.controller.EVENTS.CLOSED_CAPTION_CUE_CHANGED, _getSubtitleText(subtitleList));
      }
    }, this);

    var _onDownloadFinished = _.bind(function (data) {
      this.controller.notify(this.controller.EVENTS.ON_DOWNLOAD_FINISHED, data);
      printevent(arguments);
    }, this);

    var _onDVRWindowExceeded = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onError = _.bind(function (error, param) {
      printevent(arguments);

      if (error && !error.code) {
        // this is for test code to work
        error = param;
      }

      if (error && error.code) {
        var code = error.code.toString();

        if (bitdashErrorCodes[code]) {
          logError("bitdash error: " + error.code + ": " + bitdashErrorCodes[code].longText); // bitmovin does not provide a way to check for ALL different error codes
          // "we can't know what all the different DRM servers may return, so this keeps it generic"

          var GENERIC_DRM_ERROR_CODE = '3011';

          if (code === GENERIC_DRM_ERROR_CODE && error.serverResponse && typeof ArrayBuffer === 'function' && error.serverResponse instanceof ArrayBuffer) {
            // now we need to understand whether we have a way to
            // get actual error code from the serverResponse
            // error.serverResponse is an ArrayBuffer and we cannot manipulate it directly so we need to
            // convert it to Uint8Array
            var serverResponseUint8 = new Uint8Array(error.serverResponse); // then we need to convert Uint8Array to string which is basically a JSON

            var serverResponseString = String.fromCharCode.apply(null, serverResponseUint8); // server response should be converted to object so we parse it with JSON.parse

            var serverResponse = null; // check if server response string can be parsed

            try {
              serverResponse = JSON.parse(serverResponseString);
            } catch (e) {} // server response now is basically an object
            // { code: String, message: String }
            // so we extract the code


            var serverResponseErrorCode = null;

            if (serverResponse && serverResponse.code) {
              serverResponseErrorCode = serverResponse.code;
              this.controller.notify(this.controller.EVENTS.ERROR, {
                errorcode: serverResponseErrorCode
              });
            } else {
              this.controller.notify(this.controller.EVENTS.ERROR, {
                errorcode: bitdashErrorCodes[code].ooErrorCode
              });
            }
          } //[PLAYER-491] Workaround of an issue on Edge with flash.hls where an error 3005 is thrown
          //Playback still works so we're ignoring error 3005 on Edge with flash.hls until
          //Bitmovin resolves this
          //TODO: Since we are simplifying the tech logic, we no longer have the concept of current
          //tech. We'll have to ignore all 3005 errors on Edge for now
          else if (!(OOV4.isEdge && code === "3005")) {
              this.controller.notify(this.controller.EVENTS.ERROR, {
                errorcode: bitdashErrorCodes[code].ooErrorCode
              });
            }
        } else {
          logError("bitdash error: " + error.code + ": " + error.message);
        }
      }
    }, this);

    var _onFullscreenEnter = _.bind(function () {
      printevent(arguments);
      this.controller.notify(this.controller.EVENTS.FULLSCREEN_CHANGED, {
        isFullScreen: true,
        paused: this.player.isPaused()
      });
    }, this);

    var _onFullscreenExit = _.bind(function () {
      printevent(arguments);
      this.controller.notify(this.controller.EVENTS.FULLSCREEN_CHANGED, {
        isFullScreen: false,
        paused: this.player.isPaused()
      });
    }, this);

    var _onMetadata = _.bind(function (data, params) {
      printevent(arguments);
      var metadata = data.metadataType ? data : params; // for test code to work

      this.controller.notify(this.controller.EVENTS.METADATA_FOUND, {
        type: metadata["metadataType"],
        data: metadata["metadata"]
      });
    }, this);

    var _onMuted = _.bind(function () {
      printevent(arguments);
      this.controller.notify(this.controller.EVENTS.MUTE_STATE_CHANGE, {
        muted: true
      });
    }, this);

    var _onPaused = _.bind(function () {
      printevent(arguments); //PLAYER-3551: Workaround of a Bitmovin issue where Bitmovin immediately plays after pausing.
      //This seems to mainly occur on Android Chrome but can happen on desktop Chrome as well.

      if (!this.player.isPaused() && _pauseRequested) {
        this.player.pause();
        return;
      }

      _pauseRequested = false;
      _shouldPauseOnSeeked = false;
      _pauseOnPlaying = false; // Do not raise pause events while priming, but mark priming as completed

      if (_priming) {
        _priming = false;
        return;
      }

      this.controller.notify(this.controller.EVENTS.PAUSED);
    }, this);

    var _onPeriodSwitched = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onPlay = _.bind(function () {
      // In some cases an onPlay event from a previous source can be fired while
      // a new source is loading. This can happen when priming an ad video with an empty
      // source and then immediately setting the source of the actual video. The state
      // variables now belong to the new source, so we avoid executing this handler.
      if (this.player && !this.player.isReady()) {
        OOV4.log('Bitmovin: onPlay event received during source change, ignoring...');
        return;
      }

      printevent(arguments); // Do not raise play events while priming

      if (_priming) {
        return;
      } // PLAYER-4360 this seems to be the best place to seek back to the playhead position
      // upon failover from another stream


      if (_handleFailover) {
        this.seek(_failoverPlayheadTime);
        _handleFailover = false;
      }

      this.controller.notify(this.controller.EVENTS.PLAY, {
        url: _currentUrl
      });
    }, this);

    var _onPlaying = _.bind(function () {
      printevent(arguments);
      _currentTime = this.player.getCurrentTime();

      if (!_hasStartedPlaying) {
        if (!this.player.isMuted()) {
          this.controller.notify(this.controller.EVENTS.UNMUTED_PLAYBACK_SUCCEEDED);
        } else {
          this.controller.notify(this.controller.EVENTS.MUTED_PLAYBACK_SUCCEEDED);
        }
      }

      _hasStartedPlaying = true;

      if (_pauseOnPlaying) {
        this.player.pause();
        return;
      }

      if (_initialTime.reached) {
        if (_hasNotifiedInitialPlaying) {
          this.controller.notify(this.controller.EVENTS.PLAYING);
        } else {
          _tryNotifyInitialPlaying();
        }
      }
    }, this);

    var _onPlaybackFinished = _.bind(function () {
      printevent(arguments);

      if (_videoEnded) {
        // no double firing ended event
        return;
      }

      _videoEnded = true;
      this.controller.notify(this.controller.EVENTS.ENDED);
    }, this);

    var _onPlayerResize = _.bind(function () {
      printevent(arguments);
      notifyAssetDimensions();
    }, this);

    var _onReady = _.bind(function () {
      printevent(arguments);
      _pendingSetupOrLoad = false;

      var bitmovinUrl = _getUrlFromBitmovinPlayer(); // Bitmovin fires onReady after both player.setup() and player.load().
      // When the event is fired after player.setup() the player is not ready to
      // play since no source is loaded at this point. We wait until isReady() returns
      // true, which is when the player is actually ready to play.
      // Bitmovin can fire onReady before a source is loaded. Need investigation on when this occurs


      if (!this.player.isReady() || !bitmovinUrl) {
        OOV4.log("Bitmovin: onReady fired before source load.");

        if (_willLoad) {
          _willLoad = false;

          _loadBitmovinSource();
        }

        return;
      }

      if (bitmovinUrl === _currentUrl) {
        _loadedCurrentUrl = true;
      }

      if (!window.runningUnitTests) {
        OOV4.log('%cBitmovin player version ' + this.player.version + ' has been setup', 'color: blue; font-weight: bold');
        var playerFigure = $(_videoWrapper).find("figure");

        _ccWrapper.detach().appendTo(playerFigure);

        this.disableVrKeyboardControls();

        _printPlayerLoadInfo(this.player, bitmovinUrl);
      }

      this.controller.markReady();
      var captions = this.player.getAvailableSubtitles() || [];
      var availableLanguages = {
        locale: {},
        languages: []
      };

      if (captions.length > 0) {
        for (var i = 0; i < captions.length; i++) {
          if (captions[i].id) {
            var language = captions[i].lang;
            availableLanguages.languages.push(language);
            availableLanguages.locale[language] = _getCCLanguageLabel(language, captions[i].label);
          }
        }
      }

      var bitrates = this.player.getAvailableVideoQualities() || [];

      if (bitrates.length > 0) {
        OOV4.log("bitplayer reports bitrates: " + JSON.stringify(bitrates));
        _vtcBitrates = {};
        _vtcBitrates.auto = {
          id: "auto",
          width: 0,
          height: 0,
          bitrate: 0
        };

        for (var i = 0; i < bitrates.length; i++) {
          // Bitmovin will report a bitrate with a value of 0 if the stream only has one rendition.
          // We should hide the bitrate selector in such cases.
          if (typeof bitrates[i].bitrate === "number" && bitrates[i].bitrate > 0) {
            var vtcBitrate = {
              id: bitrates[i].id,
              width: bitrates[i].width,
              height: bitrates[i].height,
              bitrate: bitrates[i].bitrate
            };
            _vtcBitrates[vtcBitrate.id] = vtcBitrate;
          }
        }

        if (_.keys(_vtcBitrates).length > 1) {
          this.controller.notify(this.controller.EVENTS.BITRATES_AVAILABLE, _.values(_vtcBitrates));
        }
      }

      var availableAudio = this.getAvailableAudio();

      if (availableAudio && availableAudio.length > 1) {
        this.audioTracks = availableAudio;
        this.controller.notify(this.controller.EVENTS.MULTI_AUDIO_AVAILABLE, availableAudio);
      }

      if (_setVolumeOnReady >= 0) {
        this.setVolume(_setVolumeOnReady);
        _setVolumeOnReady = -1;
      }

      if (_setMuteStateOnReady) {
        if (_corePlayerMuteState) {
          this.player.mute();
        } else {
          this.player.unmute();
        }
      }

      _setMuteStateOnReady = false;
      var loadingNewSource = false;

      if (_willLoad) {
        _willLoad = false;
        loadingNewSource = _loadBitmovinSource();
      }

      if (!loadingNewSource) {
        if (_willPlay) {
          if (this.player.isReady()) {
            playVideo();
          } else {
            logError("bitdash error: player not ready to play");
          }
        } else {
          // [PBW-7036]
          // Preload needs to be called after BITRATES_AVAILABLE is fired so that initialBitrate
          // can be set before the video begins loading.
          // [PLAYER-2802]
          // Preload can't be called before play() because this triggers a Bitmovin issue that causes
          // playback to fail. Since play() calls preload() implicitly, there is no need to call preload()
          // when we're calling play() anyway.
          this.player.preload();
          OOV4.log("Bitmovin: Preloading ENABLED.");
        } // [PLAYER-2828]
        // In some cases Bitmovin will not display subtitles if player.setSubtitle() is called right before
        // player.play(). As a workaround, we need to make sure that this event gets fired after the call to play() above.


        if (!_.isEmpty(availableLanguages.languages)) {
          this.controller.notify(this.controller.EVENTS.CAPTIONS_FOUND_ON_PLAYING, availableLanguages);
        }
      }
    }, this);

    var _onSeek = _.bind(function () {
      printevent(arguments);
      _isSeeking = true; // Do not log seeks until the initialTime has been reached

      if (!_hasNotifiedInitialPlaying) {
        return;
      } // Do not raise seek events while priming


      if (_priming) {
        return;
      }

      this.controller.notify(this.controller.EVENTS.SEEKING, arguments[0].seekTarget);
    }, this);

    var _onSeeked = _.bind(function () {
      printevent(arguments); //PLAYER-4105: Bitmovin still throws the onSeeked event if we seek and switch sources
      //prior to the onSeeked event. We reset the _isSeeking flag when switching sources, so
      //we'll ignore any onSeeked events if we are in such a state.

      if (!_isSeeking) {
        return;
      }

      _isSeeking = false;
      _initialTime.pendingSeek = false;
      _currentTime = this.player.getCurrentTime();

      if (_hasNotifiedInitialPlaying) {
        this.controller.notify(this.controller.EVENTS.SEEKED);
      }

      var pausing = false;

      if (_shouldPauseOnSeeked) {
        pausing = true;
        this.pause();
      } else {
        _shouldPauseOnSeeked = false;
      }

      if (!this.player.isPaused() && !pausing && _initialTime.reached) {
        this.controller.notify(this.controller.EVENTS.PLAYING);
      }
    }, this);

    var _onSegmentRequestFinished = _.bind(function (data) {
      this.controller.notify(this.controller.EVENTS.ON_SEGMENT_LOADED, data);
      printevent(arguments);
    }, this);

    var _onSourceLoaded = _.bind(function () {
      printevent(arguments);
      _adsPlayed = false;

      if (_isDvrStream() && !_initialTime.reached) {
        // Constrain initialTime to the range of allowed values. Note that this
        // can't happen on setInitialTime() because the duration/maxTimeShift isn't
        // available at that point
        _initialTime.value = _getSafeInitialTime(_initialTime.value); // Check seekable ranges first in case these are already available before
        // the next "progress" event is fired, except for Safari which might get
        // stuck if we time-shift right after seekable ranges are available

        if (!OOV4.isSafari) {
          _monitorSeekableRanges();
        }

        var videoElement = this.player.getVideoElement(); // Check seekable ranges every time data is downloaded

        if (videoElement) {
          OOV4.log('BitWrapper: Adding "progress" event listener.');
          videoElement.addEventListener('progress', _monitorSeekableRanges);
        }
      }
    }, this);

    var _onSourceUnloaded = _.bind(function (event) {
      printevent(event);
      var videoElement = this.player.getVideoElement(); // Make sure to remove the "progress" event listener that monitors seekable
      // ranges. If listener wasn't added this will have no effect

      if (videoElement) {
        OOV4.log('BitWrapper: Removing "progress" event listener.');
        videoElement.removeEventListener('progress', _monitorSeekableRanges);
      }
    }, this);

    var _onStallStarted = _.bind(function () {
      printevent(arguments);
      this.controller.notify(this.controller.EVENTS.BUFFERING, {
        url: _currentUrl
      });
    }, this);

    var _onStallEnded = _.bind(function () {
      printevent(arguments);
      this.controller.notify(this.controller.EVENTS.BUFFERED, {
        url: _currentUrl
      });
    }, this);

    var _onSubtitleAdded = _.bind(function () {
      printevent(arguments);
      var captions = this.player.getAvailableSubtitles() || [];

      if (captions.length > 0) {
        var availableLanguages = {
          locale: {},
          languages: []
        };

        for (var i = 0; i < captions.length; i++) {
          if (captions[i].id) {
            var language = captions[i].lang;
            availableLanguages.languages.push(language);
            availableLanguages.locale[language] = _getCCLanguageLabel(language, captions[i].label);
          }
        }

        if (!_.isEmpty(availableLanguages.languages)) {
          this.controller.notify(this.controller.EVENTS.CAPTIONS_FOUND_ON_PLAYING, availableLanguages);
        }
      }
    }, this);

    var _onSubtitleChanged = _.bind(function () {
      printevent(arguments);

      var subtitleList = _ccWrapper.find("ol").attr("id", "subtitles");

      if (!subtitleList || subtitleList.length == 0) {
        return;
      }

      subtitleList.empty();

      if (!_ccVisible) {
        this.controller.notify(this.controller.EVENTS.CLOSED_CAPTION_CUE_CHANGED, "");
      }
    }, this);

    var _onSubtitleRemoved = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onTimeChanged = _.bind(function (data) {
      // Check to see whether we need to seek to initialTime. If we're getting
      // playhead updates and initial time hasn't been reached it likely means
      // that seeking to initial time has failed
      if (!_initialTime.reached) {
        OOV4.log('BitWrapper: Checking initial time on onTimeChanged handler.');

        _trySeekToInitialTime(); // This will be true if the call above realized that the initial time
        // had already been reached without the need for an additional seek.
        // If initial time hasn't been reached yet we avoid executing _onTimeChanged logic


        if (!_initialTime.reached) {
          return;
        }
      } // For live streams with discontinuities, (i.e. SSAI streams), we may receive an onTimeShift event
      // From bitmovin when seeking but not a corresponding onTimeShifted when the seek is done.
      // To handle this we call controller.seeked on the video controller here if _timeShifting is
      // still true and we are in a live stream


      if (_timeShifting) {
        _timeShifting = false;
        this.controller.notify(this.controller.EVENTS.SEEKED);
      } // Do not log time updates after the stream has finished playing


      if (_videoEnded) {
        return;
      }

      if (_adsPlayed) {
        _adsPlayed = false;
        return;
      }

      var buffer, duration, currentLiveTime;

      if (this.player.isLive()) {
        _currentTime = this.player.getTimeShift() - this.player.getMaxTimeShift();
        duration = this.player.getMaxTimeShift() * -1;
        buffer = duration; // [PBW-5863] The skin displays current time a bit differently when dealing
        // with live video, but we still need to keep track of the actual playhead for analytics purposes

        currentLiveTime = this.player.getCurrentTime();
      } else {
        //Player-2020 On android we seem to get a time update before the player's current time is updated.
        //So we should update our currentTime according to the data that is passed in unless it doesn't exist.
        if (typeof data.time === "number") {
          _currentTime = data.time;
        } else {
          _currentTime = this.player.getCurrentTime();
        }

        buffer = this.player.getVideoBufferLength() + _currentTime;
        duration = this.player.getDuration();
        currentLiveTime = 0;
      } // Do not log time updates until the initialTime has been reached


      if (!_initialTime.reached) {
        return;
      }

      this.controller.notify(this.controller.EVENTS.TIME_UPDATE, {
        currentTime: _currentTime,
        currentLiveTime: currentLiveTime,
        duration: duration,
        buffer: buffer,
        seekRange: {
          "start": 0,
          "end": duration
        }
      });
    }, this);

    var _onTimeShift = _.bind(function () {
      printevent(arguments);
      _timeShifting = true;

      if (_initialTime.reached) {
        this.controller.notify(this.controller.EVENTS.SEEKING, arguments[0].seekTarget);
      }
    }, this);
    /**
     * Is fired when time shifting has been finished and data is available to continue playback.
     * Only applies to live streams.
     * @private
     */


    var _onTimeShifted = function _onTimeShifted() {
      printevent(_arguments);
      _timeShifting = false; // Do not trigger seeked event if PLAYING hasn't been notified yet

      if (_hasNotifiedInitialPlaying) {
        _this2.controller.notify(_this2.controller.EVENTS.SEEKED, _arguments[0].seekTarget);
      } // This means that we previously shifted in order to set an initial time
      // on a DVR stream which in turn means that this handler signals that we've
      // reached said initial time


      if (_initialTime.pendingSeek) {
        _initialTime.pendingSeek = false;
        _initialTime.reached = true; // Note:
        // _hasStartedPlaying indicates that playback has started from BM's
        // perspective, but not necessarily that we've notified our own PLAYING
        // event. We don't notify our PLAYING event if playback hasn't started
        // in order to avoid flashing the scrubber bar. The notification will be
        // sent later on when BM fires its onPlaying event.

        if (_hasStartedPlaying) {
          _tryNotifyInitialPlaying(); // We had been ignoring playhead updates until now, make sure player
          // starts with correct playhead as it transitions to playing mode


          _onTimeChanged();
        }
      }
    };

    var _onUnmuted = _.bind(function () {
      printevent(arguments);
      this.setVolume(_currentVolume);
      this.controller.notify(this.controller.EVENTS.MUTE_STATE_CHANGE, {
        muted: false
      });
    }, this);

    var _onVideoAdaptation = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onVideoDownloadQualityChanged = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onVideoPlaybackQualityChanged = _.bind(function () {
      printevent(arguments);
      notifyAssetDimensions();

      if (arguments.length > 0) {
        var targetQuality = arguments[0].targetQuality ? arguments[0].targetQuality : arguments[1].targetQuality; // for test code to work

        var bitrateId = targetQuality ? targetQuality.id : null;

        if (_vtcBitrates && bitrateId && bitrateId != _currentBitRate) {
          _currentBitRate = bitrateId;
          this.controller.notify(this.controller.EVENTS.BITRATE_CHANGED, _vtcBitrates[bitrateId]);
        }
      }
    }, this);

    var _onVolumeChanged = _.bind(function (volume) {
      printevent(arguments); //PLAYER-2171: We're observing an issue where player.getVolume is incorrectly returning 0 when the
      //targetVolume is set to a non-zero value. This may be related to its mute state. We'll use
      //the targetVolume until we find something more concrete

      var bitmovinVolume = volume && typeof volume.targetVolume === "number" ? volume.targetVolume : this.player.getVolume();
      var vol = bitmovinVolume / 100;
      this.controller.notify(this.controller.EVENTS.VOLUME_CHANGE, {
        volume: vol
      });
    }, this);

    var _onVRError = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onVrModeChanged = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onVrStereoChanged = _.bind(function () {
      printevent(arguments);
    }, this);

    var _onWarning = _.bind(function (warning) {
      printevent(arguments); // Do not raise muted/unmuted playback failure events while priming

      if (_priming) {
        return;
      }

      if (warning.code === BITDASH_WARNING_CODES.USER_INTERACTION_REQUIRED) {
        if (!this.player.isMuted()) {
          this.controller.notify(this.controller.EVENTS.UNMUTED_PLAYBACK_FAILED, {
            error: warning
          });
        } else {
          // [PBW-6990]
          // There seems to be an issue on random Android devices that prevents muted
          // autoplay from working at all under certain (currently unknown) conditions.
          this.controller.notify(this.controller.EVENTS.MUTED_PLAYBACK_FAILED, {
            error: warning
          });
        }
      }
    }, this);

    var _onVrViewingDirectionChanged = _.bind(function (settings) {
      printevent(arguments);
      this.isVideoMoving = false;
      this.vrViewingDirection = settings.direction;
    }, this);

    var _onVrViewingDirectionChanging = _.bind(function (settings) {
      printevent(arguments);
      this.vrViewingDirection = settings.direction;
    }, this);

    var printevent = function printevent(event, params) {
      if (event.length > 0 && event[0].timestamp) {
        // this is debugging code
        OOV4.log("bitplayer: " + event[0].type + " " + JSON.stringify(event[0], null, '\t'));
      } else {
        OOV4.log("bitplayer test log"); // for test code to work
      }
    };
    /**
     * Gets the url of the stream Bitmovin has loaded in its config. This is dependent on the
     * state flags: _isDash, _isM3u8, and _isMP4. Will only retrieve the url for the current stream
     * type based on whichever flag is enabled.
     * @private
     * @method BitdashVideoWrapper#_getUrlFromBitmovinPlayer
     * @returns {string} The url Bitmovin has loaded in its config if found, null otherwise
     */


    var _getUrlFromBitmovinPlayer = _.bind(function () {
      var url = null;

      if (this.player) {
        var config = this.player.getConfig();
        var source = config && config.source ? config.source : {};

        if (_isDash) {
          url = source.dash;
        } else if (_isM3u8) {
          url = source.hls;
        } else if (_isMP4 || _isOGG || _isM4A) {
          //source.progressive is an array and we only provide a single element for this array
          if (source.progressive && source.progressive[0]) {
            url = source.progressive[0].url;
          }
        }
      }

      return url;
    }, this);
    /**
     * Set view boundaries
     * @private
     * @param {object} {{yaw: number, roll: number, pitch: number}}
     * yaw - rotation around the vertical axis
     * roll - rotation around the front-to-back axis
     * pitch - rotation around the side-to-side axis
     * @method BitdashVideoWrapper#_setViewBoundaries
     * @returns {object} - сorrected corners according to acceptable limits
     */


    var _setViewBoundaries = function _setViewBoundaries(params) {
      var limitsViewWindow = conf && conf.source && conf.source.vr && conf.source.vr.viewWindow;

      var checkLimitsView = !!limitsViewWindow && _.isNumber(limitsViewWindow.maxPitch) && _.isNumber(limitsViewWindow.minPitch) && _.isNumber(limitsViewWindow.maxYaw) && _.isNumber(limitsViewWindow.minYaw);

      var checkArguments = !!params && _.isNumber(params.pitch) && _.isNumber(params.yaw);

      if (checkArguments && checkLimitsView) {
        //Verification of vertical boundaries. [PLAYER-2448]
        params.pitch = params.pitch > limitsViewWindow.maxPitch ? limitsViewWindow.maxPitch : params.pitch;
        params.pitch = params.pitch < limitsViewWindow.minPitch ? limitsViewWindow.minPitch : params.pitch; //ToDo: It is necessary to describe the verification of horizontal boundaries
        // and take into account the intersection of points 0 and 360 along two axes
      }

      return _.extend({}, params);
    };
    /**
     * Сalculation of deceleration
     * @private
     * @param {number} time - time from the beginning of the animation [ms]
     * @param {number} startValue - animation start point [degrees/ms]
     * @param {number} change - the change in the angular velocity of the animation (rotation) [degrees/ms]
     * @param {number} duration - animation duration [ms]
     * @return {number} - angle change (step dYaw or dPitch) [degrees]
     */


    var _easeOutCubic = function _easeOutCubic(time, startValue, change, duration) {
      time /= duration;
      time--;
      return -change * (time * time * time - 1) + startValue;
    };
  };

  OOV4.Video.plugin(new BitdashVideoFactory());
})(OOV4._, OOV4.$);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../../html5-common/js/utils/InitModules/InitOO.js":1,"../../../html5-common/js/utils/InitModules/InitOOHazmat.js":2,"../../../html5-common/js/utils/InitModules/InitOOUnderscore.js":3,"../../../html5-common/js/utils/constants.js":4,"../../../html5-common/js/utils/environment.js":5,"../../../html5-common/js/utils/utils.js":6,"../lib/bitmovinplayer.js":12,"./helpers/polifillRequestAnimationFrame.js":10,"./helpers/vrCoordinates":11}],10:[function(require,module,exports){
"use strict";

/**
 * polyfill for CancelRequestAnimationFrame and RequestAnimationFrame
 * https://gist.github.com/paulirish/1579671
 * requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
 *
 * @description This is the new API and .. for Chrome and Safari is the webkitRequestAnimationFrame.
 * Accordingly, in Firefox, this is the mozRequestAnimationFrame.
 * Microsoft (Internet Explorer 10) will support msRequestAnimationFrame.
 * To cope with this, Eric Möller (Opera), Paul Irish (Google) and Tino Zijdel (Tweakers.net) created a polyfill.
 * In browsers where it is not supported at all, it will use setInterval
 *
 * About RequestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
 *
 * To use this polyfill, connect this file to the script (require('path/to/file')) we need and requestAnimationFrame works!
 *
 * MIT license
 */
(function () {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];

  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    //compose the method name depending on the browser
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  } //if the browser does not support the requestAnimationFrame,
  // then window.requestAnimationFrame is assigned a similar implementation by means of setTimeout


  if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function () {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  }; //If the browser does not support cancelAnimationFrame, the animation is interrupted via clearTimeout

  if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  };
})();

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLowestVrCoordinate = exports.getDecreasedVrCoordinate = exports.getDirectionCoefficients = exports.getRevertedLowestVrCoordinate = void 0;

/**
 * If the angle value is less than -180 or greater than 180,
 * the function returns the opposite corresponding value
 * (if the user has moved the image to the specified point in the opposite direction)
 * @param lowestCoordinate - a coordinate to calculate the opposite corresponding value.
 * For correct work of the function, the parameter must be less than 360 and bigger than -360
 * @return {number} - opposite corresponding value of the coordinate.
 * If lowestCoordinate > 360 or lowestCoordinate < -360 it returns the original value of lowestCoordinate
 * If type of lowestCoordinate is not number it returns 0
 */
var getRevertedLowestVrCoordinate = function getRevertedLowestVrCoordinate(lowestCoordinate) {
  var maxCoordinate = 360;
  var revertedLowestVrCoordinate = lowestCoordinate;

  if (OOV4.ensureNumber(lowestCoordinate) === null) {
    revertedLowestVrCoordinate = 0;
  } else if (lowestCoordinate < maxCoordinate && lowestCoordinate > -maxCoordinate) {
    var absLowestCoordinate = Math.abs(lowestCoordinate);
    var halfMaxCoordinate = 180;

    if (absLowestCoordinate > halfMaxCoordinate) {
      revertedLowestVrCoordinate = Math.sign(lowestCoordinate) * (absLowestCoordinate - maxCoordinate);
    }
  }

  return revertedLowestVrCoordinate;
};
/**
 * The function returns a pair of coefficients for a uniform simultaneous decrease in the coordinates "yaw" and "pitch"
 * @param lowestVrCoordinateYaw
 * @param lowestVrCoordinatePitch
 * @return {{coeffYaw: number, coeffPitch: number}}
 */


exports.getRevertedLowestVrCoordinate = getRevertedLowestVrCoordinate;

var getDirectionCoefficients = function getDirectionCoefficients(lowestVrCoordinateYaw, lowestVrCoordinatePitch) {
  var coeffYaw = 1;
  var coeffPitch = 1;

  if (OOV4.ensureNumber(lowestVrCoordinateYaw) !== null && OOV4.ensureNumber(lowestVrCoordinatePitch) !== null && lowestVrCoordinateYaw !== 0 && lowestVrCoordinatePitch !== 0) {
    if (Math.abs(lowestVrCoordinatePitch) - Math.abs(lowestVrCoordinateYaw) > 0) {
      coeffPitch = Math.abs(lowestVrCoordinatePitch / lowestVrCoordinateYaw);
    } else if (Math.abs(lowestVrCoordinatePitch) - Math.abs(lowestVrCoordinateYaw) < 0) {
      coeffYaw = Math.abs(lowestVrCoordinateYaw / lowestVrCoordinatePitch);
    }
  }

  var directionCoefficients = {
    coeffYaw: coeffYaw,
    coeffPitch: coeffPitch
  };
  return directionCoefficients;
};
/**
 * Reduce the value of the coordinate by a given value of the coefficient if the coordinate is positive,
 * Increase the value of the coordinate by a given value of the coefficient if the coordinate is negative.
 * @param {number} coordinate - value of the coordinate (yaw, roll or pitch) of vr video
 * @param {number} coeff - value by which the coordinate must be reduced
 * @returns {number} - reduced coordinate value
 */


exports.getDirectionCoefficients = getDirectionCoefficients;

var getDecreasedVrCoordinate = function getDecreasedVrCoordinate(coordinate, coeff) {
  var decreasedVrCoordinate = 0;
  var coefficient = 1;

  if (OOV4.ensureNumber(coeff) !== null && coeff !== 0 && coeff !== -0) {
    coefficient = coeff;
  }

  if (OOV4.ensureNumber(coordinate) !== null) {
    decreasedVrCoordinate = coordinate;
  }

  if (decreasedVrCoordinate !== 0 || decreasedVrCoordinate !== -0) {
    decreasedVrCoordinate -= Math.sign(decreasedVrCoordinate) * coefficient;

    if (Math.sign(decreasedVrCoordinate) === 1 && decreasedVrCoordinate < coeff || Math.sign(decreasedVrCoordinate) === -1 && decreasedVrCoordinate > -coeff) {
      decreasedVrCoordinate = 0;
    }
  }

  return decreasedVrCoordinate;
};
/**
 * The function returns a coordinate value within 360 degrees,
 * even if the user has made several camera rotations
 * @param {number} coordinate - a coordinate for calculating the corresponding the smallest value
 * @return {number} corresponding the smallest value of the coordinate
 */


exports.getDecreasedVrCoordinate = getDecreasedVrCoordinate;

var getLowestVrCoordinate = function getLowestVrCoordinate(coordinate) {
  var lowestCoordinate = coordinate;

  if (OOV4.ensureNumber(coordinate) === null || coordinate === 0 || coordinate === -0) {
    lowestCoordinate = 0;
  } else {
    var maxCoordinate = 360; // degrees

    var coefficient = coordinate / maxCoordinate;

    if (coefficient > 1 || coefficient < -1) {
      lowestCoordinate = coordinate - maxCoordinate * Math.trunc(coefficient);
    }

    lowestCoordinate = getRevertedLowestVrCoordinate(lowestCoordinate);
  }

  return lowestCoordinate;
};

exports.getLowestVrCoordinate = getLowestVrCoordinate;

},{}],12:[function(require,module,exports){
"use strict";function _typeof(obj){if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof=function _typeof(obj){return typeof obj;};}else{_typeof=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof(obj);}/****************************************************************************
 * Copyright (C) 2019, Bitmovin, Inc., All Rights Reserved
 *
 * This source code and its use and distribution, is subject to the terms
 * and conditions of the applicable license agreement.
 *
 * Bitmovin Player Version 7.8.14
 *

},{}]},{},[9]);