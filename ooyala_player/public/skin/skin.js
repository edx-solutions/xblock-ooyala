{
  "general": {
    "watermark": {"imageResource": {"url": "//player.ooyala.com/static/v4/candidate/latest/skin-plugin/assets/images/ooyala-watermark.png","androidResource" : "logo","iosResource" : "logo"  } },
    "loadingImage": {"imageResource": {"url": "//player.ooyala.com/static/v4/candidate/latest/skin-plugin/assets/images/loader_svg.svg" } }
  },
  "localization": {
    "defaultLanguage": "en",
    "availableLanguageFile": []
  },
  "responsive": {
    "breakpoints": {
      "xs": {"id": "xs", "name": "oo-xsmall", "maxWidth": 559, "multiplier": 0.7},
      "sm": {"id": "sm", "name": "oo-small", "minWidth": 560, "maxWidth": 839, "multiplier": 1},
      "md": {"id": "md", "name": "oo-medium", "minWidth": 840, "maxWidth": 1279, "multiplier": 1},
      "lg": {"id": "lg", "name": "oo-large", "minWidth": 1280, "multiplier": 1.2}
    },
    "aspectRatio": "auto"
  },
  "startScreen": {
    "promoImageSize": "default",
    "showPlayButton": true,
    "playButtonPosition": "center",
    "playIconStyle": {
      "color": "white",
      "opacity": 1
    },
    "showTitle": false,
    "showDescription": false,
    "titleFont": {
      "color": "white"
    },
    "descriptionFont": {
      "color": "white"
    },
    "infoPanelPosition": "topLeft",
    "showPromo": true
  },
  "pauseScreen": {
    "showPauseIcon": true,
    "pauseIconPosition": "center",
    "PauseIconStyle": {
      "color": "white",
      "opacity": 1
    },
    "showTitle": false,
    "showDescription": false,
    "infoPanelPosition": "topLeft",
    "screenToShowOnPause": "default"
  },
  "endScreen": {
    "screenToShowOnEnd": "discovery",
    "showReplayButton": true,
    "replayIconStyle": {
      "color": "white",
      "opacity": 1
    }
  },
  "adScreen": {
    "showAdMarquee": true,
    "showControlBar": false
  },
  "discoveryScreen": {
    "panelTitle": {
      "titleFont": {
        "fontSize": 28,
        "fontFamily": "Roboto Condensed",
        "color": "white"
      }
    },
    "contentTitle": {
      "show": false,
      "font": {
        "fontSize": 22,
        "fontFamily": "Roboto Condensed",
        "color": "white"
      }
    },
    "contentDuration": {
      "show": true,
      "font": {
        "fontSize": 12,
        "fontFamily": "Arial-BoldMT",
        "color": "white"
      }
    },
    "showCountDownTimerOnEndScreen": true,
    "countDownTime": "10"
  },
  "shareScreen": {
    "embed": {
      "source": "<iframe width='640' height='480' frameborder='0' allowfullscreen src='//player.ooyala.com/static/v4/candidate/latest/skin-plugin/iframe.html?ec=<ASSET_ID>&pbid=<PLAYER_ID>&pcode=<PUBLISHER_ID>'></iframe>"
    }
  },
  "moreOptionsScreen": {
    "brightOpacity": 1.0,
    "darkOpacity": 0.4,
    "iconSize": 30,
    "color": "white",
    "iconStyle": {
      "active": {
        "color": "#FFFFFF",
        "opacity": 1.0
      },
      "inactive": {
        "color": "#FFFFFF",
        "opacity": 0.95
      }
    }
  },
  "closedCaptionOptions": {
    "enabled": true,
    "language": "en",
    "textColor": "White",
    "windowColor": "Transparent",
    "backgroundColor": "Black",
    "textOpacity": 1,
    "backgroundOpacity": 0.6,
    "windowOpacity": 0,
    "fontType": "Proportional Sans-Serif",
    "fontSize": "Medium",
    "textEnhancement": "Uniform"
  },
  "upNext": {
    "showUpNext": true,
    "timeToShow": "10"
  },
  "controlBar": {
    "volumeControl": {
      "color": "rgba(67,137,255,1)"
    },
    "iconStyle": {
      "active": {
        "color": "#FFFFFF",
        "opacity": 1.0
      },
      "inactive": {
        "color": "#FFFFFF",
        "opacity": 0.95
      }
    },
    "autoHide": true,
    "height": 50,
    "logo": {
      "imageResource": {"url": "","androidResource": "logo","iosResource": "logo"},
      "clickUrl": "http://www.ooyala.com",
      "target": "_blank",
      "width": 96,
      "height": 24
    },
    "adScrubberBar": {
      "backgroundColor": "rgba(175,175,175,1)",
      "bufferedColor": "rgba(92, 92, 92, 1);",
      "playedColor": "rgba(255,63,128,1)"
    },
    "scrubberBar": {
      "backgroundColor": "rgba(0,0,0,1)",
      "bufferedColor": "rgba(0,0,0,0.7)",
      "playedColor": "rgba(74,74,74,1)",
      "thumbnailPreview": false
    }
  },
  "live": {
    "forceDvrDisabled": false
  },
  "buttons": {
    "desktopContent": [
      {"name":"playbackSpeed", "location":"controlBar", "whenDoesNotFit":"drop", "minWidth":45 },
      {"name":"playPause", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45 },
      {"name":"scrubberBar", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45 },
      {"name":"live", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45},
      {"name":"flexibleSpace", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":1 },
      {"name":"closedCaption", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45 },
      {"name":"volume", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":240 },
      {"name":"quality", "location":"controlBar", "whenDoesNotFit":"moveToMoreOptions", "minWidth":45 },
      {"name":"logo", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":125 },
      {"name":"fullscreen", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45 },
      {"name":"moreOptions", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45 }
    ],
    "desktopAd": [
      {"name":"playPause", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45 },
      {"name":"volume", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":240 },
      {"name":"flexibleSpace", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":1 },
      {"name":"logo", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":125 },
      {"name":"fullscreen", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45 },
      {"name":"moreOptions", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45 }
    ],
    "mobileContent": [
      {"name":"volume", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":50 },
      {"name":"live", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":45},
      {"name":"timeDuration", "location":"controlBar", "whenDoesNotFit":"drop", "minWidth":100 },
      {"name":"flexibleSpace", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":1 },
      {"name":"share", "location":"moreOptions" },
      {"name":"discovery", "location":"moreOptions" },
      {"name":"closedCaption", "location":"moreOptions" },
      {"name":"fullscreen", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":50 },
      {"name":"moreOptions", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":50 }
    ],
    "mobileAd": [
      {"name":"volume", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":50 },
      {"name":"flexibleSpace", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":1 },
      {"name":"fullscreen", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":50 },
      {"name":"moreOptions", "location":"controlBar", "whenDoesNotFit":"keep", "minWidth":50 }
    ]
  },
  "icons": {
    "play": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0068", "fontStyleClass": "oo-icon oo-icon-play-slick"},
    "pause": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0067", "fontStyleClass": "oo-icon oo-icon-pause-slick"},
    "volume": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0062", "fontStyleClass": "oo-icon oo-icon-volume-on-ooyala-default"},
    "volumeOff": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0070", "fontStyleClass": "oo-icon oo-icon-volume-mute-ooyala-default"},
    "expand": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0069", "fontStyleClass": "oo-icon oo-icon-system-fullscreen"},
    "compress": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u006a", "fontStyleClass": "oo-icon oo-icon-system-minimizescreen"},
    "ellipsis": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0066", "fontStyleClass": "oo-icon oo-icon-system-menu"},
    "replay": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0063", "fontStyleClass": "oo-icon oo-icon-system-replay"},
    "share": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u006f", "fontStyleClass": "oo-icon oo-icon-share"},
    "cc": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u006B", "fontStyleClass": "oo-icon oo-icon-cc"},
    "discovery": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u006C", "fontStyleClass": "oo-icon oo-icon-discovery-binoculars"},
    "quality": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u006D", "fontStyleClass": "oo-icon oo-icon-bitrate"},
    "setting": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u006E", "fontStyleClass": "oo-icon oo-icon-system-settings"},
    "dismiss": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0065", "fontStyleClass": "oo-icon oo-icon-system-close"},
    "toggleOn": {"fontFamilyName": "fontawesome", "fontString": "\uf205", "fontStyleClass": ""},
    "toggleOff": {"fontFamilyName": "fontawesome", "fontString": "\uf204", "fontStyleClass": ""},
    "left": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0072", "fontStyleClass": "oo-icon oo-icon-system-left-arrow"},
    "right": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0073", "fontStyleClass": "oo-icon oo-icon-system-right-arrow"},
    "learn": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0074", "fontStyleClass": "oo-icon oo-icon-system-more-information"},
    "skip": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0075", "fontStyleClass": "oo-icon oo-icon-skip-slick"},
    "warning": {"fontFamilyName": "fontawesome", "fontString": "\uf06a", "fontStyleClass": ""},
    "auto": {"fontFamilyName": "ooyala-slick-type", "fontString": "\u0064", "fontStyleClass": "oo-icon oo-icon-system-auto"}
  }
}
